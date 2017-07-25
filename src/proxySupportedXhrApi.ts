import * as request from 'request';
import * as  Promise from "bluebird";
import { IXHROptions, IXHRApi, IXHRProgress } from "./ews.partial";
import { setupXhrResponse } from "./utils";

import { Agent as httpsAgent } from "https";
import { ClientResponse } from "http"


/** @internal */
export class proxySupportedXhrApi implements IXHRApi {

    proxyUrl: string = null;
    proxyUser: string = null;
    proxyPassword: string = null;
    allowUntrustedCertificate: boolean;

    private stream: any;

    get apiName(): string {
        return "proxy";
    }

    constructor(proxyUrl: string)
    constructor(proxyUrl: string, allowUntrustedCertificate: boolean)
    constructor(proxyUrl: string, proxyUserName: string, proxyPassword: string)
    constructor(proxyUrl: string, proxyUserName: string, proxyPassword: string, allowUntrustedCertificate: boolean)
    constructor(proxyUrl: string, proxyUserNameOrallowUntrustedCertificate: string | boolean = false, proxyPassword: string = null, allowUntrustedCertificate: boolean = false) {
        this.proxyUrl = proxyUrl;

        if (typeof proxyUserNameOrallowUntrustedCertificate === 'string') {
            this.proxyUser = proxyUserNameOrallowUntrustedCertificate;
            this.proxyPassword = proxyPassword
            this.allowUntrustedCertificate = allowUntrustedCertificate;
        }
        else {
            this.allowUntrustedCertificate = proxyUserNameOrallowUntrustedCertificate;
        }

    }

    xhr(xhroptions: IXHROptions, progressDelegate?: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest> {

        //setup xhr for github.com/andris9/fetch options
        let options = {
            url: xhroptions.url,
            body: xhroptions.data,
            headers: xhroptions.headers,
            method: <any>xhroptions.type,
            followRedirect: false,
            //resolveWithFullResponse: true
        }

        let proxyStr = this.getProxyString();
        if (proxyStr) {
            options["proxy"] = proxyStr;
        }

        return new Promise<XMLHttpRequest>((resolve, reject) => {
            request(options, (err, response, body) => {

                if (err) {
                    let xhrResponse: XMLHttpRequest = <any>{
                        response: err.response && err.response.body ? err.response.body.toString() : '',
                        status: err.statusCode,
                        //redirectCount: meta.redirectCount,
                        headers: err.response ? err.response.headers : {},
                        finalUrl: err.url,
                        responseType: '',
                        statusText: err.message,
                        message: err.message
                    };
                    if (typeof xhrResponse.status === 'undefined' && err.message) {
                        try {
                            let parse: any[] = err.message.match(/statusCode=(\d*?)$/)
                            if (parse && parse.length > 1) {
                                xhrResponse[<any>"status"] = Number(parse[1]);
                            }
                        } catch (e) { }
                    }
                    reject(setupXhrResponse(xhrResponse));
                }
                else {
                    let xhrResponse: XMLHttpRequest = <any>{
                        response: body ? body.toString() : '',
                        status: response.statusCode,
                        //redirectCount: meta.redirectCount,
                        headers: response.headers,
                        finalUrl: response.url,
                        responseType: '',
                        statusText: response.statusMessage,
                    };
                    if (xhrResponse.status === 200) {
                        resolve(setupXhrResponse(xhrResponse));
                    }
                    else {
                        reject(setupXhrResponse(xhrResponse));
                    }
                }
            });
        });

    }

    xhrStream(xhroptions: IXHROptions, progressDelegate: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest> {

        //setup xhr for github.com/andris9/fetch options
        let options = {
            url: xhroptions.url,
            body: xhroptions.data,
            headers: xhroptions.headers,
            method: <any>xhroptions.type,
            followRedirect: false,
            
        }

        let proxyStr = this.getProxyString();
        if (proxyStr) {
            options["proxy"] = proxyStr;
        }

        return new Promise<XMLHttpRequest>((resolve, reject) => {

            this.stream = request(options);

            this.stream.on('response', function (response) {
                // unmodified http.IncomingMessage object
                progressDelegate({ type: "header", headers: response["headers"] })
            })
            this.stream.on("data", (chunk) => {
                // decompressed data as it is received
                // console.log('decoded chunk: ' + chunk)
                // console.log(chunk.toString());
                progressDelegate({ type: "data", data: chunk.toString() });
            });

            this.stream.on("end", () => {
                progressDelegate({ type: "end" });
                resolve();
            });

            this.stream.on('error', (reason) => {
                progressDelegate({ type: "error", error: reason });
                this.disconnect();
                let xhrResponse: XMLHttpRequest = <any>{
                    response: reason.response && reason.response.body ? reason.response.body.toString() : '',
                    status: reason.statusCode,
                    //redirectCount: meta.redirectCount,
                    headers: reason.response ? reason.response.headers : {},
                    finalUrl: reason.url,
                    responseType: '',
                    statusText: reason.message,
                    message: reason.message
                };

                if (typeof xhrResponse.status === 'undefined' && reason.message) {
                    try {
                        let parse: any[] = reason.message.match(/statusCode=(\d*?)$/)
                        if (parse && parse.length > 1) {
                            xhrResponse[<any>"status"] = Number(parse[1]);
                        }
                    } catch (e) { }
                }

                reject(setupXhrResponse(xhrResponse));
            });
        });
    }

    disconnect() {
        if (this.stream) {
            try {
                this.stream.destroy();
            }
            catch (e) { }
        }
    }

    getProxyString(): string {
        if (this.proxyUrl) {
            let str: string = this.proxyUrl;
            if (this.proxyUser && this.proxyPassword) {
                let proxyParts = this.proxyUrl.split("://");

                return (proxyParts[0] + "://" + this.proxyUser + ":" + this.proxyPassword + "@" + proxyParts[1]);

            }
            else {
                return this.proxyUrl;
            }
        }
        return null;
    }
}
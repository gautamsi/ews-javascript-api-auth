import * as request from 'request-promise';
import * as  Promise from "bluebird";
import { IXHROptions, IXHRApi, IXHRProgress } from "./ews.partial";
import { setupXhrResponse } from "./utils";

import { Agent as httpsAgent } from "https";



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
            resolveWithFullResponse: true
        }

        let proxyStr = this.getProxyString();
        if (proxyStr) {
            options["proxy"] = proxyStr;
        }

        return new Promise<XMLHttpRequest>((resolve, reject) => {
            request(options).then<XMLHttpRequest>((result) => {
                let xhrResponse: XMLHttpRequest = <any>{
                    response: result.body.toString(),
                    status: result.statusCode,
                    //redirectCount: meta.redirectCount,
                    headers: result.headers,
                    finalUrl: result.url,
                    responseType: '',
                    statusText: undefined,
                };
                if (xhrResponse.status === 200) {
                    resolve(setupXhrResponse(xhrResponse));
                }
                else {
                    reject(setupXhrResponse(xhrResponse));
                }

            }, (reason) => {
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

    xhrStream(xhroptions: IXHROptions, progressDelegate: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest> {

        //setup xhr for github.com/andris9/fetch options
        let options = {
            url: xhroptions.url,
            body: xhroptions.data,
            headers: xhroptions.headers,
            method: <any>xhroptions.type,
            followRedirect: false,
            resolveWithFullResponse: true
        }

        return new Promise<XMLHttpRequest>((resolve, reject) => {
            var request = require('request')
            this.stream = request(
                options
            );

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

    // private ntlmPreCall(options: IXHROptions, ) {
    //     let ntlmOptions = {
    //         url: options.url,
    //         username: this.username,
    //         password: this.password,
    //         workstation: options['workstation'] || '',
    //         domain: this.domain
    //     };

    //     return new Promise<XMLHttpRequest>((resolve, reject) => {

    //         //let type1msg = ntlm.createType1Message(ntlmOptions); //lack of v2
    //         let type1msg = createType1Message(ntlmOptions.workstation, ntlmOptions.domain); // alternate client - ntlm-client

    //         options.headers['Authorization'] = type1msg;
    //         options.headers['Connection'] = 'keep-alive';

    //         fetchUrl(options.url, options, (error, meta, body) => {
    //             if (error) {
    //                 reject(error);
    //             }
    //             else {
    //                 let xhrResponse: XMLHttpRequest = <any>{
    //                     response: body,
    //                     status: meta.status,
    //                     redirectCount: meta.redirectCount,
    //                     headers: meta.responseHeaders,
    //                     finalUrl: meta.finalUrl,
    //                     responseType: '',
    //                     statusText: undefined,
    //                 };
    //                 resolve(xhrResponse);
    //             }
    //         });
    //     }).then((res: any) => {
    //         if (!res.headers['www-authenticate'])
    //             throw new Error('www-authenticate not found on response of second request');

    //         //let type2msg = ntlm.parseType2Message(res.headers['www-authenticate']); //httpntlm
    //         //let type3msg = ntlm.createType3Message(type2msg, ntlmOptions); //httpntlm
    //         let type2msg = decodeType2Message(res.headers['www-authenticate']); //with ntlm-client
    //         let type3msg = createType3Message(type2msg, ntlmOptions.username, ntlmOptions.password, ntlmOptions.workstation, ntlmOptions.domain); //with ntlm-client

    //         delete options.headers['authorization'] // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails
    //         delete options.headers['connection'] // 'fetch' has this wired addition with lower case, with lower case ntlm on server side fails

    //         options.headers['Authorization'] = type3msg;
    //         options.headers['Connection'] = 'Close';

    //         return options;
    //     });
    // }


}
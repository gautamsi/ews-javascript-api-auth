import { FetchStream, fetchUrl, Meta } from 'fetch';
import * as  Promise from "bluebird";
import { IXHROptions, IXHRApi, IXHRProgress } from "./ews.partial";
import { setupXhrResponse } from "./utils";

export class cookieAuthXhrApi implements IXHRApi {

    private stream: FetchStream = null;
    private username: string = null
    private password: string = null
    private cookies: string[] = [];

    get apiName(): string {
        return "ntlm";
    }

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

    xhr(xhroptions: IXHROptions, progressDelegate?: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest> {

        if (xhroptions.headers["Authorization"]) {
            delete xhroptions.headers["Authorization"];
        }

        //setup xhr for github.com/andris9/fetch options
        let options = {
            url: xhroptions.url,
            payload: xhroptions.data,
            headers: xhroptions.headers,
            method: <any>xhroptions.type,
            cookies: this.cookies
        }

        return new Promise<XMLHttpRequest>((resolve, reject) => {

            this.cookiesPreCall(options).then(() => {
                options.cookies = this.cookies;
                fetchUrl(options.url, options, (error, meta, body) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        // storing more cookies for next request
                        let cookies: string[] = meta.cookieJar.getCookies();
                        if (!Array.isArray(cookies)) {
                            cookies = [cookies];
                        }
                        this.cookies = cookies;
                        // cookies.forEach((cookie) => { // TODO: fix multiple x-backendcookies if needed
                        //     if (cookie.indexOf('X-BackEndCookie') < 0) { //Exchange 2013 returns different X-BackEndCookie each time
                        //         if (this.cookies.indexOf(cookie) < 0) {
                        //             this.cookies.push(cookie);
                        //         }
                        //     }
                        // });
                        let xhrResponse: XMLHttpRequest = <any>{
                            response: body.toString(),
                            status: meta.status,
                            redirectCount: meta.redirectCount,
                            headers: meta.responseHeaders,
                            finalUrl: meta.finalUrl,
                            responseType: '',
                            statusText: undefined,
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
        })
    }

    xhrStream(xhroptions: IXHROptions, progressDelegate: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest> {

        //setup xhr for github.com/andris9/fetch options
        let options = {
            url: xhroptions.url,
            payload: xhroptions.data,
            headers: xhroptions.headers,
            method: <any>xhroptions.type,
            cookies: this.cookies
        }

        return new Promise<XMLHttpRequest>((resolve, reject) => {
            this.cookiesPreCall(options).then(() => {
                options.cookies = this.cookies;
                this.stream = new FetchStream(xhroptions.url, options);

                this.stream.on("data", (chunk: string) => {
                    //console.log(chunk.toString());
                    progressDelegate({ type: "data", data: chunk.toString() });
                });

                this.stream.on("meta", (meta: Meta) => {
                    progressDelegate({ type: "header", headers: meta["responseHeaders"] });
                    // storing more cookies for next request
                    let cookies: string[] = meta['cookieJar'].getCookies();
                    if (!Array.isArray(cookies)) {
                        cookies = [cookies];
                    }
                    this.cookies = cookies;
                    // cookies.forEach((cookie) => { // TODO: fix multiple x-backendcookies if needed
                    //     if (cookie.indexOf('X-BackEndCookie') < 0) { //Exchange 2013 returns different X-BackEndCookie each time
                    //         if (this.cookies.indexOf(cookie) < 0) {
                    //             this.cookies.push(cookie);
                    //         }
                    //     }
                    // });
                });

                this.stream.on("end", () => {
                    progressDelegate({ type: "end" });
                    resolve();
                });

                this.stream.on('error', (error) => {
                    progressDelegate({ type: "error", error: error });
                    this.disconnect();
                    reject(error);
                });
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

    private cookiesPreCall(options: IXHROptions): Promise<void> {

        return new Promise<void>((resolve, reject) => {
            if (!this.cookies || this.cookies.length < 1) {
                var parser = cookieAuthXhrApi.parseString(options.url);
                var baseUrl = parser.scheme + "://" + parser.authority + "/CookieAuth.dll?Logon";
                var preauthOptions = {
                    method: <any>"POST",
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    //set body, in fetch it is payload
                    payload: 'curl=Z2F&flags=0&forcedownlevel=0&formdir=1&trusted=0&username=' + this.username + '&password=' + this.password,
                    url: baseUrl,
                    disableRedirects: true
                }
                //obtaining cookies
                fetchUrl(baseUrl, preauthOptions, (error, meta, body) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        //set cookies
                        let cookies: string[] = meta.cookieJar.getCookies();
                        if (!Array.isArray(cookies)) {
                            cookies = [cookies];
                        }
                        this.cookies = cookies;
                        resolve();
                    }
                });
            }
            else {
                resolve();
            }
        });
    }

    private static parseString(url: string) {
        var regex = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
        var parts = url.match(regex);
        return {
            scheme: parts[2],
            authority: parts[4],
            path: parts[5],
            query: parts[7],
            fragment: parts[9]
        };
    }

}
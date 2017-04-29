"use strict";
var fetch_1 = require("fetch");
var Promise = require("bluebird");
var utils_1 = require("./utils");
var cookieAuthXhrApi = (function () {
    function cookieAuthXhrApi(username, password) {
        this.stream = null;
        this.username = null;
        this.password = null;
        this.cookies = [];
        this.username = username;
        this.password = password;
    }
    Object.defineProperty(cookieAuthXhrApi.prototype, "apiName", {
        get: function () {
            return "ntlm";
        },
        enumerable: true,
        configurable: true
    });
    cookieAuthXhrApi.prototype.xhr = function (xhroptions, progressDelegate) {
        var _this = this;
        if (xhroptions.headers["Authorization"]) {
            delete xhroptions.headers["Authorization"];
        }
        //setup xhr for github.com/andris9/fetch options
        var options = {
            url: xhroptions.url,
            payload: xhroptions.data,
            headers: xhroptions.headers,
            method: xhroptions.type,
            cookies: this.cookies
        };
        return new Promise(function (resolve, reject) {
            _this.cookiesPreCall(options).then(function () {
                options.cookies = _this.cookies;
                fetch_1.fetchUrl(options.url, options, function (error, meta, body) {
                    if (error) {
                        reject(error);
                    }
                    else {
                        // storing more cookies for next request
                        var cookies = meta.cookieJar.getCookies();
                        if (!Array.isArray(cookies)) {
                            cookies = [cookies];
                        }
                        _this.cookies = cookies;
                        // cookies.forEach((cookie) => { // TODO: fix multiple x-backendcookies if needed
                        //     if (cookie.indexOf('X-BackEndCookie') < 0) { //Exchange 2013 returns different X-BackEndCookie each time
                        //         if (this.cookies.indexOf(cookie) < 0) {
                        //             this.cookies.push(cookie);
                        //         }
                        //     }
                        // });
                        var xhrResponse = {
                            response: body.toString(),
                            status: meta.status,
                            redirectCount: meta.redirectCount,
                            headers: meta.responseHeaders,
                            finalUrl: meta.finalUrl,
                            responseType: '',
                            statusText: undefined,
                        };
                        if (xhrResponse.status === 200) {
                            resolve(utils_1.setupXhrResponse(xhrResponse));
                        }
                        else {
                            reject(utils_1.setupXhrResponse(xhrResponse));
                        }
                    }
                });
            });
        });
    };
    cookieAuthXhrApi.prototype.xhrStream = function (xhroptions, progressDelegate) {
        var _this = this;
        //setup xhr for github.com/andris9/fetch options
        var options = {
            url: xhroptions.url,
            payload: xhroptions.data,
            headers: xhroptions.headers,
            method: xhroptions.type,
            cookies: this.cookies
        };
        return new Promise(function (resolve, reject) {
            _this.cookiesPreCall(options).then(function () {
                options.cookies = _this.cookies;
                _this.stream = new fetch_1.FetchStream(xhroptions.url, options);
                _this.stream.on("data", function (chunk) {
                    //console.log(chunk.toString());
                    progressDelegate({ type: "data", data: chunk.toString() });
                });
                _this.stream.on("meta", function (meta) {
                    progressDelegate({ type: "header", headers: meta["responseHeaders"] });
                    // storing more cookies for next request
                    var cookies = meta['cookieJar'].getCookies();
                    if (!Array.isArray(cookies)) {
                        cookies = [cookies];
                    }
                    _this.cookies = cookies;
                    // cookies.forEach((cookie) => { // TODO: fix multiple x-backendcookies if needed
                    //     if (cookie.indexOf('X-BackEndCookie') < 0) { //Exchange 2013 returns different X-BackEndCookie each time
                    //         if (this.cookies.indexOf(cookie) < 0) {
                    //             this.cookies.push(cookie);
                    //         }
                    //     }
                    // });
                });
                _this.stream.on("end", function () {
                    progressDelegate({ type: "end" });
                    resolve();
                });
                _this.stream.on('error', function (error) {
                    progressDelegate({ type: "error", error: error });
                    _this.disconnect();
                    reject(error);
                });
            });
        });
    };
    cookieAuthXhrApi.prototype.disconnect = function () {
        if (this.stream) {
            try {
                this.stream.destroy();
            }
            catch (e) { }
        }
    };
    cookieAuthXhrApi.prototype.cookiesPreCall = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.cookies || _this.cookies.length < 1) {
                var parser = cookieAuthXhrApi.parseString(options.url);
                var baseUrl = parser.scheme + "://" + parser.authority + "/CookieAuth.dll?Logon";
                var preauthOptions = {
                    method: "POST",
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    //set body, in fetch it is payload
                    payload: 'curl=Z2F&flags=0&forcedownlevel=0&formdir=1&trusted=0&username=' + _this.username + '&password=' + _this.password,
                    url: baseUrl,
                    disableRedirects: true
                };
                //obtaining cookies
                fetch_1.fetchUrl(baseUrl, preauthOptions, function (error, meta, body) {
                    if (error) {
                        reject(error);
                    }
                    else {
                        //set cookies
                        var cookies = meta.cookieJar.getCookies();
                        if (!Array.isArray(cookies)) {
                            cookies = [cookies];
                        }
                        _this.cookies = cookies;
                        resolve();
                    }
                });
            }
            else {
                resolve();
            }
        });
    };
    cookieAuthXhrApi.parseString = function (url) {
        var regex = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
        var parts = url.match(regex);
        return {
            scheme: parts[2],
            authority: parts[4],
            path: parts[5],
            query: parts[7],
            fragment: parts[9]
        };
    };
    return cookieAuthXhrApi;
}());
exports.cookieAuthXhrApi = cookieAuthXhrApi;

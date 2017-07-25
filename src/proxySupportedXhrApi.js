"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request-promise");
var Promise = require("bluebird");
var utils_1 = require("./utils");
/** @internal */
var proxySupportedXhrApi = (function () {
    function proxySupportedXhrApi(proxyUrl, proxyUserNameOrallowUntrustedCertificate, proxyPassword, allowUntrustedCertificate) {
        if (proxyUserNameOrallowUntrustedCertificate === void 0) { proxyUserNameOrallowUntrustedCertificate = false; }
        if (proxyPassword === void 0) { proxyPassword = null; }
        if (allowUntrustedCertificate === void 0) { allowUntrustedCertificate = false; }
        this.proxyUrl = null;
        this.proxyUser = null;
        this.proxyPassword = null;
        this.proxyUrl = proxyUrl;
        if (typeof proxyUserNameOrallowUntrustedCertificate === 'string') {
            this.proxyUser = proxyUserNameOrallowUntrustedCertificate;
            this.proxyPassword = proxyPassword;
            this.allowUntrustedCertificate = allowUntrustedCertificate;
        }
        else {
            this.allowUntrustedCertificate = proxyUserNameOrallowUntrustedCertificate;
        }
    }
    Object.defineProperty(proxySupportedXhrApi.prototype, "apiName", {
        get: function () {
            return "proxy";
        },
        enumerable: true,
        configurable: true
    });
    proxySupportedXhrApi.prototype.xhr = function (xhroptions, progressDelegate) {
        //setup xhr for github.com/andris9/fetch options
        var options = {
            url: xhroptions.url,
            body: xhroptions.data,
            headers: xhroptions.headers,
            method: xhroptions.type,
            followRedirect: false,
            resolveWithFullResponse: true
        };
        var proxyStr = this.getProxyString();
        if (proxyStr) {
            options["proxy"] = proxyStr;
        }
        return new Promise(function (resolve, reject) {
            request(options).then(function (result) {
                var xhrResponse = {
                    response: result.body.toString(),
                    status: result.statusCode,
                    //redirectCount: meta.redirectCount,
                    headers: result.headers,
                    finalUrl: result.url,
                    responseType: '',
                    statusText: undefined,
                };
                if (xhrResponse.status === 200) {
                    resolve(utils_1.setupXhrResponse(xhrResponse));
                }
                else {
                    reject(utils_1.setupXhrResponse(xhrResponse));
                }
            }, function (reason) {
                var xhrResponse = {
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
                        var parse = reason.message.match(/statusCode=(\d*?)$/);
                        if (parse && parse.length > 1) {
                            xhrResponse["status"] = Number(parse[1]);
                        }
                    }
                    catch (e) { }
                }
                reject(utils_1.setupXhrResponse(xhrResponse));
            });
        });
    };
    proxySupportedXhrApi.prototype.xhrStream = function (xhroptions, progressDelegate) {
        var _this = this;
        //setup xhr for github.com/andris9/fetch options
        var options = {
            url: xhroptions.url,
            body: xhroptions.data,
            headers: xhroptions.headers,
            method: xhroptions.type,
            followRedirect: false,
            resolveWithFullResponse: true
        };
        return new Promise(function (resolve, reject) {
            var request = require('request');
            _this.stream = request(options);
            _this.stream.on('response', function (response) {
                // unmodified http.IncomingMessage object
                progressDelegate({ type: "header", headers: response["headers"] });
            });
            _this.stream.on("data", function (chunk) {
                // decompressed data as it is received
                // console.log('decoded chunk: ' + chunk)
                // console.log(chunk.toString());
                progressDelegate({ type: "data", data: chunk.toString() });
            });
            _this.stream.on("end", function () {
                progressDelegate({ type: "end" });
                resolve();
            });
            _this.stream.on('error', function (reason) {
                progressDelegate({ type: "error", error: reason });
                _this.disconnect();
                var xhrResponse = {
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
                        var parse = reason.message.match(/statusCode=(\d*?)$/);
                        if (parse && parse.length > 1) {
                            xhrResponse["status"] = Number(parse[1]);
                        }
                    }
                    catch (e) { }
                }
                reject(utils_1.setupXhrResponse(xhrResponse));
            });
        });
    };
    proxySupportedXhrApi.prototype.disconnect = function () {
        if (this.stream) {
            try {
                this.stream.destroy();
            }
            catch (e) { }
        }
    };
    proxySupportedXhrApi.prototype.getProxyString = function () {
        if (this.proxyUrl) {
            var str = this.proxyUrl;
            if (this.proxyUser && this.proxyPassword) {
                var proxyParts = this.proxyUrl.split("://");
                return (proxyParts[0] + "://" + this.proxyUser + ":" + this.proxyPassword + "@" + proxyParts[1]);
            }
            else {
                return this.proxyUrl;
            }
        }
        return null;
    };
    return proxySupportedXhrApi;
}());
exports.proxySupportedXhrApi = proxySupportedXhrApi;

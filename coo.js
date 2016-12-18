var ews = require("ews-javascript-api");
var PromiseFactory = ews.PromiseFactory;
var request = require('httpreq');
var cookiesXHRApi = (function () {
    function cookiesXHRApi(user, password) {
        this.cookies = [];
        this.userName = user;
        this.password = password;
    }
    cookiesXHRApi.prototype.xhr = function (xhroptions) {
        var _this = this;
        var headers = xhroptions.headers;
        if (headers["Authorization"]) {
            delete headers["Authorization"];
        }
        var xhr = {
            method: "POST",
            url: xhroptions.url,
            body: xhroptions.data,
            headers: headers,
            cookies: _this.cookies
        }
        // no need to use PromiseFactory.create, just return Q promise in your implementation.
        return PromiseFactory.create(function (successDelegate, errorDelegate, progressDelegate) {
            //checking if cookiesAuth is needed
            if (!_this.cookies || _this.cookies.length < 1) {
                var uri = new ews.Uri(xhroptions.url);
                var baseUrl = uri.Scheme + "://" + uri.Host + "/CookieAuth.dll?Logon";
                var preauthOptions = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'curl=Z2F&flags=0&forcedownlevel=0&formdir=1&trusted=0&username=' + _this.userName + '&password=' + _this.password,
                    url: baseUrl
                }                
                //obtaining cookies
                request.doRequest(preauthOptions, function (err, res) {
                    if (err) {
                        errorDelegate(err);
                    }
                    else {
                        //set cookies
                        _this.cookies = res.cookies;
                        xhr.cookies = _this.cookies;
                        request.doRequest(xhr, function (err, res) {
                            if (err) {
                                errorDelegate(err);
                            }
                            else {
                                // storing more cookies for next request
                                res.cookies.forEach(function (cookie) { // TODO: fix multiple x-backendcookies if needed
                                    if (cookie.indexOf('X-BackEndCookie') < 0) { //Exchange 2013 returns different X-BackEndCookie each time
                                        if (_this.cookies.indexOf(cookie) < 0) {
                                            _this.cookies.push(cookie);
                                        }
                                    }
                                });
                                //mapping properties to expected return properties.
                                res['responseText'] = res.body;
                                res['status'] = res.statusCode;
                                successDelegate(res);
                                //console.log(_this.cookies);
                            }
                        });
                    }
                });
            }
            else {
                request.doRequest(xhr, function (err, res) {
                    if (err) {
                        errorDelegate(err);
                    }
                    else {
                        // storing more cookies for next request
                        res.cookies.forEach(function (cookie, index) { // TODO: fix multiple x-backendcookies if needed
                            if (cookie.indexOf('X-BackEndCookie') < 0) { //Exchange 2013 returns different X-BackEndCookie each time
                                if (_this.cookies.indexOf(cookie) < 0) {
                                    _this.cookies.push(cookie);
                                }
                            }
                        });
                        //mapping properties to expected return properties.
                        res['responseText'] = res.body;
                        res['status'] = res.statusCode;
                        successDelegate(res);
                        //console.log(_this.cookies);
                    }
                });
            }
        });
    };
    Object.defineProperty(cookiesXHRApi.prototype, "type", {
        get: function () {
            return "cookiesXHR";
        },
        enumerable: true,
        configurable: true
    });
    return cookiesXHRApi;
})();
exports.cookiesXHRApi = cookiesXHRApi;

"cadata22CB8FF8984C4CDAB0BC55687D2D871A="1e92b0583-9c68-435d-9862-5e2a765a5320ti+1hfCA1Nc9uiHLt+t1yfMHWg0V06BW24xHbuCWkXplhJYx69ftuXsWp2vlOyo6F4fgmbm+XQLkLDXOYmB20Vzo/qNgfonQIrmBqnpU1OCIGiykx9N1P0JUMGmLw7WzGRiAxL1bBgnuwVI7yvP7snJbVgPQrJYMtpb3ReLhXrk="; ClientId=9QPPDRKWVEUO0XLXVGOPDW; exchangecookie=8eb9be9b420a406f9e09bf67908dc35e; X-BackEndCookie=S-1-5-21-3777577498-757777749-754899233-3212=u56Lnp2ejJqBm8vGzMbInM/SzcnOmtLLx8+Z0sfPxpvSy52czZ3GyM6Zz8mbgYHNz87I0s/O0s7Jq83MxcvPxc/K"
"cadata22CB8FF8984C4CDAB0BC55687D2D871A="1e92b0583-9c68-435d-9862-5e2a765a5320ti+1hfCA1Nc9uiHLt+t1yfMHWg0V06BW24xHbuCWkXplhJYx69ftuXsWp2vlOyo6F4fgmbm+XQLkLDXOYmB20Vzo/qNgfonQIrmBqnpU1OCIGiykx9N1P0JUMGmLw7WzGRiAxL1bBgnuwVI7yvP7snJbVgPQrJYMtpb3ReLhXrk="; ClientId=LZLAMWP9KYZLTAJTDEDLQ; exchangecookie=b496d5d87aed48d986fb0fe42f9124f5; X-BackEndCookie=S-1-5-21-3777577498-757777749-754899233-3212=u56Lnp2ejJqBm8vGzMbInM/SzcnOmtLLx8+Z0sfPxpvSy52czZ3GyM6Zz8mbgYHNz87I0s/O0s7Jq83MxcvPxcvG"

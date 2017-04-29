/** @internal */
export function setupXhrResponse(xhrResponse: XMLHttpRequest): XMLHttpRequest {
    xhrResponse[<any>"responseText"] = xhrResponse["response"];
    delete (<any>xhrResponse)["response"];
    xhrResponse.getAllResponseHeaders = function () {
        var header = "";
        if ((<any>xhrResponse).headers) {
            for (var key in (<any>xhrResponse).headers) {
                header += key + " : " + (<any>xhrResponse).headers[key] + "\r\n";
            }
        }
        return header;
    };

    xhrResponse.getResponseHeader = (header: string) => {
        if (header) {
            if ((<any>xhrResponse).headers) {
                if ((<any>xhrResponse).headers[header]) {
                    return (<any>xhrResponse).headers[header];
                }
                if ((<any>xhrResponse).headers[header.toLocaleLowerCase()]) {
                    return (<any>xhrResponse).headers[header.toLocaleLowerCase()];
                }
            }
        }
        return null;
    }

    return xhrResponse;
}
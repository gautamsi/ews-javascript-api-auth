/// <reference types="bluebird" />
import * as Promise from "bluebird";
import { IXHROptions, IXHRApi, IXHRProgress } from "./ews.partial";
/** @internal */
export declare class ntlmAuthXhrApi implements IXHRApi {
    private stream;
    private username;
    private password;
    private domain;
    readonly apiName: string;
    constructor(username: string, password: string);
    xhr(xhroptions: IXHROptions, progressDelegate?: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    xhrStream(xhroptions: IXHROptions, progressDelegate: (progressData: IXHRProgress) => void): Promise<XMLHttpRequest>;
    disconnect(): void;
    private ntlmPreCall(options);
    private setupXhrResponse(xhrResponse);
}

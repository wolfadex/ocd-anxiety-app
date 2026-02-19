import { HttpRequest, HttpResponse } from "./http/index.js";
import { DomError, DomElement, Viewport, SetViewportOptions, SetViewportOfOptions } from "./browser/index.js";
export * from "./http/index.js";
export * from "./browser/index.js";
export interface ElmPorts {
    send: {
        subscribe: (callback: (defs: TaskDefinition[]) => Promise<void>) => void;
    };
    receive: {
        send: (result: TaskResult[]) => void;
    };
}
export type Tasks = {
    [fn: string]: (arg: any) => any;
};
export interface TaskDefinition {
    function: string;
    attemptId: string;
    taskId: string;
    args: any;
}
export interface TaskResult {
    attemptId: string;
    taskId: string;
    result: Success | Error;
}
export interface Success {
    value: any;
}
export interface Error {
    error: {
        reason: string;
        message: string;
        raw?: any;
    };
}
export interface Builtins {
    debugLog?: (message: string) => void;
    http?: (request: HttpRequest) => Promise<HttpResponse>;
    timeNow?: () => number;
    timeZoneOffset?: () => number;
    timeZoneName?: () => string | number;
    randomSeed?: () => number;
    sleep?: (ms: number) => Promise<void>;
    domFocus?: (id: string) => void | DomError;
    domBlur?: (id: string) => void | DomError;
    domGetViewport?: () => Viewport;
    domGetViewportOf?: (id: string) => Viewport | DomError;
    domSetViewport?: (args: SetViewportOptions) => void;
    domSetViewportOf?: (args: SetViewportOfOptions) => void | DomError;
    domGetElement?: (id: string) => DomElement | DomError;
}
export interface DebugOptions {
    taskStart?: boolean;
    taskFinish?: boolean;
}
export interface Options {
    tasks: Tasks;
    ports: ElmPorts;
    builtins?: Builtins;
    debug?: boolean | DebugOptions;
}
export declare function register(options: Options): void;

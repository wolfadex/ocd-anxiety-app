"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const fetchAdapter = __importStar(require("./http/fetch.js"));
const dom = __importStar(require("./browser/dom.js"));
__exportStar(require("./http/index.js"), exports);
__exportStar(require("./browser/index.js"), exports);
const BuiltInTasks = {
    debugLog: console.log,
    http: fetchAdapter.http,
    timeNow: () => Date.now(),
    timeZoneOffset: () => getTimezoneOffset(),
    timeZoneName: () => getTimeZoneName(),
    randomSeed: () => Date.now(),
    sleep: sleep,
    domFocus: dom.focus,
    domBlur: dom.blur,
    domGetViewport: dom.getViewport,
    domGetViewportOf: dom.getViewportOf,
    domSetViewport: dom.setViewport,
    domSetViewportOf: dom.setViewportOf,
    domGetElement: dom.getElement,
};
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function getTimezoneOffset() {
    return -new Date().getTimezoneOffset();
}
function getTimeZoneName() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    catch (e) {
        return new Date().getTimezoneOffset();
    }
}
function register(options) {
    const tasks = createTasks(options);
    const subscribe = options.ports.send.subscribe;
    const send = options.ports.receive.send;
    subscribe((payload) => __awaiter(this, void 0, void 0, function* () {
        const debouncedSend = debounce(send, debounceThreshold(payload));
        for (const def of payload) {
            if (!tasks[def.function]) {
                return debouncedSend({
                    attemptId: def.attemptId,
                    taskId: def.taskId,
                    result: {
                        error: {
                            reason: "missing_function",
                            message: `${def.function} is not registered`,
                        },
                    },
                });
            }
        }
        payload.map((def) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                logTaskStart(def, options);
                const result = yield ((_a = tasks[def.function]) === null || _a === void 0 ? void 0 : _a.call(tasks, def.args));
                logTaskFinish(def, options);
                debouncedSend({
                    attemptId: def.attemptId,
                    taskId: def.taskId,
                    result: { value: result },
                });
            }
            catch (e) {
                debouncedSend({
                    attemptId: def.attemptId,
                    taskId: def.taskId,
                    result: {
                        error: {
                            reason: "js_exception",
                            message: `${e.name}: ${e.message}`,
                            raw: e,
                        },
                    },
                });
            }
        }));
    }));
}
exports.register = register;
function logTaskStart(def, options) {
    const logStart = options.debug &&
        typeof options.debug !== "boolean" &&
        options.debug.taskStart;
    if (logStart || options.debug === true) {
        console.info(`--starting-- ${def.function} attempt-${def.attemptId} id-${def.taskId}`);
    }
}
function logTaskFinish(def, options) {
    const logStart = options.debug &&
        typeof options.debug !== "boolean" &&
        options.debug.taskFinish;
    if (logStart || options.debug === true) {
        console.info(`--complete-- ${def.function} attempt - ${def.attemptId} id - ${def.taskId}`);
    }
}
function debounceThreshold(defs) {
    return defs.length > 10 ? 20 : 0;
}
function debounce(send, wait) {
    let timeout;
    let results = [];
    return function enqueueResult(taskResult) {
        results.push(taskResult);
        const later = () => {
            clearTimeout(timeout);
            send(results);
            results = [];
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
function createTasks(options) {
    const builtins = Object.assign(Object.assign({}, BuiltInTasks), (options.builtins || {}));
    return Object.assign(Object.assign({}, prefixWith("builtin:", builtins)), options.tasks);
}
function prefixWith(prefix, tasks) {
    return Object.fromEntries(Object.entries(tasks).map(([key, fn]) => [`${prefix}${key}`, fn]));
}
//# sourceMappingURL=index.js.map
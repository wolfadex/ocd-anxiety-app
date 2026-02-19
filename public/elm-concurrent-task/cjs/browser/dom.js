"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElement = exports.setViewportOf = exports.setViewport = exports.getViewportOf = exports.getViewport = exports.blur = exports.focus = void 0;
function focus(id) {
    return withDomNode(id, (el) => el.focus());
}
exports.focus = focus;
function blur(id) {
    return withDomNode(id, (el) => el.blur());
}
exports.blur = blur;
function getViewport() {
    return {
        scene: getBrowserScene(),
        viewport: {
            x: window.scrollX,
            y: window.scrollY,
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        },
    };
}
exports.getViewport = getViewport;
function getViewportOf(id) {
    return withDomNode(id, (el) => ({
        scene: {
            width: el.scrollWidth,
            height: el.scrollHeight,
        },
        viewport: {
            x: el.scrollLeft,
            y: el.scrollTop,
            width: el.clientWidth,
            height: el.clientHeight,
        },
    }));
}
exports.getViewportOf = getViewportOf;
function setViewport(options) {
    window.scroll(options.y, options.y);
}
exports.setViewport = setViewport;
function setViewportOf(options) {
    return withDomNode(options.id, (el) => {
        el.scrollLeft = options.x;
        el.scrollTop = options.y;
    });
}
exports.setViewportOf = setViewportOf;
function getElement(id) {
    return withDomNode(id, (el) => {
        const rect = el.getBoundingClientRect();
        const x = window.scrollX;
        const y = window.scrollY;
        return {
            scene: getBrowserScene(),
            viewport: {
                x: x,
                y: y,
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight,
            },
            element: {
                x: x + rect.left,
                y: y + rect.top,
                width: rect.width,
                height: rect.height,
            },
        };
    });
}
exports.getElement = getElement;
function withDomNode(id, callback) {
    const el = document.getElementById(id);
    if (el) {
        return callback(el);
    }
    return { error: null };
}
function getBrowserScene() {
    const body = document.body;
    const elem = document.documentElement;
    return {
        width: Math.max(body.scrollWidth, body.offsetWidth, elem.scrollWidth, elem.offsetWidth, elem.clientWidth),
        height: Math.max(body.scrollHeight, body.offsetHeight, elem.scrollHeight, elem.offsetHeight, elem.clientHeight),
    };
}
//# sourceMappingURL=dom.js.map
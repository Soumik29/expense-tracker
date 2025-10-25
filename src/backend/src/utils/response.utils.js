"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Send = /** @class */ (function () {
    function Send() {
    }
    Send.success = function (res, message, data) {
        if (message === void 0) { message = "Login Successful"; }
        res.status(200).json({
            ok: true,
            message: message,
            data: data,
        });
        return;
    };
    Send.error = function (res, message, data) {
        if (message === void 0) { message = "Internal Server Error"; }
        res.status(500).json({
            ok: false,
            message: message,
            data: data,
        });
        return;
    };
    Send.notFound = function (res, message, data) {
        if (message === void 0) { message = "404 Page not Found"; }
        res.status(404).json({
            ok: false,
            message: message,
            data: data,
        });
        return;
    };
    Send.unauthorized = function (res, data, message) {
        if (message === void 0) { message = "unauthorized"; }
        res.status(401).json({
            ok: false,
            message: message,
            data: data,
        });
        return;
    };
    Send.validationErrors = function (res, errors) {
        res.status(422).json({
            ok: false,
            message: "Validation error",
            errors: errors,
        });
        return;
    };
    Send.forbidden = function (res, data, message) {
        if (message === void 0) { message = "forbidden"; }
        res.status(403).json({
            ok: false,
            data: data,
            message: message,
        });
        return;
    };
    Send.badRequest = function (res, data, message) {
        if (message === void 0) { message = "bad request"; }
        res.status(400).json({
            ok: false,
            data: data,
            message: message,
        });
        return;
    };
    return Send;
}());
exports.default = Send;

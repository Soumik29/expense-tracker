"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var auth_config_js_1 = require("@config/auth.config.js");
var response_utils_js_1 = require("@utils/response.utils.js");
var jsonwebtoken_1 = require("jsonwebtoken");
var sec = auth_config_js_1.default.secret;
var AuthMiddleware = /** @class */ (function () {
    function AuthMiddleware() {
    }
    AuthMiddleware.authenticateUser = function (req, res, next) {
        var token = req.cookies.accessToken;
        if (!token) {
            return response_utils_js_1.default.unauthorized(res, null);
        }
        try {
            var decodedToken = (0, jsonwebtoken_1.verify)(token, sec);
            console.log(decodedToken);
        }
        catch (err) {
            console.error("JWT verification failed:", err);
        }
    };
    return AuthMiddleware;
}());
var h = new AuthMiddleware();
console.log(h);

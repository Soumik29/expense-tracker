"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cookie_parser_1 = require("cookie-parser");
var cors_1 = require("cors");
var auth_routes_js_1 = require("@routes/auth.routes.js");
var app_config_js_1 = require("@config/app.config.js");
var user_routes_js_1 = require("@routes/user.routes.js");
var App = /** @class */ (function () {
    function App() {
        this.app = (0, express_1.default)();
        this.initMiddlewares();
        this.initRoutes();
    }
    App.prototype.initMiddlewares = function () {
        this.app.use(express_1.default.json());
        this.app.use((0, cookie_parser_1.default)());
        this.app.use((0, cors_1.default)({
            origin: [
                'http://localhost:3000'
            ],
            methods: ['GET', 'POST', 'DELETE', 'PUT'],
            credentials: true
        }));
    };
    App.prototype.initRoutes = function () {
        this.app.use("/api/auth/", auth_routes_js_1.default);
        this.app.use("/api/user", user_routes_js_1.default);
    };
    App.prototype.start = function () {
        var port = app_config_js_1.default.port, host = app_config_js_1.default.host;
        if (host !== undefined) {
            host = host;
        }
        else {
            host = "localhost";
        }
        this.app.listen(port, host, function () {
            console.log("Server is running on http://".concat(host, ":").concat(port));
        });
    };
    return App;
}());
exports.default = App;

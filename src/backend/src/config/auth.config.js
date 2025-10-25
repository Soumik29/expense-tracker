"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var authConfig = {
    secret: process.env.AUTH_SECRET,
    secret_expries_in: process.env.AUTH_SECRET_EXPIRES_IN,
    refreshToken: process.env.AUTH_REFRESH_SECRET,
    refreshToken_expries_in: process.env.AUTH_REFRESH_SECRET_EXPIRES_IN
};
exports.default = authConfig;

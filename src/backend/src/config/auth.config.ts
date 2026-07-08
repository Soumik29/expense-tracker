// Properties are getters, not plain values, so each access reads process.env
// fresh at call time. This module is a static object evaluated once at
// import time; under ESM, static `import` declarations are always fully
// evaluated before the importing module's own top-level code runs,
// regardless of source-line order. index.ts's dotenv loading is a plain
// statement (not its own imported module), so anything this module imports
// (this file, transitively via app.js) can end up evaluated — and its
// process.env reads captured — before dotenv has actually populated
// process.env. Getters sidestep that entirely by deferring the read.
const authConfig = {
    get secret() {
        return process.env.JWT_SECRET ?? process.env.AUTH_SECRET;
    },
    // Defaulted, not required — .env.example lists these alongside the
    // secrets, but a deployment can reasonably omit them and expect a sane
    // default rather than an undefined expiresIn.
    get secret_expries_in() {
        return process.env.JWT_SECRET_EXPIRES_IN ?? process.env.AUTH_SECRET_EXPIRES_IN ?? "15m";
    },
    get refreshToken() {
        return process.env.JWT_REFRESH_SECRET ?? process.env.AUTH_REFRESH_SECRET;
    },
    get refreshToken_expries_in() {
        return process.env.JWT_REFRESH_SECRET_EXPIRES_IN ?? process.env.AUTH_REFRESH_SECRET_EXPIRES_IN ?? "7d";
    },
}

export default authConfig;
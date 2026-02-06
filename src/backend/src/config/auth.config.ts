const authConfig = {
    secret: process.env.JWT_SECRET ?? process.env.AUTH_SECRET,
    secret_expries_in: process.env.JWT_SECRET_EXPIRES_IN ?? process.env.AUTH_SECRET_EXPIRES_IN,
    refreshToken: process.env.JWT_REFRESH_SECRET ?? process.env.AUTH_REFRESH_SECRET,
    refreshToken_expries_in: process.env.JWT_REFRESH_SECRET_EXPIRES_IN ?? process.env.AUTH_REFRESH_SECRET_EXPIRES_IN
}

export default authConfig;
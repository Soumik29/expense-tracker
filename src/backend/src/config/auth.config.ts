const authConfig = {
    secret: process.env.AUTH_SECRET,
    secret_expries_in: process.env.AUTH_SECRET_EXPIRES_IN,
    refreshToken: process.env.AUTH_REFRESH_SECRET,
    refreshToken_expries_in: process.env.AUTH_REFRESH_SECRET_EXPIRES_IN
}

export default authConfig;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENT_ORIGIN = exports.IS_PROD = void 0;
exports.getJwtSecret = getJwtSecret;
exports.IS_PROD = process.env.NODE_ENV === 'production';
/**
 * In production you should always set JWT_SECRET.
 * In dev we fall back to a known string to reduce setup friction.
 */
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (secret && secret.trim().length >= 16)
        return secret.trim();
    if (exports.IS_PROD) {
        // Fail closed in prod rather than silently using an insecure default.
        throw new Error('Missing/invalid JWT_SECRET (must be >= 16 chars)');
    }
    return 'dev-insecure-jwt-secret-change-me';
}
exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

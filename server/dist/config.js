"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = exports.CLIENT_ORIGIN = exports.IS_PROD = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.IS_PROD = process.env.NODE_ENV === 'production';
exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const getJwtSecret = () => {
    return process.env.JWT_SECRET || 'supersecret_dev_key';
};
exports.getJwtSecret = getJwtSecret;

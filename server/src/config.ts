import dotenv from 'dotenv';
dotenv.config();

export const IS_PROD = process.env.NODE_ENV === 'production';
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

export const getJwtSecret = (): string => {
    return process.env.JWT_SECRET || 'supersecret_dev_key';
};

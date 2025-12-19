import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getJwtSecret } from '../config';

const router = Router();
const JWT_SECRET = getJwtSecret();

type FieldErrors = Record<string, string>;

function normalizeEmail(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    const email = input.trim().toLowerCase();
    if (!email) return null;
    // pragmatic email check (not RFC-perfect, but good UX)
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return ok ? email : null;
}

function validatePassword(input: unknown): string | null {
    if (typeof input !== 'string') return 'Password is required';
    const pw = input;
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (pw.length > 200) return 'Password is too long';
    // basic complexity: at least 2 of the 3 classes
    const hasLetter = /[A-Za-z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    const hasSymbol = /[^A-Za-z0-9]/.test(pw);
    const classes = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length;
    if (classes < 2) return 'Use at least two of: letters, numbers, symbols';
    return null;
}

const attempts = new Map<string, { count: number; resetAt: number }>();
function tooManyAttempts(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const existing = attempts.get(key);
    if (!existing || existing.resetAt <= now) {
        attempts.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }
    existing.count += 1;
    attempts.set(key, existing);
    return existing.count > limit;
}

async function getProfileComplete(userId: number): Promise<boolean> {
    const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
    return !!profile;
}

const resetTokens = new Map<string, { userId: number; expiresAt: number }>();
function isExpired(expiresAt: number) {
    return Date.now() > expiresAt;
}

// Signup
router.post('/signup', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const passwordError = validatePassword(req.body?.password);
    const fieldErrors: FieldErrors = {};
    if (!email) fieldErrors.email = 'Enter a valid email';
    if (passwordError) fieldErrors.password = passwordError;
    if (Object.keys(fieldErrors).length > 0) {
        return res.status(400).json({ error: 'Validation error', fieldErrors });
    }

    try {
        if (tooManyAttempts(`signup:${req.ip}`, 12, 10 * 60 * 1000)) {
            return res.status(429).json({ error: 'Too many attempts. Try again later.' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email: email! } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists', fieldErrors: { email: 'This email is already in use' } });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        const user = await prisma.user.create({
            data: {
                email: email!,
                password: hashedPassword,
            },
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user.id, email: user.email },
            profileComplete: await getProfileComplete(user.id),
        });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const fieldErrors: FieldErrors = {};
    if (!email) fieldErrors.email = 'Enter a valid email';
    if (!password) fieldErrors.password = 'Password is required';
    if (Object.keys(fieldErrors).length > 0) {
        return res.status(400).json({ error: 'Validation error', fieldErrors });
    }

    try {
        if (tooManyAttempts(`login:${req.ip}`, 20, 10 * 60 * 1000)) {
            return res.status(429).json({ error: 'Too many attempts. Try again later.' });
        }

        const user = await prisma.user.findUnique({ where: { email: email! } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user.id, email: user.email },
            profileComplete: await getProfileComplete(user.id),
        });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Current session
router.get('/me', authenticate, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, isActive: true },
        });
        if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' });
        res.json({
            user: { id: user.id, email: user.email },
            profileComplete: await getProfileComplete(user.id),
        });
    } catch (e) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Request a password reset (dev-only token return; prod should email the link)
router.post('/password-reset/request', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ error: 'Validation error', fieldErrors: { email: 'Enter a valid email' } });

    try {
        if (tooManyAttempts(`pwreset:${req.ip}`, 20, 10 * 60 * 1000)) {
            return res.status(429).json({ error: 'Too many attempts. Try again later.' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        // Always return 200 (avoid account enumeration)
        if (!user) return res.json({ ok: true });

        const token = crypto.randomBytes(24).toString('hex');
        resetTokens.set(token, { userId: user.id, expiresAt: Date.now() + 60 * 60 * 1000 }); // 1h

        const isProd = process.env.NODE_ENV === 'production';
        if (isProd) return res.json({ ok: true });

        // Dev convenience: return token so frontend can complete the flow.
        return res.json({ ok: true, resetToken: token });
    } catch (e) {
        return res.status(500).json({ error: 'Something went wrong' });
    }
});

router.post('/password-reset/confirm', async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const passwordError = validatePassword(req.body?.newPassword);
    const fieldErrors: FieldErrors = {};
    if (!token) fieldErrors.token = 'Reset token is required';
    if (passwordError) fieldErrors.newPassword = passwordError;
    if (Object.keys(fieldErrors).length > 0) {
        return res.status(400).json({ error: 'Validation error', fieldErrors });
    }

    const record = resetTokens.get(token);
    if (!record || isExpired(record.expiresAt)) {
        if (record) resetTokens.delete(token);
        return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    try {
        const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
        await prisma.user.update({
            where: { id: record.userId },
            data: { password: hashedPassword },
        });
        resetTokens.delete(token);
        return res.json({ ok: true });
    } catch {
        return res.status(500).json({ error: 'Something went wrong' });
    }
});

export default router;

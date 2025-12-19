import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Create or Update Profile
router.post('/', authenticate, async (req: AuthRequest, res) => {
    const { displayName, bio, age, location, gender, preferences, photos } = req.body;
    const userId = req.user!.userId;

    try {
        const errors: Record<string, string> = {};
        const name = typeof displayName === 'string' ? displayName.trim() : '';
        if (!name) errors.displayName = 'Display name is required';
        if (name.length > 50) errors.displayName = 'Display name is too long';
        const parsedAge = typeof age === 'number' ? age : parseInt(String(age ?? ''), 10);
        if (!Number.isFinite(parsedAge)) errors.age = 'Age is required';
        if (Number.isFinite(parsedAge) && (parsedAge < 18 || parsedAge > 100)) errors.age = 'Age must be 18–100';
        if (typeof bio === 'string' && bio.length > 400) errors.bio = 'Bio is too long';
        if (typeof location === 'string' && location.length > 80) errors.location = 'Location is too long';
        if (typeof gender === 'string' && gender.length > 30) errors.gender = 'Gender is too long';
        if (typeof preferences === 'string' && preferences.length > 4000) errors.preferences = 'Too much data';

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ error: 'Validation error', fieldErrors: errors });
        }

        const profile = await prisma.profile.upsert({
            where: { userId },
            update: { displayName: name, bio, age: parsedAge, location, gender, preferences },
            create: { userId, displayName: name, bio, age: parsedAge, location, gender, preferences },
        });

        // Optional: set photos via URL list (simple MVP)
        if (Array.isArray(photos)) {
            const urls = photos
                .filter((p: unknown) => typeof p === 'string')
                .map((p: string) => p.trim())
                .filter((p: string) => p.length > 0)
                .slice(0, 6);

            await prisma.photo.deleteMany({ where: { profileId: profile.id } });
            if (urls.length > 0) {
                await prisma.photo.createMany({
                    data: urls.map((url: string, idx: number) => ({
                        profileId: profile.id,
                        url,
                        sortOrder: idx,
                        isPrimary: idx === 0,
                    })),
                });
            }
        }

        const withPhotos = await prisma.profile.findUnique({
            where: { userId },
            include: { photos: true },
        });
        res.json(withPhotos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// Get My Profile
router.get('/me', authenticate, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const profile = await prisma.profile.findUnique({ where: { userId }, include: { photos: true } });
    res.json(profile);
});

// Get Discovery Feed (Profiles of others)
// MVP: Just get all profiles except self and already liked/matched
router.get('/discovery', authenticate, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;

    try {
        // Get IDs of users I have already liked
        const liked = await prisma.like.findMany({
            where: { senderId: userId },
            select: { receiverId: true },
        });
        const likedIds = liked.map(l => l.receiverId);

        const profiles = await prisma.profile.findMany({
            where: {
                userId: {
                    notIn: [userId, ...likedIds],
                },
            },
            include: { photos: true, user: { select: { id: true } } }
        });
        res.json(profiles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch discovery feed' });
    }
});

export default router;

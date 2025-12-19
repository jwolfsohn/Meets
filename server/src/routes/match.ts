import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Send Like
router.post('/like', authenticate, async (req: AuthRequest, res) => {
    const { receiverId } = req.body; // user ID of person being liked
    const senderId = req.user!.userId;

    try {
        // Check if like exists
        const existing = await prisma.like.findFirst({
            where: { senderId, receiverId },
        });
        if (existing) return res.json({ message: 'Already liked' });

        // Create like
        await prisma.like.create({
            data: { senderId, receiverId },
        });

        // Check for match (mutual like)
        const mutualLike = await prisma.like.findFirst({
            where: { senderId: receiverId, receiverId: senderId },
        });

        let isMatch = false;
        if (mutualLike) {
            isMatch = true;
            // Create Match
            // Check if match already exists to be safe
            const existingMatch = await prisma.match.findFirst({
                where: {
                    OR: [
                        { user1Id: senderId, user2Id: receiverId },
                        { user1Id: receiverId, user2Id: senderId },
                    ]
                }
            });

            if (!existingMatch) {
                await prisma.match.create({
                    data: { user1Id: senderId, user2Id: receiverId },
                });
            }
        }

        res.json({ success: true, isMatch });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to like user' });
    }
});

// Get Matches
router.get('/', authenticate, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
        const matches = await prisma.match.findMany({
            where: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
            },
            include: {
                user1: { include: { profile: { include: { photos: true } } } },
                user2: { include: { profile: { include: { photos: true } } } },
            },
        });

        // Format for client
        const formatted = matches.map(m => {
            const otherUser = m.user1Id === userId ? m.user2 : m.user1;
            return {
                id: m.id,
                matchedAt: m.matchedAt,
                otherUser: {
                    id: otherUser.id,
                    name: otherUser.profile?.displayName,
                    photo: otherUser.profile?.photos[0]?.url,
                },
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

export default router;

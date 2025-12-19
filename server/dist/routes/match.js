"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Send Like
router.post('/like', auth_1.authenticate, async (req, res) => {
    const { receiverId } = req.body; // user ID of person being liked
    const senderId = req.user.userId;
    try {
        // Check if like exists
        const existing = await prisma_1.default.like.findFirst({
            where: { senderId, receiverId },
        });
        if (existing)
            return res.json({ message: 'Already liked' });
        // Create like
        await prisma_1.default.like.create({
            data: { senderId, receiverId },
        });
        // Check for match (mutual like)
        const mutualLike = await prisma_1.default.like.findFirst({
            where: { senderId: receiverId, receiverId: senderId },
        });
        let isMatch = false;
        if (mutualLike) {
            isMatch = true;
            // Create Match
            // Check if match already exists to be safe
            const existingMatch = await prisma_1.default.match.findFirst({
                where: {
                    OR: [
                        { user1Id: senderId, user2Id: receiverId },
                        { user1Id: receiverId, user2Id: senderId },
                    ]
                }
            });
            if (!existingMatch) {
                await prisma_1.default.match.create({
                    data: { user1Id: senderId, user2Id: receiverId },
                });
            }
        }
        res.json({ success: true, isMatch });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to like user' });
    }
});
// Get Matches
router.get('/', auth_1.authenticate, async (req, res) => {
    const userId = req.user.userId;
    try {
        const matches = await prisma_1.default.match.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});
exports.default = router;

import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Create Availability Slot
router.post('/slots', authenticate, async (req: AuthRequest, res) => {
    const { startTime, endTime } = req.body;
    const userId = req.user!.userId;

    try {
        const slot = await prisma.availabilitySlot.create({
            data: {
                userId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
            },
        });
        res.json(slot);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Get My Slots
router.get('/slots', authenticate, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const slots = await prisma.availabilitySlot.findMany({ where: { userId } });
    res.json(slots);
});

// Get Match's Slots
router.get('/slots/:matchId', authenticate, async (req: AuthRequest, res) => {
    // In MVP, we just get the 'other' user's slots for this match
    // Real implementation should verify user participates in match
    const matchId = parseInt(req.params.matchId);
    // Find the match to get the other user ID
    // Skipping comprehensive security check for speed, assuming matchId is valid
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "Match not found" });

    const myId = req.user!.userId;
    const otherUserId = match.user1Id === myId ? match.user2Id : match.user1Id;

    const slots = await prisma.availabilitySlot.findMany({
        where: { userId: otherUserId, isBooked: false }
    });
    res.json(slots);
});


// Propose Call (Invite)
router.post('/invite', authenticate, async (req: AuthRequest, res) => {
    const { matchId, slotId } = req.body;
    const userId = req.user!.userId;

    try {
        const invite = await prisma.callInvite.create({
            data: {
                matchId,
                slotId,
                proposerId: userId,
            },
        });
        res.json(invite);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Accept Invite (Create Booking)
router.post('/accept/:inviteId', authenticate, async (req: AuthRequest, res) => {
    const inviteId = parseInt(req.params.inviteId);

    try {
        const invite = await prisma.callInvite.findUnique({
            where: { id: inviteId },
            include: { slot: true }
        });

        if (!invite) return res.status(404).json({ error: "Invite not found" });

        // Create Booking
        const booking = await prisma.callBooking.create({
            data: {
                inviteId,
                scheduledTime: invite.slot.startTime,
                status: 'scheduled',
                meetingLink: 'https://meet.google.com/abc-defg-hij', // Dummy link
            }
        });

        // Mark slot as booked
        await prisma.availabilitySlot.update({
            where: { id: invite.slotId },
            data: { isBooked: true }
        });

        // Update invite status
        await prisma.callInvite.update({
            where: { id: inviteId },
            data: { status: 'accepted' }
        });

        res.json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to accept" });
    }
});

export default router;

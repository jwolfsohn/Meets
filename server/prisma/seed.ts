import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Cleanup
    await prisma.callBooking.deleteMany();
    await prisma.callInvite.deleteMany();
    await prisma.availabilitySlot.deleteMany();
    await prisma.match.deleteMany();
    await prisma.like.deleteMany();
    await prisma.photo.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();

    const password = await bcrypt.hash('password123', 10);

    // Users data
    const users = [
        { email: 'alice@example.com', name: 'Alice', gender: 'Female', age: 24, bio: 'Loves hiking and coffee.', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
        { email: 'bob@example.com', name: 'Bob', gender: 'Male', age: 27, bio: 'Tech enthusiast and gamer.', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
        { email: 'charlie@example.com', name: 'Charlie', gender: 'Male', age: 29, bio: 'Foodie and traveler.', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400' },
        { email: 'diana@example.com', name: 'Diana', gender: 'Female', age: 25, bio: 'Artist and dreamer.', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' },
        { email: 'eve@example.com', name: 'Eve', gender: 'Female', age: 26, bio: 'Yoga instructor.', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400' },
        { email: 'frank@example.com', name: 'Frank', gender: 'Male', age: 30, bio: 'Musician.', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
    ];

    for (const u of users) {
        const user = await prisma.user.create({
            data: {
                email: u.email,
                password,
                profile: {
                    create: {
                        displayName: u.name,
                        age: u.age,
                        bio: u.bio,
                        gender: u.gender,
                        location: 'San Francisco, CA',
                        photos: {
                            create: { url: u.photo, isPrimary: true }
                        }
                    }
                }
            }
        });
        console.log(`Created user ${u.name}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

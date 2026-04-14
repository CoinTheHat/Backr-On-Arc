import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const username = searchParams.get('username');
    const query = searchParams.get('q');

    if (address) {
        const creator = await db.creators.find(address);
        return NextResponse.json(creator || {});
    }

    if (username) {
        // Check if username is already taken
        const existing = await db.creators.findByUsername(username);
        return NextResponse.json({ available: !existing });
    }

    const creators = await db.creators.getAll();

    if (query) {
        const lowerQuery = query.toLowerCase();
        const filtered = creators.filter((c: any) =>
            c.name?.toLowerCase().includes(lowerQuery) ||
            c.username?.toLowerCase().includes(lowerQuery) ||
            c.bio?.toLowerCase().includes(lowerQuery)
        );
        return NextResponse.json(filtered);
    }

    return NextResponse.json(creators);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { address, username, name, avatarUrl } = body;

        if (!address) {
            return NextResponse.json({ error: 'Missing address' }, { status: 400 });
        }

        // Validate username format
        if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return NextResponse.json({ error: 'Username must be 3-20 characters, letters, numbers, and underscores only' }, { status: 400 });
        }

        // Check if username is already taken by another creator
        if (username) {
            const existingWithUsername = await db.creators.findByUsername(username);

            if (existingWithUsername && existingWithUsername.address.toLowerCase() !== address.toLowerCase()) {
                return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
            }
        }

        // Check if email is already taken by another creator (prevent duplicate accounts for same email)
        if (body.email) {
            const users = await db.creators.getAll();
            // Note: This is inefficient for large DBs, should add findByEmail to db.ts. 
            // optimized instruction: I should add findByEmail to db.ts properly, but for now I can iterate or just assume address limit.
            // Actually, let's keep it simple and safe.
            const existingWithEmail = users.find((u: any) => u.email === body.email && u.address.toLowerCase() !== address.toLowerCase());
            if (existingWithEmail) {
                return NextResponse.json({ error: 'Email is already linked to another wallet. Please login with your original wallet.' }, { status: 409 });
            }
        }

        // Save to local DB (now Postgres)
        const updated = await db.creators.create({
            ...body,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json(updated);
    } catch (e: any) {
        // Handle unique constraint violation for username or avatarUrl
        if (e.code === '23505' && (e.constraint?.includes('username') || e.constraint?.includes('avatarUrl'))) {
            return NextResponse.json({ error: 'Username or Avatar URL is already taken' }, { status: 409 });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

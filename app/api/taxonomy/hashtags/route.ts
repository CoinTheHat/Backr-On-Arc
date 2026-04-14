import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

const DEFAULT_HASHTAGS = [
    { id: 'crypto', label: 'crypto', isActive: true, sortOrder: 1 },
    { id: 'web3', label: 'web3', isActive: true, sortOrder: 2 },
    { id: 'nft', label: 'nft', isActive: true, sortOrder: 3 },
    { id: 'indie', label: 'indie', isActive: true, sortOrder: 4 }
];

export async function GET() {
    try {
        const data = await db.taxonomy.hashtags.getAll();

        // Map 'name' to 'label' for frontend compatibility
        const mappedData = data.map((tag: any) => ({
            ...tag,
            label: tag.name
        }));

        if (!data || data.length === 0) {
            // Optional: return defaults if DB empty? 
            // Better to return empty array or defaults.
            // Following original logic:
            return NextResponse.json(mappedData.length ? mappedData : DEFAULT_HASHTAGS);
        }

        return NextResponse.json(mappedData);
    } catch (e: any) {
        return NextResponse.json(DEFAULT_HASHTAGS);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Check if bulk add (array)
        if (Array.isArray(body)) {
            // PG specific bulk insert or loop
            // db.taxonomy.hashtags.create takes name, slug
            const results = [];
            for (const tag of body) {
                const slug = tag.id || tag.label.toLowerCase().replace(/[^a-z0-9]+/g, '');
                const newTag = await db.taxonomy.hashtags.create(tag.label, slug);
                // We might need to update other fields (sortOrder etc) immediately?
                // The current db.create only sets name/slug.
                // For MVP, just creating is fine, or we call update.
                if (newTag) {
                    await db.taxonomy.hashtags.update(newTag.id, {
                        sortOrder: tag.sortOrder,
                        isActive: tag.isActive,
                        isTrending: tag.isTrending
                    });
                    results.push(newTag);
                }
            }
            return NextResponse.json(results);
        }

        // Single add
        const { label, sortOrder, isActive, isTrending } = body;
        const slug = body.id || label.toLowerCase().replace(/[^a-z0-9]+/g, '');

        const newTag = await db.taxonomy.hashtags.create(label, slug);
        if (newTag) {
            await db.taxonomy.hashtags.update(newTag.id, {
                sortOrder,
                isActive,
                isTrending
            });
            // Fetch updated
            const updated = { ...newTag, sortOrder, isActive, isTrending, label }; // approximate return
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: "Failed to create" }, { status: 500 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, label, sortOrder, isActive, isTrending } = body;

        if (!id) {
            return NextResponse.json({ error: 'Hashtag ID is required' }, { status: 400 });
        }

        const updated = await db.taxonomy.hashtags.update(id, {
            label, // maps to name in DB
            sortOrder,
            isActive,
            isTrending
        });

        if (!updated) {
            return NextResponse.json({ error: 'Hashtag not found' }, { status: 404 });
        }

        return NextResponse.json({ ...updated, label: updated.name });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Hashtag ID is required' }, { status: 400 });
        }

        await db.taxonomy.hashtags.delete(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

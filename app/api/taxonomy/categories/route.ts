import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

const DEFAULT_CATEGORIES = [
    { id: 'art', name: 'Art', icon: '🎨', isActive: true, sortOrder: 1 },
    { id: 'gaming', name: 'Gaming', icon: '🎮', isActive: true, sortOrder: 2 },
    { id: 'music', name: 'Music', icon: '🎵', isActive: true, sortOrder: 3 },
    { id: 'tech', name: 'Tech', icon: '💻', isActive: true, sortOrder: 4 },
    { id: 'podcast', name: 'Podcast', icon: '🎙️', isActive: true, sortOrder: 5 }
];

export async function GET() {
    try {
        const data = await db.taxonomy.categories.getAll();

        if (!data || data.length === 0) {
            return NextResponse.json(DEFAULT_CATEGORIES);
        }

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json(DEFAULT_CATEGORIES);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, icon, sortOrder, isActive } = body;

        // Auto-generate slug from name if not provided
        const slug = body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const newCat = await db.taxonomy.categories.create(name, slug);

        if (newCat) {
            // Update additional fields
            const updated = await db.taxonomy.categories.update(newCat.id, {
                name,
                icon,
                sortOrder,
                isActive
            });
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
        const { id, name, icon, sortOrder, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
        }

        const updated = await db.taxonomy.categories.update(id, {
            name,
            icon,
            sortOrder,
            isActive
        });

        if (!updated) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
        }

        await db.taxonomy.categories.delete(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

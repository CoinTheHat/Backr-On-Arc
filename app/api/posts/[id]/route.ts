import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const body = await request.json();

        // Verify ownership
        const existingPost = await db.posts.getById(id);

        if (!existingPost) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (existingPost.creatorAddress.toLowerCase() !== body.creatorAddress.toLowerCase()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Update post
        const payload = {
            title: body.title,
            content: body.content,
            image: body.image || null,
            videoUrl: body.videoUrl || null,
            minTier: Number(body.minTier) || 0,
            isPublic: !!body.isPublic,
            ppvPrice: body.ppvPrice || null,
            ppvEnabled: !!body.ppvEnabled
        };

        await db.posts.update(id, payload);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Post Update Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const body = await request.json();

        // Verify ownership
        const existingPost = await db.posts.getById(id);

        if (!existingPost) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (existingPost.creatorAddress.toLowerCase() !== body.creatorAddress.toLowerCase()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Delete post
        await db.posts.delete(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Post Delete Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { db } from "@/utils/db";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await db.posts.like(id);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error liking post:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

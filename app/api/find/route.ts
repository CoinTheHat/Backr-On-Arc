import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { identifier } = body;

        if (!identifier) {
            return NextResponse.json(
                { error: "Identifier is required" },
                { status: 400 }
            );
        }

        // If it's already a wallet address, return it
        if (identifier.startsWith('0x') && identifier.length === 42) {
            return NextResponse.json({
                success: true,
                address: identifier,
                identifier,
            });
        }

        // Look up by username in our database
        const creator = await db.creators.findByUsername(identifier);

        if (!creator) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            address: creator.address,
            identifier,
        });
    } catch (error) {
        console.error("Error in /api/find:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

'use client';

import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"] });

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-mist text-slate-900`}>
                <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                    <h1 className="font-serif text-4xl font-bold mb-4">Something went wrong!</h1>
                    <p className="text-slate-500 mb-8">A creating error occurred.</p>
                    <button
                        onClick={() => reset()}
                        className="px-6 py-3 rounded-full bg-slate-900 text-white font-bold"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}

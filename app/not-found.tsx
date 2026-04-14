import Link from 'next/link';
import { Rocket } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-mist text-slate-900 p-6 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
                <Rocket size={40} className="transform rotate-45" />
            </div>
            <h2 className="text-4xl font-bold font-serif mb-2">404</h2>
            <p className="text-xl font-medium text-slate-700 mb-2">Page Not Found</p>
            <p className="text-slate-500 mb-8 max-w-md">
                The page you are looking for doesn't exist or has been moved.
            </p>
            <Link
                href="/"
                className="px-8 py-3 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
            >
                Return Home
            </Link>
        </div>
    );
}

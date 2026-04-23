/**
 * Avatar helpers.
 *
 * Supabase Storage on the free tier can be throttled / paused, which breaks
 * uploaded avatar URLs. As a resilient fallback we use DiceBear (a free CDN
 * that generates deterministic SVG avatars from a seed — e.g. a wallet
 * address) so creators always have a visible profile picture.
 */

/**
 * Returns a DiceBear URL for a given seed (wallet address, username, etc).
 * These are free, cached globally, and never break.
 */
export function generatedAvatar(seed: string): string {
    const clean = String(seed || 'anon').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 64) || 'anon';
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${clean}&backgroundColor=6366f1,8b5cf6,ec4899,10b981&size=256`;
}

/**
 * Pick the best avatar URL available: uploaded → generated fallback.
 */
export function resolveAvatar(uploadedUrl: string | null | undefined, seed: string): string {
    if (uploadedUrl && uploadedUrl.length > 0) return uploadedUrl;
    return generatedAvatar(seed);
}

/**
 * Event handler for <img onError> — swaps to a DiceBear URL if the uploaded
 * URL fails to load (Supabase 401 / 404 / CORS).
 */
export function onAvatarError(seed: string) {
    return (e: React.SyntheticEvent<HTMLImageElement>) => {
        const fallback = generatedAvatar(seed);
        const img = e.currentTarget;
        if (img.src !== fallback) img.src = fallback;
    };
}

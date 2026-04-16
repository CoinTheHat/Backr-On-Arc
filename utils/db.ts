import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dtxrLhgNbVRSceACyImtLEBcELdghdzH@trolley.proxy.rlwy.net:53433/railway',
    ssl: { rejectUnauthorized: false }
});

// Initialize tables
const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS creators (
                address TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                name TEXT,
                bio TEXT,
                description TEXT,
                "profileImage" TEXT,
                "coverImage" TEXT,
                email TEXT,
                "avatarUrl" TEXT,
                socials JSONB,
                "payoutToken" TEXT,
                "contractAddress" TEXT,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            );
            
            -- Add username column if it doesn't exist (for existing tables)
            ALTER TABLE creators
            ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

            CREATE TABLE IF NOT EXISTS tiers (
                id TEXT PRIMARY KEY,
                "creatorAddress" TEXT REFERENCES creators(address),
                name TEXT,
                price NUMERIC,
                description TEXT,
                perks JSONB,
                image TEXT
            );

            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                "creatorAddress" TEXT REFERENCES creators(address),
                title TEXT,
                content TEXT,
                image TEXT,
                "videoUrl" TEXT,
                "minTier" INTEGER,
                likes INTEGER DEFAULT 0,
                "isPublic" BOOLEAN DEFAULT FALSE,
                "createdAt" TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS tips (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                sender TEXT,
                receiver TEXT REFERENCES creators(address),
                amount NUMERIC,
                currency TEXT,
                message TEXT,
                "txHash" TEXT,
                timestamp TIMESTAMP DEFAULT NOW()
            );

            -- Add txHash column if it doesn't exist (for existing tables)
            ALTER TABLE tips
            ADD COLUMN IF NOT EXISTS "txHash" TEXT;

            CREATE TABLE IF NOT EXISTS memberships (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                "userAddress" TEXT,
                "creatorAddress" TEXT REFERENCES creators(address),
                "tierId" INTEGER,
                "expiresAt" TIMESTAMP,
                "txHash" TEXT,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            );

            -- Add txHash column if it doesn't exist (for existing tables)
            ALTER TABLE memberships
            ADD COLUMN IF NOT EXISTS "txHash" TEXT;

            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                icon TEXT,
                "sortOrder" INTEGER DEFAULT 0,
                "isActive" BOOLEAN DEFAULT TRUE,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS hashtags (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL, 
                slug TEXT UNIQUE NOT NULL, 
                "sortOrder" INTEGER DEFAULT 0,
                "isActive" BOOLEAN DEFAULT TRUE,
                "isTrending" BOOLEAN DEFAULT FALSE,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS comments (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                "postId" TEXT REFERENCES posts(id) ON DELETE CASCADE,
                "userAddress" TEXT,
                content TEXT,
                "createdAt" TIMESTAMP DEFAULT NOW()
            );

            -- PPV columns on posts
            ALTER TABLE posts ADD COLUMN IF NOT EXISTS "ppvPrice" NUMERIC DEFAULT NULL;
            ALTER TABLE posts ADD COLUMN IF NOT EXISTS "ppvEnabled" BOOLEAN DEFAULT FALSE;

            -- PPV purchases table
            CREATE TABLE IF NOT EXISTS ppv_purchases (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                "postId" TEXT REFERENCES posts(id) ON DELETE CASCADE,
                "buyerAddress" TEXT,
                amount NUMERIC,
                "txHash" TEXT,
                "createdAt" TIMESTAMP DEFAULT NOW()
            );

            -- Jobs table (ERC-8183) — Content Commissions
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                "onchainId" TEXT,
                "creatorAddress" TEXT,
                "requesterAddress" TEXT,
                title TEXT,
                description TEXT,
                budget NUMERIC,
                status TEXT DEFAULT 'open',
                "claimedBy" TEXT,
                "submissionResult" TEXT,
                "txHash" TEXT,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            );

            -- Add requesterAddress if not exists (for existing tables)
            ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "requesterAddress" TEXT;
        `);
    } catch (err) {
        console.error('Error initializing DB:', err);
    } finally {
        client.release();
    }
};

// Run init on import (or you could call this explicitly)
// Only run if we have a database URL, and don't crash if it fails (e.g. during build)
if (process.env.DATABASE_URL) {
    initDb().catch(e => {
        console.warn("Failed to initialize DB (this is expected during build):", e.message);
    });
}

export const db = {
    creators: {
        getAll: async () => {
            const res = await pool.query('SELECT * FROM creators');
            return res.rows;
        },
        find: async (address: string) => {
            const res = await pool.query('SELECT * FROM creators WHERE LOWER(address) = LOWER($1)', [address]);
            return res.rows[0];
        },
        findByUsername: async (username: string) => {
            const res = await pool.query('SELECT * FROM creators WHERE LOWER(username) = LOWER($1)', [username]);
            return res.rows[0];
        },
        create: async (creator: any) => {
            const { address, username, name, bio, profileImage, coverImage, email, avatarUrl, contractAddress } = creator;
            // Sync avatar fields for compatibility across different components
            const finalAvatar = avatarUrl || profileImage || '';

            // First, check if a profile already exists with this address (case-insensitive)
            const existing = await pool.query('SELECT address FROM creators WHERE LOWER(address) = LOWER($1)', [address]);
            const canonicalAddress = existing.rows.length > 0 ? existing.rows[0].address : address;

            const query = `
                INSERT INTO creators (address, username, name, bio, "profileImage", "coverImage", email, "avatarUrl", "contractAddress", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                ON CONFLICT (address) DO UPDATE
                SET
                    username = COALESCE(NULLIF($2, ''), creators.username),
                    name = COALESCE(NULLIF($3, ''), creators.name),
                    bio = COALESCE(NULLIF($4, ''), creators.bio),
                    "profileImage" = CASE WHEN $5 <> '' THEN $5 ELSE creators."profileImage" END,
                    "coverImage" = CASE WHEN $6 <> '' THEN $6 ELSE creators."coverImage" END,
                    email = COALESCE(NULLIF($7, ''), creators.email),
                    "avatarUrl" = CASE WHEN $8 <> '' THEN $8 ELSE creators."avatarUrl" END,
                    "contractAddress" = CASE WHEN $9 <> '' THEN $9 ELSE creators."contractAddress" END,
                    "updatedAt" = NOW()
                RETURNING *;
            `;
            const res = await pool.query(query, [canonicalAddress, username, name, bio, finalAvatar, coverImage, email, finalAvatar, contractAddress || '']);
            return res.rows[0];
        },
        updateSocials: async (address: string, socials: any) => {
            const query = `
                UPDATE creators 
                SET socials = $2, "updatedAt" = NOW()
                WHERE LOWER(address) = LOWER($1)
                RETURNING *;
            `;
            const res = await pool.query(query, [address, socials]);
            return res.rows[0];
        }
    },
    tiers: {
        getByCreator: async (address: string) => {
            const res = await pool.query('SELECT * FROM tiers WHERE LOWER("creatorAddress") = LOWER($1)', [address]);
            return res.rows;
        },
        saveAll: async (address: string, newTiers: any[]) => {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                // Find the canonical address from creators table
                const creatorRes = await client.query('SELECT address FROM creators WHERE LOWER(address) = LOWER($1)', [address]);
                const canonicalAddress = creatorRes.rows.length > 0 ? creatorRes.rows[0].address : address;

                await client.query('DELETE FROM tiers WHERE LOWER("creatorAddress") = LOWER($1)', [address]);
                for (const tier of newTiers) {
                    await client.query(
                        'INSERT INTO tiers (id, "creatorAddress", name, price, description, perks, image) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                        [tier.id || Math.random().toString(36).substr(2, 9), canonicalAddress, tier.name, tier.price, tier.description, JSON.stringify(tier.perks), tier.image]
                    );
                }
                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        }
    },
    posts: {
        getAll: async () => {
            const res = await pool.query('SELECT * FROM posts ORDER BY "createdAt" DESC');
            return res.rows;
        },
        getByCreator: async (address: string) => {
            const res = await pool.query('SELECT * FROM posts WHERE LOWER("creatorAddress") = LOWER($1) ORDER BY "createdAt" DESC', [address]);
            return res.rows;
        },
        getById: async (id: string) => {
            const res = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
            return res.rows[0];
        },
        create: async (post: any) => {
            // Find canonical address from creators table
            const creatorRes = await pool.query('SELECT address FROM creators WHERE LOWER(address) = LOWER($1)', [post.creatorAddress]);
            const canonicalAddress = creatorRes.rows.length > 0 ? creatorRes.rows[0].address : post.creatorAddress;

            const query = `
                INSERT INTO posts ("creatorAddress", title, content, image, "videoUrl", "minTier", "isPublic", "ppvPrice", "ppvEnabled", "createdAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                RETURNING *;
            `;
            const res = await pool.query(query, [
                canonicalAddress, post.title, post.content, post.image, post.videoUrl, post.minTier, post.isPublic,
                post.ppvPrice || null, post.ppvEnabled || false
            ]);
            return res.rows[0];
        },
        update: async (id: string, post: any) => {
            const query = `
                UPDATE posts
                SET title = $2, content = $3, image = $4, "videoUrl" = $5, "minTier" = $6, "isPublic" = $7, "ppvPrice" = $8, "ppvEnabled" = $9
                WHERE id = $1
                RETURNING *;
            `;
            const res = await pool.query(query, [
                id, post.title, post.content, post.image, post.videoUrl, post.minTier, post.isPublic,
                post.ppvPrice || null, post.ppvEnabled || false
            ]);
            return res.rows[0];
        },
        async delete(id: string) {
            const res = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
            return res.rows[0];
        },
        async like(id: string) {
            const res = await pool.query('UPDATE posts SET likes = likes + 1 WHERE id = $1 RETURNING likes', [id]);
            return res.rows[0];
        }
    },
    comments: {
        getByPost: async (postId: string) => {
            const res = await pool.query(`
                SELECT c.*, cr.username, cr."avatarUrl" 
                FROM comments c
                LEFT JOIN creators cr ON LOWER(c."userAddress") = LOWER(cr.address)
                WHERE c."postId" = $1 
                ORDER BY c."createdAt" ASC
            `, [postId]);
            return res.rows;
        },
        create: async (comment: { postId: string, userAddress: string, content: string }) => {
            const res = await pool.query(
                'INSERT INTO comments ("postId", "userAddress", content) VALUES ($1, $2, $3) RETURNING *',
                [comment.postId, comment.userAddress.toLowerCase(), comment.content]
            );
            return res.rows[0];
        }
    },
    taxonomy: {
        categories: {
            getAll: async () => {
                const res = await pool.query('SELECT * FROM categories ORDER BY "sortOrder" ASC');
                return res.rows;
            },
            create: async (name: string, slug: string) => {
                const res = await pool.query('INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *', [name, slug]);
                return res.rows[0];
            },
            delete: async (id: string) => {
                await pool.query('DELETE FROM categories WHERE id = $1', [id]);
            },
            toggleActive: async (id: string, isActive: boolean) => {
                const res = await pool.query('UPDATE categories SET "isActive" = $2 WHERE id = $1 RETURNING *', [id, isActive]);
                return res.rows[0];
            },
            update: async (id: string, updates: any) => {
                const { name, icon, sortOrder, isActive } = updates;
                const query = `
                    UPDATE categories 
                    SET 
                        name = COALESCE($2, name),
                        icon = COALESCE($3, icon), 
                        "sortOrder" = COALESCE($4, "sortOrder"),
                        "isActive" = COALESCE($5, "isActive"),
                        "updatedAt" = NOW()
                    WHERE id = $1
                    RETURNING *;
                `;
                const res = await pool.query(query, [id, name, icon, sortOrder, isActive]);
                return res.rows[0];
            }
        },
        hashtags: {
            getAll: async () => {
                const res = await pool.query('SELECT * FROM hashtags ORDER BY "sortOrder" ASC');
                return res.rows;
            },
            create: async (name: string, slug: string) => {
                const res = await pool.query('INSERT INTO hashtags (name, slug) VALUES ($1, $2) RETURNING *', [name, slug]);
                return res.rows[0];
            },
            delete: async (id: string) => {
                await pool.query('DELETE FROM hashtags WHERE id = $1', [id]);
            },
            toggleTrending: async (id: string, isTrending: boolean) => {
                const res = await pool.query('UPDATE hashtags SET "isTrending" = $2 WHERE id = $1 RETURNING *', [id, isTrending]);
                return res.rows[0];
            },
            update: async (id: string, updates: any) => {
                const { label, sortOrder, isActive, isTrending } = updates;
                // Note: label maps to name in DB
                const query = `
                    UPDATE hashtags 
                    SET 
                        name = COALESCE($2, name),
                        "sortOrder" = COALESCE($3, "sortOrder"),
                        "isActive" = COALESCE($4, "isActive"),
                        "isTrending" = COALESCE($5, "isTrending"),
                         "updatedAt" = NOW()
                    WHERE id = $1
                    RETURNING *;
                `;
                const res = await pool.query(query, [id, label, sortOrder, isActive, isTrending]);
                return res.rows[0];
            }
        }
    },
    stats: {
        getCounts: async () => {
            const creators = await pool.query('SELECT COUNT(*) FROM creators');
            const posts = await pool.query('SELECT COUNT(*) FROM posts');
            const tips = await pool.query('SELECT COUNT(*) FROM tips');
            const volume = await pool.query('SELECT SUM(amount) FROM tips');
            const ppvPurchases = await pool.query('SELECT COUNT(*) FROM ppv_purchases');
            return {
                creators: parseInt(creators.rows[0].count),
                posts: parseInt(posts.rows[0].count),
                tips: parseInt(tips.rows[0].count),
                ppvPurchases: parseInt(ppvPurchases.rows[0].count),
                volume: parseFloat(volume.rows[0].sum || '0')
            };
        }
    },
    tips: {
        getAll: async () => {
            const res = await pool.query('SELECT * FROM tips ORDER BY timestamp DESC');
            return res.rows;
        },
        getByReceiver: async (address: string) => {
            const res = await pool.query('SELECT * FROM tips WHERE LOWER(receiver) = LOWER($1) ORDER BY timestamp DESC', [address]);
            return res.rows;
        },
        getBySender: async (address: string) => {
            const res = await pool.query('SELECT * FROM tips WHERE LOWER(sender) = LOWER($1) ORDER BY timestamp DESC', [address]);
            return res.rows;
        },
        create: async (tip: any) => {
            const query = `
                INSERT INTO tips (sender, receiver, amount, currency, message, "txHash", timestamp)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING *;
            `;
            const res = await pool.query(query, [
                tip.sender.toLowerCase(),
                tip.receiver.toLowerCase(),
                tip.amount,
                tip.currency || 'USDC',
                tip.message,
                tip.txHash || null
            ]);
            return res.rows[0];
        }
    },
    ppvPurchases: {
        create: async (purchase: any) => {
            const query = `
                INSERT INTO ppv_purchases ("postId", "buyerAddress", amount, "txHash")
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const res = await pool.query(query, [
                purchase.postId, purchase.buyerAddress.toLowerCase(), purchase.amount, purchase.txHash
            ]);
            return res.rows[0];
        },
        getByPostAndBuyer: async (postId: string, buyerAddress: string) => {
            const res = await pool.query(
                'SELECT * FROM ppv_purchases WHERE "postId" = $1 AND LOWER("buyerAddress") = LOWER($2)',
                [postId, buyerAddress]
            );
            return res.rows[0];
        },
        getByBuyer: async (buyerAddress: string) => {
            const res = await pool.query(
                'SELECT * FROM ppv_purchases WHERE LOWER("buyerAddress") = LOWER($1) ORDER BY "createdAt" DESC',
                [buyerAddress]
            );
            return res.rows;
        },
        getByPost: async (postId: string) => {
            const res = await pool.query(
                'SELECT * FROM ppv_purchases WHERE "postId" = $1 ORDER BY "createdAt" DESC',
                [postId]
            );
            return res.rows;
        }
    },
    jobs: {
        getAll: async (status?: string) => {
            if (status) {
                const res = await pool.query('SELECT * FROM jobs WHERE status = $1 ORDER BY "createdAt" DESC', [status]);
                return res.rows;
            }
            const res = await pool.query('SELECT * FROM jobs ORDER BY "createdAt" DESC');
            return res.rows;
        },
        getByCreator: async (address: string) => {
            const res = await pool.query('SELECT * FROM jobs WHERE LOWER("creatorAddress") = LOWER($1) ORDER BY "createdAt" DESC', [address]);
            return res.rows;
        },
        getByRequester: async (address: string) => {
            const res = await pool.query('SELECT * FROM jobs WHERE LOWER("requesterAddress") = LOWER($1) ORDER BY "createdAt" DESC', [address]);
            return res.rows;
        },
        getById: async (id: string) => {
            const res = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
            return res.rows[0];
        },
        create: async (job: any) => {
            const query = `
                INSERT INTO jobs ("onchainId", "creatorAddress", "requesterAddress", title, description, budget, status, "txHash")
                VALUES ($1, $2, $3, $4, $5, $6, 'open', $7)
                RETURNING *;
            `;
            const res = await pool.query(query, [
                job.onchainId,
                job.creatorAddress ? job.creatorAddress.toLowerCase() : null,
                job.requesterAddress ? job.requesterAddress.toLowerCase() : null,
                job.title, job.description, job.budget, job.txHash
            ]);
            return res.rows[0];
        },
        update: async (id: string, updates: any) => {
            const query = `
                UPDATE jobs
                SET status = COALESCE($2, status),
                    "claimedBy" = COALESCE($3, "claimedBy"),
                    "submissionResult" = COALESCE($4, "submissionResult"),
                    "txHash" = COALESCE($5, "txHash"),
                    "updatedAt" = NOW()
                WHERE id = $1
                RETURNING *;
            `;
            const res = await pool.query(query, [
                id, updates.status, updates.claimedBy, updates.submissionResult, updates.txHash
            ]);
            return res.rows[0];
        }
    },
    memberships: {
        getAll: async () => {
            const res = await pool.query('SELECT * FROM memberships ORDER BY "createdAt" DESC');
            return res.rows;
        },
        getByUser: async (address: string) => {
            const query = `
                SELECT m.*, c.name as "creatorName", c.username as "creatorUsername", c."avatarUrl" as "creatorAvatar", c."profileImage" as "creatorProfileImage"
                FROM memberships m
                LEFT JOIN creators c ON LOWER(m."creatorAddress") = LOWER(c.address)
                WHERE LOWER(m."userAddress") = LOWER($1)
                ORDER BY m."createdAt" DESC
            `;
            const res = await pool.query(query, [address]);
            return res.rows;
        },
        getByCreator: async (address: string) => {
            const res = await pool.query('SELECT * FROM memberships WHERE LOWER("creatorAddress") = LOWER($1)', [address]);
            return res.rows;
        },
        create: async (membership: any) => {
            // Find canonical addresses from creators table
            const userRes = await pool.query('SELECT address FROM creators WHERE LOWER(address) = LOWER($1)', [membership.userAddress]);
            const creatorRes = await pool.query('SELECT address FROM creators WHERE LOWER(address) = LOWER($1)', [membership.creatorAddress]);
            const canonicalUser = userRes.rows.length > 0 ? userRes.rows[0].address : membership.userAddress;
            const canonicalCreator = creatorRes.rows.length > 0 ? creatorRes.rows[0].address : membership.creatorAddress;

            const query = `
                INSERT INTO memberships ("userAddress", "creatorAddress", "tierId", "expiresAt", "txHash", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                RETURNING *;
            `;
            const res = await pool.query(query, [
                canonicalUser,
                canonicalCreator,
                membership.tierId,
                membership.expiresAt,
                membership.txHash || null
            ]);
            return res.rows[0];
        }
    }
};

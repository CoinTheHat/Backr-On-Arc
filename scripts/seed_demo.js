/**
 * Seed demo creators + PPV posts for a fresh platform state.
 *   node scripts/seed_demo.js
 *
 * Creates 4 demo creators with deterministic wallet addresses (generated from
 * a fixed mnemonic-ish seed so rerunning is idempotent). Each creator gets a
 * 1-tier membership and 2 PPV posts. This gives the demo page real recipients
 * to route nanopayments to and gives AI chat real postIds to unlock.
 */
const { Pool } = require('pg');
const { keccak256, toBytes } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) { console.error('No POSTGRES_URL / DATABASE_URL'); process.exit(1); }
const pool = new Pool({ connectionString: url });

// Deterministic wallets from a fixed seed phrase. These are DEMO addresses
// only — no real person owns them. Anyone can re-derive them to verify.
function demoWallet(seed) {
    const pk = keccak256(toBytes('backr-demo-v1:' + seed));
    const acc = privateKeyToAccount(pk);
    return acc.address;
}

// User-owned test wallet — unlocks against @eli_test land real USDC here so
// you can verify the transfer on ArcScan.
const TEST_WALLET = '0xEc499d6561Dfef8115B21E7Bae883967e56F6728';

const CREATORS = [
    {
        // Controlled test wallet — USDC lands here when any of eli_test's
        // PPV posts are unlocked on-chain. Used for demo verification.
        address: TEST_WALLET,
        username: 'eli_test',
        name: 'Eli Test',
        bio: 'Controlled test wallet for demo verification. Unlock my posts to see USDC land on ArcScan.',
        cat: 'Demo & Testing',
        posts: [
            { title: 'DEMO: Unlock me to fire a real on-chain USDC transfer', price: 0.005 },
            { title: 'DEMO: $0.001 micro-unlock — tiny but real', price: 0.001 },
            { title: 'DEMO: $0.01 long read — biggest payment', price: 0.01 },
        ],
    },
    {
        username: 'mira',
        name: 'Mira Chen',
        bio: 'Cypherpunk essays + zk research notes. Weekly deep-dives.',
        cat: 'Tech & Crypto',
        posts: [
            { title: 'What actually ships in a zk-rollup fraud proof', price: 0.005 },
            { title: 'Recovering EIP-3009 authorizations: a field guide', price: 0.003 },
        ],
    },
    {
        username: 'sam_builds',
        name: 'Sam Builds',
        bio: 'Solo dev, open-source maximalist. Shipping notes + postmortems.',
        cat: 'Engineering',
        posts: [
            { title: 'Why my indexer broke at 180M rows (and the fix)', price: 0.005 },
            { title: 'Three tiny wins from migrating to SQLite WAL', price: 0.001 },
        ],
    },
    {
        username: 'kaya_art',
        name: 'Kaya Demir',
        bio: 'Generative visuals + type experiments. Drops every Friday.',
        cat: 'Art & Design',
        posts: [
            { title: 'Process notes: 400 hours of tile-based plotter runs', price: 0.01 },
            { title: 'Six variable font tricks I keep reusing', price: 0.003 },
        ],
    },
    {
        username: 'lena_writes',
        name: 'Lena Park',
        bio: 'Long-form essays on creator economies and platform dynamics.',
        cat: 'Writing',
        posts: [
            { title: 'Patreon vs the stablecoin native future', price: 0.005 },
            { title: 'Why nanopayments finally make sense', price: 0.001 },
        ],
    },
    {
        username: 'noor_music',
        name: 'Noor Rahman',
        bio: 'Ambient + field recordings from Istanbul rooftops. Monthly mixtape.',
        cat: 'Music',
        posts: [
            { title: 'Mixtape #14: 47 minutes of sampled tram sounds', price: 0.005 },
            { title: 'Stems pack — three unfinished tracks', price: 0.003 },
        ],
    },
    {
        username: 'dev_dario',
        name: 'Dario Ruiz',
        bio: 'Low-level performance rabbit holes. Rust, SIMD, cache lines.',
        cat: 'Engineering',
        posts: [
            { title: 'Beat memcpy with 14 lines of AVX-512', price: 0.005 },
            { title: 'Cache-oblivious sort in 60 lines of Rust', price: 0.003 },
        ],
    },
];

(async () => {
    console.log('Seeding demo creators…\n');
    for (const c of CREATORS) {
        // Use explicit address when provided (test wallets where USDC
        // actually lands on unlock), else derive deterministically.
        const addr = (c.address ? c.address : demoWallet(c.username)).toLowerCase();

        // Upsert creator
        const existing = await pool.query('SELECT address FROM creators WHERE LOWER(address) = $1', [addr]);
        if (existing.rowCount > 0) {
            console.log(`  ${c.username.padEnd(14)} exists (${addr})`);
        } else {
            await pool.query(
                `INSERT INTO creators (address, name, username, bio, description, "avatarUrl", "contractAddress")
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [addr, c.name, c.username, c.bio, c.cat, null, null],
            );
            console.log(`  ${c.username.padEnd(14)} created (${addr})`);
        }

        // Tier
        const tierExists = await pool.query('SELECT id FROM tiers WHERE LOWER("creatorAddress") = $1 LIMIT 1', [addr]);
        if (tierExists.rowCount === 0) {
            try {
                const tierId = `tier_${c.username}_supporter`;
                await pool.query(
                    `INSERT INTO tiers (id, "creatorAddress", name, price, perks)
                     VALUES ($1, $2, 'Supporter', 5, $3::jsonb)`,
                    [tierId, addr, JSON.stringify(['Access to members-only posts','Direct messages','Early access'])],
                );
                console.log(`    + tier "Supporter" ($5)`);
            } catch (e) {
                console.log(`    ! tier skipped: ${e.message}`);
            }
        }

        // Posts
        for (let i = 0; i < c.posts.length; i++) {
            const p = c.posts[i];
            const postExists = await pool.query(
                'SELECT id FROM posts WHERE LOWER("creatorAddress") = $1 AND title = $2',
                [addr, p.title],
            );
            if (postExists.rowCount > 0) {
                console.log(`    ~ post "${p.title.slice(0, 40)}…" exists`);
                continue;
            }
            try {
                await pool.query(
                    `INSERT INTO posts ("creatorAddress", title, content, "isPublic", "ppvEnabled", "ppvPrice")
                     VALUES ($1, $2, $3, false, true, $4)`,
                    [
                        addr,
                        p.title,
                        `Preview: this post is pay-per-view ($${p.price}). Unlock via Gateway nanopayment — no gas, no wallet prompt once you've funded your Gateway balance.`,
                        p.price,
                    ],
                );
                console.log(`    + post "${p.title.slice(0, 40)}…" ($${p.price})`);
            } catch (e) {
                console.log(`    ! post failed: ${e.message}`);
            }
        }
    }
    console.log('\nDone.');
    await pool.end();
})();

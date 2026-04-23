/**
 * One-shot DB reset for demo recording.
 *   node scripts/reset_db.js
 */
const { Pool } = require('pg');
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

const tables = [
    'ppv_purchases',
    'comments',
    'tips',
    'memberships',
    'jobs',
    'posts',
    'tiers',
    'creators',
];

(async () => {
    for (const t of tables) {
        try {
            const res = await pool.query(`DELETE FROM ${t}`);
            console.log(`  ${t.padEnd(18)} -> ${res.rowCount} rows deleted`);
        } catch (e) {
            console.log(`  ${t.padEnd(18)} -> error: ${e.message}`);
        }
    }
    await pool.end();
    console.log('\nDone. Platform is a clean slate.');
})();

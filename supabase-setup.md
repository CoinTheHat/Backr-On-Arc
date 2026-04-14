# supabase/storage-setup.md
## Buckets to Create
1. **avatars**: Public bucket for profile pictures.
2. **posts**: Public bucket for post images/videos.

## Permissions (RLS)
Ensure the buckets are **Public** or set up RLS policies to allow:
- `SELECT`: Anyone (if public).
- `INSERT`: Authenticated users.
- `UPDATE`: Owners.

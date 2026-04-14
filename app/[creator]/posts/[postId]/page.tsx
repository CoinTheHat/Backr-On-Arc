'use client';

import { use, useState, useEffect } from 'react';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import { useRouter } from 'next/navigation';

export default function PostPage({ params }: { params: Promise<{ creator: string; postId: string }> }) {
    const resolvedParams = use(params);
    const { creator, postId } = resolvedParams;
    const router = useRouter();

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch specific post
        // API endpoint implies getting all posts for a creator, we might need to filter client side if API doesn't support ID
        // Or update API. For now, fetch all and find.
        fetch(`/api/posts?address=${creator}`)
            .then(res => res.json())
            .then(posts => {
                const found = posts.find((p: any) => p.id == postId || p._id == postId); // Check ID match
                setPost(found);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, [creator, postId]);

    if (loading) return <div style={{ padding: '48px', textAlign: 'center' }}>Loading post...</div>;
    if (!post) return <div style={{ padding: '48px', textAlign: 'center' }}>Post not found</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Button
                variant="outline"
                onClick={() => router.push(`/${creator}`)}
                style={{
                    marginBottom: '32px',
                    alignSelf: 'flex-start',
                    borderRadius: '24px',
                    padding: '8px 20px'
                }}
            >
                ← Back to Creator
            </Button>

            <Card style={{ flex: 1, padding: '0', overflow: 'hidden' }}>
                {post.image && (
                    <div style={{ width: '100%', height: '500px', background: `url(${post.image}) center/cover no-repeat` }}></div>
                )}

                <div style={{ padding: '48px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px' }}>{post.title}</h1>
                        <p style={{ color: '#a1a1aa' }}>{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#e4e4e7', whiteSpace: 'pre-wrap' }}>
                        {post.content}
                    </div>
                </div>
            </Card>
        </div>
    );
}

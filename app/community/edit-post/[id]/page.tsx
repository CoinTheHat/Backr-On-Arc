'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useCommunity } from '../../../context/CommunityContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, X, Globe, Lock, ChevronDown, Bold, Italic, Type, Quote, List, Upload } from 'lucide-react';
import Button from '../../../components/Button';
import { useAccount } from 'wagmi';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { tiers, refreshData } = useCommunity();
    const router = useRouter();
    const { address } = useAccount();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [minTier, setMinTier] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const [showImageInput, setShowImageInput] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch existing post
    useEffect(() => {
        fetch(`/api/posts?address=${address}`)
            .then(res => res.json())
            .then((posts: any[]) => {
                const post = posts.find(p => p.id === Number(id));
                if (!post) {
                    alert('Post not found');
                    router.push('/community');
                    return;
                }
                if (post.creatorAddress !== address) {
                    alert('Unauthorized');
                    router.push('/community');
                    return;
                }
                setTitle(post.title || '');
                setContent(post.content || '');
                setImageUrl(post.image || '');
                setVideoUrl(post.videoUrl || '');
                setMinTier(post.minTier || 0);
                setLoading(false);
            })
            .catch(() => {
                alert('Failed to load post');
                router.push('/community');
            });
    }, [id, address, router]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    const insertMarkdown = (prefix: string, suffix: string) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = content;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);
        const newText = before + prefix + selection + suffix + after;
        setContent(newText);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = end + prefix.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1000;
                const MAX_HEIGHT = 1000;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setImageUrl(dataUrl);
                    setShowImageInput(true);
                }
            };
            if (event.target?.result) {
                img.src = event.target.result as string;
            }
        };
        reader.readAsDataURL(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    processFile(file);
                    e.preventDefault();
                    return;
                }
            }
        }
    };

    const handleUpdate = async () => {
        if (!title.trim() || !content.trim()) return alert('Please add a title and some content.');
        if (!address) return alert('Wallet not connected.');

        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/posts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorAddress: address,
                    title,
                    content,
                    image: imageUrl,
                    videoUrl,
                    minTier,
                    isPublic: minTier === 0
                })
            });

            if (res.ok) {
                await refreshData();
                router.push('/community');
            } else {
                throw new Error('Failed to update post');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to update post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-brand-light flex items-center justify-center text-brand-muted">Loading...</div>;

    return (
        <div className="min-h-screen bg-brand-light font-sans flex flex-col">
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="text-gray-500 hover:text-brand-dark flex items-center gap-2 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
                    <ArrowLeft size={18} />
                    <span className="hidden md:inline">Back</span>
                </button>
                <div className="text-sm font-bold text-brand-muted uppercase tracking-widest hidden md:block">Edit Post</div>
                <div className="flex gap-3">
                    <Button
                        onClick={handleUpdate}
                        disabled={isSubmitting || !title || !content}
                        variant="primary"
                        className="rounded-full px-6 py-2 text-sm shadow-glow hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </nav>

            <main className="flex-1 max-w-3xl w-full mx-auto py-12 px-6">
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-5xl font-serif font-bold text-brand-dark placeholder-gray-300 border-none focus:ring-0 bg-transparent p-0 mb-8 leading-tight selection:bg-brand-primary/20"
                        autoFocus
                    />

                    <div className="flex items-center gap-1 mb-6 p-1.5 bg-white shadow-sm border border-gray-100 rounded-xl w-fit sticky top-20 z-10">
                        <button onClick={() => insertMarkdown('**', '**')} className="p-2 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-lg transition-colors" title="Bold"><Bold size={18} /></button>
                        <button onClick={() => insertMarkdown('*', '*')} className="p-2 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-lg transition-colors" title="Italic"><Italic size={18} /></button>
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                        <button onClick={() => insertMarkdown('## ', '')} className="p-2 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-lg transition-colors" title="Heading"><Type size={18} /></button>
                        <button onClick={() => insertMarkdown('> ', '')} className="p-2 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-lg transition-colors" title="Quote"><Quote size={18} /></button>
                        <button onClick={() => insertMarkdown('- ', '')} className="p-2 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-lg transition-colors" title="List"><List size={18} /></button>
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onPaste={handlePaste}
                        className="w-full min-h-[30vh] text-xl text-gray-700 leading-relaxed placeholder-gray-300 border-none focus:ring-0 bg-transparent p-0 resize-none overflow-hidden mb-12"
                        placeholder="Tell your story... (Paste images directly!)"
                    />

                    {imageUrl && (
                        <div className="grid gap-4 mb-8">
                            <div className="relative group rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                                <img src={imageUrl} alt="Preview" className="w-full max-h-[400px] object-cover" />
                                <button onClick={() => { setImageUrl(''); setShowImageInput(false); }} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"><X size={16} /></button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 py-6 border-t border-gray-100">
                        <div className="flex gap-2">
                            <div className="relative group">
                                <button onClick={() => setShowImageInput(!showImageInput)} className={`p-3 rounded-xl transition-all flex items-center gap-2 ${showImageInput ? 'bg-brand-dark text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-brand-primary hover:text-brand-primary shadow-sm'}`}><ImageIcon size={20} /></button>
                                {showImageInput && (
                                    <div className="absolute bottom-full mb-3 left-0 w-[320px] bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-20 animate-in fade-in zoom-in-95">
                                        <div className="flex gap-2 items-center">
                                            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors" title="Upload Image"><Upload size={18} /></button>
                                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste URL..." className="flex-1 text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary min-w-0" autoFocus />
                                            <button onClick={() => setShowImageInput(false)} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
                                        </div>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                            </div>
                        </div>

                        <div className="relative group min-w-[240px]">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none">{minTier === 0 ? <Globe size={18} /> : <Lock size={18} />}</div>
                            <select value={minTier} onChange={(e) => setMinTier(Number(e.target.value))} className="w-full appearance-none bg-white border border-gray-200 hover:border-brand-primary/50 text-gray-700 font-medium rounded-xl pl-11 pr-10 py-3 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all">
                                <option value={0}>Public (Everyone)</option>
                                {tiers.map((tier, index) => (
                                    <option key={tier.id} value={index + 1}>{tier.name} ($ {tier.price}) & Higher</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><ChevronDown size={16} /></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

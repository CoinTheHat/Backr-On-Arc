'use client';

import { useState, useRef } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, Youtube, Globe, Lock, X, ChevronDown, Bold, Italic, Type, Quote, List, Send, Sparkles, FileText } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useToast } from '../../components/Toast';
import ImageUpload from '../../components/ImageUpload';

export default function NewPostPage() {
    const { tiers, isLoading, refreshData } = useCommunity();
    const router = useRouter();
    const { address } = useAccount();
    const { showToast, ToastComponent } = useToast();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [minTier, setMinTier] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showVideoInput, setShowVideoInput] = useState(false);
    const [ppvEnabled, setPpvEnabled] = useState(false);
    const [ppvPrice, setPpvPrice] = useState('0.005');

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-mist flex items-center justify-center">
            <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '100ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '200ms' }}></div>
            </div>
        </div>
    );

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

    const handlePost = async () => {
        if (!title.trim() || !content.trim()) return showToast('Please add a title and content.', 'error');
        if (!address) return showToast('Wallet not connected.', 'error');

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorAddress: address,
                    title,
                    content,
                    image: imageUrl,
                    videoUrl,
                    minTier,
                    ppvEnabled,
                    ppvPrice: ppvEnabled ? ppvPrice : undefined,
                    createdAt: new Date().toISOString(),
                    likes: 0,
                    isPublic: minTier === 0
                })
            });

            if (res.ok) {
                showToast('Post published!', 'success');
                await refreshData();
                router.push('/community');
            } else {
                throw new Error('Failed to create post');
            }
        } catch (e) {
            console.error(e);
            showToast('Failed to publish. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toolbarBtns = [
        { icon: <Bold size={16} />, action: () => insertMarkdown('**', '**'), tip: 'Bold' },
        { icon: <Italic size={16} />, action: () => insertMarkdown('*', '*'), tip: 'Italic' },
        null, // separator
        { icon: <Type size={16} />, action: () => insertMarkdown('## ', ''), tip: 'Heading' },
        { icon: <Quote size={16} />, action: () => insertMarkdown('> ', ''), tip: 'Quote' },
        { icon: <List size={16} />, action: () => insertMarkdown('- ', ''), tip: 'List' },
    ];

    return (
        <div className="min-h-screen bg-mist font-sans flex flex-col">
            {ToastComponent}

            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center justify-between px-4 md:px-8">
                <button
                    onClick={() => router.back()}
                    className="text-slate-500 hover:text-slate-900 flex items-center gap-2 font-semibold transition-colors px-3 py-2 rounded-xl hover:bg-slate-50"
                >
                    <ArrowLeft size={18} />
                    <span className="hidden sm:inline">Back</span>
                </button>

                <div className="text-xs font-bold text-slate-400 uppercase tracking-[.2em] hidden md:block">
                    New Post
                </div>

                <button
                    onClick={handlePost}
                    disabled={isSubmitting || !title || !content}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 active:scale-95"
                >
                    <Send size={14} />
                    {isSubmitting ? 'Publishing...' : 'Publish'}
                </button>
            </nav>

            {/* Main Editor */}
            <main className="flex-1 max-w-3xl w-full mx-auto py-10 md:py-16 px-6">

                <div className="bg-purple-50 border border-purple-200 text-purple-800 rounded-2xl p-5 mb-8 flex items-start gap-3">
                    <FileText size={22} className="shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-base mb-1">Monetize Every Post</h3>
                        <p className="text-sm leading-relaxed">Set your post as Public (free), Members-Only (tier subscribers), or Pay-Per-View ($0.001-$0.01 per view). PPV posts use Circle Nanopayments for gasless micro-transactions — something impossible on traditional gas networks.</p>
                    </div>
                </div>

                {/* Editor Card */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-8">

                    {/* Title */}
                    <div className="px-8 md:px-12 pt-10">
                        <input
                            type="text"
                            placeholder="Give your post a title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-3xl md:text-4xl font-bold text-slate-900 placeholder-slate-300 border-none focus:ring-0 focus:outline-none bg-transparent p-0 leading-tight"
                            style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                            autoFocus
                        />
                    </div>

                    {/* Divider */}
                    <div className="mx-8 md:mx-12 my-6 h-px bg-slate-100"></div>

                    {/* Formatting Toolbar */}
                    <div className="px-8 md:px-12 mb-4">
                        <div className="flex items-center gap-0.5 p-1 bg-slate-50 rounded-xl w-fit">
                            {toolbarBtns.map((btn, i) =>
                                btn === null ? (
                                    <div key={i} className="w-px h-5 bg-slate-200 mx-1"></div>
                                ) : (
                                    <button
                                        key={i}
                                        onClick={btn.action}
                                        className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                                        title={btn.tip}
                                    >
                                        {btn.icon}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Content Input */}
                    <div className="px-8 md:px-12 pb-6">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleContentChange}
                            className="w-full min-h-[30vh] text-[17px] text-slate-600 leading-[1.8] placeholder-slate-300 border-none focus:ring-0 focus:outline-none bg-transparent p-0 resize-none overflow-hidden"
                            placeholder="Write something amazing..."
                        />
                    </div>

                    {/* Image Upload Area */}
                    <div className="px-8 md:px-12 pb-10">
                        <ImageUpload
                            bucket="posts"
                            value={imageUrl}
                            onChange={setImageUrl}
                            aspectRatio="video"
                            label="Add Post Cover"
                            helperText="Recommended: 1200x675px"
                        />
                    </div>

                    {/* Bottom Settings Bar */}
                    <div className="px-8 md:px-12 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {/* Video Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowVideoInput(!showVideoInput)}
                                    className={`p-3 rounded-xl transition-all flex items-center gap-2 border ${showVideoInput
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                >
                                    <Youtube size={18} />
                                    <span className="text-sm font-bold">Video URL</span>
                                </button>
                                {showVideoInput && (
                                    <div className="absolute bottom-full mb-3 left-0 w-[300px] bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-20">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={videoUrl}
                                                onChange={(e) => setVideoUrl(e.target.value)}
                                                placeholder="Paste YouTube/Video URL..."
                                                className="flex-1 text-sm border border-slate-100 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Visibility Select */}
                        <div className="relative w-full sm:w-64">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                {minTier === 0 ? <Globe size={18} /> : <Lock size={18} />}
                            </div>
                            <select
                                value={minTier}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setMinTier(val);
                                    if (val === 0) setPpvEnabled(false);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value={0}>Everyone (Public)</option>
                                {tiers.map((tier, idx) => (
                                    <option key={tier.id} value={idx + 1}>{tier.name} Tier & Up</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Pay-Per-View Section */}
                    <div className="px-8 md:px-12 py-4 bg-slate-50/50 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={ppvEnabled}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setPpvEnabled(checked);
                                        if (checked && minTier === 0) setMinTier(1);
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                                />
                                <span className="text-sm font-bold text-slate-700">Pay-Per-View</span>
                            </label>
                        </div>

                        {ppvEnabled && (
                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        value={ppvPrice}
                                        onChange={(e) => setPpvPrice(e.target.value)}
                                        className="w-28 bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                {['0.001', '0.005', '0.01'].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setPpvPrice(preset)}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                            ppvPrice === preset
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        ${preset}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                    <Sparkles size={14} className="text-amber-400" />
                    Posts are saved on Arc Network with PPV content monetized via Circle Nanopayments.
                </p>
            </main>
        </div>
    );
}

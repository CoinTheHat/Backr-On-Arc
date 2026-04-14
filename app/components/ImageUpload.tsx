'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Button from './Button';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    bucket: 'avatars' | 'posts';
    label?: string;
    helperText?: string;
    aspectRatio?: 'square' | 'video' | 'any';
    className?: string;
    showLabel?: boolean;
}

export default function ImageUpload({
    value,
    onChange,
    bucket,
    label,
    helperText,
    aspectRatio = 'square',
    className = '',
    showLabel = true
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB.');
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(publicUrl);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message || error}`);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = () => {
        onChange('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const aspectClass =
        aspectRatio === 'square' ? 'aspect-square' :
            aspectRatio === 'video' ? 'aspect-video' :
                'aspect-auto min-h-[150px]';

    return (
        <div className={`space-y-2 ${className}`}>
            {label && showLabel && <label className="text-sm font-bold text-gray-300">{label}</label>}

            <div className={`relative rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50/50 transition-all hover:border-indigo-400 hover:bg-white ${aspectClass}`}>
                {value ? (
                    <>
                        <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <button
                                onClick={removeImage}
                                className="p-3 bg-white/20 hover:bg-rose-500 rounded-full text-white transition-all transform hover:scale-110 border border-white/30"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 group transition-all"
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={32} className="animate-spin text-indigo-600" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Uploading...</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 rounded-full bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all transform group-hover:-translate-y-1">
                                    <Upload size={24} />
                                </div>
                                <div className="text-center">
                                    <span className="block text-sm font-bold text-slate-500 group-hover:text-indigo-600">{label || 'Upload Image'}</span>
                                    {helperText && <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{helperText}</span>}
                                </div>
                            </>
                        )}
                    </button>
                )}
            </div>

            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
            />

            {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        </div>
    );
}

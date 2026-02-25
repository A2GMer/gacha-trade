"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, GripVertical, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface ImageUploaderProps {
    images: string[];
    onChange: (images: string[]) => void;
    error?: string;
    maxImages?: number;
}

export function ImageUploader({ images, onChange, error, maxImages = 4 }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const uploadImage = useCallback(
        async (file: File): Promise<string | null> => {
            const fileExt = file.name.split(".").pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `items/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("item-images")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                return null;
            }

            const { data } = supabase.storage
                .from("item-images")
                .getPublicUrl(filePath);

            return data.publicUrl;
        },
        [supabase.storage]
    );

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const remaining = maxImages - images.length;
        const filesToUpload = Array.from(files).slice(0, remaining);

        if (filesToUpload.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = filesToUpload.map((file) => uploadImage(file));
            const urls = await Promise.all(uploadPromises);
            const validUrls = urls.filter((url): url is string => url !== null);
            onChange([...images, ...validUrls]);
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
            // inputをリセット
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="font-black flex items-center gap-2">
                    📸 商品の写真
                    <span className="badge bg-primary text-white">必須</span>
                </h2>
                <span className="text-xs text-muted font-bold">{images.length}/{maxImages}枚</span>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-danger text-xs font-bold bg-danger/5 p-3 rounded-2xl">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
            />

            <div className="grid grid-cols-4 gap-2">
                {/* 既にアップロードされた画像 */}
                {images.map((url, i) => (
                    <div key={i} className="aspect-square relative group rounded-2xl overflow-hidden border border-border">
                        <img src={url} alt={`写真${i + 1}`} className="w-full h-full object-cover" />
                        <button
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 badge bg-black/50 text-white text-[8px] backdrop-blur-sm">
                            {i + 1}枚目
                        </div>
                    </div>
                ))}

                {/* アップロードスロット */}
                {Array.from({ length: maxImages - images.length }).map((_, i) => (
                    <button
                        key={`empty-${i}`}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={`aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed ${error ? "border-danger/50 bg-danger/5" : "border-border bg-background"
                            }`}
                    >
                        {uploading && i === 0 ? (
                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                            <>
                                <Camera className={`h-6 w-6 mb-1 ${error ? "text-danger/50" : "text-muted"}`} />
                                <span className="text-[10px] text-muted font-medium">{images.length + i + 1}枚目</span>
                            </>
                        )}
                    </button>
                ))}
            </div>

            <p className="text-[10px] text-muted">
                📌 4枚の写真が必須です。正面・裏面・側面・全体を撮影してください。
            </p>
        </div>
    );
}

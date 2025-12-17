'use client';

import { useId, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PhotoDropzoneProps {
    onFilesSelected: (files: File[]) => void;
    isProcessing?: boolean;
    processingProgress?: { current: number; total: number; filename: string };
}

export default function PhotoDropzone({
    onFilesSelected,
    isProcessing = false,
    processingProgress,
}: PhotoDropzoneProps) {
    const inputId = useId();
    const [isDragging, setIsDragging] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFilesSelected(Array.from(files));
        }
        // Reset input
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isProcessing) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isProcessing) return;

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/') ||
            file.name.toLowerCase().endsWith('.heic') ||
            file.name.toLowerCase().endsWith('.heif')
        );

        if (files.length > 0) {
            onFilesSelected(files);
        }
    };

    return (
        <div className="w-full">
            {/* Native file input - hidden but accessible via label */}
            <input
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
                multiple
                onChange={handleChange}
                disabled={isProcessing}
                className="sr-only"
            />

            {/* Label wraps the entire dropzone - ensures iOS compatibility */}
            <label
                htmlFor={inputId}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <motion.div
                    whileTap={!isProcessing ? { scale: 0.98 } : undefined}
                    className={`
            relative overflow-hidden rounded-3xl p-8 md:p-12
            cursor-pointer select-none
            transition-all duration-300 ease-out
            ${isDragging
                            ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-purple-400'
                            : 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-white/20'
                        }
            ${isProcessing ? 'pointer-events-none opacity-80' : ''}
          `}
                    style={{
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                    }}
                >
                    {/* Background glow */}
                    <div className="absolute inset-0 opacity-50 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10">
                        {isProcessing ? (
                            <div className="text-center space-y-6">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    className="w-16 h-16 mx-auto"
                                >
                                    <Loader2 className="w-16 h-16 text-purple-400" />
                                </motion.div>

                                <div>
                                    <p className="text-lg font-medium text-white mb-1">
                                        処理中...
                                    </p>
                                    {processingProgress && (
                                        <p className="text-white/60 text-sm">
                                            {processingProgress.current} / {processingProgress.total}
                                        </p>
                                    )}
                                </div>

                                {processingProgress && (
                                    <div className="w-full max-w-xs mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                            initial={{ width: '0%' }}
                                            animate={{
                                                width: `${(processingProgress.current / processingProgress.total) * 100}%`,
                                            }}
                                            transition={{ duration: 0.3, ease: 'easeOut' }}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center space-y-6">
                                <motion.div
                                    initial={{ scale: 1 }}
                                    animate={{ scale: isDragging ? 1.1 : 1 }}
                                    className="relative w-20 h-20 mx-auto"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Camera className="w-10 h-10 text-white/80" />
                                    </div>
                                </motion.div>

                                <div>
                                    <p className="text-xl font-semibold text-white mb-2">
                                        {isDragging ? 'ここにドロップ' : '写真を選択'}
                                    </p>
                                    <p className="text-white/50 text-sm">
                                        タップして写真ライブラリから選択
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                                    <span className="px-2 py-1 bg-white/5 rounded-md">JPEG</span>
                                    <span className="px-2 py-1 bg-white/5 rounded-md">PNG</span>
                                    <span className="px-2 py-1 bg-white/5 rounded-md">HEIC</span>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </label>
        </div>
    );
}

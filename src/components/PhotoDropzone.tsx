'use client';

import { useRef, useState, useEffect } from 'react';
import { Camera, Loader2, ImagePlus } from 'lucide-react';
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
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    // Detect iOS
    useEffect(() => {
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(iOS);
    }, []);

    // Direct click handler for iOS
    const handleButtonClick = () => {
        if (inputRef.current && !isProcessing) {
            // iOS Safari workaround: create new input each time
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';

            input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                    onFilesSelected(Array.from(target.files));
                }
            };

            input.click();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFilesSelected(Array.from(files));
        }
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
            file.type.startsWith('image/')
        );

        if (files.length > 0) {
            onFilesSelected(files);
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Hidden input for desktop drag & drop */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleChange}
                disabled={isProcessing}
                className="hidden"
            />

            {/* Main button - explicit for iOS */}
            <button
                type="button"
                onClick={handleButtonClick}
                disabled={isProcessing}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          w-full relative overflow-hidden rounded-3xl p-8 md:p-12
          text-left transition-all duration-300 ease-out
          ${isDragging
                        ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-purple-400'
                        : 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 active:border-white/30'
                    }
          ${isProcessing ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}
        `}
                style={{
                    WebkitTapHighlightColor: 'transparent',
                    WebkitUserSelect: 'none',
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
                                    写真を処理中...
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
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ImagePlus className="w-10 h-10 text-white" />
                                </div>
                            </motion.div>

                            <div>
                                <p className="text-xl font-bold text-white mb-2">
                                    {isDragging ? 'ここにドロップ' : 'タップして写真を追加'}
                                </p>
                                <p className="text-white/50 text-sm">
                                    {isIOS ? 'フォトライブラリから選択' : 'ドラッグ＆ドロップも可能'}
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                                <span className="px-2 py-1 bg-white/5 rounded-md">JPEG</span>
                                <span className="px-2 py-1 bg-white/5 rounded-md">PNG</span>
                                <span className="px-2 py-1 bg-white/5 rounded-md">HEIC</span>
                                <span className="px-2 py-1 bg-white/5 rounded-md">枚数無制限</span>
                            </div>
                        </div>
                    )}
                </div>
            </button>
        </div>
    );
}

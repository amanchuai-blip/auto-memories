'use client';

import { useRef, useState, useEffect } from 'react';
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
    const [isDragging, setIsDragging] = useState(false);

    const handleButtonClick = () => {
        if (isProcessing) return;

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
        <button
            type="button"
            onClick={handleButtonClick}
            disabled={isProcessing}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
        w-full text-left relative overflow-hidden
        border-4 ${isDragging ? 'border-amber-400 bg-amber-400/10' : 'border-dashed border-white/30'}
        p-8 transition-all
        ${isProcessing ? 'cursor-not-allowed' : 'cursor-pointer hover:border-white/50 active:bg-white/5'}
      `}
            style={{
                WebkitTapHighlightColor: 'transparent',
            }}
        >
            {isProcessing ? (
                <div className="text-center space-y-4">
                    {/* VHS Loading animation */}
                    <div className="flex items-center justify-center gap-2">
                        <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="text-4xl text-amber-400"
                        >
                            ▶
                        </motion.div>
                        <span className="text-2xl text-white tracking-[0.3em]">LOADING</span>
                    </div>

                    {processingProgress && (
                        <>
                            <div className="w-full h-2 bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full bg-amber-400"
                                    initial={{ width: '0%' }}
                                    animate={{
                                        width: `${(processingProgress.current / processingProgress.total) * 100}%`,
                                    }}
                                />
                            </div>
                            <p className="text-white/50 text-lg tracking-wider">
                                {processingProgress.current} / {processingProgress.total}
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="text-center space-y-4">
                    <div className="text-6xl">📼</div>
                    <div>
                        <p className="text-2xl text-white tracking-widest mb-2">
                            {isDragging ? 'DROP HERE' : 'INSERT TAPE'}
                        </p>
                        <p className="text-white/40 text-sm tracking-wider">
                            タップして写真を選択
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-xs text-white/30">
                        <span className="border border-white/20 px-2 py-1">JPEG</span>
                        <span className="border border-white/20 px-2 py-1">PNG</span>
                        <span className="border border-white/20 px-2 py-1">HEIC</span>
                    </div>
                </div>
            )}
        </button>
    );
}

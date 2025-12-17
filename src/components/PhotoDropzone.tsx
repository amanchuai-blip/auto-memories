'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2 } from 'lucide-react';

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

    const handleClick = () => {
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

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isProcessing}
            onDragOver={(e) => { e.preventDefault(); if (!isProcessing) setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (isProcessing) return;
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                if (files.length > 0) onFilesSelected(files);
            }}
            className={`
        w-full rounded-2xl p-10 text-center transition-all border-2 border-dashed
        ${isDragging ? 'border-violet-500 bg-violet-500/10' : 'border-white/20 bg-white/5'}
        ${isProcessing ? 'cursor-wait' : 'cursor-pointer active:bg-white/10'}
      `}
        >
            {isProcessing ? (
                <div className="space-y-5">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                        <Loader2 className="w-14 h-14 mx-auto text-violet-400" />
                    </motion.div>
                    <div>
                        <p className="font-bold text-xl">処理中...</p>
                        {processingProgress && (
                            <>
                                <p className="text-lg text-white/60 mt-2">
                                    {processingProgress.current} / {processingProgress.total}
                                </p>
                                <div className="w-full h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-violet-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-white/70" />
                    </div>
                    <div>
                        <p className="font-bold text-xl">{isDragging ? 'ここにドロップ' : '写真を選択'}</p>
                        <p className="text-lg text-white/50 mt-2">タップして選択</p>
                    </div>
                </div>
            )}
        </button>
    );
}

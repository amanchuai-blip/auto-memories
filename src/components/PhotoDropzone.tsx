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
            style={{
                width: '100%',
                borderRadius: '20px',
                padding: '48px 24px',
                textAlign: 'center',
                border: `2px dashed ${isDragging ? '#8b5cf6' : 'rgba(255,255,255,0.2)'}`,
                backgroundColor: isDragging ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)',
                cursor: isProcessing ? 'wait' : 'pointer',
                transition: 'all 0.2s',
            }}
        >
            {isProcessing ? (
                <div>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        style={{ display: 'inline-block' }}
                    >
                        <Loader2 size={56} color="#a78bfa" />
                    </motion.div>
                    <div style={{ marginTop: '20px' }}>
                        <p style={{ fontSize: '22px', fontWeight: 'bold', color: 'white' }}>処理中...</p>
                        {processingProgress && (
                            <>
                                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                                    {processingProgress.current} / {processingProgress.total}
                                </p>
                                <div style={{
                                    width: '100%',
                                    height: '8px',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                    marginTop: '16px',
                                    overflow: 'hidden',
                                }}>
                                    <motion.div
                                        style={{
                                            height: '100%',
                                            backgroundColor: '#8b5cf6',
                                            borderRadius: '4px',
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 20px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Camera size={40} color="rgba(255,255,255,0.7)" />
                    </div>
                    <p style={{ fontSize: '22px', fontWeight: 'bold', color: 'white' }}>
                        {isDragging ? 'ここにドロップ' : '写真を選択'}
                    </p>
                    <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
                        タップして選択
                    </p>
                </div>
            )}
        </button>
    );
}

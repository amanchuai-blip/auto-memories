'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '@/lib/i18n';

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
    const [dragError, setDragError] = useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
            setDragError(null);

            if (rejectedFiles.length > 0) {
                setDragError(t('create.errors.rejected'));
                return;
            }

            if (acceptedFiles.length === 0) {
                setDragError(t('create.errors.noPhotos'));
                return;
            }

            onFilesSelected(acceptedFiles);
        },
        [onFilesSelected]
    );

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/heic': ['.heic'],
            'image/heif': ['.heif'],
        },
        disabled: isProcessing,
        multiple: true,
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center
          transition-all duration-300 cursor-pointer
          ${isDragActive && !isDragReject ? 'border-purple-500 bg-purple-500/10' : ''}
          ${isDragReject ? 'border-red-500 bg-red-500/10' : ''}
          ${!isDragActive && !isProcessing ? 'border-white/20 hover:border-white/40 hover:bg-white/5' : ''}
          ${isProcessing ? 'border-white/10 bg-white/5 cursor-not-allowed' : ''}
        `}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                    {isProcessing ? (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-purple-400 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-white font-medium">{t('create.dropzone.processing')}</p>
                                {processingProgress && (
                                    <p className="text-white/60 text-sm mt-1">
                                        {t('create.dropzone.progress', {
                                            current: processingProgress.current,
                                            total: processingProgress.total,
                                            filename: processingProgress.filename,
                                        })}
                                    </p>
                                )}
                            </div>
                            <div className="w-full max-w-xs mx-auto bg-white/10 rounded-full h-2 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    initial={{ width: '0%' }}
                                    animate={{
                                        width: processingProgress
                                            ? `${(processingProgress.current / processingProgress.total) * 100}%`
                                            : '0%',
                                    }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <motion.div
                                className="mx-auto w-16 h-16 rounded-full bg-white/10 flex items-center justify-center"
                                animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                            >
                                <Upload
                                    className={`w-8 h-8 transition-colors ${isDragActive ? 'text-purple-400' : 'text-white/60'
                                        }`}
                                />
                            </motion.div>
                            <div>
                                <p className="text-white font-medium">
                                    {isDragActive ? t('create.dropzone.titleActive') : t('create.dropzone.title')}
                                </p>
                                <p className="text-white/60 text-sm mt-1">
                                    {t('create.dropzone.subtitle')}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Gradient border effect on drag */}
                {isDragActive && !isDragReject && (
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20" />
                    </motion.div>
                )}
            </div>

            {/* Error message */}
            <AnimatePresence>
                {dragError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-200 text-sm">{dragError}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

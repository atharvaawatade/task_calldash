import { useCallback, useRef, useState } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Upload,
    FileText,
    Trash2,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Database,
} from 'lucide-react';
import { toast } from 'sonner';

export function DocumentUploader() {
    const {
        documents,
        uploadDocument,
        isUploading,
        deleteDocument,
        isDeleting,
    } = useDocuments();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        (file: File) => {
            if (file.size > 20 * 1024 * 1024) {
                toast.error('File exceeds 20MB limit.');
                return;
            }

            uploadDocument(file, {
                onSuccess: () => toast.success(`${file.name} synced to intelligence core`),
                onError: (err) => toast.error(`Sync failed: ${err.message}`),
            });
        },
        [uploadDocument]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const statusIcon = (status: string) => {
        switch (status) {
            case 'ready':
                return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 glow-primary" />;
            case 'processing':
                return <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />;
            case 'failed':
                return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
            default:
                return null;
        }
    };

    return (
        <div className="glass-panel rounded-3xl p-6 space-y-6 card-hover-effect">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 text-emerald-400">
                        <Database className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-white uppercase opacity-90">Intelligence</h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            {documents.length} Units Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                className={`relative group border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer overflow-hidden ${isDragging
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-white/5 bg-zinc-950/40 hover:border-white/10 hover:bg-zinc-950/60'
                    }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full group-hover:animate-shimmer"
                    style={{ backgroundSize: '200% 100%' }} />

                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                        e.target.value = '';
                    }}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Coding Intelligence...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 relative z-10">
                        <div className="p-3 rounded-full bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                            <Upload className="h-6 w-6 text-zinc-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Sync Documents</p>
                            <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest">PDF • TXT • MD • DOCX</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Document List */}
            {documents.length > 0 && (
                <ScrollArea className="max-h-[160px] pr-4">
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="group/item flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all shadow-sm"
                            >
                                <div className="flex items-center gap-3 min-w-0 pr-4">
                                    <div className="p-2 rounded-lg bg-zinc-950/50 text-emerald-400 border border-white/5">
                                        <FileText className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-zinc-200 truncate">{doc.filename}</p>
                                        <div className="flex items-center gap-2">
                                            {statusIcon(doc.status)}
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                                                {doc.status === 'ready' ? `${doc.chunks} Fragments` : doc.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteDocument(doc.id);
                                    }}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}

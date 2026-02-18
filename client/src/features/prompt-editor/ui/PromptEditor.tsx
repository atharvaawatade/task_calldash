import { useState, useEffect } from 'react';
import { usePrompt } from '../hooks/usePrompt';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, RotateCcw, Check, Cpu } from 'lucide-react';
import { toast } from 'sonner';

export function PromptEditor() {
    const { prompt, defaultPrompt, isLoading, savePrompt, isSaving } = usePrompt();
    const [localPrompt, setLocalPrompt] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (prompt) {
            setLocalPrompt(prompt);
        }
    }, [prompt]);

    const handleSave = () => {
        savePrompt(localPrompt, {
            onSuccess: () => {
                toast.success('Prompt synced to neural layers');
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            },
            onError: (err) => {
                toast.error(`Sync failed: ${err.message}`);
            },
        });
    };

    const handleReset = () => {
        setLocalPrompt(defaultPrompt);
        toast.info('Neural defaults restored');
    };

    const hasChanges = localPrompt !== prompt;

    return (
        <div className="glass-panel rounded-3xl p-6 space-y-6 card-hover-effect">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 text-emerald-400">
                        <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-white uppercase opacity-90">Core Logic</h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            Neural System Prompt
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative group">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                <Textarea
                    value={localPrompt}
                    onChange={(e) => setLocalPrompt(e.target.value)}
                    placeholder={isLoading ? 'Loading logic...' : 'Initialize system directives...'}
                    disabled={isLoading}
                    maxLength={5000}
                    className="min-h-[160px] bg-black/40 border-white/[0.03] rounded-2xl text-zinc-200 placeholder:text-zinc-700 resize-none focus:border-emerald-500/30 focus:ring-emerald-500/10 transition-all font-mono text-[11px] leading-relaxed"
                />
                <div className="absolute bottom-3 right-3">
                    <span className="text-[9px] font-bold text-zinc-700 bg-black/50 px-2 py-1 rounded-md border border-white/5 uppercase tracking-tighter">
                        {localPrompt.length} / 5000
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${hasChanges || saved
                        ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20'
                        : 'bg-zinc-950 text-zinc-700 border border-white/5'
                        }`}
                >
                    {saved ? (
                        <><Check className="h-3.5 w-3.5 mr-2" /> Synced</>
                    ) : (
                        <><Save className="h-3.5 w-3.5 mr-2" /> Update Core</>
                    )}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    className="h-12 w-12 rounded-xl border border-white/5 text-zinc-500 hover:text-white hover:bg-white/5"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>

                {hasChanges && (
                    <div className="flex items-center gap-1.5 animate-pulse ml-auto">
                        <div className="h-1 w-1 rounded-full bg-amber-400" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-400">Modified</span>
                    </div>
                )}
            </div>
        </div>
    );
}


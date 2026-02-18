import { useTranscriptStore } from '../store/transcriptStore';
import { BookOpen, FileText, Search, Layers } from 'lucide-react';

export function RAGSourcesPanel() {
    const { ragSources, currentQuery } = useTranscriptStore();

    return (
        <div className="glass-panel rounded-3xl overflow-hidden card-hover-effect flex flex-col" style={{ height: '420px' }}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Search className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white">RAG Sources</h2>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Retrieved document chunks</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {ragSources.length > 0 ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {ragSources.length} chunks used
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-zinc-500">
                            <Layers className="h-3 w-3" />
                            Awaiting query
                        </span>
                    )}
                </div>
            </div>

            {/* ── Body ───────────────────────────────────────────── */}
            <div className="flex-1 overflow-hidden">
                {ragSources.length === 0 ? (

                    /* Empty state */
                    <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <BookOpen className="h-7 w-7 text-zinc-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-zinc-500">No sources retrieved yet</p>
                            <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">
                                Ask a question during a live call.<br />
                                Matching document chunks will appear here.
                            </p>
                        </div>
                    </div>

                ) : (

                    /* Results */
                    <div className="h-full flex flex-col overflow-hidden">

                        {/* Query pill */}
                        {currentQuery && (
                            <div className="mx-5 mt-4 mb-3 shrink-0 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Query</p>
                                <p className="text-xs text-zinc-300 italic line-clamp-2">"{currentQuery}"</p>
                            </div>
                        )}

                        {/* Scrollable chunk list */}
                        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
                            {ragSources.map((source, i) => {
                                const pct = Math.round(source.score * 100);
                                const barColor =
                                    pct >= 60 ? 'bg-emerald-400' :
                                    pct >= 35 ? 'bg-amber-400' :
                                    'bg-zinc-500';
                                const labelColor =
                                    pct >= 60 ? 'text-emerald-400' :
                                    pct >= 35 ? 'text-amber-400' :
                                    'text-zinc-500';

                                return (
                                    <div
                                        key={i}
                                        className="rounded-xl bg-zinc-950/60 border border-white/[0.05] p-3.5 space-y-2.5 hover:border-white/10 transition-colors"
                                    >
                                        {/* Chunk header */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 shrink-0">
                                                    <FileText className="h-3 w-3 text-emerald-400" />
                                                </div>
                                                <span className="text-[11px] font-semibold text-zinc-200 truncate">
                                                    {source.filename}
                                                </span>
                                                <span className="text-[9px] text-zinc-600 shrink-0">
                                                    chunk {i + 1}
                                                </span>
                                            </div>

                                            {/* Relevance score */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="w-14 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${barColor}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className={`text-[9px] font-bold tabular-nums ${labelColor}`}>
                                                    {pct}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Chunk text preview */}
                                        <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3 pl-[28px]">
                                            {source.text}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

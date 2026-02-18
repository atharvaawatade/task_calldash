import { VoiceCallWidget } from '@/features/voice-call/ui/VoiceCallWidget';
import { PromptEditor } from '@/features/prompt-editor/ui/PromptEditor';
import { DocumentUploader } from '@/features/document-upload/ui/DocumentUploader';
import { TranscriptViewer } from '@/features/transcript/ui/TranscriptViewer';
import { RAGSourcesPanel } from '@/features/transcript/ui/RAGSourcesPanel';
import { Mic, ChevronRight } from 'lucide-react';

const PIPELINE_STEPS = [
    { label: 'STT', desc: 'Whisper' },
    { label: 'RAG', desc: 'Qdrant' },
    { label: 'LLM', desc: 'GPT-4o' },
    { label: 'TTS', desc: 'Cartesia' },
];

export default function App() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Ambient blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse-subtle pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-float pointer-events-none" />

            {/* ── Header ───────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 glass-panel border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Mic className="h-4.5 w-4.5 text-zinc-950" />
                        </div>
                        <div>
                            <h1 className="text-base font-black premium-gradient-text tracking-tight leading-none">
                                Voice AI Agent
                            </h1>
                            <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 mt-0.5">
                                Real-time · WebRTC · RAG
                            </p>
                        </div>
                    </div>

                    {/* Pipeline indicator */}
                    <div className="hidden md:flex items-center gap-1">
                        {PIPELINE_STEPS.map((step, i) => (
                            <div key={step.label} className="flex items-center gap-1">
                                <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors">
                                    <span className="text-[10px] font-bold text-zinc-200 leading-none">{step.label}</span>
                                    <span className="text-[8px] text-zinc-500 mt-0.5">{step.desc}</span>
                                </div>
                                {i < PIPELINE_STEPS.length - 1 && (
                                    <ChevronRight className="h-3 w-3 text-zinc-700" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-semibold text-emerald-400 hidden sm:block">LiveKit Connected</span>
                    </div>
                </div>
            </header>

            {/* ── Main ─────────────────────────────────────────────── */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left 8 cols — controls */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Col A */}
                            <div className="space-y-6">
                                <VoiceCallWidget />
                                <DocumentUploader />
                            </div>

                            {/* Col B */}
                            <div className="space-y-6">
                                <PromptEditor />
                                <RAGSourcesPanel />
                            </div>
                        </div>
                    </div>

                    {/* Right 4 cols — transcript */}
                    <div className="lg:col-span-4">
                        <TranscriptViewer />
                    </div>
                </div>
            </main>

            {/* ── Footer ───────────────────────────────────────────── */}
            <footer className="relative z-10 py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-2">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                    <p className="text-[9px] text-zinc-600 uppercase tracking-[0.3em]">
                        OpenAI Whisper · GPT-4o · Cartesia Sonic · Qdrant · LiveKit
                    </p>
                </div>
            </footer>
        </div>
    );
}

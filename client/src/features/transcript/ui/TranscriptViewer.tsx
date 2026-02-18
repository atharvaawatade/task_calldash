import { useEffect, useRef } from 'react';
import { useTranscriptStore } from '../store/transcriptStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, User, Bot, Terminal } from 'lucide-react';

export function TranscriptViewer() {
    const { messages } = useTranscriptStore();
    // A sentinel div at the bottom of the list — scrollIntoView is reliable
    // regardless of which element the ScrollArea exposes via its ref.
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="glass-panel rounded-3xl p-6 h-full flex flex-col space-y-6 card-hover-effect min-h-[500px]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 text-emerald-400">
                        <Terminal className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-white uppercase opacity-90">Live Feed</h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            Protocol Stream
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                <ScrollArea className="h-full pr-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-zinc-600 gap-3">
                            <MessageSquare className="h-8 w-8 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Waiting for transmission...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${msg.sender === 'agent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                                        }`}>
                                        {msg.sender === 'agent' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    </div>

                                    <div className={`space-y-1.5 flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`rounded-2xl px-4 py-3 text-sm shadow-2xl ${msg.sender === 'user'
                                                    ? 'bg-blue-600/10 text-blue-100 border border-blue-500/20 rounded-tr-none'
                                                    : 'bg-white/5 text-zinc-200 border border-white/5 rounded-tl-none'
                                                } ${!msg.isFinal ? 'opacity-50 italic animate-pulse' : ''}`}
                                        >
                                            <p className="leading-relaxed">{msg.text}</p>
                                        </div>
                                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {/* Sentinel for reliable auto-scroll */}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </ScrollArea>

                {/* Fade effect at the top */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
            </div>
        </div>
    );
}

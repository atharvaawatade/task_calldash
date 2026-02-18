import { useEffect, useState } from 'react';
import { useVoiceCall } from '../hooks/useVoiceCall';
import { useCallStore } from '../store/callStore';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff, Activity } from 'lucide-react';

const STATUS_CONFIG = {
    idle: { color: 'text-zinc-500', label: 'Idle', dot: 'bg-zinc-500' },
    connecting: { color: 'text-amber-400', label: 'Linking', dot: 'bg-amber-400 animate-pulse' },
    connected: { color: 'text-emerald-400', label: 'Secured', dot: 'bg-emerald-400 shadow-[0_0_8px_oklch(0.7_0.25_160)]' },
    disconnected: { color: 'text-zinc-500', label: 'Offline', dot: 'bg-zinc-500' },
    error: { color: 'text-red-400', label: 'Interrupted', dot: 'bg-red-400' },
} as const;

const BAR_COUNT = 24;

export function VoiceCallWidget() {
    const { connectionState, isMicEnabled, connectToRoom, disconnect, toggleMic } =
        useVoiceCall();
    const { agentSpeaking, error } = useCallStore();
    const isConnected = connectionState === 'connected';
    const config = STATUS_CONFIG[connectionState];

    // Drive bar animation via requestAnimationFrame so bars actually move.
    const [tick, setTick] = useState(0);
    useEffect(() => {
        if (!agentSpeaking) return;
        let raf: number;
        const animate = () => {
            setTick(Date.now());
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [agentSpeaking]);

    return (
        <div className="glass-panel rounded-3xl p-6 space-y-8 relative overflow-hidden group/card card-hover-effect">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -mr-16 -mt-16 transition-colors duration-1000 ${isConnected ? 'bg-emerald-500/20' : 'bg-white/5'
                }`} />

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-white/5 transition-colors ${isConnected ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-white uppercase opacity-90">Audio Core</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${config.color}`}>
                                {config.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visualizer */}
            <div className="relative h-32 flex items-center justify-center rounded-2xl bg-black/40 border border-white/[0.03] overflow-hidden group-hover/card:border-white/10 transition-colors">
                {isConnected ? (
                    <div className="flex items-end gap-1.5 h-20">
                        {Array.from({ length: BAR_COUNT }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-1 rounded-full transition-[height] duration-75 ${agentSpeaking
                                    ? 'bg-gradient-to-t from-emerald-500 to-teal-400 shadow-[0_0_15px_oklch(0.7_0.25_160/0.4)]'
                                    : 'bg-zinc-800'
                                    }`}
                                style={{
                                    height: agentSpeaking
                                        ? `${Math.abs(Math.sin((i * 0.8 + tick / 200))) * 60 + 15}%`
                                        : '15%',
                                    opacity: 0.3 + (i / BAR_COUNT) * 0.7,
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                            <Phone className="h-8 w-8 text-zinc-700 relative z-10" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                            Satellite Link Ready
                        </span>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="text-[10px] font-bold uppercase text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
                    System Alert: {error}
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
                <Button
                    onClick={isConnected ? disconnect : connectToRoom}
                    disabled={connectionState === 'connecting'}
                    className={`flex-1 h-16 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${isConnected
                        ? 'bg-zinc-950 text-red-500 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40'
                        : 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] hover:bg-emerald-400'
                        }`}
                >
                    {isConnected ? (
                        <><PhoneOff className="h-4 w-4 mr-3" /> Terminate</>
                    ) : connectionState === 'connecting' ? (
                        <Activity className="h-4 w-4 animate-spin" />
                    ) : (
                        <><Phone className="h-4 w-4 mr-3" /> Initialize</>
                    )}
                </Button>

                {isConnected && (
                    <Button
                        variant="ghost"
                        onClick={toggleMic}
                        className={`h-16 w-16 rounded-2xl border transition-all active:scale-95 ${isMicEnabled
                            ? 'bg-white/5 border-white/5 text-emerald-400 hover:bg-emerald-500/10'
                            : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                            }`}
                    >
                        {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>
                )}
            </div>
        </div>
    );
}

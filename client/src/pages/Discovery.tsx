import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, MapPin, X } from 'lucide-react';
import { api } from '../lib/api';

interface Profile {
    displayName: string;
    age: number;
    bio?: string | null;
    location?: string | null;
    preferences?: string | null;
    user: { id: number };
    photos: { url: string }[];
}

type Prompt = { question: string; answer: string };

function safeJsonParse(input: unknown): any | null {
    if (typeof input !== 'string') return null;
    try { return JSON.parse(input); } catch { return null; }
}

function promptsFromPreferences(pref?: string | null): Prompt[] {
    const parsed = safeJsonParse(pref);
    const raw = Array.isArray(parsed?.prompts) ? parsed.prompts : [];
    return raw
        .filter((p: any) => p && typeof p.question === 'string')
        .slice(0, 3)
        .map((p: any) => ({
            question: String(p.question),
            answer: typeof p.answer === 'string' ? p.answer : '',
        }))
        .filter((p: Prompt) => p.answer.trim().length > 0);
}

const Discovery = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [toast, setToast] = useState<string | null>(null);

    const [dx, setDx] = useState(0);
    const [dy, setDy] = useState(0);
    const [transition, setTransition] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);

    const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const offsetStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const pendingSwipe = useRef<{ dir: 'like' | 'pass'; profile: Profile } | null>(null);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const res = await api.get('/api/profile/discovery');
                setProfiles(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfiles();
    }, []);

    const current = profiles[currentIndex];
    const next = profiles[currentIndex + 1];

    const likeLabelOpacity = useMemo(() => Math.min(1, Math.max(0, dx / 140)), [dx]);
    const passLabelOpacity = useMemo(() => Math.min(1, Math.max(0, -dx / 140)), [dx]);
    const rotation = useMemo(() => dx / 18, [dx]);

    const commitLike = async (profile: Profile) => {
        try {
            const res = await api.post('/api/matches/like', { receiverId: profile.user.id });
            if (res.data?.isMatch) {
                setToast("It's a match!");
                window.setTimeout(() => setToast(null), 2200);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const swipe = (dir: 'like' | 'pass') => {
        if (!current || transition) return;
        setTransition('transform 220ms cubic-bezier(0.22, 1, 0.36, 1)');
        pendingSwipe.current = { dir, profile: current };
        setDx(dir === 'like' ? 420 : -420);
        setDy(dy * 0.3);
        setIsDragging(false);
    };

    if (currentIndex >= profiles.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-10">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Heart size={26} className="text-gray-300" />
                </div>
                <div className="max-w-xs">
                    <h3 className="text-xl font-black text-gray-800">You’re all caught up</h3>
                    <p className="text-gray-500 text-sm mt-1">Check back soon for new people nearby.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {toast && (
                <div className="mb-3">
                    <div className="mx-auto w-fit bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                        {toast}
                    </div>
                </div>
            )}

            <div className="flex-1 flex items-center justify-center">
                <div className="relative w-full max-w-md h-[650px]">
                    {/* next card */}
                    {next && (
                        <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-white border border-gray-100 shadow-sm">
                            <ProfileView profile={next} muted />
                        </div>
                    )}

                    {/* top card */}
                    {current && (
                        <div
                            className="absolute inset-0 rounded-[2rem] overflow-hidden bg-white border border-gray-100 shadow-xl"
                            style={{
                                transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${rotation}deg)`,
                                transition,
                                touchAction: 'pan-y',
                            }}
                            onPointerDown={(e) => {
                                if (transition) return;
                                setIsDragging(true);
                                setTransition('');
                                dragStart.current = { x: e.clientX, y: e.clientY };
                                offsetStart.current = { x: dx, y: dy };
                                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                            }}
                            onPointerMove={(e) => {
                                if (!isDragging) return;
                                const nx = offsetStart.current.x + (e.clientX - dragStart.current.x);
                                const ny = offsetStart.current.y + (e.clientY - dragStart.current.y);
                                setDx(nx);
                                setDy(ny);
                            }}
                            onPointerUp={() => {
                                setIsDragging(false);
                                const threshold = 110;
                                if (dx > threshold) return swipe('like');
                                if (dx < -threshold) return swipe('pass');
                                setTransition('transform 180ms cubic-bezier(0.22, 1, 0.36, 1)');
                                setDx(0);
                                setDy(0);
                            }}
                            onTransitionEnd={() => {
                                const pending = pendingSwipe.current;
                                if (!pending) return;
                                pendingSwipe.current = null;
                                void (async () => {
                                    if (pending.dir === 'like') await commitLike(pending.profile);
                                    setCurrentIndex((i) => i + 1);
                                    setTransition('');
                                    setDx(0);
                                    setDy(0);
                                })();
                            }}
                        >
                            {/* swipe labels */}
                            <div className="absolute top-5 left-5 z-20 pointer-events-none">
                                <div
                                    className="px-3 py-1.5 rounded-xl border-2 border-emerald-500 text-emerald-600 font-black tracking-wide bg-white/90"
                                    style={{ opacity: likeLabelOpacity }}
                                >
                                    LIKE
                                </div>
                            </div>
                            <div className="absolute top-5 right-5 z-20 pointer-events-none">
                                <div
                                    className="px-3 py-1.5 rounded-xl border-2 border-rose-500 text-rose-600 font-black tracking-wide bg-white/90"
                                    style={{ opacity: passLabelOpacity }}
                                >
                                    NOPE
                </div>
                </div>

                            <ProfileView profile={current} />

                            {/* actions */}
                            <div className="absolute bottom-4 left-0 right-0 z-20">
                                <div className="mx-auto w-fit bg-white/85 backdrop-blur-md border border-gray-200 rounded-full px-4 py-2 shadow-lg flex items-center gap-4">
                                    <button
                                        onClick={() => swipe('pass')}
                                        className="h-12 w-12 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition active:scale-95"
                                        aria-label="Pass"
                                    >
                                        <X size={26} />
                    </button>
                                    <button
                                        onClick={() => swipe('like')}
                                        className="h-12 w-12 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white flex items-center justify-center shadow-md hover:opacity-90 transition active:scale-95"
                                        aria-label="Like"
                                    >
                                        <Heart size={26} fill="currentColor" />
                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Discovery;

function ProfileView({ profile, muted }: { profile: Profile; muted?: boolean }) {
    const photo = profile.photos?.[0]?.url;
    const prompts = promptsFromPreferences(profile.preferences);
    return (
        <div className={`h-full flex flex-col ${muted ? 'opacity-70' : ''}`}>
            <div className="relative h-[360px] bg-gray-100">
                {photo ? (
                    <img src={photo} alt={profile.displayName} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <div className="flex items-end gap-2">
                        <div className="text-3xl font-black">{profile.displayName}</div>
                        <div className="text-xl font-semibold opacity-90">{profile.age}</div>
                    </div>
                    {profile.location && (
                        <div className="mt-1 flex items-center gap-1 text-white/80 text-sm font-semibold">
                            <MapPin size={14} />
                            <span>{profile.location}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                {profile.bio?.trim() ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="text-[11px] font-black tracking-widest uppercase text-gray-400">About</div>
                        <div className="mt-2 text-gray-900 font-semibold leading-relaxed">{profile.bio}</div>
                    </div>
                ) : null}

                {prompts.map((p, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="text-[11px] font-black tracking-widest uppercase text-gray-400">{p.question}</div>
                        <div className="mt-2 text-gray-900 font-semibold leading-relaxed">{p.answer}</div>
                    </div>
                ))}

                {(!profile.bio?.trim() && prompts.length === 0) && (
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">
                        No prompts yet.
                    </div>
                )}
            </div>
        </div>
    );
}

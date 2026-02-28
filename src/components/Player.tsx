'use client';

import React, { useRef, useState, useEffect } from 'react';
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube';
import { usePlayerStore, Track } from '@/store/playerStore';
import { Play, Pause, SkipForward, SkipBack, Search, X, Loader2, Volume2, VolumeX, Info } from 'lucide-react';

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function Player() {
    const {
        currentTrack, setCurrentTrack,
        isPlaying, setIsPlaying,
        volume, setVolume,
        duration, setDuration,
        currentTime, setCurrentTime,
        playNext, playPrev, addToQueue,
        queue, currentIndex
    } = usePlayerStore();

    const playerRef = useRef<YouTubePlayer | null>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);

    // Seekbar dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [dragTime, setDragTime] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showHowToUse, setShowHowToUse] = useState(false);

    // Debounce search effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                setSearchResults(data.tracks || []);
                setShowDropdown(true);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSearching(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectTrack = async (track: Track) => {
        setShowDropdown(false);
        setSearchQuery('');

        try {
            setCurrentTrack({ ...track, youtubeVideoId: null });
            setIsVideoReady(false);

            const res = await fetch(`/api/youtube?q=${encodeURIComponent(`${track.artist} ${track.title}`)}`);
            const data = await res.json();

            const newTrack = { ...track, youtubeVideoId: data.videoId };
            setCurrentTrack(newTrack);
            setIsPlaying(true);

            // Also add to queue so next/prev works manually for a simple mockup
            usePlayerStore.setState(state => ({
                queue: [...state.queue, newTrack],
                currentIndex: state.queue.length
            }));
        } catch (error) {
            console.error(error);
        }
    };

    // Track progress
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && isVideoReady && playerRef.current) {
            interval = setInterval(async () => {
                try {
                    // Make sure we handle Promise/number correctly again based on react-youtube version
                    const timeObj = playerRef.current!.getCurrentTime();
                    if (timeObj && typeof timeObj.then === 'function') {
                        timeObj.then((t: number) => setCurrentTime(t || 0)).catch(() => { });
                    } else if (typeof timeObj === 'number') {
                        setCurrentTime(timeObj || 0);
                    }
                } catch (e) { }
            }, 500);
        }
        return () => clearInterval(interval);
    }, [isPlaying, isVideoReady, setCurrentTime]);

    // Sync volume
    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.setVolume(volume);
        }
    }, [volume]);

    // Sync play/pause
    useEffect(() => {
        if (playerRef.current) {
            if (isPlaying) {
                playerRef.current.playVideo();
            } else {
                playerRef.current.pauseVideo();
            }
        }
    }, [isPlaying]);

    const onReady = (event: YouTubeEvent) => {
        playerRef.current = event.target;
        setIsVideoReady(true);
        event.target.setVolume(volume);

        // Get duration once ready. react-youtube's getDuration() might return a number directly 
        // instead of a Promise in some versions, or a Promise in others.
        const durationObj = event.target.getDuration();
        if (durationObj && typeof durationObj.then === 'function') {
            durationObj.then((d: number) => setDuration(d)).catch(console.error);
        } else if (typeof durationObj === 'number') {
            setDuration(durationObj);
        }

        if (isPlaying) {
            event.target.playVideo();
        }
    };

    const onStateChange = (event: YouTubeEvent) => {
        // 1: playing, 2: paused
        if (event.data === 1 && !isPlaying) {
            setIsPlaying(true);
        } else if (event.data === 2 && isPlaying) {
            setIsPlaying(false);
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black text-white">
            {/* Background Layer: YouTube Video */}
            {currentTrack?.youtubeVideoId && (
                <div
                    className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="pointer-events-none w-full h-full relative overflow-hidden">
                        <YouTube
                            videoId={currentTrack.youtubeVideoId}
                            opts={{
                                width: '100%',
                                height: '100%',
                                playerVars: {
                                    autoplay: 1,
                                    controls: 0,
                                    rel: 0,
                                    showinfo: 0,
                                    modestbranding: 0,
                                    iv_load_policy: 3,
                                    disablekb: 1,
                                    playsinline: 1,
                                },
                            }}
                            onReady={onReady}
                            onStateChange={onStateChange}
                            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                            iframeClassName="w-[300vw] h-[300vw] sm:w-[200vw] sm:h-[200vw] md:w-[150vw] md:h-[150vw] lg:w-[100vw] lg:h-[56.25vw] min-h-screen min-w-[177.77vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        />
                    </div>
                </div>
            )}

            {/* Middle Layer: Overlay */}
            <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                    backdropFilter: 'blur(10px) brightness(0.6)',
                    WebkitBackdropFilter: 'blur(10px) brightness(0.6)',
                }}
            />

            {/* Foreground Layer: Controls & Info */}
            <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-12">
                {/* Header */}
                <header className="flex justify-between items-center w-full relative hover:z-50">
                    <div className="font-bold text-xl md:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        VibePlayer
                    </div>

                    <div className="relative z-50 flex items-center space-x-3 sm:space-x-4">
                        {/* 使い方ボタン */}
                        <button
                            onClick={() => setShowHowToUse(true)}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                            aria-label="使い方を表示"
                            title="使い方を表示"
                        >
                            <Info className="w-5 h-5" />
                        </button>

                        {/* Search Input & Results (Only show in header if there is a current track) */}
                        {currentTrack && (
                            <>
                                <div className="flex items-center bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/20 px-4 h-10 w-48 sm:w-64 focus-within:w-64 sm:focus-within:w-80 focus-within:bg-white/20">
                                    {isSearching ? (
                                        <Loader2 className="w-4 h-4 text-white/50 animate-spin mr-2 shrink-0" />
                                    ) : (
                                        <Search className="w-4 h-4 text-white/50 mr-2 shrink-0" />
                                    )}
                                    <input
                                        type="text"
                                        placeholder="Search tracks..."
                                        className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-white/50"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => {
                                            if (searchResults.length > 0) setShowDropdown(true);
                                        }}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSearchResults([]);
                                                setShowDropdown(false);
                                            }}
                                            className="shrink-0"
                                        >
                                            <X className="w-4 h-4 text-white/50 hover:text-white ml-2" />
                                        </button>
                                    )}
                                </div>

                                {/* Results Dropdown */}
                                {showDropdown && searchResults.length > 0 && (
                                    <div className="absolute top-12 right-0 w-64 sm:w-80 max-h-[60vh] overflow-y-auto bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-2 z-[60]">
                                        {searchResults.map((track) => (
                                            <button
                                                key={track.id}
                                                className="w-full flex items-center p-2 hover:bg-white/10 rounded-xl transition-colors text-left"
                                                onClick={() => handleSelectTrack(track)}
                                            >
                                                <img
                                                    src={track.artworkUrl}
                                                    alt={track.title}
                                                    className="w-12 h-12 rounded object-cover mr-3 bg-white/5"
                                                />
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-sm font-bold truncate text-white">{track.title}</div>
                                                    <div className="text-xs truncate text-white/60">{track.artist}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </header>

                {/* Player Controls */}
                <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-8 md:space-y-12 pb-4">
                    {currentTrack ? (
                        <>
                            {/* Artwork & Info */}
                            <div className="flex flex-col items-center space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {currentTrack.artworkUrl && (
                                    <div className="relative group">
                                        <img
                                            src={currentTrack.artworkUrl}
                                            alt={currentTrack.title}
                                            className="w-56 h-56 md:w-80 md:h-80 object-cover rounded-2xl shadow-2xl shadow-black/50 transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">{currentTrack.title}</h2>
                                    <p className="text-white/70 text-lg md:text-xl font-medium">{currentTrack.artist}</p>
                                </div>
                            </div>

                            {/* Controls Area */}
                            <div className="w-full flex flex-col items-center space-y-6">
                                {/* Progress Bar */}
                                <div className="w-full flex items-center space-x-3 text-xs md:text-sm font-medium text-white/70">
                                    <span className="w-10 text-right">
                                        {formatTime(isDragging ? dragTime : currentTime)}
                                    </span>
                                    <div
                                        className="flex-1 h-1.5 md:h-2 bg-white/20 rounded-full cursor-pointer relative group"
                                        onPointerDown={(e) => {
                                            if (!playerRef.current || duration === 0) return;
                                            setIsDragging(true);
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                                            setDragTime(pos * duration);

                                            // Optional: handle drag move/up by attaching to window
                                            const handlePointerMove = (moveEvent: PointerEvent) => {
                                                const movePos = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                                                setDragTime(movePos * duration);
                                            };
                                            const handlePointerUp = (upEvent: PointerEvent) => {
                                                const finalPos = Math.max(0, Math.min(1, (upEvent.clientX - rect.left) / rect.width));
                                                const newTime = finalPos * duration;
                                                playerRef.current?.seekTo(newTime, true);
                                                setCurrentTime(newTime);
                                                setIsDragging(false);

                                                window.removeEventListener('pointermove', handlePointerMove);
                                                window.removeEventListener('pointerup', handlePointerUp);
                                            };

                                            window.addEventListener('pointermove', handlePointerMove);
                                            window.addEventListener('pointerup', handlePointerUp);
                                        }}
                                    >
                                        <div
                                            className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-green-400 transition-none"
                                            style={{
                                                width: `${duration > 0 ? ((isDragging ? dragTime : currentTime) / duration) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                    <span className="w-10 text-left">{formatTime(duration)}</span>
                                </div>

                                {/* Main Playback Controls & Volume */}
                                <div className="w-full flex items-center justify-between">
                                    {/* Empty spacer or Extra controls for left side */}
                                    <div className="hidden md:flex flex-1" />

                                    {/* Center Play Controls */}
                                    <div className="flex flex-1 justify-center items-center space-x-6 md:space-x-8">
                                        <button
                                            className={`p-3 rounded-full transition-all flex items-center justify-center ${currentIndex <= 0 ? 'text-white/30 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 hover:scale-110 active:scale-95 text-white'}`}
                                            onClick={() => { if (currentIndex > 0) playPrev() }}
                                            disabled={currentIndex <= 0}
                                        >
                                            <SkipBack className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                                        </button>
                                        <button
                                            className="p-5 md:p-6 bg-white hover:bg-gray-100 hover:scale-105 rounded-full text-black transition-all shadow-lg active:scale-95"
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            aria-label={isPlaying ? "Pause" : "Play"}
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
                                            ) : (
                                                <Play className="w-8 h-8 md:w-10 md:h-10 pl-1" fill="currentColor" />
                                            )}
                                        </button>
                                        <button
                                            className={`p-3 rounded-full transition-all flex items-center justify-center ${queue.length === 0 || currentIndex >= queue.length - 1 ? 'text-white/30 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 hover:scale-110 active:scale-95 text-white'}`}
                                            onClick={() => { if (queue.length > 0 && currentIndex < queue.length - 1) playNext() }}
                                            disabled={queue.length === 0 || currentIndex >= queue.length - 1}
                                        >
                                            <SkipForward className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                                        </button>
                                    </div>

                                    {/* Right Side: Volume Control */}
                                    <div className="flex flex-1 justify-end items-center space-x-3 hidden md:flex">
                                        <button onClick={() => setVolume(volume === 0 ? 100 : 0)}>
                                            {volume === 0 ? <VolumeX className="w-5 h-5 text-white/70" /> : <Volume2 className="w-5 h-5 text-white/70" />}
                                        </button>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={volume}
                                            onChange={(e) => setVolume(Number(e.target.value))}
                                            className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                                        />
                                    </div>
                                </div>

                                {/* Mobile version Volume Control */}
                                <div className="flex md:hidden w-full items-center justify-center space-x-3 pt-4">
                                    <button onClick={() => setVolume(volume === 0 ? 100 : 0)}>
                                        {volume === 0 ? <VolumeX className="w-4 h-4 text-white/70" /> : <Volume2 className="w-4 h-4 text-white/70" />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={(e) => setVolume(Number(e.target.value))}
                                        className="w-48 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full min-h-[50vh] space-y-8 animate-in fade-in zoom-in-95 duration-700 mt-10 md:mt-20">
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60 text-center px-4">
                                さあ、音楽を探そう
                            </h1>

                            <div className="relative w-full max-w-xl z-50 px-4 md:px-0">
                                <div className="flex items-center bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/20 px-6 h-14 md:h-16 w-full focus-within:bg-white/20 focus-within:ring-2 focus-within:ring-white/50 shadow-2xl">
                                    {isSearching ? (
                                        <Loader2 className="w-6 h-6 text-white/50 animate-spin mr-3 shrink-0" />
                                    ) : (
                                        <Search className="w-6 h-6 text-white/50 mr-3 shrink-0" />
                                    )}
                                    <input
                                        type="text"
                                        placeholder="曲名、アーティスト名で検索..."
                                        className="bg-transparent border-none outline-none text-base md:text-xl w-full text-white placeholder:text-white/50"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => {
                                            if (searchResults.length > 0) setShowDropdown(true);
                                        }}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSearchResults([]);
                                                setShowDropdown(false);
                                            }}
                                            className="shrink-0 p-2"
                                        >
                                            <X className="w-5 h-5 text-white/50 hover:text-white" />
                                        </button>
                                    )}
                                </div>

                                {/* Results Dropdown (Centered) */}
                                {showDropdown && searchResults.length > 0 && (
                                    <div className="absolute top-[calc(100%+0.5rem)] left-0 md:left-0 right-0 mx-4 md:mx-0 max-h-[50vh] overflow-y-auto bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-2 z-[60]">
                                        {searchResults.map((track) => (
                                            <button
                                                key={track.id}
                                                className="w-full flex items-center p-3 hover:bg-white/10 rounded-xl transition-colors text-left"
                                                onClick={() => handleSelectTrack(track)}
                                            >
                                                <img
                                                    src={track.artworkUrl}
                                                    alt={track.title}
                                                    className="w-14 h-14 rounded-lg object-cover mr-4 bg-white/5 shadow-md"
                                                />
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-base font-bold truncate text-white">{track.title}</div>
                                                    <div className="text-sm truncate text-white/60">{track.artist}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <p className="text-white/60 text-base md:text-xl max-w-md text-center px-4">
                                お気に入りの曲名やアーティスト名を入力して、再生を始めましょう。
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Credit */}
                <footer className="w-full flex flex-col-reverse md:flex-row justify-between items-center md:items-end gap-2 text-xs md:text-sm text-white/40 font-medium">
                    <div className="text-left">
                        &copy; {(() => {
                            const currentYear = new Date().getFullYear();
                            const startYear = 2026;
                            return currentYear === startYear ? startYear : `${startYear}-${currentYear}`;
                        })()} is0629sy. All rights reserved.
                    </div>
                    <div className="text-center md:text-right">
                        Powered by YouTube & Spotify
                    </div>
                </footer>
            </div>

            {/* How to Use Modal */}
            {showHowToUse && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowHowToUse(false)} />
                    <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
                        <button
                            onClick={() => setShowHowToUse(false)}
                            className="absolute top-4 right-4 p-1 text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold mb-6 text-white flex items-center">
                            <Info className="w-5 h-5 mr-3" />
                            使い方
                        </h3>
                        <div className="space-y-5 text-sm md:text-base text-white/80 leading-relaxed">
                            <p>
                                <strong className="text-white block mb-1">曲を検索・再生</strong>
                                右上の検索バーに曲名やアーティスト名を入力し、候補から選択すると再生が始まります。
                            </p>
                            <p>
                                <strong className="text-white block mb-1">再生コントロール</strong>
                                画面中央のボタンで再生・一時停止や、前後の曲へのスキップ操作が可能です。
                            </p>
                            <p>
                                <strong className="text-white block mb-1">シークバーと音量</strong>
                                プログレスバーのクリックやドラッグで再生位置を変更できます。音量アイコンでミュート・調節が可能です。
                            </p>
                        </div>
                        <div className="mt-8 border-t border-white/10 pt-6">
                            <button
                                onClick={() => setShowHowToUse(false)}
                                className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors active:scale-95"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

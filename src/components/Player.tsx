'use client';

import React, { useRef, useState, useEffect } from 'react';
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube';
import { usePlayerStore } from '@/store/playerStore';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

export default function Player() {
    const { currentTrack, isPlaying, setIsPlaying, volume } = usePlayerStore();
    const playerRef = useRef<YouTubePlayer | null>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);

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
                    backdropFilter: 'blur(20px) brightness(0.6)',
                    WebkitBackdropFilter: 'blur(20px) brightness(0.6)',
                }}
            />

            {/* Foreground Layer: Controls & Info */}
            <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-12">
                {/* Header */}
                <header className="flex justify-between items-center w-full">
                    <div className="font-bold text-xl md:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        VibePlayer
                    </div>
                    {/* Static Search Input Placeholder */}
                    <div className="w-48 sm:w-64 h-10 bg-white/10 hover:bg-white/20 transition-colors rounded-full border border-white/20 px-4 flex items-center cursor-pointer">
                        <span className="text-sm text-white/70">Search tracks...</span>
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

                            {/* Controls */}
                            <div className="flex items-center space-x-8">
                                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-95">
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
                                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-95">
                                    <SkipForward className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-white/50 animate-pulse">
                            <p className="text-lg">Click the search bar to find a track</p>
                        </div>
                    )}
                </div>

                {/* Footer Credit */}
                <footer className="w-full text-center md:text-right text-xs md:text-sm text-white/40 font-medium">
                    Powered by YouTube & Spotify
                </footer>
            </div>
        </div>
    );
}

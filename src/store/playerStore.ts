import { create } from 'zustand';

export interface Track {
    id: string;
    title: string;
    artist: string;
    artworkUrl: string;
    youtubeVideoId: string | null;
}

interface PlayerState {
    currentTrack: Track | null;
    isPlaying: boolean;
    volume: number;
    setCurrentTrack: (track: Track) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setVolume: (volume: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
    currentTrack: null,
    isPlaying: false,
    volume: 100,
    setCurrentTrack: (track) => set({ currentTrack: track }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setVolume: (volume) => set({ volume }),
}));

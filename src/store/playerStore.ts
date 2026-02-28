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
    duration: number;
    currentTime: number;
    queue: Track[];
    currentIndex: number;

    setCurrentTrack: (track: Track) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setVolume: (volume: number) => void;
    setDuration: (duration: number) => void;
    setCurrentTime: (time: number) => void;

    addToQueue: (track: Track) => void;
    playNext: () => void;
    playPrev: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null,
    isPlaying: false,
    volume: 100,
    duration: 0,
    currentTime: 0,
    queue: [],
    currentIndex: -1,

    setCurrentTrack: (track) => set({ currentTrack: track }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setVolume: (volume) => set({ volume }),
    setDuration: (duration) => set({ duration }),
    setCurrentTime: (currentTime) => set({ currentTime }),

    addToQueue: (track) => set((state) => {
        const isFirst = state.queue.length === 0;
        return {
            queue: [...state.queue, track],
            ...(isFirst ? { currentTrack: track, currentIndex: 0 } : {})
        };
    }),

    playNext: () => set((state) => {
        if (state.queue.length === 0 || state.currentIndex >= state.queue.length - 1) return state;
        const nextIndex = state.currentIndex + 1;
        return {
            currentIndex: nextIndex,
            currentTrack: state.queue[nextIndex],
            isPlaying: true,
            currentTime: 0,
        };
    }),

    playPrev: () => set((state) => {
        if (state.queue.length === 0 || state.currentIndex <= 0) {
            return { currentTime: 0 }; // Restart current track if it's the first one
        }
        const prevIndex = state.currentIndex - 1;
        return {
            currentIndex: prevIndex,
            currentTrack: state.queue[prevIndex],
            isPlaying: true,
            currentTime: 0,
        };
    }),
}));

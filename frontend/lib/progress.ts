import { create } from 'zustand';

type ProgressState = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isCompleted: boolean;
  completionTick: number;
  nextVideoId: number | null;
  prevVideoId: number | null;
  markVideoCompleted: (videoId: number) => void;
};

export const useProgressStore = create<ProgressState>((set) => ({
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  isCompleted: false,
  completionTick: 0,
  nextVideoId: null,
  prevVideoId: null,
  markVideoCompleted: (_videoId: number) => {
    set((state) => ({ isCompleted: true, completionTick: state.completionTick + 1 }));
  },
}));

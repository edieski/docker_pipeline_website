import { create } from "zustand";
import { persist } from "zustand/middleware";

const generatePlayerId = () => {
  return Math.random().toString(36).substr(2, 9);
};

interface MissionProgress {
  missionId: number;
  completed: boolean;
  timeSpent: number;
  hintsUsed: number;
  score: number;
}

export interface Player {
  id: string;
  name: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  currentMission: number;
  progress: MissionProgress[];
  totalTimeSpent: number;
}

interface GameState {
  playerId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completedMissions: number[];
  currentMission: number | null;
  progressTokens: string[];
  hintsUsed: number;
  timeSpent: number;
  player: Player | null;
  setDifficulty: (difficulty: 'beginner' | 'intermediate' | 'advanced') => void;
  completeMission: (missionId: number) => void;
  setCurrentMission: (missionId: number | null) => void;
  addProgressToken: (token: string) => void;
  useHint: () => void;
  addTimeSpent: (seconds: number) => void;
  parseProgressToken: (token: string) => { playerId: string; mission: number; progress: string } | null;
  generateProgressToken: () => string;
  createPlayer: (name: string) => void;
  updateMissionProgress: (missionId: number, progress: Partial<MissionProgress>) => void;
  unlockNextMission: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerId: generatePlayerId(),
      difficulty: 'beginner',
      completedMissions: [],
      currentMission: null,
      progressTokens: [],
      hintsUsed: 0,
      timeSpent: 0,
      player: null,
      
      setDifficulty: (difficulty) => set({ difficulty }),
      
      completeMission: (missionId) => set((state) => ({
        completedMissions: [...state.completedMissions, missionId]
      })),
      
      setCurrentMission: (missionId) => set({ currentMission: missionId }),
      
      addProgressToken: (token) => set((state) => ({
        progressTokens: [...state.progressTokens, token]
      })),
      
      useHint: () => set((state) => ({
        hintsUsed: state.hintsUsed + 1
      })),
      
      addTimeSpent: (seconds) => set((state) => ({
        timeSpent: state.timeSpent + seconds
      })),
      
      parseProgressToken: (token) => {
        try {
          const decoded = JSON.parse(atob(token));
          return decoded;
        } catch {
          return null;
        }
      },
      
      generateProgressToken: () => {
        const state = get();
        const tokenData = {
          playerId: state.playerId,
          difficulty: state.difficulty,
          completedMissions: state.completedMissions,
          hintsUsed: state.hintsUsed,
          timeSpent: state.timeSpent,
          timestamp: Date.now()
        };
        return btoa(JSON.stringify(tokenData));
      },
      
      createPlayer: (name: string) => set((state) => ({
        player: {
          id: state.playerId,
          name,
          difficulty: state.difficulty,
          currentMission: 1,
          progress: [],
          totalTimeSpent: 0
        }
      })),
      
      updateMissionProgress: (missionId: number, progress: Partial<MissionProgress>) => set((state) => {
        if (!state.player) return state;
        
        const existingProgressIndex = state.player.progress.findIndex(p => p.missionId === missionId);
        const existingProgress = existingProgressIndex >= 0 ? state.player.progress[existingProgressIndex] : {
          missionId,
          completed: false,
          timeSpent: 0,
          hintsUsed: 0,
          score: 0
        };
        
        const updatedProgress = { ...existingProgress, ...progress };
        const newProgress = existingProgressIndex >= 0 
          ? state.player.progress.map((p, i) => i === existingProgressIndex ? updatedProgress : p)
          : [...state.player.progress, updatedProgress];
        
        return {
          player: {
            ...state.player,
            progress: newProgress,
            totalTimeSpent: state.player.totalTimeSpent + (progress.timeSpent || 0)
          }
        };
      }),
      
      unlockNextMission: () => set((state) => {
        if (!state.player) return state;
        
        return {
          player: {
            ...state.player,
            currentMission: Math.min(state.player.currentMission + 1, 6)
          }
        };
      }),
      
      resetGame: () => set({
        playerId: generatePlayerId(),
        difficulty: 'beginner',
        completedMissions: [],
        currentMission: null,
        progressTokens: [],
        hintsUsed: 0,
        timeSpent: 0,
        player: null
      })
    }),
    {
      name: 'devops-escape-room-storage',
      partialize: (state) => ({
        playerId: state.playerId,
        difficulty: state.difficulty,
        completedMissions: state.completedMissions,
        hintsUsed: state.hintsUsed,
        timeSpent: state.timeSpent,
        player: state.player
      })
    }
  )
);
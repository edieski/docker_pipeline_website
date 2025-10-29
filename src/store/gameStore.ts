import { create } from "zustand";
import { persist } from "zustand/middleware";

const generatePlayerId = () => {
  return Math.random().toString(36).substr(2, 9);
};

const SHARED_STORAGE_KEY = 'devops-escape-room-all-players'

// Helper functions to manage shared player storage
export const savePlayerToSharedStorage = (player: Player) => {
  try {
    const stored = localStorage.getItem(SHARED_STORAGE_KEY)
    const allPlayers: Record<string, { player: Player; lastUpdate: number }> = stored 
      ? JSON.parse(stored) 
      : {}
    
    allPlayers[player.id] = {
      player: {
        ...player,
        // Add timestamp to track when this was last updated
      },
      lastUpdate: Date.now()
    }
    
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(allPlayers))
  } catch (e) {
    console.error('Failed to save player to shared storage:', e)
  }
}

export const getAllPlayersFromSharedStorage = (): Record<string, { player: Player; lastUpdate: number }> => {
  try {
    const stored = localStorage.getItem(SHARED_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (e) {
    console.error('Failed to load players from shared storage:', e)
    return {}
  }
}

interface MissionProgress {
  missionId: number;
  completed: boolean;
  timeSpent: number;
  hintsUsed: number;
  score: number;
  quizScore?: number;
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
        // Include full player data if available
        const tokenData = {
          playerId: state.playerId,
          difficulty: state.difficulty,
          completedMissions: state.completedMissions,
          hintsUsed: state.hintsUsed,
          timeSpent: state.timeSpent,
          timestamp: Date.now(),
          // Include full player progress if player exists
          player: state.player ? {
            id: state.player.id,
            name: state.player.name,
            difficulty: state.player.difficulty,
            currentMission: state.player.currentMission,
            progress: state.player.progress,
            totalTimeSpent: state.player.totalTimeSpent
          } : null
        };
        return btoa(JSON.stringify(tokenData));
      },
      
      createPlayer: (name: string) => {
        const state = get();
        const newPlayer: Player = {
          id: state.playerId,
          name,
          difficulty: state.difficulty,
          currentMission: 1,
          progress: [],
          totalTimeSpent: 0
        };
        set({ player: newPlayer });
        // Auto-save to shared storage
        savePlayerToSharedStorage(newPlayer);
      },
      
      updateMissionProgress: (missionId: number, progress: Partial<MissionProgress>) => {
        const state = get();
        if (!state.player) return;
        
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
        
        // Calculate time difference to avoid double-counting
        // Only add the difference between new and old timeSpent
        const oldTimeSpent = existingProgress.timeSpent || 0;
        const newTimeSpent = updatedProgress.timeSpent || 0;
        const timeDifference = newTimeSpent - oldTimeSpent;
        
        const updatedPlayer: Player = {
          ...state.player,
          progress: newProgress,
          totalTimeSpent: Math.max(0, state.player.totalTimeSpent + timeDifference)
        };
        
        set({ player: updatedPlayer });
        // Auto-save to shared storage
        savePlayerToSharedStorage(updatedPlayer);
      },
      
      unlockNextMission: () => {
        const state = get();
        if (!state.player) return;
        
        const updatedPlayer: Player = {
          ...state.player,
          currentMission: Math.min(state.player.currentMission + 1, 6)
        };
        
        set({ player: updatedPlayer });
        // Auto-save to shared storage
        savePlayerToSharedStorage(updatedPlayer);
      },
      
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
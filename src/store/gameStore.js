import { create } from 'zustand';

const useGameStore = create((set) => ({
  // 游戏列表
  games: [],

  // 当前游戏
  currentGame: null,

  // 用户数据
  userData: {
    totalScore: 0,
    gamesPlayed: 0,
    achievements: [],
  },

  // 游戏记录
  gameRecords: {},

  // 设置游戏列表
  setGames: (games) => set({ games }),

  // 设置当前游戏
  setCurrentGame: (game) => set({ currentGame: game }),

  // 更新游戏记录
  updateGameRecord: (gameId, score) => set((state) => {
    const currentRecord = state.gameRecords[gameId] || { highScore: 0, playCount: 0 };
    const newHighScore = Math.max(currentRecord.highScore, score);

    return {
      gameRecords: {
        ...state.gameRecords,
        [gameId]: {
          highScore: newHighScore,
          playCount: currentRecord.playCount + 1,
          lastPlayed: new Date().toISOString(),
        }
      },
      userData: {
        ...state.userData,
        totalScore: state.userData.totalScore + score,
        gamesPlayed: state.userData.gamesPlayed + 1,
      }
    };
  }),

  // 获取游戏记录
  getGameRecord: (gameId) => (state) => state.gameRecords[gameId] || null,
}));

export default useGameStore;

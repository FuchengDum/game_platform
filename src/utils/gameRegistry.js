/**
 * 游戏注册中心
 * 所有游戏都需要在这里注册
 */

// 游戏模块缓存
const gameModuleCache = new Map();

// 预加载Phaser引擎
let phaserPromise = null;
const preloadPhaser = () => {
  if (!phaserPromise) {
    phaserPromise = import('phaser');
  }
  return phaserPromise;
};

// 立即开始预加载Phaser
preloadPhaser();

// 预加载游戏配置（小文件，加载快）
const gameModules = import.meta.glob('../games/*/config.js', { eager: true });

// 解析游戏配置
const games = Object.entries(gameModules).map(([path, module]) => {
  const gameId = path.match(/\/games\/(.+)\/config\.js$/)[1];
  return {
    id: gameId,
    ...module.default,
  };
});

/**
 * 获取所有游戏列表
 */
export const getAllGames = () => games;

/**
 * 根据 ID 获取游戏配置
 */
export const getGameById = (id) => {
  return games.find(game => game.id === id);
};

/**
 * 根据分类获取游戏
 */
export const getGamesByCategory = (category) => {
  return games.filter(game => game.category === category);
};

/**
 * 获取所有游戏分类
 */
export const getAllCategories = () => {
  const categories = new Set(games.map(game => game.category));
  return Array.from(categories);
};

/**
 * 动态加载游戏主类 - 缓存优化版本
 */
export const loadGame = async (gameId) => {
  try {
    // 检查缓存
    if (gameModuleCache.has(gameId)) {
      return gameModuleCache.get(gameId);
    }

    // 并行加载Phaser和游戏模块
    const [phaser, gameModule] = await Promise.all([
      preloadPhaser(),
      (async () => {
        const modules = import.meta.glob('../games/*/index.js');
        const modulePath = `../games/${gameId}/index.js`;

        if (!modules[modulePath]) {
          throw new Error(`Game module not found: ${gameId}`);
        }

        return await modules[modulePath]();
      })()
    ]);

    // 缓存模块
    gameModuleCache.set(gameId, gameModule.default);

    return gameModule.default;
  } catch (error) {
    console.error(`❌ 加载游戏失败: ${gameId}`, error.message);
    return null;
  }
};

export default {
  getAllGames,
  getGameById,
  getGamesByCategory,
  getAllCategories,
  loadGame,
};

/**
 * 游戏注册中心
 * 所有游戏都需要在这里注册
 */

// 动态导入游戏配置
const gameModules = import.meta.glob('../games/*/config.js', { eager: true });

console.log('📦 Game modules found:', Object.keys(gameModules));

// 解析游戏配置
const games = Object.entries(gameModules).map(([path, module]) => {
  const gameId = path.match(/\/games\/(.+)\/config\.js$/)[1];
  console.log(`✅ Registered game: ${gameId}`, module.default);
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
 * 动态加载游戏主类
 */
export const loadGame = async (gameId) => {
  try {
    // 使用 Vite 的 glob 导入来支持动态加载
    const modules = import.meta.glob('../games/*/index.js');
    const modulePath = `../games/${gameId}/index.js`;

    console.log('📂 Available modules:', Object.keys(modules));
    console.log('🔍 Looking for:', modulePath);

    if (!modules[modulePath]) {
      throw new Error(`Game module not found: ${gameId}`);
    }

    console.log('⏳ Loading module...');
    const module = await modules[modulePath]();
    console.log('✅ Module loaded:', module);
    return module.default;
  } catch (error) {
    console.error(`❌ Failed to load game: ${gameId}`, error);
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

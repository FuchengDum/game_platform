import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllGames, getAllCategories } from '../utils/gameRegistry';
import useGameStore from '../store/gameStore';

function Home() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const gameRecords = useGameStore((state) => state.gameRecords);

  useEffect(() => {
    const allGames = getAllGames();
    const allCategories = getAllCategories();
    console.log('🎮 Loaded games:', allGames);
    console.log('📁 Categories:', allCategories);
    setGames(allGames);
    setCategories(['all', ...allCategories]);
  }, []);

  // 过滤游戏
  const filteredGames = games.filter(game => {
    const matchCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       game.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handlePlayGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'all': '全部',
      'arcade': '街机',
      'puzzle': '益智',
      'action': '动作',
      'casual': '休闲',
    };
    return labels[category] || category;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl p-8 mb-8 text-center">
        <h2 className="text-4xl font-bold mb-3">欢迎来到游戏大厅 🎮</h2>
        <p className="text-lg opacity-90">探索各种有趣的小游戏，挑战你的技能！</p>
      </div>

      {/* 搜索和筛选 */}
      <div className="mb-8 space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            placeholder="搜索游戏..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-game-card text-white px-4 py-3 pl-12 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-game-card text-gray-300 hover:bg-game-accent'
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* 游戏列表 */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-2xl text-gray-400">😢 没有找到匹配的游戏</p>
          <p className="text-gray-500 mt-2">试试其他搜索词或分类</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map(game => {
            const record = gameRecords[game.id];
            return (
              <div key={game.id} className="game-card">
                {/* 游戏封面 */}
                <div className="relative">
                  <img
                    src={game.thumbnail}
                    alt={game.name}
                    className="game-card-image"
                  />
                  {record && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs">
                      最高: {record.highScore}
                    </div>
                  )}
                </div>

                {/* 游戏信息 */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold">{game.name}</h3>
                    <span className="text-2xl">{game.icon}</span>
                  </div>

                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {game.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>⭐ {game.difficulty}</span>
                      {record && <span>🎮 {record.playCount}次</span>}
                    </div>

                    <button
                      onClick={() => handlePlayGame(game.id)}
                      className="bg-primary-500 hover:bg-primary-600 text-white
                               px-4 py-2 rounded-lg text-sm font-semibold
                               transition-colors duration-200"
                    >
                      开始游戏
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;

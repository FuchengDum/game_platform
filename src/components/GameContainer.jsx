import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById, loadGame } from '../utils/gameRegistry';
import useGameStore from '../store/gameStore';

function GameContainer() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const gameRef = useRef(null);
  const containerRef = useRef(null);
  const [gameConfig, setGameConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const updateGameRecord = useGameStore((state) => state.updateGameRecord);

  useEffect(() => {
    // 清理函数 - 彻底清除旧游戏
    const cleanupOldGame = () => {
      console.log('🧹 Cleaning up old game...');

      // 销毁游戏实例
      if (gameRef.current) {
        try {
          gameRef.current.destroy();
        } catch (err) {
          console.error('Error destroying game:', err);
        }
        gameRef.current = null;
      }

      // 清空 DOM 容器
      const container = document.getElementById('phaser-game');
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        console.log('✅ Container cleaned');
      }
    };

    // 先清理可能存在的旧游戏
    cleanupOldGame();

    // 加载游戏配置
    const config = getGameById(gameId);
    if (!config) {
      setError('游戏不存在');
      setIsLoading(false);
      return;
    }
    setGameConfig(config);

    // 动态加载游戏类
    const initGame = async () => {
      try {
        console.log('🎮 Loading game:', gameId);
        const GameClass = await loadGame(gameId);
        console.log('✅ Game class loaded:', GameClass);

        if (!GameClass) {
          throw new Error('无法加载游戏');
        }

        // 游戏结束回调
        const handleGameOver = (score) => {
          console.log('🏁 Game over, score:', score);
          updateGameRecord(gameId, score);
          // 延迟返回，让玩家看到最终分数
          setTimeout(() => {
            navigate('/');
          }, 1000);
        };

        // 再次确保容器干净
        cleanupOldGame();

        // 创建游戏实例
        console.log('🎯 Creating game instance...');
        gameRef.current = new GameClass('phaser-game', handleGameOver);
        gameRef.current.start();
        console.log('✅ Game started successfully');
        setIsLoading(false);
      } catch (err) {
        console.error('❌ 游戏加载失败:', err);
        setError('游戏加载失败: ' + err.message);
        setIsLoading(false);
      }
    };

    initGame();

    // 清理函数 - 组件卸载时执行
    return () => {
      console.log('🔄 Component unmounting, cleaning up...');
      cleanupOldGame();
    };
  }, [gameId, navigate, updateGameRecord]);

  const handlePauseResume = () => {
    if (!gameRef.current) return;

    if (isPaused) {
      gameRef.current.resume();
    } else {
      gameRef.current.pause();
    }
    setIsPaused(!isPaused);
  };

  const handleRestart = () => {
    if (gameRef.current) {
      gameRef.current.destroy();
    }
    window.location.reload();
  };

  const handleExit = () => {
    navigate('/');
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">😢</div>
        <h2 className="text-3xl font-bold mb-4">出错了</h2>
        <p className="text-gray-400 mb-8">{error}</p>
        <button onClick={handleExit} className="btn-primary">
          返回大厅
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4 animate-bounce">🎮</div>
        <h2 className="text-3xl font-bold mb-4">加载中...</h2>
        <p className="text-gray-400">正在启动游戏</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      {/* 游戏容器 - 居中显示 */}
      <div className="flex flex-col items-center gap-4">
        {/* 游戏信息和控制栏 */}
        <div className="w-full max-w-4xl bg-game-card rounded-lg px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
          {/* 左侧：游戏信息 */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">{gameConfig.icon}</span>
            <div>
              <h2 className="text-base font-bold leading-tight">{gameConfig.name}</h2>
              <p className="text-xs text-gray-400 leading-tight">
                {gameConfig.controls.desktop}
              </p>
            </div>
          </div>

          {/* 右侧：控制按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handlePauseResume}
              className="bg-game-accent hover:bg-opacity-80 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-all
                       flex items-center gap-1.5"
              title={isPaused ? '继续' : '暂停'}
            >
              <span className="text-base">{isPaused ? '▶️' : '⏸️'}</span>
              <span className="hidden sm:inline">{isPaused ? '继续' : '暂停'}</span>
            </button>
            <button
              onClick={handleRestart}
              className="bg-game-accent hover:bg-opacity-80 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-all
                       flex items-center gap-1.5"
              title="重新开始"
            >
              <span className="text-base">🔄</span>
              <span className="hidden sm:inline">重玩</span>
            </button>
            <button
              onClick={handleExit}
              className="bg-red-600 hover:bg-red-700 text-white
                       px-4 py-2 rounded-lg text-sm font-medium transition-all
                       flex items-center gap-1.5"
              title="退出游戏"
            >
              <span className="text-base">❌</span>
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </div>

        {/* Phaser 游戏画面 */}
        <div
          id="phaser-game"
          ref={containerRef}
        />
      </div>

      {/* 暂停遮罩 */}
      {isPaused && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-game-card rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">⏸️</div>
            <h3 className="text-3xl font-bold mb-4">游戏已暂停</h3>
            <button onClick={handlePauseResume} className="btn-primary">
              继续游戏
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameContainer;

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById, loadGame } from '../utils/gameRegistry';
import useGameStore from '../store/gameStore';

// 移动端虚拟控制按钮组件
const MobileControlButtons = ({ onControl }) => {
  return (
    <div className="flex flex-col items-center gap-2 sm:hidden mt-4">
      <button
        onClick={() => onControl('UP')}
        className="w-14 h-14 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-full flex items-center justify-center text-2xl text-white shadow-lg transition-all active:scale-95"
        aria-label="向上"
      >
        ↑
      </button>
      <div className="flex gap-2">
        <button
          onClick={() => onControl('LEFT')}
          className="w-14 h-14 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-full flex items-center justify-center text-2xl text-white shadow-lg transition-all active:scale-95"
          aria-label="向左"
        >
          ←
        </button>
        <button
          onClick={() => onControl('DOWN')}
          className="w-14 h-14 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-full flex items-center justify-center text-2xl text-white shadow-lg transition-all active:scale-95"
          aria-label="向下"
        >
          ↓
        </button>
        <button
          onClick={() => onControl('RIGHT')}
          className="w-14 h-14 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-full flex items-center justify-center text-2xl text-white shadow-lg transition-all active:scale-95"
          aria-label="向右"
        >
          →
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">使用方向键或滑动屏幕控制</p>
    </div>
  );
};

function GameContainer() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const gameRef = useRef(null);
  const containerRef = useRef(null);
  const [gameConfig, setGameConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameLoading, setGameLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const updateGameRecord = useGameStore((state) => state.updateGameRecord);

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 处理移动端控制
  const handleMobileControl = (direction) => {
    if (gameRef.current && gameRef.current.scene && gameRef.current.scene.scenes.length > 0) {
      const gameScene = gameRef.current.scene.scenes[0];
      // 检查是否有控制方法
      if (gameScene.handleSwipe) {
        let startX = gameScene.cameras.main.width / 2;
        let startY = gameScene.cameras.main.height / 2;
        let endX = startX;
        let endY = startY;

        switch (direction) {
          case 'UP':
            endY -= 100;
            break;
          case 'DOWN':
            endY += 100;
            break;
          case 'LEFT':
            endX -= 100;
            break;
          case 'RIGHT':
            endX += 100;
            break;
        }

        gameScene.handleSwipe(startX, startY, endX, endY);
      }
    }
  };

  // 先加载游戏配置和类
  useEffect(() => {
    const config = getGameById(gameId);
    if (!config) {
      setError('游戏不存在');
      setIsLoading(false);
      return;
    }
    setGameConfig(config);
    setIsLoading(false); // 立即设置为 false，让 DOM 渲染
  }, [gameId]);

  // 等待容器渲染后再初始化游戏
  useEffect(() => {
    // 确保基础条件满足
    if (isLoading || !gameConfig || !containerRef.current) {
      return;
    }

    let mounted = true;

    const initGame = async () => {
      try {
        setGameLoading(true);

        const GameClass = await loadGame(gameId);

        if (!GameClass || !mounted) {
          return;
        }

        // 游戏结束回调
        const handleGameOver = (score) => {
          updateGameRecord(gameId, score);
          setIsGameOver(true);
          setFinalScore(score);
        };

        gameRef.current = new GameClass('phaser-game', handleGameOver);
        gameRef.current.start();

        setGameLoading(false);
      } catch (err) {
        if (mounted) {
          setError('游戏加载失败: ' + err.message);
          setGameLoading(false);
        }
      }
    };

    initGame();

    return () => {
      mounted = false;
      if (gameRef.current) {
        try {
          gameRef.current.destroy();
        } catch (err) {
          console.error('Error destroying game:', err);
        }
        gameRef.current = null;
      }
    };
  }, [gameId, gameConfig, isLoading, navigate, updateGameRecord]);

  const handlePauseResume = () => {
    if (!gameRef.current) return;

    if (isPaused) {
      gameRef.current.resume();
    } else {
      gameRef.current.pause();
    }
    setIsPaused(!isPaused);
  };

  const handleRestart = async () => {
    if (gameRef.current) {
      gameRef.current.destroy();
      gameRef.current = null;
    }
    // 重置游戏结束状态
    setIsGameOver(false);
    setFinalScore(0);
    setIsPaused(false);
    // 重新初始化游戏
    setGameLoading(true);

    try {
      const GameClass = await loadGame(gameId);

      if (containerRef.current && gameConfig && GameClass) {
        const handleGameOver = (score) => {
          updateGameRecord(gameId, score);
          setIsGameOver(true);
          setFinalScore(score);
        };

        gameRef.current = new GameClass('phaser-game', handleGameOver);
        gameRef.current.start();
      }
    } catch (err) {
      setError('重新开始游戏失败: ' + err.message);
    }

    setGameLoading(false);
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
        <p className="text-gray-400">正在读取游戏配置</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
      {/* 游戏加载遮罩 */}
      {gameLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-game-card rounded-xl p-8 text-center">
            <div className="text-6xl mb-4 animate-pulse">⚡</div>
            <h2 className="text-3xl font-bold mb-4">启动游戏中...</h2>
            <p className="text-gray-400">正在加载游戏资源，请稍候</p>
          </div>
        </div>
      )}

      {/* 游戏容器 - 移动端优化 */}
      <div className="space-y-3 sm:space-y-4">
        {/* 游戏信息和控制栏 - 移动端优化 */}
        <div className="w-full bg-game-card rounded-lg px-3 py-2 sm:px-4 sm:py-2.5">
          {/* 桌面端布局 */}
          <div className="hidden sm:flex items-center justify-between">
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
                <span>{isPaused ? '继续' : '暂停'}</span>
              </button>
              <button
                onClick={handleRestart}
                className="bg-game-accent hover:bg-opacity-80 text-white
                         px-4 py-2 rounded-lg text-sm font-medium transition-all
                         flex items-center gap-1.5"
                title="重新开始"
              >
                <span className="text-base">🔄</span>
                <span>重玩</span>
              </button>
              <button
                onClick={handleExit}
                className="bg-red-600 hover:bg-red-700 text-white
                         px-4 py-2 rounded-lg text-sm font-medium transition-all
                         flex items-center gap-1.5"
                title="退出游戏"
              >
                <span className="text-base">❌</span>
                <span>退出</span>
              </button>
            </div>
          </div>

          {/* 移动端布局 */}
          <div className="sm:hidden">
            {/* 游戏信息 - 紧凑布局 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{gameConfig.icon}</span>
                <div>
                  <h2 className="text-sm font-bold leading-tight">{gameConfig.name}</h2>
                  <p className="text-xs text-gray-400 leading-tight">
                    {isMobile ? gameConfig.controls.mobile : gameConfig.controls.desktop}
                  </p>
                </div>
              </div>
            </div>

            {/* 移动端控制按钮 - 小尺寸 */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={handlePauseResume}
                className="bg-game-accent hover:bg-opacity-80 text-white
                         w-12 h-12 rounded-lg flex items-center justify-center
                         transition-all active:scale-95"
                title={isPaused ? '继续' : '暂停'}
              >
                <span className="text-lg">{isPaused ? '▶️' : '⏸️'}</span>
              </button>
              <button
                onClick={handleRestart}
                className="bg-game-accent hover:bg-opacity-80 text-white
                         w-12 h-12 rounded-lg flex items-center justify-center
                         transition-all active:scale-95"
                title="重新开始"
              >
                <span className="text-lg">🔄</span>
              </button>
              <button
                onClick={handleExit}
                className="bg-red-600 hover:bg-red-700 text-white
                         w-12 h-12 rounded-lg flex items-center justify-center
                         transition-all active:scale-95"
                title="退出游戏"
              >
                <span className="text-lg">❌</span>
              </button>
            </div>
          </div>
        </div>

        {/* Phaser 游戏画面 - 响应式容器 */}
        <div className="flex justify-center">
          <div
            id="phaser-game"
            ref={containerRef}
            className="w-full max-w-full sm:max-w-[600px]"
            data-game={gameId}
          />
        </div>

        {/* 移动端虚拟控制按钮 */}
        {isMobile && gameId === 'snake' && (
          <MobileControlButtons onControl={handleMobileControl} />
        )}
      </div>

      {/* 游戏结束遮罩 */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-game-card rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🏁</div>
            <h3 className="text-3xl font-bold mb-2">游戏结束</h3>
            <p className="text-xl text-gray-300 mb-6">得分: {finalScore}</p>
            <div className="flex gap-4 justify-center">
              <button onClick={handleRestart} className="btn-primary">
                重新开始
              </button>
              <button onClick={handleExit} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200">
                返回大厅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 暂停遮罩 */}
      {isPaused && !isGameOver && (
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

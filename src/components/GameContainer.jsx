import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById, loadGame } from '../utils/gameRegistry';
import useGameStore from '../store/gameStore';


function GameContainer() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const gameRef = useRef(null);
  const containerRef = useRef(null);
  const landscapeContainerRef = useRef(null);
  const [gameConfig, setGameConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameLoading, setGameLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showControls, setShowControls] = useState(false); // 移动端控制栏显示状态
  const updateGameRecord = useGameStore((state) => state.updateGameRecord);

  // 检测移动设备和屏幕方向
  useEffect(() => {
    const checkDeviceState = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           window.innerWidth < 768;
      const isLandscapeMode = window.innerWidth > window.innerHeight;

      setIsMobile(isMobileDevice);
      setIsLandscape(isLandscapeMode);

      console.log('📱 设备状态更新:', {
        isMobile: isMobileDevice,
        isLandscape: isLandscapeMode,
        size: `${window.innerWidth}×${window.innerHeight}`
      });
    };

    checkDeviceState();

    const handleOrientationChange = () => {
      setTimeout(checkDeviceState, 100); // 延迟处理，确保浏览器完成旋转
    };

    window.addEventListener('resize', checkDeviceState);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', checkDeviceState);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  
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
    const targetRef = isMobile && isLandscape ? containerRef : landscapeContainerRef;
    if (isLoading || !gameConfig || !targetRef.current) {
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

        // 使用正确的容器ID
        const containerId = isMobile && isLandscape ? 'phaser-game' : 'phaser-game-landscape-hidden';
        gameRef.current = new GameClass(containerId, handleGameOver);
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

      const targetRef = isMobile && isLandscape ? containerRef : landscapeContainerRef;
      if (targetRef.current && gameConfig && GameClass) {
        const handleGameOver = (score) => {
          updateGameRecord(gameId, score);
          setIsGameOver(true);
          setFinalScore(score);
        };

        // 使用正确的容器ID
        const containerId = isMobile && isLandscape ? 'phaser-game' : 'phaser-game-landscape-hidden';
        gameRef.current = new GameClass(containerId, handleGameOver);
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
    <div className="w-full px-0 sm:px-2 py-0">
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
      <div className="space-y-0 sm:space-y-4">
        {/* 游戏信息和控制栏 - 移动端优化 */}
        <div className={`${isMobile && isLandscape ? 'hidden' : (showControls ? '' : 'h-0 overflow-hidden')} w-full bg-game-card rounded-lg px-2 py-1 sm:px-4 sm:py-2.5 transition-all duration-300`}>
          {/* 移动端控制切换按钮 - 仅在非横屏模式下显示 */}
          {isMobile && !isLandscape && (
            <div className="sm:hidden flex justify-center py-1">
              <button
                onClick={() => setShowControls(!showControls)}
                className="bg-game-accent hover:bg-opacity-80 text-white
                         w-10 h-10 rounded-full flex items-center justify-center
                         transition-all active:scale-95"
                title={showControls ? '隐藏控制' : '显示控制'}
              >
                <span className="text-sm">{showControls ? '⬆️' : '⬇️'}</span>
              </button>
            </div>
          )}

          {/* PC端始终显示控制栏 */}
          {!isMobile && !showControls && (
            <div className="hidden sm:flex justify-center py-2">
              <button
                onClick={() => setShowControls(true)}
                className="bg-game-accent hover:bg-opacity-80 text-white
                         px-4 py-2 rounded-lg text-sm font-medium transition-all"
                title="显示控制"
              >
                🎮 显示游戏控制
              </button>
            </div>
          )}

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
            <div className="flex items-center justify-between mb-1">
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

        {/* 移动端浮动控制按钮 - 横屏时隐藏 */}
        {isMobile && !isLandscape && (
          <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
            {/* 暂停/继续按钮 */}
            <button
              onClick={handlePauseResume}
              className="bg-game-accent hover:bg-opacity-80 text-white
                       w-12 h-12 rounded-full flex items-center justify-center
                       transition-all active:scale-95 shadow-lg"
              title={isPaused ? '继续' : '暂停'}
            >
              <span className="text-lg">{isPaused ? '▶️' : '⏸️'}</span>
            </button>

            {/* 退出按钮 */}
            <button
              onClick={handleExit}
              className="bg-red-600 hover:bg-red-700 text-white
                       w-12 h-12 rounded-full flex items-center justify-center
                       transition-all active:scale-95 shadow-lg"
              title="退出游戏"
            >
              <span className="text-lg">❌</span>
            </button>
          </div>
        )}

        {/* 横屏模式下的游戏画面 - 全屏体验 */}
        {isMobile && isLandscape && (
          <div className="fixed inset-0 z-30 bg-black">
            {/* 横屏模式下的最小控制按钮 */}
            <button
              onClick={handleExit}
              className="fixed top-2 right-2 z-40 bg-red-600 hover:bg-red-700 text-white
                       w-8 h-8 rounded-full flex items-center justify-center
                       transition-all active:scale-95 shadow-lg"
              title="退出游戏"
              style={{
                // 确保按钮在安全区域内
                right: 'env(safe-area-inset-right, 8px)',
                top: 'env(safe-area-inset-top, 8px)'
              }}
            >
              <span className="text-xs">❌</span>
            </button>

            {/* 横屏模式下的暂停按钮 */}
            <button
              onClick={handlePauseResume}
              className="fixed top-2 right-12 z-40 bg-game-accent hover:bg-opacity-80 text-white
                       w-8 h-8 rounded-full flex items-center justify-center
                       transition-all active:scale-95 shadow-lg"
              title={isPaused ? '继续' : '暂停'}
              style={{
                // 确保按钮在安全区域内，并给退出按钮留出空间
                right: 'env(safe-area-inset-right, 52px)',
                top: 'env(safe-area-inset-top, 8px)'
              }}
            >
              <span className="text-xs">{isPaused ? '▶️' : '⏸️'}</span>
            </button>

            <div
              id="phaser-game"
              ref={containerRef}
              className="w-full h-full"
              data-game={gameId}
              style={{
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
            />
          </div>
        )}

        {/* 竖屏模式下的游戏画面 */}
        {(!isMobile || !isLandscape) && (
          <div className={`mt-0 sm:mt-0 ${isMobile ? 'h-[calc(100vh-60px)]' : 'h-screen'}`}>
            <div
              id="phaser-game-landscape-hidden"
              ref={landscapeContainerRef}
              className={`w-full ${isMobile ? 'h-full' : 'h-screen'}`}
              data-game={gameId}
              style={{
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
            />
          </div>
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

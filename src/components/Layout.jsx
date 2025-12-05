import { Outlet, Link, useLocation } from 'react-router-dom';
import useGameStore from '../store/gameStore';

function Layout() {
  const location = useLocation();
  const userData = useGameStore((state) => state.userData);
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      {/* 顶部导航栏 - 自适应版本 */} 
      <header className="bg-game-card shadow-lg sticky top-0 z-50">
        <div className={`container mx-auto px-4 ${isHome ? 'py-2.5' : 'py-2'}`}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className={`${isHome ? 'w-8 h-8' : 'w-7 h-7'} bg-primary-500 rounded flex items-center justify-center`}>
                <span className={isHome ? 'text-xl' : 'text-lg'}>🎮</span>
              </div>
              <div>
                <h1 className={`${isHome ? 'text-lg' : 'text-base'} font-bold leading-tight`}>游戏大厅</h1>
                {isHome && <p className="text-xs text-gray-400 hidden sm:block leading-tight">Phaser Game Hub</p>}
              </div>
            </Link>

            {/* 用户信息 */}
            <div className="flex items-center gap-3">
              {isHome && (
                <div className="hidden lg:flex items-center gap-3 text-xs">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">总分</p>
                    <p className="font-bold text-primary-500">{userData.totalScore}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">游戏次数</p>
                    <p className="font-bold text-primary-500">{userData.gamesPlayed}</p>
                  </div>
                </div>
              )}

              {!isHome && (
                <Link to="/" className="bg-game-accent hover:bg-opacity-80 text-white px-3 py-1.5 rounded text-sm transition-all">
                  返回大厅
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main>
        <Outlet />
      </main>

      {/* 底部 - 自适应版本 */}
      <footer className={`bg-game-card ${isHome ? 'py-3' : 'py-2'}`}>
        <div className="container mx-auto px-4 text-center text-gray-400 text-xs">
          <p>© 2024 Phaser Game Hub · 基于 Phaser 3 和 React 构建 ·
            <a href="https://phaser.io" target="_blank" rel="noopener noreferrer"
               className="hover:text-primary-500 transition-colors ml-1">
              Powered by Phaser
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;

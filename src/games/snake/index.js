import Phaser from 'phaser';
import GameSceneSlim from './scenes/GameSceneSlim';
import config from './config';

/**
 * 贪吃蛇游戏主类
 */
export default class SnakeGame {
  constructor(containerId, onGameOver) {
    this.containerId = containerId;
    this.onGameOver = onGameOver;
    this.game = null;
    this.handleResize = this.handleResize.bind(this);
  }

  start() {
    try {
      // 确保容器存在并已渲染
      const container = document.getElementById(this.containerId);
      if (!container) {
        throw new Error(`容器 #${this.containerId} 不存在`);
      }

      // 检测是否为移动端
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      window.innerWidth < 768;

      // 延迟初始化，确保 React 组件完全渲染
      const initGame = () => {
        // 移动端：直接使用窗口尺寸（全屏）
        // 桌面端：尝试使用容器尺寸
        let width, height;

        if (isMobile) {
          // 移动端强制使用窗口尺寸
          width = Math.max(1, Math.floor(window.innerWidth));
          height = Math.max(1, Math.floor(window.innerHeight));
          console.log(`🎮 移动端：使用窗口尺寸 ${width}×${height}`);
        } else {
          // 桌面端：尝试获取容器尺寸
          const rect = container.getBoundingClientRect();
          width = Math.max(1, Math.floor(rect.width));
          height = Math.max(1, Math.floor(rect.height));

          // 如果容器尺寸太小，使用窗口尺寸
          if (width < 600 || height < 600) {
            const fallbackWidth = Math.max(1, Math.floor(container.offsetWidth));
            const fallbackHeight = Math.max(1, Math.floor(container.offsetHeight));

            if (fallbackWidth > width || fallbackHeight > height) {
              width = fallbackWidth;
              height = fallbackHeight;
            }

            // 还是太小？使用窗口尺寸
            if (width < 600 || height < 600) {
              width = Math.max(1, Math.floor(window.innerWidth));
              height = Math.max(1, Math.floor(window.innerHeight));
              console.log(`🎮 桌面端：容器尺寸过小，使用窗口尺寸`);
            }
          }

          console.log(`🎮 桌面端：使用容器尺寸 ${width}×${height}`);
        }

        // 强制设置容器尺寸以匹配窗口（移动端）
        if (isMobile) {
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.maxWidth = 'none';
          container.style.maxHeight = 'none';

          // 确保父容器也是全屏
          const parent = container.parentElement;
          if (parent) {
            parent.style.width = '100%';
            parent.style.height = '100%';
            parent.style.maxWidth = 'none';
            parent.style.maxHeight = 'none';
          }

          console.log(`🎮 移动端：已强制设置容器和父容器为全屏`);
        }

        console.log(`🎮 游戏最终尺寸: ${width}×${height}`);
        console.log(`🎮 窗口尺寸: ${window.innerWidth}×${window.innerHeight}`);
        console.log(`🎮 容器尺寸: ${container.offsetWidth}×${container.offsetHeight}`);

        const gameConfig = {
          type: Phaser.AUTO,
          parent: this.containerId,
          width: width,
          height: height,
          ...config.gameConfig,
          scene: [new GameSceneSlim(this.onGameOver)],
          backgroundColor: '#1a1a2e'
        };

        // 确保scale配置覆盖
        gameConfig.scale = {
          mode: 'RESIZE',
          autoCenter: 'CENTER_BOTH',
          width: width,
          height: height,
          resizeParent: true,
          expandParent: true
        };

        console.log(`🎮 Phaser配置:`, {
          type: gameConfig.type,
          parent: gameConfig.parent,
          width: gameConfig.width,
          height: gameConfig.height,
          scaleMode: gameConfig.scale.mode
        });

        // 创建游戏实例
        this.game = new Phaser.Game(gameConfig);

        // 强制确保游戏容器和canvas尺寸正确
        this.game.events.on('ready', () => {
          console.log('🎮 Phaser游戏已准备好');
          this.forceResize();
        });
      };

      // 等待 DOM 完全渲染后再初始化
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.log('🎮 容器尺寸为0，等待DOM更新...');
        // 使用requestAnimationFrame等待DOM更新
        requestAnimationFrame(() => {
          requestAnimationFrame(initGame);
        });
      } else {
        initGame();
      }

      // 添加窗口大小变化监听
      window.addEventListener('resize', this.handleResize);
      window.addEventListener('orientationchange', this.handleResize);

    } catch (error) {
      throw error;
    }
  }

  /**
   * 处理窗口大小变化
   */
  /**
   * 强制调整游戏尺寸
   */
  forceResize() {
    if (!this.game) return;

    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn('🎮 强制调整失败：容器不存在');
      return;
    }

    // 检测是否为移动端
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                    window.innerWidth < 768;

    let width, height;

    if (isMobile) {
      // 移动端：直接使用窗口尺寸
      width = Math.max(1, Math.floor(window.innerWidth));
      height = Math.max(1, Math.floor(window.innerHeight));
      console.log(`🎮 forceResize: 移动端使用窗口尺寸 ${width}×${height}`);

      // 强制设置容器尺寸
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.maxWidth = 'none';
      container.style.maxHeight = 'none';

      const parent = container.parentElement;
      if (parent) {
        parent.style.width = '100%';
        parent.style.height = '100%';
        parent.style.maxWidth = 'none';
        parent.style.maxHeight = 'none';
      }
    } else {
      // 桌面端：尝试获取容器尺寸
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));

      // 如果容器尺寸太小，使用 offset 尺寸
      if (width <= 600 || height <= 600) {
        const fallbackWidth = Math.max(1, Math.floor(container.offsetWidth));
        const fallbackHeight = Math.max(1, Math.floor(container.offsetHeight));

        if (fallbackWidth > width || fallbackHeight > height) {
          width = fallbackWidth;
          height = fallbackHeight;
          console.log('🎮 forceResize: 使用offset尺寸作为备选');
        }
      }

      // 如果还是太小，使用窗口尺寸
      if (width <= 600 || height <= 600) {
        const windowWidth = Math.max(1, Math.floor(window.innerWidth));
        const windowHeight = Math.max(1, Math.floor(window.innerHeight));

        if (windowWidth > width || windowHeight > height) {
          width = windowWidth;
          height = windowHeight;
          console.log('🎮 forceResize: 使用窗口尺寸作为最终备选');
        }
      }

      console.log(`🎮 forceResize: 桌面端使用容器尺寸 ${width}×${height}`);
    }

    console.log(`🎮 强制调整尺寸检查:`, {
      container: `${width}×${height}`,
      game: `${this.game.config.width}×${this.game.config.height}`,
      canvas: this.game.canvas ? `${this.game.canvas.width}×${this.game.canvas.height}` : 'N/A',
      window: `${window.innerWidth}×${window.innerHeight}`,
      isMobile: isMobile
    });

    // 强制调整游戏尺寸
    if (this.game.scale) {
      this.game.scale.resize(width, height);
      console.log(`🎮 游戏尺寸已强制调整为: ${width}×${height}`);
    }

    // 强制更新canvas元素样式
    if (this.game.canvas) {
      this.game.canvas.style.width = '100%';
      this.game.canvas.style.height = '100%';
      this.game.canvas.style.display = 'block';
    }
  }

  handleResize() {
    this.forceResize(); // 现在直接调用强制调整方法
  }

  destroy() {
    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);

    if (this.game) {
      // 停止所有场景
      if (this.game.scene) {
        this.game.scene.scenes.forEach(scene => {
          if (scene.scene.isActive()) {
            scene.scene.stop();
          }
        });
      }

      // 销毁游戏实例（removeCanvas: true 会移除 canvas 元素）
      this.game.destroy(true, false);
      this.game = null;
    }
  }

  pause() {
    if (this.game) {
      this.game.scene.pause('GameSceneSlim');
    }
  }

  resume() {
    if (this.game) {
      this.game.scene.resume('GameSceneSlim');
    }
  }
}

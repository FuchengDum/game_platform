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

      // 等待容器渲染完成，并获取实际尺寸
      const initGame = () => {
        // 多种方式获取容器尺寸，优先使用实际可视区域
        let width, height;

        // 方法1：getBoundingClientRect
        const rect = container.getBoundingClientRect();
        width = Math.max(1, Math.floor(rect.width));
        height = Math.max(1, Math.floor(rect.height));

        // 方法2：offsetWidth/Height作为备选
        if (width <= 600 || height <= 600) {
          const fallbackWidth = Math.max(1, Math.floor(container.offsetWidth));
          const fallbackHeight = Math.max(1, Math.floor(container.offsetHeight));

          // 如果getBoundingClientRect返回的值太小，使用offset尺寸
          if (fallbackWidth > width || fallbackHeight > height) {
            width = fallbackWidth;
            height = fallbackHeight;
            console.log('🎮 使用offset尺寸作为备选');
          }
        }

        // 方法3：window尺寸作为最后备选（针对全屏容器）
        if (width <= 600 || height <= 600) {
          const isMobilePortrait = window.innerWidth < window.innerHeight && window.innerWidth < 768;
          if (!isMobilePortrait) {
            // 非移动端竖屏时，尝试使用窗口尺寸
            const windowWidth = Math.max(1, Math.floor(window.innerWidth));
            const windowHeight = Math.max(1, Math.floor(window.innerHeight));

            if (windowWidth > width || windowHeight > height) {
              width = windowWidth;
              height = windowHeight;
              console.log('🎮 使用窗口尺寸作为最终备选');
            }
          }
        }

        console.log(`🎮 游戏容器最终尺寸: ${width}×${height}`);
        console.log(`🎮 容器检查: rect(${rect.width}×${rect.height}), offset(${container.offsetWidth}×${container.offsetHeight}), window(${window.innerWidth}×${window.innerHeight})`);

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
          width: '100%',
          height: '100%',
          resizeParent: true,
          expandParent: true
        };

        console.log(`🎮 Phaser配置:`, gameConfig);

        // 创建游戏实例
        this.game = new Phaser.Game(gameConfig);

        // 强制确保游戏容器和canvas尺寸正确
        this.game.events.on('ready', () => {
          console.log('🎮 Phaser游戏已准备好');
          this.forceResize();
        });
      };

      // 如果容器尺寸为0，等待DOM更新后再初始化
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

    // 使用相同的多种尺寸检测逻辑
    let width, height;

    // 方法1：getBoundingClientRect
    const rect = container.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));

    // 方法2：offsetWidth/Height作为备选
    if (width <= 600 || height <= 600) {
      const fallbackWidth = Math.max(1, Math.floor(container.offsetWidth));
      const fallbackHeight = Math.max(1, Math.floor(container.offsetHeight));

      if (fallbackWidth > width || fallbackHeight > height) {
        width = fallbackWidth;
        height = fallbackHeight;
        console.log('🎮 forceResize: 使用offset尺寸作为备选');
      }
    }

    // 方法3：window尺寸作为最后备选
    if (width <= 600 || height <= 600) {
      const isMobilePortrait = window.innerWidth < window.innerHeight && window.innerWidth < 768;
      if (!isMobilePortrait) {
        const windowWidth = Math.max(1, Math.floor(window.innerWidth));
        const windowHeight = Math.max(1, Math.floor(window.innerHeight));

        if (windowWidth > width || windowHeight > height) {
          width = windowWidth;
          height = windowHeight;
          console.log('🎮 forceResize: 使用窗口尺寸作为最终备选');
        }
      }
    }

    console.log(`🎮 强制调整尺寸检查:`, {
      container: `${width}×${height}`,
      game: `${this.game.config.width}×${this.game.config.height}`,
      canvas: this.game.canvas ? `${this.game.canvas.width}×${this.game.canvas.height}` : 'N/A',
      details: `rect(${rect.width}×${rect.height}), offset(${container.offsetWidth}×${container.offsetHeight}), window(${window.innerWidth}×${window.innerHeight})`
    });

    // 强制调整游戏尺寸，不管是否有显著变化
    if (this.game.scale) {
      this.game.scale.resize(width, height);
      console.log(`🎮 游戏尺寸已强制调整为: ${width}×${height}`);
    }

    // 也强制更新canvas元素样式
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

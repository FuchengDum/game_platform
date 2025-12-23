/**
 * 移动端屏幕优化器
 * 处理横屏检测、界面优化和屏幕适配
 */
export class MobileScreenOptimizer {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isLandscape = window.innerWidth > window.innerHeight;
    this.originalOrientation = this.isLandscape;

    // 优化配置
    this.config = {
      forceLandscape: true,
      preventZoom: true,
      optimizedViewport: true
    };

    // DOM 元素
    this.landscapePrompt = null;
    this.gameContainer = null;

    // 事件监听器
    this.handleResize = this.handleResize.bind(this);
    this.handleOrientationChange = this.handleOrientationChange.bind(this);

    this.init();
  }

  /**
   * 检测是否为移动设备
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth < 768;
  }

  /**
   * 初始化屏幕优化器
   */
  init() {
    if (!this.isMobile) {
      console.log('🖥️ 检测到桌面设备，跳过移动端优化');
      return;
    }

    // 检查是否在游戏页面（贪吃蛇游戏）
    const gameContainer = document.getElementById('phaser-game');
    const isGamePage = document.body.classList.contains('in-game');

    if (!gameContainer || !isGamePage) {
      console.log('🏠 未在贪吃蛇游戏页面，跳过横屏优化', {
        hasGameContainer: !!gameContainer,
        hasInGameClass: isGamePage
      });
      return;
    }

    console.log('📱 移动设备 + 游戏页面，启动屏幕优化...');

    // 创建优化DOM
    this.createLandscapePrompt();
    this.setupViewport();
    this.setupEventListeners();

    // 初始检查屏幕方向
    this.checkOrientation();
  }

  /**
   * 创建横屏提示界面
   */
  createLandscapePrompt() {
    this.landscapePrompt = document.createElement('div');
    this.landscapePrompt.className = 'mobile-landscape-optimization';
    this.landscapePrompt.innerHTML = `
      <div class="rotate-icon">📱</div>
      <h2>请横屏游戏</h2>
      <p>为了更好的游戏体验</p>
      <p>请将设备旋转至横屏模式</p>
      <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;">
        或点击下方按钮继续使用竖屏
      </p>
      <button id="continue-portrait" style="
        margin-top: 1rem;
        padding: 0.8rem 1.5rem;
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 8px;
        color: white;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
      ">继续使用竖屏</button>
    `;

    document.body.appendChild(this.landscapePrompt);

    // 添加按钮事件
    const continueBtn = document.getElementById('continue-portrait');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.config.forceLandscape = false;
        this.hideLandscapePrompt();
      });
    }
  }

  /**
   * 设置视口优化
   */
  setupViewport() {
    if (!this.config.preventZoom) return;

    // 防止移动端缩放
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }

    // 添加CSS样式
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/src/styles/mobile-landscape.css';
    document.head.appendChild(style);

    // 优化所有可能的游戏容器
    const containers = [
      document.getElementById('phaser-game'),
      document.getElementById('phaser-game-landscape-hidden'),
      document.getElementById('game-container')
    ].filter(Boolean);

    containers.forEach(container => {
      container.style.touchAction = 'none';
      container.style.userSelect = 'none';
      container.style.webkitUserSelect = 'none';
      container.style.webkitTouchCallout = 'none';
      container.style.webkitTapHighlightColor = 'transparent';
    });

    // 设置默认容器引用（后续会动态更新）
    this.gameContainer = containers[0] || document.body;
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听屏幕方向变化
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleOrientationChange);

    // 防止默认触摸行为
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // 防止多点触控缩放
      }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (e.scale !== 1) {
        e.preventDefault(); // 防止双指缩放
      }
    }, { passive: false });

    // 监听双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault(); // 防止双击缩放
      }
      lastTouchEnd = now;
    }, { passive: false });
  }

  /**
   * 处理屏幕尺寸变化
   */
  handleResize() {
    const newIsLandscape = window.innerWidth > window.innerHeight;
    if (newIsLandscape !== this.isLandscape) {
      this.isLandscape = newIsLandscape;
      this.checkOrientation();
    }
  }

  /**
   * 处理方向变化
   */
  handleOrientationChange() {
    setTimeout(() => {
      this.handleResize();
    }, 100); // 延迟处理，确保浏览器已经完成方向切换
  }

  /**
   * 检查屏幕方向
   */
  checkOrientation() {
    console.log(`📐 屏幕方向检查: ${this.isLandscape ? '横屏' : '竖屏'}`);

    if (this.config.forceLandscape && !this.isLandscape) {
      this.showLandscapePrompt();
    } else {
      this.hideLandscapePrompt();
    }

    // 调整游戏界面
    this.adjustGameLayout();
  }

  /**
   * 显示横屏提示
   */
  showLandscapePrompt() {
    if (this.landscapePrompt) {
      this.landscapePrompt.classList.add('show');
    }
  }

  /**
   * 隐藏横屏提示
   */
  hideLandscapePrompt() {
    if (this.landscapePrompt) {
      this.landscapePrompt.classList.remove('show');
    }
  }

  /**
   * 调整游戏布局
   */
  adjustGameLayout() {
    // 强制横屏模式：始终使用 phaser-game 容器
    const targetContainerId = 'phaser-game';
    const gameContainer = document.getElementById(targetContainerId);

    if (!gameContainer) {
      console.warn(`⚠️ 目标容器不存在: ${targetContainerId}`);
      return;
    }

    // 更新当前容器引用
    this.gameContainer = gameContainer;

    // 发送自定义事件，通知游戏更新布局
    const event = new CustomEvent('mobileScreenOptimized', {
      detail: {
        isMobile: this.isMobile,
        isLandscape: this.isLandscape,
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    window.dispatchEvent(event);

    console.log(`🎮 游戏布局已优化: ${window.innerWidth}×${window.innerHeight}, 容器: ${targetContainerId}, 模式: 强制横屏`);
  }

  /**
   * 获取当前优化状态
   */
  getOptimizationStatus() {
    return {
      isMobile: this.isMobile,
      isLandscape: this.isLandscape,
      forceLandscape: this.config.forceLandscape,
      preventZoom: this.config.preventZoom,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      aspectRatio: window.innerWidth / window.innerHeight
    };
  }

  /**
   * 销毁优化器
   */
  destroy() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);

    if (this.landscapePrompt && this.landscapePrompt.parentNode) {
      this.landscapePrompt.parentNode.removeChild(this.landscapePrompt);
    }

    console.log('🔧 移动端屏幕优化器已销毁');
  }
}
/**
 * 移动端UI渲染器
 * 提供响应式布局，适配不同屏幕尺寸和方向
 */

import {
  MobileUILayout,
  DeviceOrientation,
  PerformanceMetrics,
  ResponsiveBreakpoints,
  MobileRendererInterface
} from '../types/MobileTypes.js';

export class MobileUIRenderer extends Phaser.GameObjects.Container {
  constructor(scene, hapticFeedback = null) {
    super(scene, 0, 0);
    this.scene = scene;
    this.hapticFeedback = hapticFeedback;

    // 设备信息
    this.orientation = this.detectOrientation();
    this.pixelRatio = window.devicePixelRatio || 1;

    // 响应式断点
    this.breakpoints = {
      small: 600,
      medium: 900,
      large: 1200,
      tablet: 768,
      desktop: 1024
    };

    // 布局配置
    this.layout = this.initializeLayout();
    this.safeArea = this.getSafeArea();

    // UI元素容器
    this.containers = {
      gameBoard: null,
      joystick: null,
      hud: null,
      effects: null,
      menus: null
    };

    // 视觉元素
    this.elements = {
      score: null,
      level: null,
      pauseButton: null,
      joystickBase: null,
      joystickStick: null,
      touchEffects: [],
      directionIndicator: null
    };

    // 性能设置
    this.quality = this.detectOptimalQuality();
    this.animationSettings = this.getAnimationSettings();

    // 初始化
    this.initialize();
  }

  /**
   * 初始化渲染器
   */
  initialize() {
    // 添加到场景
    this.scene.add.existing(this);

    // 创建容器
    this.createContainers();

    // 创建基础UI元素
    this.createBaseElements();

    // 监听方向变化
    this.setupOrientationListener();

    // 设置初始布局
    this.updateLayout(this.orientation);
  }

  /**
   * 检测设备方向
   */
  detectOrientation() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    return {
      type: isLandscape ? 'landscape' : 'portrait',
      isLandscape,
      width,
      height,
      pixelRatio: this.pixelRatio
    };
  }

  /**
   * 获取安全区域（处理刘海屏等）
   */
  getSafeArea() {
    // 获取CSS环境变量中的安全区域
    const safeAreaTop = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--safe-area-inset-top') || '0');
    const safeAreaRight = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--safe-area-inset-right') || '0');
    const safeAreaBottom = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--safe-area-inset-bottom') || '0');
    const safeAreaLeft = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--safe-area-inset-left') || '0');

    return {
      top: safeAreaTop * this.pixelRatio,
      right: safeAreaRight * this.pixelRatio,
      bottom: safeAreaBottom * this.pixelRatio,
      left: safeAreaLeft * this.pixelRatio
    };
  }

  /**
   * 初始化布局配置
   */
  initializeLayout() {
    return {
      gameBoard: {
        x: 0,
        y: 0,
        width: this.orientation.width,
        height: this.orientation.height,
        scale: 1
      },
      joystick: {
        x: 0,
        y: 0,
        width: 160,
        height: 160,
        visible: false
      },
      hud: {
        score: { x: 0, y: 0, visible: true },
        level: { x: 0, y: 0, visible: true },
        pause: { x: 0, y: 0, visible: true }
      },
      safeArea: this.safeArea
    };
  }

  /**
   * 创建容器
   */
  createContainers() {
    // 游戏板容器
    this.containers.gameBoard = this.scene.add.container(0, 0);
    this.containers.gameBoard.setDepth(10);
    this.add(this.containers.gameBoard);

    // 摇杆容器
    this.containers.joystick = this.scene.add.container(0, 0);
    this.containers.joystick.setDepth(1000);
    this.add(this.containers.joystick);
    this.containers.joystick.setVisible(false);

    // HUD容器 - 设置最高深度确保显示在最上层
    this.containers.hud = this.scene.add.container(0, 0);
    this.containers.hud.setDepth(2000);
    this.add(this.containers.hud);

    // 特效容器
    this.containers.effects = this.scene.add.container(0, 0);
    this.containers.effects.setDepth(500);
    this.add(this.containers.effects);

    // 菜单容器
    this.containers.menus = this.scene.add.container(0, 0);
    this.containers.menus.setDepth(3000);
    this.add(this.containers.menus);
    this.containers.menus.setVisible(false);
  }

  /**
   * 创建基础UI元素
   */
  createBaseElements() {
    // 分数显示
    this.elements.score = this.scene.add.text(0, 0, '0', {
      fontSize: this.getResponsiveFontSize(24),
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0);

    // 等级显示
    this.elements.level = this.scene.add.text(0, 0, 'Lv.1', {
      fontSize: this.getResponsiveFontSize(20),
      fontFamily: 'Arial, sans-serif',
      fill: '#fbbf24',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setScrollFactor(0);

    // 暂停按钮
    this.elements.pauseButton = this.scene.add.graphics();
    this.elements.pauseButton.setScrollFactor(0);
    this.drawPauseButton();

    // 方向指示器
    this.elements.directionIndicator = this.scene.add.graphics();
    this.containers.effects.add(this.elements.directionIndicator);

    // 添加到HUD容器
    this.containers.hud.add([this.elements.score, this.elements.level, this.elements.pauseButton]);

    console.log('✅ MobileUIRenderer HUD元素已创建', {
      score: '✓',
      level: '✓',
      pauseButton: '✓',
      hudContainerDepth: this.containers.hud.depth
    });
  }

  /**
   * 绘制暂停按钮
   */
  drawPauseButton() {
    // 检查元素是否存在且场景未被销毁
    if (!this.scene || !this.scene.sys || this.scene.sys.queue === null) {
      console.warn('⚠️ MobileUIRenderer: 场景已销毁，跳过暂停按钮绘制');
      return;
    }

    if (!this.elements.pauseButton) {
      console.warn('⚠️ MobileUIRenderer: pauseButton未初始化，跳过绘制');
      return;
    }

    const button = this.elements.pauseButton;
    const size = this.getResponsiveSize(40);

    try {
      button.clear();

      // 按钮背景
      button.fillStyle(0x333333, 0.8);
      button.fillRoundedRect(-size/2, -size/2, size, size, 8);

      // 暂停图标（两条竖线）
      button.fillStyle(0xffffff, 1);
      const barWidth = size * 0.2;
      const barHeight = size * 0.5;
      const spacing = size * 0.15;

      button.fillRect(-spacing - barWidth/2, -barHeight/2, barWidth, barHeight);
      button.fillRect(spacing - barWidth/2, -barHeight/2, barWidth, barHeight);

      // 设置交互区域
      button.setInteractive(
        new Phaser.Geom.Rectangle(-size/2, -size/2, size, size),
        Phaser.Geom.Rectangle.Contains
      );

      // 添加点击事件
      button.on('pointerdown', () => {
        this.triggerPause();
      });

      // 悬停效果
      button.on('pointerover', () => {
        button.clear();
        button.fillStyle(0x555555, 0.9);
        button.fillRoundedRect(-size/2, -size/2, size, size, 8);

        button.fillStyle(0xffffff, 1);
        button.fillRect(-spacing - barWidth/2, -barHeight/2, barWidth, barHeight);
        button.fillRect(spacing - barWidth/2, -barHeight/2, barWidth, barHeight);
      });

      button.on('pointerout', () => {
        this.drawPauseButton();
      });
    } catch (error) {
      console.error('❌ MobileUIRenderer: 绘制暂停按钮失败', error);
    }
  }

  /**
   * 设置方向变化监听器
   */
  setupOrientationListener() {
    // 保存监听器引用，以便在销毁时正确移除
    this.orientationListener = () => {
      const newOrientation = this.detectOrientation();
      if (newOrientation.type !== this.orientation.type ||
          newOrientation.width !== this.orientation.width ||
          newOrientation.height !== this.orientation.height) {
        this.orientation = newOrientation;
        this.safeArea = this.getSafeArea();
        this.updateLayout(newOrientation);
      }
    };

    window.addEventListener('resize', this.orientationListener);
  }

  /**
   * 更新布局
   */
  updateLayout(orientation) {
    // 检查场景是否已被销毁
    if (!this.scene || !this.scene.sys || this.scene.sys.queue === null) {
      console.warn('⚠️ MobileUIRenderer: 场景已销毁，跳过布局更新');
      return;
    }

    try {
      this.layout = this.calculateLayout(orientation);

      // 更新容器位置和大小
      this.updateContainers();

      // 更新UI元素位置
      this.updateUIElements();

      // 调整字体大小
      this.adjustFontSizes();

      // 调整按钮大小
      this.adjustButtonSizes();
    } catch (error) {
      console.error('❌ MobileUIRenderer: 更新布局失败', error);
    }
  }

  /**
   * 计算布局
   */
  calculateLayout(orientation) {
    const { width, height, isLandscape } = orientation;
    const { safeArea } = this;

    console.log('📐 MobileUIRenderer计算布局:', {
      orientation: { width, height, isLandscape },
      safeArea,
      sceneSize: this.scene ? `${this.scene.cameras.main.width}×${this.scene.cameras.main.height}` : 'N/A'
    });

    const layout = { ...this.layout };

    // 游戏板布局
    if (isLandscape) {
      // 横屏模式
      const gameBoardHeight = height - safeArea.top - safeArea.bottom;
      const gameBoardWidth = gameBoardHeight; // 保持正方形
      const gameBoardX = (width - gameBoardWidth) / 2;
      const gameBoardY = safeArea.top;

      layout.gameBoard = {
        x: gameBoardX,
        y: gameBoardY,
        width: gameBoardWidth,
        height: gameBoardHeight,
        scale: Math.min(gameBoardWidth / 600, gameBoardHeight / 600) // 基准600x600
      };

      // 摇杆位置（左下角）- 使用160边距匹配摇杆实际位置
      layout.joystick = {
        x: 160,  // 固定左边距
        y: height - 160,  // 固定底边距
        width: 160,
        height: 160,
        visible: true
      };

      // HUD位置 - 简化并使用固定边距
      layout.hud.score = {
        x: width - 80,   // 距离右边80
        y: 30,           // 距离顶部30
        visible: true
      };

      layout.hud.level = {
        x: width - 80,   // 距离右边80
        y: 70,           // 距离顶部70（score下方40px）
        visible: true
      };

      layout.hud.pause = {
        x: width - 30,   // 距离右边30
        y: 30,           // 距离顶部30
        visible: true
      };

      console.log('✅ 横屏HUD位置计算完成:', {
        score: layout.hud.score,
        level: layout.hud.level,
        pause: layout.hud.pause
      });

    } else {
      // 竖屏模式
      const gameBoardWidth = width - safeArea.left - safeArea.right;
      const gameBoardHeight = gameBoardWidth; // 保持正方形
      const gameBoardX = safeArea.left;
      const gameBoardY = safeArea.top + 80; // 留出HUD空间

      layout.gameBoard = {
        x: gameBoardX,
        y: gameBoardY,
        width: gameBoardWidth,
        height: gameBoardHeight,
        scale: Math.min(gameBoardWidth / 600, gameBoardHeight / 600)
      };

      // 摇杆位置（底部中央）
      layout.joystick = {
        x: width / 2,
        y: height - safeArea.bottom - 120,
        width: 160,
        height: 160,
        visible: true
      };

      // HUD位置
      layout.hud.score = {
        x: safeArea.left + 80,
        y: safeArea.top + 30,
        visible: true
      };

      layout.hud.level = {
        x: width - safeArea.right - 80,
        y: safeArea.top + 30,
        visible: true
      };

      layout.hud.pause = {
        x: width / 2,
        y: safeArea.top + 30,
        visible: true
      };
    }

    layout.safeArea = safeArea;
    return layout;
  }

  /**
   * 更新容器
   */
  updateContainers() {
    const { gameBoard, joystick } = this.layout;

    // 更新游戏板容器
    this.containers.gameBoard.setPosition(gameBoard.x, gameBoard.y);

    // 更新摇杆容器
    this.containers.joystick.setPosition(joystick.x, joystick.y);
    this.containers.joystick.setVisible(joystick.visible);
  }

  /**
   * 更新UI元素位置
   */
  updateUIElements() {
    const { hud } = this.layout;

    // 更新分数
    this.elements.score.setPosition(hud.score.x, hud.score.y);
    this.elements.score.setVisible(hud.score.visible);

    // 更新等级
    this.elements.level.setPosition(hud.level.x, hud.level.y);
    this.elements.level.setVisible(hud.level.visible);

    // 更新暂停按钮
    this.elements.pauseButton.setPosition(hud.pause.x, hud.pause.y);
    this.elements.pauseButton.setVisible(hud.pause.visible);

    console.log('📱 MobileUIRenderer HUD位置更新:', {
      sceneSize: `${this.orientation.width}×${this.orientation.height}`,
      score: { x: hud.score.x, y: hud.score.y, visible: hud.score.visible },
      level: { x: hud.level.x, y: hud.level.y, visible: hud.level.visible },
      pause: { x: hud.pause.x, y: hud.pause.y, visible: hud.pause.visible }
    });
  }

  /**
   * 调整字体大小
   */
  adjustFontSizes() {
    // 检查元素是否存在且场景未被销毁
    if (!this.scene || !this.scene.sys || this.scene.sys.queue === null) {
      console.warn('⚠️ MobileUIRenderer: 场景已销毁，跳过字体大小调整');
      return;
    }

    if (!this.elements.score || !this.elements.level) {
      console.warn('⚠️ MobileUIRenderer: UI元素未初始化，跳过字体大小调整');
      return;
    }

    const scaleFactor = this.layout.gameBoard.scale;

    try {
      this.elements.score.setFontSize(this.getResponsiveFontSize(24 * scaleFactor));
      this.elements.level.setFontSize(this.getResponsiveFontSize(20 * scaleFactor));
    } catch (error) {
      console.error('❌ MobileUIRenderer: 调整字体大小失败', error);
    }
  }

  /**
   * 调整按钮大小
   */
  adjustButtonSizes() {
    this.drawPauseButton(); // 重新绘制暂停按钮
  }

  /**
   * 获取响应式字体大小
   */
  getResponsiveFontSize(baseSize) {
    const scaleFactor = Math.min(this.orientation.width, this.orientation.height) / 600;
    return Math.max(12, Math.round(baseSize * scaleFactor));
  }

  /**
   * 获取响应式尺寸
   */
  getResponsiveSize(baseSize) {
    const scaleFactor = Math.min(this.orientation.width, this.orientation.height) / 600;
    return Math.max(20, Math.round(baseSize * scaleFactor));
  }

  /**
   * 检测最优质量设置
   */
  detectOptimalQuality() {
    const { width, height } = this.orientation;
    const pixelCount = width * height * this.pixelRatio * this.pixelRatio;

    if (pixelCount > 1920 * 1080) {
      return 'low'; // 高分辨率屏幕
    } else if (pixelCount > 1280 * 720) {
      return 'medium'; // 中等分辨率屏幕
    } else {
      return 'high'; // 低分辨率屏幕
    }
  }

  /**
   * 获取动画设置
   */
  getAnimationSettings() {
    const settings = {
      high: { enabled: true, particleCount: 10, frameRate: 60 },
      medium: { enabled: true, particleCount: 5, frameRate: 30 },
      low: { enabled: false, particleCount: 2, frameRate: 15 }
    };

    return settings[this.quality] || settings.medium;
  }

  /**
   * 渲染摇杆
   */
  renderJoystick(joystickData) {
    if (!joystickData || !this.containers.joystick.visible) return;

    const { baseRadius, stickRadius } = this.layout.joystick;

    // 清除旧的摇杆图形
    this.containers.joystick.removeAll(true);

    // 绘制底座
    const base = this.scene.add.graphics();
    base.lineStyle(3, 0x666666, 0.5);
    base.strokeCircle(0, 0, baseRadius);
    base.fillStyle(0x333333, 0.3);
    base.fillCircle(0, 0, baseRadius);

    // 绘制活动范围指示
    base.lineStyle(1, 0x999999, 0.3);
    base.strokeCircle(0, 0, baseRadius * 1.2);

    this.containers.joystick.add(base);

    // 绘制手柄
    if (joystickData.isActive) {
      const stick = this.scene.add.graphics();
      const stickX = joystickData.stickX - joystickData.baseX;
      const stickY = joystickData.stickY - joystickData.baseY;

      // 外圈发光效果
      stick.lineStyle(2, 0x00ff00, 0.3);
      stick.strokeCircle(stickX, stickY, stickRadius + 5);

      // 主手柄
      stick.fillStyle(0x00ff00, 0.8);
      stick.fillCircle(stickX, stickY, stickRadius);

      // 压力感应效果
      if (joystickData.pressure > 0.5) {
        const pressureRadius = stickRadius * (0.5 + joystickData.pressure * 0.5);
        stick.lineStyle(2, 0x00ff00, joystickData.pressure * 0.8);
        stick.strokeCircle(stickX, stickY, pressureRadius);
      }

      this.containers.joystick.add(stick);
    }

    // 方向指示器
    if (joystickData.isActive && joystickData.direction.magnitude > 0.1) {
      this.drawDirectionIndicator(joystickData.direction);
    }
  }

  /**
   * 绘制方向指示器
   */
  drawDirectionIndicator(direction) {
    const indicator = this.elements.directionIndicator;
    indicator.clear();

    if (!direction || direction.magnitude < 0.1) return;

    const length = 30 * direction.magnitude;
    const endX = Math.cos(direction.angle) * length;
    const endY = Math.sin(direction.angle) * length;

    // 方向线
    indicator.lineStyle(3, 0x00ff00, 0.6);
    indicator.beginPath();
    indicator.moveTo(0, 0);
    indicator.lineTo(endX, endY);
    indicator.strokePath();

    // 箭头
    const arrowSize = 10;
    const arrowAngle = 0.5;

    indicator.lineStyle(2, 0x00ff00, 0.8);
    indicator.beginPath();
    indicator.moveTo(endX, endY);
    indicator.lineTo(
      endX - arrowSize * Math.cos(direction.angle - arrowAngle),
      endY - arrowSize * Math.sin(direction.angle - arrowAngle)
    );
    indicator.moveTo(endX, endY);
    indicator.lineTo(
      endX - arrowSize * Math.cos(direction.angle + arrowAngle),
      endY - arrowSize * Math.sin(direction.angle + arrowAngle)
    );
    indicator.strokePath();
  }

  /**
   * 显示触摸效果
   */
  showTouchEffect(x, y, type = 'press') {
    if (!this.animationSettings.enabled) return;

    const effect = this.scene.add.graphics();

    if (type === 'press') {
      // 按下效果
      effect.fillStyle(0xffffff, 0.4);
      effect.fillCircle(x, y, 20);

      // 添加收缩动画
      this.scene.tweens.add({
        targets: effect,
        scaleX: 0.5,
        scaleY: 0.5,
        alpha: 0,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          effect.destroy();
        }
      });
    } else {
      // 释放效果
      effect.lineStyle(3, 0xffffff, 0.6);
      effect.strokeCircle(x, y, 15);

      // 添加扩散动画
      this.scene.tweens.add({
        targets: effect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          effect.destroy();
        }
      });
    }

    this.containers.effects.add(effect);
  }

  /**
   * 显示方向指示
   */
  showDirectionIndicator(angle) {
    const indicator = this.scene.add.graphics();
    const length = 40;
    const endX = Math.cos(angle) * length;
    const endY = Math.sin(angle) * length;

    indicator.lineStyle(4, 0x00ff00, 0.8);
    indicator.beginPath();
    indicator.moveTo(0, 0);
    indicator.lineTo(endX, endY);
    indicator.strokePath();

    // 添加渐隐动画
    this.scene.tweens.add({
      targets: indicator,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        indicator.destroy();
      }
    });

    this.containers.effects.add(indicator);
  }

  /**
   * 调整渲染质量
   */
  adjustQuality(metrics) {
    if (!metrics) return;

    // 根据FPS自动调整质量
    if (metrics.fps < 30 && this.quality !== 'low') {
      this.quality = 'low';
      this.animationSettings = this.getAnimationSettings();
      this.applyQualitySettings();
    } else if (metrics.fps > 50 && this.quality !== 'high') {
      this.quality = 'high';
      this.animationSettings = this.getAnimationSettings();
      this.applyQualitySettings();
    }
  }

  /**
   * 应用质量设置
   */
  applyQualitySettings() {
    // 调整特效可见性
    this.containers.effects.setVisible(this.animationSettings.enabled);

    // 调整粒子数量等
    // 这里可以根据quality调整其他渲染参数
  }

  /**
   * 获取布局信息
   */
  getLayout() {
    return { ...this.layout };
  }

  /**
   * 更新分数显示
   */
  updateScore(score) {
    if (!this.elements.score) {
      console.warn('⚠️ MobileUIRenderer: score元素不存在');
      return;
    }
    this.elements.score.setText(score.toString());
  }

  /**
   * 更新等级显示
   */
  updateLevel(level) {
    if (!this.elements.level) {
      console.warn('⚠️ MobileUIRenderer: level元素不存在');
      return;
    }
    this.elements.level.setText(`Lv.${level}`);
  }

  /**
   * 触发暂停
   */
  triggerPause() {
    // 触觉反馈
    if (this.hapticFeedback) {
      this.hapticFeedback.trigger('buttonPress');
    }

    // 触发暂停事件（由场景处理）
    this.scene.events.emit('ui:pause');
  }

  /**
   * 显示菜单
   */
  showMenu() {
    this.containers.menus.setVisible(true);
  }

  /**
   * 隐藏菜单
   */
  hideMenu() {
    this.containers.menus.setVisible(false);
  }

  /**
   * 获取设备类型
   */
  getDeviceType() {
    const width = this.orientation.width;
    if (width < this.breakpoints.tablet) {
      return 'mobile';
    } else if (width < this.breakpoints.desktop) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * 销毁渲染器
   */
  destroy() {
    // 移除事件监听器（使用保存的引用）
    if (this.orientationListener) {
      window.removeEventListener('resize', this.orientationListener);
      this.orientationListener = null;
    }

    // 销毁所有元素（添加存在性检查）
    if (this.containers.gameBoard) {
      this.containers.gameBoard.destroy(true);
    }
    if (this.containers.joystick) {
      this.containers.joystick.destroy(true);
    }
    if (this.containers.hud) {
      this.containers.hud.destroy(true);
    }
    if (this.containers.effects) {
      this.containers.effects.destroy(true);
    }
    if (this.containers.menus) {
      this.containers.menus.destroy(true);
    }

    super.destroy();
  }
}

export default MobileUIRenderer;
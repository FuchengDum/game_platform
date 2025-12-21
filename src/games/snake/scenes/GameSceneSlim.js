import Phaser from 'phaser';
import { SnakeController } from '../controllers/SnakeController.js';
import { GameRenderer } from '../renderers/GameRenderer.js';
import { GameLogic } from '../logics/GameLogic.js';

// 移动端组件
import MobileJoystickController from '../mobile/controllers/MobileJoystickController.js';
import MobileInputHandler from '../mobile/handlers/MobileInputHandler.js';
import MobileUIRenderer from '../mobile/renderers/MobileUIRenderer.js';
import HapticFeedback from '../mobile/systems/HapticFeedback.js';
import MobilePerformanceManager from '../mobile/managers/MobilePerformanceManager.js';

/**
 * 精简版贪吃蛇游戏场景
 * 使用模块化架构，大幅减少文件大小
 * 集成移动端优化组件
 */
export default class GameSceneSlim extends Phaser.Scene {
  constructor(onGameOver) {
    super('GameSceneSlim');
    this.onGameOver = onGameOver;

    // 游戏模块
    this.snakeController = null;
    this.gameRenderer = null;
    this.gameLogic = null;

    // 游戏状态
    this.food = null;
    this.cursors = null;

    // 动画状态
    this.eyeBlinkTime = 0;
    this.isBlinking = false;

    // 移动端组件
    this.mobileJoystick = null;
    this.mobileInputHandler = null;
    this.mobileUIRenderer = null;
    this.hapticFeedback = null;
    this.performanceManager = null;

    // 移动端状态
    this.isMobileDevice = this.detectMobileDevice();
    this.isMobileMode = false;
    this.is360Mode = false;

    // 传统触摸控制（备用）
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isSwipe = false;
    this.swipeThreshold = 12;
    this.touchDebounce = 50;
    this.lastTouchTime = 0;
    this.minSwipeVelocity = 0.3;
    this.maxTouchDuration = 500;
  }

  /**
   * 预加载资源
   */
  preload() {
    // 由于使用矢量图形，无需预加载图片资源
  }

  /**
   * 创建游戏
   */
  create() {
    // 初始化游戏模块
    this.gameRenderer = new GameRenderer(this);
    const gridConfig = this.gameRenderer.getGridConfig();
    this.snakeController = new SnakeController(gridConfig);
    this.gameLogic = new GameLogic();

    // 初始化各个模块
    this.snakeController.init();
    this.gameLogic.init();
    this.gameRenderer.init();

    // 初始化移动端组件（如果是移动设备）
    if (this.isMobileDevice) {
      this.initializeMobileComponents();
      this.isMobileMode = true;
    }

    // 生成第一个食物
    this.food = this.gameLogic.generateRandomFood(this.snakeController.getSnake(), gridConfig.gridCount);

    // 设置控制
    this.setupKeyboardControls();
    if (this.isMobileMode) {
      this.setupMobileControls();
    } else {
      this.setupTouchControls();
    }

    // 初始化游戏状态
    this.eyeBlinkTime = 0;
    this.snakeController.moveTime = 2000; // 2秒后开始移动

    // 初始渲染游戏画面
    this.render();
  }

  /**
   * 设置键盘控制
   */
  setupKeyboardControls() {
    this.cursors = this.input.keyboard.createCursorKeys();

    // 方向键控制
    this.input.keyboard.on('keydown-UP', () => {
      this.snakeController.setDirection('UP');
    });

    this.input.keyboard.on('keydown-DOWN', () => {
      this.snakeController.setDirection('DOWN');
    });

    this.input.keyboard.on('keydown-LEFT', () => {
      this.snakeController.setDirection('LEFT');
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      this.snakeController.setDirection('RIGHT');
    });

    // 暂停控制
    this.input.keyboard.on('keydown-SPACE', () => {
      this.gameLogic.togglePause();
    });
  }

  /**
   * 设置触摸控制 - 高性能版本
   */
  setupTouchControls() {
    // 触摸状态
    this.resetTouchState();

    // 触摸开始
    this.input.on('pointerdown', (pointer) => {
      this.touchStartTime = Date.now();
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
      this.lastX = pointer.x;
      this.lastY = pointer.y;
      this.isSwipe = false;
      this.totalDistance = 0;
    });

    // 触摸移动 - 实时滑动检测
    this.input.on('pointermove', (pointer) => {
      if (this.touchStartTime === 0) return;

      const deltaX = pointer.x - this.lastX;
      const deltaY = pointer.y - this.lastY;
      const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      this.lastX = pointer.x;
      this.lastY = pointer.y;
      this.totalDistance += moveDistance;

      // 如果移动距离足够，实时处理滑动方向
      if (this.totalDistance > this.swipeThreshold && !this.isSwipe) {
        this.isSwipe = true;
        this.processRealTimeSwipe(pointer.x - this.touchStartX, pointer.y - this.touchStartY);
      }
    });

    // 触摸结束
    this.input.on('pointerup', (pointer) => {
      const now = Date.now();
      const touchDuration = now - this.touchStartTime;

      // 节流控制 - 更短的节流时间
      if (now - this.lastTouchTime < this.touchDebounce) {
        this.resetTouchState();
        return;
      }
      this.lastTouchTime = now;

      // 计算最终滑动数据
      const finalDeltaX = pointer.x - this.touchStartX;
      const finalDeltaY = pointer.y - this.touchStartY;
      const finalDistance = Math.sqrt(finalDeltaX * finalDeltaX + finalDeltaY * finalDeltaY);

      // 计算滑动速度
      const velocity = finalDistance / Math.max(touchDuration, 1);

      // 判断操作类型
      if (this.isSwipe || (finalDistance > this.swipeThreshold && velocity > this.minSwipeVelocity)) {
        // 处理滑动 - 优先使用已经处理过的结果
        if (!this.isSwipe) {
          this.processRealTimeSwipe(finalDeltaX, finalDeltaY);
        }
      } else {
        // 处理点击
        this.handleTouch(pointer.x, pointer.y);
      }

      this.resetTouchState();
    });
  }

  /**
   * 重置触摸状态
   */
  resetTouchState() {
    this.touchStartTime = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.isSwipe = false;
    this.totalDistance = 0;
  }

  /**
   * 处理点击事件
   */
  handleTouch(x, y) {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;

    // 添加触觉反馈（如果支持）
    if (this.hapticFeedback) {
      this.hapticFeedback.trigger('light');
    }

    // 创建点击效果反馈
    this.createTouchEffect(x, y);

    // 根据点击位置设置方向
    if (Math.abs(dx) > Math.abs(dy)) {
      // 水平方向
      if (dx > 0) {
        this.snakeController.setDirection('RIGHT');
      } else {
        this.snakeController.setDirection('LEFT');
      }
    } else {
      // 垂直方向
      if (dy > 0) {
        this.snakeController.setDirection('DOWN');
      } else {
        this.snakeController.setDirection('UP');
      }
    }
  }

  /**
   * 创建点击效果反馈
   */
  createTouchEffect(x, y) {
    // 创建临时圆形反馈效果
    const effect = this.add.graphics();
    effect.fillStyle(0xffffff, 0.3);
    effect.fillCircle(x, y, 15);

    // 添加渐隐动画
    this.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        effect.destroy();
      }
    });
  }

  /**
   * 实时处理滑动方向
   */
  processRealTimeSwipe(deltaX, deltaY) {
    // 添加触觉反馈
    if (this.hapticFeedback) {
      this.hapticFeedback.trigger('move');
    }

    // 创建滑动效果
    this.createSwipeEffect(this.touchStartX + deltaX/2, this.touchStartY + deltaY/2, deltaX, deltaY);

    // 判断主要滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动为主
      if (deltaX > 0) {
        this.snakeController.setDirection('RIGHT');
      } else {
        this.snakeController.setDirection('LEFT');
      }
    } else {
      // 垂直滑动为主
      if (deltaY > 0) {
        this.snakeController.setDirection('DOWN');
      } else {
        this.snakeController.setDirection('UP');
      }
    }
  }

  /**
   * 创建滑动效果反馈
   */
  createSwipeEffect(x, y, deltaX, deltaY) {
    // 计算滑动角度
    const angle = Math.atan2(deltaY, deltaX);

    // 创建滑动轨迹效果
    const effect = this.add.graphics();
    effect.lineStyle(3, 0xffffff, 0.4);
    effect.beginPath();
    effect.moveTo(x - deltaX/4, y - deltaY/4);
    effect.lineTo(x + deltaX/4, y + deltaY/4);
    effect.strokePath();

    // 创建箭头指示方向
    const arrowLength = 15;
    const arrowAngle = 0.5;
    const endX = x + deltaX/4;
    const endY = y + deltaY/4;

    effect.lineStyle(2, 0xffffff, 0.6);
    effect.beginPath();
    effect.moveTo(endX, endY);
    effect.lineTo(
      endX - arrowLength * Math.cos(angle - arrowAngle),
      endY - arrowLength * Math.sin(angle - arrowAngle)
    );
    effect.moveTo(endX, endY);
    effect.lineTo(
      endX - arrowLength * Math.cos(angle + arrowAngle),
      endY - arrowLength * Math.sin(angle + arrowAngle)
    );
    effect.strokePath();

    // 渐隐动画
    this.tweens.add({
      targets: effect,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        effect.destroy();
      }
    });
  }

  /**
   * 处理滑动操作 - 保留兼容性
   */
  handleSwipe(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 只有当滑动距离足够时才处理
    if (distance < this.swipeThreshold) {
      return;
    }

    this.processRealTimeSwipe(deltaX, deltaY);
  }

  /**
   * 更新游戏状态
   */
  update(time, delta) {
    const gameState = this.gameLogic.getGameState();

    if (gameState.isPaused || gameState.isGameOver) {
      return;
    }

    // 更新眨眼动画
    this.updateBlinking(delta);

    // 蛇的移动逻辑
    let needsRender = false;
    if (time >= this.snakeController.moveTime) {
      this.moveSnake();
      this.snakeController.moveTime = time + this.snakeController.moveDelay;
      needsRender = true;
    }

    // 只在需要时渲染
    if (needsRender || this.isBlinking) {
      this.render();
    }
  }

  /**
   * 更新眨眼动画
   */
  updateBlinking(delta) {
    this.eyeBlinkTime += delta;

    // 随机眨眼
    if (!this.isBlinking && Math.random() < 0.002) {
      this.isBlinking = true;
      this.eyeBlinkTime = 0;
    }

    // 眨眼结束
    if (this.isBlinking && this.eyeBlinkTime > 150) {
      this.isBlinking = false;
    }
  }

  /**
   * 移动蛇
   */
  moveSnake() {
    let shouldGrow = false;

    if (this.is360Mode) {
      // 360度模式：获取下一个头部位置进行碰撞检查
      const nextHead = this.snakeController.getNextHeadPosition();

      if (!nextHead) return;

      // 预检查碰撞
      if (this.snakeController.checkCollisionAt(nextHead)) {
        this.handleGameOver();

        // 游戏结束触觉反馈
        if (this.hapticFeedback) {
          this.hapticFeedback.trigger('gameOver');
        }
        return;
      }

      // 如果没有碰撞，执行360度移动
      const head = this.snakeController.move360();
      if (!head) return;

      // 检查是否吃到食物
      if (this.gameLogic.checkFoodCollision(head, this.food)) {
        shouldGrow = true;
        this.snakeController.eatFood();

        // 吃食物触觉反馈
        if (this.hapticFeedback) {
          this.hapticFeedback.trigger('eat');
        }

        const gridConfig = this.snakeController.getGridSize();
        this.food = this.gameLogic.generateRandomFood(this.snakeController.getSnake(), gridConfig.gridCount);
      }

      // 如果没有吃到食物，移除蛇尾
      if (!shouldGrow) {
        this.snakeController.removeTail();
      }

      // 移动触觉反馈（仅在有实际移动时）
      if (this.hapticFeedback && this.snakeController.isMoving()) {
        this.hapticFeedback.trigger('move');
      }

    } else {
      // 传统模式：获取下一个头部位置（不移动蛇）
      const nextHead = this.snakeController.getNextHeadPosition();

      if (!nextHead) return;

      // 预检查碰撞
      if (this.snakeController.checkCollisionAt(nextHead)) {
        this.handleGameOver();

        // 游戏结束触觉反馈
        if (this.hapticFeedback) {
          this.hapticFeedback.trigger('gameOver');
        }
        return;
      }

      // 如果没有碰撞，执行移动
      const head = this.snakeController.move();
      if (!head) return;

      // 检查是否吃到食物
      if (this.gameLogic.checkFoodCollision(head, this.food)) {
        shouldGrow = true;
        this.snakeController.eatFood();

        // 吃食物触觉反馈
        if (this.hapticFeedback) {
          this.hapticFeedback.trigger('eat');
        }

        const gridConfig = this.snakeController.getGridSize();
        this.food = this.gameLogic.generateRandomFood(this.snakeController.getSnake(), gridConfig.gridCount);
      }

      // 如果没有吃到食物，移除蛇尾
      if (!shouldGrow) {
        this.snakeController.removeTail();
      }
    }
  }

  /**
   * 渲染游戏画面
   */
  render() {
    const snake = this.snakeController.getSnake();

    // 只在游戏未结束时渲染
    if (!this.gameLogic.getGameState().isGameOver) {
      // 获取游戏统计信息和状态
      const gameStats = this.gameLogic.getGameStats(this.snakeController);
      const gameState = this.gameLogic.getGameState();

      this.gameRenderer.render(snake, this.food, this.isBlinking, gameStats, gameState);
    }
  }

  /**
   * 处理游戏结束
   */
  handleGameOver() {
    const result = this.gameLogic.handleGameOver();

    if (this.onGameOver) {
      this.onGameOver(result.score);
    }
  }

  /**
   * 获取游戏统计信息
   */
  getStats() {
    return this.gameLogic.getGameStats(this.snakeController);
  }

  /**
   * 检测移动设备
   */
  detectMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // 标准移动设备检测
    const isStandardMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    // 触摸支持检测
    const hasTouchSupport = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;

    // Chrome DevTools移动端模拟器检测
    const isDevToolsMobile = userAgent.includes('Mobile') ||
                              userAgent.includes('Android') ||
                              hasTouchSupport ||
                              window.innerWidth <= 768; // 小屏幕设备

    // 调试信息
    console.log('📱 Device Detection Debug:');
    console.log('  - User Agent:', userAgent);
    console.log('  - Standard Mobile:', isStandardMobile);
    console.log('  - Touch Support:', hasTouchSupport);
    console.log('  - DevTools Mobile:', isDevToolsMobile);
    console.log('  - Screen Width:', window.innerWidth);

    return isStandardMobile || isDevToolsMobile;
  }

  /**
   * 初始化移动端组件
   */
  initializeMobileComponents() {
    try {
      // 初始化触觉反馈
      this.hapticFeedback = new HapticFeedback(HapticFeedback.createGamingConfig());

      // 初始化性能管理器
      this.performanceManager = new MobilePerformanceManager(this, {
        adaptiveQuality: true,
        batterySaving: true
      });

      // 初始化移动端UI渲染器
      this.mobileUIRenderer = new MobileUIRenderer(this, this.hapticFeedback);
      this.add.existing(this.mobileUIRenderer);

      // 初始化输入处理器
      this.mobileInputHandler = new MobileInputHandler({
        filtering: { noiseThreshold: 3 },
        gesture: { swipeMinDistance: 25 }
      });

      // 初始化虚拟摇杆
      this.mobileJoystick = new MobileJoystickController(this, {
        baseX: 100,
        baseY: -100,
        baseRadius: 50,
        maxDistance: 70
      }, this.hapticFeedback);

      // 启用360度移动模式
      this.snakeController.enable360Mode(true);
      this.is360Mode = true;

      // 设置移动端组件事件回调
      this.setupMobileEventCallbacks();

      console.log('Mobile components initialized successfully');
    } catch (error) {
      console.error('Failed to initialize mobile components:', error);
      this.isMobileMode = false;
    }
  }

  /**
   * 设置移动端控制
   */
  setupMobileControls() {
    // 设置原始触摸事件监听
    this.input.on('pointerdown', (pointer) => {
      this.handleMobileTouchStart(pointer);
    });

    this.input.on('pointermove', (pointer) => {
      this.handleMobileTouchMove(pointer);
    });

    this.input.on('pointerup', (pointer) => {
      this.handleMobileTouchEnd(pointer);
    });

    // 设置UI事件监听
    this.events.on('ui:pause', () => {
      this.gameLogic.togglePause();
    });
  }

  /**
   * 设置移动端事件回调
   */
  setupMobileEventCallbacks() {
    // 摇杆事件
    if (this.mobileJoystick) {
      this.mobileJoystick.onMove((joystickData) => {
        this.handleJoystickMove(joystickData);
      });

      this.mobileJoystick.onActivate(() => {
        if (this.hapticFeedback) {
          this.hapticFeedback.trigger('light');
        }
      });
    }

    // 输入处理器事件
    if (this.mobileInputHandler) {
      this.mobileInputHandler.setDirectionChangeCallback((direction) => {
        this.handleDirectionChange(direction);
      });

      this.mobileInputHandler.setGestureDetectedCallback((gesture) => {
        this.handleGesture(gesture);
      });
    }

    // 性能管理器事件
    if (this.performanceManager) {
      this.performanceManager.onPerformanceWarning((warning) => {
        console.warn('Performance warning:', warning);
      });

      this.performanceManager.onQualityChange((change) => {
        console.log('Quality changed:', change);
        this.adjustMobileQuality(change);
      });
    }
  }

  /**
   * 处理移动端触摸开始
   */
  handleMobileTouchStart(pointer) {
    const touchEvent = {
      type: 'pointerdown',
      clientX: pointer.x,
      clientY: pointer.y,
      pointerId: pointer.id,
      pressure: pointer.pressure || 0.5
    };

    // 尝试处理摇杆输入
    if (this.mobileJoystick && this.mobileJoystick.handleTouchStart({
      x: pointer.x,
      y: pointer.y,
      identifier: pointer.id,
      pressure: pointer.pressure || 0.5,
      timestamp: Date.now()
    })) {
      return; // 摇杆处理了此触摸
    }

    // 通过输入处理器处理
    if (this.mobileInputHandler) {
      this.mobileInputHandler.processTouchEvent(touchEvent);
    }

    // 触觉反馈
    if (this.hapticFeedback) {
      this.hapticFeedback.trigger('light');
    }
  }

  /**
   * 处理移动端触摸移动
   */
  handleMobileTouchMove(pointer) {
    // 摇杆处理
    if (this.mobileJoystick && this.mobileJoystick.isActive()) {
      this.mobileJoystick.handleTouchMove({
        x: pointer.x,
        y: pointer.y,
        identifier: pointer.id,
        pressure: pointer.pressure || 0.5,
        timestamp: Date.now()
      });
      return;
    }

    // 输入处理器处理
    if (this.mobileInputHandler) {
      const touchEvent = {
        type: 'pointermove',
        clientX: pointer.x,
        clientY: pointer.y,
        pointerId: pointer.id,
        pressure: pointer.pressure || 0.5
      };
      this.mobileInputHandler.processTouchEvent(touchEvent);
    }
  }

  /**
   * 处理移动端触摸结束
   */
  handleMobileTouchEnd(pointer) {
    // 摇杆处理
    if (this.mobileJoystick && this.mobileJoystick.isActive()) {
      this.mobileJoystick.handleTouchEnd({
        x: pointer.x,
        y: pointer.y,
        identifier: pointer.id,
        pressure: pointer.pressure || 0.5,
        timestamp: Date.now()
      });
      return;
    }

    // 输入处理器处理
    if (this.mobileInputHandler) {
      const touchEvent = {
        type: 'pointerup',
        clientX: pointer.x,
        clientY: pointer.y,
        pointerId: pointer.id,
        pressure: pointer.pressure || 0.5
      };
      this.mobileInputHandler.processTouchEvent(touchEvent);
    }

    // 显示触摸效果
    if (this.mobileUIRenderer) {
      this.mobileUIRenderer.showTouchEffect(pointer.x, pointer.y, 'release');
    }
  }

  /**
   * 处理摇杆移动
   */
  handleJoystickMove(joystickData) {
    if (this.is360Mode && this.snakeController) {
      // 将摇杆方向转换为蛇的移动方向
      this.snakeController.setDirectionVector(joystickData.direction);

      // 更新UI渲染器中的摇杆显示
      if (this.mobileUIRenderer) {
        this.mobileUIRenderer.renderJoystick(joystickData);
      }
    }
  }

  /**
   * 处理方向变化
   */
  handleDirectionChange(direction) {
    if (this.is360Mode && this.snakeController && direction.magnitude > 0.3) {
      this.snakeController.setDirectionVector(direction);

      // 显示方向指示
      if (this.mobileUIRenderer) {
        this.mobileUIRenderer.showDirectionIndicator(direction.angle);
      }
    }
  }

  /**
   * 处理手势
   */
  handleGesture(gesture) {
    switch (gesture.type) {
      case 'tap':
        // 点击暂停
        this.gameLogic.togglePause();
        if (this.hapticFeedback) {
          this.hapticFeedback.trigger('buttonPress');
        }
        break;

      case 'longpress':
        // 长按重置游戏或切换控制模式
        this.toggleControlMode();
        break;

      case 'swipe':
        // 快速滑动可以作为快速方向改变
        if (!this.is360Mode && gesture.velocity > 0.8) {
          this.handleSwipeDirection(gesture.angle);
        }
        break;
    }
  }

  /**
   * 切换控制模式
   */
  toggleControlMode() {
    this.is360Mode = !this.is360Mode;
    this.snakeController.enable360Mode(this.is360Mode);

    if (this.hapticFeedback) {
      this.hapticFeedback.trigger(this.is360Mode ? 'success' : 'warning');
    }

    console.log(`Control mode changed to: ${this.is360Mode ? '360°' : '4-direction'}`);
  }

  /**
   * 处理滑动方向
   */
  handleSwipeDirection(angle) {
    const directions = {
      'UP': -Math.PI / 2,
      'DOWN': Math.PI / 2,
      'LEFT': Math.PI,
      'RIGHT': 0
    };

    // 找到最接近的方向
    let closestDirection = 'RIGHT';
    let minDiff = Math.PI;

    for (const [dir, dirAngle] of Object.entries(directions)) {
      const diff = Math.abs(angle - dirAngle);
      if (diff < minDiff) {
        minDiff = diff;
        closestDirection = dir;
      }
    }

    this.snakeController.setDirection(closestDirection);

    if (this.hapticFeedback) {
      this.hapticFeedback.trigger('move');
    }
  }

  /**
   * 调整移动端质量
   */
  adjustMobileQuality(change) {
    if (this.mobileUIRenderer) {
      // 根据性能调整UI渲染质量
      this.mobileUIRenderer.adjustQuality(this.performanceManager.getMetrics());
    }

    if (this.hapticFeedback) {
      // 在低性能时降低触觉反馈强度
      if (change.to === 'low') {
        this.hapticFeedback.setIntensity(0.5);
      } else if (change.to === 'high' || change.to === 'ultra') {
        this.hapticFeedback.setIntensity(0.8);
      }
    }
  }

  
  /**
   * 渲染游戏画面（移动端增强版）
   */
  render() {
    const snake = this.snakeController.getSnake();

    // 只在游戏未结束时渲染
    if (!this.gameLogic.getGameState().isGameOver) {
      // 获取游戏统计信息和状态
      const gameStats = this.gameLogic.getGameStats(this.snakeController);
      const gameState = this.gameLogic.getGameState();

      // 传统渲染器
      this.gameRenderer.render(snake, this.food, this.isBlinking, gameStats, gameState);

      // 移动端UI渲染器
      if (this.mobileUIRenderer && this.isMobileMode) {
        // 更新分数和等级显示
        this.mobileUIRenderer.updateScore(gameStats.score);
        this.mobileUIRenderer.updateLevel(this.snakeController.speedLevel);

        // 如果是360度模式，显示方向指示器
        if (this.is360Mode) {
          const direction = this.snakeController.getDirectionVector();
          if (direction.magnitude > 0.1) {
            this.mobileUIRenderer.showDirectionIndicator(direction.angle);
          }
        }
      }
    }
  }

  /**
   * 销毁场景
   */
  destroy() {
    // 销毁移动端组件
    if (this.mobileJoystick) {
      this.mobileJoystick.destroy();
    }
    if (this.mobileInputHandler) {
      this.mobileInputHandler.destroy();
    }
    if (this.mobileUIRenderer) {
      this.mobileUIRenderer.destroy();
    }
    if (this.hapticFeedback) {
      this.hapticFeedback.destroy();
    }
    if (this.performanceManager) {
      this.performanceManager.destroy();
    }

    // 销毁游戏模块
    if (this.gameRenderer) {
      this.gameRenderer.destroy();
    }

    super.destroy();
  }
}
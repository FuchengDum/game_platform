import Phaser from 'phaser';
import { SnakeController } from '../controllers/SnakeController.js';
import { GameRenderer } from '../renderers/GameRenderer.js';
import { GameLogic } from '../logics/GameLogic.js';

/**
 * 精简版贪吃蛇游戏场景
 * 使用模块化架构，大幅减少文件大小
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

    // 移动端触摸控制
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isSwipe = false;
    this.swipeThreshold = 12; // 降低滑动阈值，提高敏感度
    this.touchDebounce = 50; // 减少节流时间，提高响应性
    this.lastTouchTime = 0;
    this.minSwipeVelocity = 0.3; // 最小滑动速度
    this.maxTouchDuration = 500; // 最大触摸时长
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

    // 生成第一个食物
    this.food = this.gameLogic.generateRandomFood(this.snakeController.getSnake(), gridConfig.gridCount);

    // 设置控制
    this.setupKeyboardControls();
    this.setupTouchControls();

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
    if (navigator.vibrate) {
      navigator.vibrate(50); // 50ms短振动
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
    if (navigator.vibrate) {
      navigator.vibrate(30); // 更短的振动，更快反馈
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
    // 先获取下一个头部位置（不移动蛇）
    const nextHead = this.snakeController.getNextHeadPosition();

    // 预检查碰撞
    if (this.snakeController.checkCollisionAt(nextHead)) {
      this.handleGameOver();
      return;
    }

    // 如果没有碰撞，执行移动
    const head = this.snakeController.move();
    let shouldGrow = false;

    // 检查是否吃到食物
    if (this.gameLogic.checkFoodCollision(head, this.food)) {
      shouldGrow = true;
      this.snakeController.eatFood();
      const gridConfig = this.snakeController.getGridSize();
      this.food = this.gameLogic.generateRandomFood(this.snakeController.getSnake(), gridConfig.gridCount);
    }

    // 如果没有吃到食物，移除蛇尾
    if (!shouldGrow) {
      this.snakeController.removeTail();
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
   * 销毁场景
   */
  destroy() {
    if (this.gameRenderer) {
      this.gameRenderer.destroy();
    }
    super.destroy();
  }
}
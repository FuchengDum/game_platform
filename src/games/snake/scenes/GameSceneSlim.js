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
    this.swipeThreshold = 30;
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
    this.snakeController = new SnakeController();
    this.gameRenderer = new GameRenderer(this);
    this.gameLogic = new GameLogic();

    // 初始化各个模块
    this.snakeController.init();
    this.gameLogic.init();
    this.gameRenderer.init();

    // 生成第一个食物
    this.food = this.gameLogic.generateRandomFood(this.snakeController.getSnake());

    // 设置控制
    this.setupKeyboardControls();
    this.setupTouchControls();

    // 初始化游戏状态
    this.eyeBlinkTime = 0;
    this.snakeController.moveTime = 2000; // 2秒后开始移动

    // 初始渲染游戏画面
    this.render();

    // 添加调试文本
    this.add.text(10, 10, 'Snake Game Running', {
      fontSize: '16px',
      color: '#ffffff'
    });
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
   * 设置触摸控制
   */
  setupTouchControls() {
    // 触摸开始
    this.input.on('pointerdown', (pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
    });

    // 触摸结束（检测滑动）
    this.input.on('pointerup', (pointer) => {
      const deltaX = pointer.x - this.touchStartX;
      const deltaY = pointer.y - this.touchStartY;

      if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
        this.handleSwipe(this.touchStartX, this.touchStartY, pointer.x, pointer.y);
      }
    });
  }

  /**
   * 处理滑动操作
   */
  handleSwipe(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (deltaX > 0) {
        this.snakeController.setDirection('RIGHT');
      } else {
        this.snakeController.setDirection('LEFT');
      }
    } else {
      // 垂直滑动
      if (deltaY > 0) {
        this.snakeController.setDirection('DOWN');
      } else {
        this.snakeController.setDirection('UP');
      }
    }
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
      this.food = this.gameLogic.generateRandomFood(this.snakeController.getSnake());
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
      this.gameRenderer.render(snake, this.food, this.isBlinking);
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
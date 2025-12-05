import Phaser from 'phaser';
import { FoodManager } from '../entities/FoodManager.js';
import { EffectManager } from '../systems/EffectManager.js';
import { SoundManager } from '../systems/SoundManager.js';
import { EffectsUI } from '../systems/EffectsUI.js';

const GRID_SIZE = 20;
const GRID_WIDTH = 30;
const GRID_HEIGHT = 30;

export default class GameScene extends Phaser.Scene {
  constructor(onGameOver) {
    super('GameScene');
    this.onGameOver = onGameOver;
    this.score = 0;
    this.snake = [];
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.food = null;
    this.moveTime = 0;
    this.moveDelay = 120; // 移动间隔（毫秒）- 初始为熟练速度
    this.baseMoveDelay = 120; // 基础移动延迟
    this.foodCount = 0; // 吃到的食物数量
    this.speedLevel = 1; // 当前速度等级 - 初始为熟练

    // 速度调整配置 - 扩展到10级，提供更高的挑战性
    this.speedConfig = {
      // 前期每3个食物升一级，后期每4个食物升级
      foodPerLevelBasic: 3,   // 1-6级：每3个食物升级
      foodPerLevelAdvanced: 4, // 7-10级：每4个食物升级
      // 速度等级对应的延迟时间 - 扩展到10级
      levelDelays: [120, 110, 100, 90, 80, 70, 65, 60, 55, 50],
      // 速度等级名称 - 新增4个高速称号
      levelNames: ['熟练', '优秀', '专家', '大师', '王者', '传奇', '神话', '至尊', '极速', '闪电']
    };

    // 动画相关
    this.animationTime = 0;
    this.foodAnimationTime = 0;
    this.eyeBlinkTime = 0;
    this.isBlinking = false;

    // this.snakeSprites = []; // 我们将使用更简单的渲染方法

    // 性能优化 - 脏标记系统
    this.needsRedraw = true;
    this.lastGameState = null;
    this.lastFoodPosition = null;
    this.lastSnakeLength = 0;

    // 网格缓存
    this.gridTexture = null;
    this.gridCreated = false;

    // 粒子池系统 - 性能优化
    this.particlePool = {
      particles: [],
      activeParticles: [],
      maxParticles: 50, // 限制最大粒子数
      poolInitialized: false
    };

    // 初始化道具系统
    this.foodManager = null;
    this.effectManager = new EffectManager();
    this.soundManager = null;

    // UI元素
    this.effectsDisplay = null;
    this.progressBarContainer = null;
    this.effectsUI = null;
  }

  preload() {
    // 这里暂时不需要预加载，我们将使用CSS样式来美化蛇的外观
  }

  create() {
    // 初始化蛇
    this.snake = [
      { x: 15, y: 15 },
      { x: 14, y: 15 },
      { x: 13, y: 15 }
    ];

    // 蛇将在render方法中绘制

    // 创建食物管理器并生成第一个食物
    this.foodManager = new FoodManager(this);
    this.foodManager.spawnFood(this.snake);

    // 初始化音效管理器
    this.soundManager = new SoundManager(this);

    // 初始化效果管理器回调
    this.setupEffectCallbacks();

    // 创建高级效果UI - 调整位置避免遮挡游戏区域
    this.effectsUI = new EffectsUI(this, 16, 140); // 从100调整到140，给游戏区域更多空间

    // 初始化粒子池系统
    this.initializeParticlePool();

    // 键盘输入
    this.cursors = this.input.keyboard.createCursorKeys();

    // 触摸控制
    this.input.on('pointerdown', (pointer) => {
      const touchX = pointer.x;
      const touchY = pointer.y;
      const head = this.snake[0];
      const headX = head.x * GRID_SIZE + GRID_SIZE / 2;
      const headY = head.y * GRID_SIZE + GRID_SIZE / 2;

      const dx = touchX - headX;
      const dy = touchY - headY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && this.direction !== 'LEFT') {
          this.nextDirection = 'RIGHT';
        } else if (dx < 0 && this.direction !== 'RIGHT') {
          this.nextDirection = 'LEFT';
        }
      } else {
        if (dy > 0 && this.direction !== 'UP') {
          this.nextDirection = 'DOWN';
        } else if (dy < 0 && this.direction !== 'DOWN') {
          this.nextDirection = 'UP';
        }
      }
    });

    // UI
    this.scoreText = this.add.text(16, 16, '分数: 0', {
      fontSize: '24px',
      fill: '#fff'
    });

    // 速度显示
    this.speedText = this.add.text(16, 45, '速度: 熟练 (1级)', {
      fontSize: '18px',
      fill: '#48dbfb'
    });

    // 食物计数
    this.foodText = this.add.text(16, 70, '食物: 0', {
      fontSize: '18px',
      fill: '#0ea5e9'
    });

    this.add.text(300, 300, '使用方向键或触摸控制', {
      fontSize: '18px',
      fill: '#48dbfb'
    }).setOrigin(0.5).setAlpha(0.7);

    // 绘制缓存网格（性能优化）
    this.drawCachedGrid();
  }

  /**
   * 检查游戏状态是否发生变化，判断是否需要重绘
   */
  checkGameStateChange() {
    if (!this.lastGameState) {
      this.needsRedraw = true;
      this.updateLastGameState();
      return;
    }

    // 检查蛇的状态变化
    if (this.snake.length !== this.lastSnakeLength) {
      this.needsRedraw = true;
      this.updateLastGameState();
      return;
    }

    // 检查蛇位置变化
    if (this.snake.length > 0 && this.lastGameState.snake) {
      for (let i = 0; i < this.snake.length; i++) {
        if (!this.lastGameState.snake[i] ||
            this.snake[i].x !== this.lastGameState.snake[i].x ||
            this.snake[i].y !== this.lastGameState.snake[i].y) {
          this.needsRedraw = true;
          this.updateLastGameState();
          return;
        }
      }
    }

    // 检查食物变化
    const currentFood = this.foodManager ? this.foodManager.getCurrentFood() : null;
    if (currentFood) {
      const currentFoodPos = `${currentFood.x},${currentFood.y}`;
      if (currentFoodPos !== this.lastFoodPosition) {
        this.needsRedraw = true;
        this.updateLastGameState();
        return;
      }
    }

    // 检查眨眼状态变化
    if (this.isBlinking !== this.lastGameState.isBlinking) {
      this.needsRedraw = true;
      this.updateLastGameState();
      return;
    }
  }

  /**
   * 更新最后游戏状态记录
   */
  updateLastGameState() {
    this.lastGameState = {
      snake: this.snake.map(segment => ({...segment})),
      isBlinking: this.isBlinking,
      animationTime: this.animationTime
    };

    const currentFood = this.foodManager ? this.foodManager.getCurrentFood() : null;
    this.lastFoodPosition = currentFood ? `${currentFood.x},${currentFood.y}` : null;
    this.lastSnakeLength = this.snake.length;
  }

  /**
   * 创建缓存的网格纹理
   */
  createCachedGrid() {
    if (this.gridCreated) return;

    // 创建canvas纹理
    const gridCanvas = this.textures.createCanvas('grid', GRID_WIDTH * GRID_SIZE, GRID_HEIGHT * GRID_SIZE);
    const ctx = gridCanvas.context;

    // 柔和的网格样式 - 使用点状网格而非线条
    const dotSize = 1;
    const dotColor = '#94a3b8'; // 更柔和的蓝灰色
    const lineColor = '#94a3b80d'; // 极淡的线条

    // 绘制网格交叉点
    ctx.fillStyle = dotColor;
    for (let x = 0; x <= GRID_WIDTH; x++) {
      for (let y = 0; y <= GRID_HEIGHT; y++) {
        // 只在网格交叉点绘制小点
        ctx.beginPath();
        ctx.arc(x * GRID_SIZE, y * GRID_SIZE, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 添加非常淡的水平线（每隔几格）
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    for (let y = 0; y <= GRID_HEIGHT; y += 5) { // 每5格一条线
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_SIZE);
      ctx.lineTo(GRID_WIDTH * GRID_SIZE, y * GRID_SIZE);
      ctx.stroke();
    }

    // 添加非常淡的垂直线（每隔几格）
    for (let x = 0; x <= GRID_WIDTH; x += 5) { // 每5格一条线
      ctx.beginPath();
      ctx.moveTo(x * GRID_SIZE, 0);
      ctx.lineTo(x * GRID_SIZE, GRID_HEIGHT * GRID_SIZE);
      ctx.stroke();
    }

    // 刷新纹理
    gridCanvas.refresh();

    this.gridCreated = true;
  }

  /**
   * 绘制缓存的网格
   */
  drawCachedGrid() {
    if (!this.gridCreated) {
      this.createCachedGrid();
    }

    // 使用缓存的纹理
    if (!this.gridImage) {
      this.gridImage = this.add.image(0, 0, 'grid').setOrigin(0, 0);
    }
  }

  drawGrid() {
    const graphics = this.add.graphics();

    // 柔和的网格样式 - 使用点状网格而非线条
    const dotSize = 1;
    const dotOpacity = 0.15; // 更低的透明度
    const dotColor = 0x94a3b8; // 更柔和的蓝灰色

    // 绘制网格交叉点
    for (let x = 0; x <= GRID_WIDTH; x++) {
      for (let y = 0; y <= GRID_HEIGHT; y++) {
        // 只在网格交叉点绘制小点
        graphics.fillStyle(dotColor, dotOpacity);
        graphics.fillCircle(
          x * GRID_SIZE,
          y * GRID_SIZE,
          dotSize
        );
      }
    }

    // 可选：添加非常淡的水平线（每隔几格）
    graphics.lineStyle(1, 0x94a3b8, 0.05); // 极淡的线条
    for (let y = 0; y <= GRID_HEIGHT; y += 5) { // 每5格一条线
      graphics.beginPath();
      graphics.moveTo(0, y * GRID_SIZE);
      graphics.lineTo(GRID_WIDTH * GRID_SIZE, y * GRID_SIZE);
      graphics.strokePath();
    }

    // 可选：添加非常淡的垂直线（每隔几格）
    for (let x = 0; x <= GRID_WIDTH; x += 5) { // 每5格一条线
      graphics.beginPath();
      graphics.moveTo(x * GRID_SIZE, 0);
      graphics.lineTo(x * GRID_SIZE, GRID_HEIGHT * GRID_SIZE);
      graphics.strokePath();
    }
  }

  update(time) {
    // 检查游戏状态变化，决定是否需要重绘
    this.checkGameStateChange();

    // 更新动画时间
    this.animationTime += 16; // 约60fps
    this.foodAnimationTime += 16;
    this.eyeBlinkTime += 16;

    // 更新效果管理器
    this.effectManager.update(16);

    // 更新效果UI显示 - 确保进度条和时间动态变化
    this.updateEffectsDisplay();

    // 更新食物管理器
    if (this.foodManager) {
      this.foodManager.update(16);
    }

    // 处理眨眼动画
    if (this.eyeBlinkTime > 3000 + Math.random() * 2000) { // 3-5秒眨眼一次
      this.isBlinking = true;
      this.eyeBlinkTime = 0;
    }

    if (this.isBlinking && this.eyeBlinkTime > 150) { // 眨眼持续150ms
      this.isBlinking = false;
    }

    // 处理输入
    if (this.cursors.left.isDown && this.direction !== 'RIGHT') {
      this.nextDirection = 'LEFT';
    } else if (this.cursors.right.isDown && this.direction !== 'LEFT') {
      this.nextDirection = 'RIGHT';
    } else if (this.cursors.up.isDown && this.direction !== 'DOWN') {
      this.nextDirection = 'UP';
    } else if (this.cursors.down.isDown && this.direction !== 'UP') {
      this.nextDirection = 'DOWN';
    }

    // 移动蛇 - 考虑效果影响的移动延迟
    if (time >= this.moveTime) {
      this.moveSnake();

      // 计算动态移动延迟
      const speedMultiplier = this.effectManager.getSpeedMultiplier();
      this.currentMoveDelay = this.baseMoveDelay / speedMultiplier;
      this.moveTime = time + this.currentMoveDelay;
    }

    // 渲染
    this.render();
  }

  moveSnake() {
    this.direction = this.nextDirection;

    const head = { ...this.snake[0] };

    // 根据方向移动头部
    switch (this.direction) {
      case 'LEFT':
        head.x--;
        break;
      case 'RIGHT':
        head.x++;
        break;
      case 'UP':
        head.y--;
        break;
      case 'DOWN':
        head.y++;
        break;
    }

    // 检查碰撞
    if (this.checkCollision(head)) {
      this.gameOver();
      return;
    }

    // 添加新头部
    this.snake.unshift(head);

    // 检查是否吃到食物/道具
    const foodCollision = this.foodManager ? this.foodManager.checkCollision(head) : null;
    if (foodCollision) {
      // 处理食物/道具效果
      const consumeResult = this.foodManager.consumeFood();

      if (consumeResult) {
        // 应用效果 - 为所有食物类型添加效果管理
        if (consumeResult.effect) {
          // 特殊道具：添加持续时间效果
          if (consumeResult.effect.type !== 'none' && consumeResult.effect.type !== 'normal') {
            this.effectManager.addEffect(
              consumeResult.effect.type,
              consumeResult.effect.duration,
              {
                [consumeResult.effect.type.includes('speed') ? 'speedMultiplier' : 'scoreMultiplier']: consumeResult.effect.value
              },
              consumeResult.effect.name
            );
          }

          // 普通食物：添加短期效果用于视觉反馈
          if (consumeResult.effect.type === 'normal') {
            this.effectManager.addEffect(
              'normal',
              consumeResult.effect.duration, // 使用配置中的2000ms
              {
                'scoreMultiplier': 1.0
              },
              consumeResult.effect.name
            );
          }
        }

        // 计算分数（考虑倍数）
        const scoreGain = consumeResult.score * this.effectManager.getScoreMultiplier();
        this.score += scoreGain;
        this.scoreText.setText('分数: ' + this.score);

        // 更新食物计数
        this.foodCount++;
        this.foodText.setText(`食物: ${this.foodCount}`);

        // 更新效果显示
        this.updateEffectsDisplay();

        // 检查是否需要提升速度等级
        this.updateSpeed();

        // 生成新食物
        this.foodManager.spawnFood(this.snake);
      }
    } else {
      // 移除尾部
      this.snake.pop();
    }
  }

  checkCollision(head) {
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
      return true;
    }

    // 检查自身碰撞
    for (let i = 0; i < this.snake.length; i++) {
      if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
        return true;
      }
    }

    return false;
  }

  /**
   * 设置效果管理器回调
   */
  setupEffectCallbacks() {
    // 速度效果回调
    this.effectManager.setEffectCallback('speed_up', (event, data) => {
      if (event === 'start') {
        console.log('⚡ 加速效果开始');

        // 显示效果激活UI
        if (this.effectsUI) {
          this.effectsUI.showEffectActivated('speed_up', '速度提升');
        }
      } else if (event === 'end') {
        console.log('⚡ 加速效果结束');

        // 播放效果结束音效
        if (this.soundManager) {
          this.soundManager.playEffectEndSound();
        }

        // 显示效果结束UI
        if (this.effectsUI) {
          this.effectsUI.showEffectEnded('speed_up', '速度提升');
        }
      }
    });

    // 减速效果回调
    this.effectManager.setEffectCallback('slow_down', (event, data) => {
      if (event === 'start') {
        console.log('💧 减速效果开始');

        // 显示效果激活UI
        if (this.effectsUI) {
          this.effectsUI.showEffectActivated('slow_down', '速度减缓');
        }
      } else if (event === 'end') {
        console.log('💧 减速效果结束');

        // 播放效果结束音效
        if (this.soundManager) {
          this.soundManager.playEffectEndSound();
        }

        // 显示效果结束UI
        if (this.effectsUI) {
          this.effectsUI.showEffectEnded('slow_down', '速度减缓');
        }
      }
    });

    // 双倍积分回调
    this.effectManager.setEffectCallback('double_score', (event, data) => {
      if (event === 'start') {
        console.log('⭐ 双倍积分开始');

        // 显示效果激活UI
        if (this.effectsUI) {
          this.effectsUI.showEffectActivated('double_score', '双倍积分');
        }
      } else if (event === 'end') {
        console.log('⭐ 双倍积分结束');

        // 播放效果结束音效
        if (this.soundManager) {
          this.soundManager.playEffectEndSound();
        }

        // 显示效果结束UI
        if (this.effectsUI) {
          this.effectsUI.showEffectEnded('double_score', '双倍积分');
        }
      }
    });
  }

  /**
   * 创建效果显示UI
   */
  updateEffectsDisplay() {
    // 只使用新的EffectsUI系统，避免重复显示
    if (this.effectsUI) {
      this.effectsUI.update(this.effectManager);
    }
  }

  /**
   * 渲染进度条
   */
  renderProgressBars() {
    if (!this.progressBarContainer) return;

    this.progressBarContainer.clear();

    const progressBars = this.effectManager.getProgressBarsData();
    let yOffset = 130;

    for (const bar of progressBars) {
      const barWidth = 80;
      const barHeight = 4;
      const x = 16;

      // 背景
      this.progressBarContainer.fillStyle(0x374151, 1);
      this.progressBarContainer.fillRect(x, yOffset, barWidth, barHeight);

      // 进度
      const progressWidth = barWidth * (1 - (bar.remaining / 6000)); // 假设最大6秒
      this.progressBarContainer.fillStyle(bar.color, 1);
      this.progressBarContainer.fillRect(x, yOffset, progressWidth, barHeight);

      yOffset += 8;
    }
  }

  render() {
    // 脏标记优化 - 只有状态变化时才重绘
    if (!this.needsRedraw) {
      return;
    }

    // 清除之前的图形
    if (this.graphics) {
      this.graphics.clear();
    } else {
      this.graphics = this.add.graphics();
    }

    // 重绘完成后重置脏标记
    this.needsRedraw = false;

    // 绘制蛇 - 更美观的样式
    this.snake.forEach((segment, index) => {
      const x = segment.x * GRID_SIZE;
      const y = segment.y * GRID_SIZE;

      if (index === 0) {
        // 可爱的蛇头设计
        const centerX = x + GRID_SIZE / 2;
        const centerY = y + GRID_SIZE / 2;

        // 蛇头主体 - 更圆润的形状
        this.graphics.fillStyle(0x7dd3fc, 1); // 更柔和的蓝色
        this.graphics.fillCircle(centerX, centerY, GRID_SIZE / 2 - 1);

        // 腮红 - 增加可爱感
        this.graphics.fillStyle(0xfbbf24, 0.3); // 金黄色腮红
        this.graphics.fillEllipse(centerX - 4, centerY + 2, 3, 2);
        this.graphics.fillEllipse(centerX + 4, centerY + 2, 3, 2);

        // 大眼睛 - 可爱风格，带眨眼动画
        this.graphics.fillStyle(0xffffff, 1);
        const eyeOffset = this.getEyeOffset();

        if (!this.isBlinking) {
          // 正常眼睛
          this.graphics.fillCircle(centerX + eyeOffset.left.x, centerY + eyeOffset.left.y, 3);
          this.graphics.fillCircle(centerX + eyeOffset.right.x, centerY + eyeOffset.right.y, 3);

          // 眼睛内部 - 更有神
          this.graphics.fillStyle(0x1e293b, 1); // 深色瞳孔
          this.graphics.fillCircle(centerX + eyeOffset.left.x, centerY + eyeOffset.left.y, 2);
          this.graphics.fillCircle(centerX + eyeOffset.right.x, centerY + eyeOffset.right.y, 2);

          // 眼睛高光 - 更有神采
          this.graphics.fillStyle(0xffffff, 1);
          this.graphics.fillCircle(centerX + eyeOffset.left.x - 1, centerY + eyeOffset.left.y - 1, 1);
          this.graphics.fillCircle(centerX + eyeOffset.right.x - 1, centerY + eyeOffset.right.y - 1, 1);
        } else {
          // 眨眼状态 - 横线
          this.graphics.fillStyle(0x1e293b, 1);
          this.graphics.fillRect(centerX + eyeOffset.left.x - 2, centerY + eyeOffset.left.y, 4, 1);
          this.graphics.fillRect(centerX + eyeOffset.right.x - 2, centerY + eyeOffset.right.y, 4, 1);
        }

        // 可爱的嘴巴
        this.graphics.lineStyle(2, 0x1e293b, 1);
        this.graphics.beginPath();
        this.graphics.arc(centerX, centerY + 2, 3, 0, Math.PI);
        this.graphics.strokePath();

        // 头顶装饰 - 小帽子或头发
        this.graphics.fillStyle(0xf472b6, 1); // 粉色
        this.graphics.fillTriangle(centerX - 2, centerY - 6, centerX + 2, centerY - 6, centerX, centerY - 9);

        // 边框
        this.graphics.lineStyle(1, 0x0284c7, 0.8);
        this.graphics.strokeCircle(centerX, centerY, GRID_SIZE / 2 - 1);
      } else {
        // 可爱的蛇身设计
        const centerX = x + GRID_SIZE / 2;
        const centerY = y + GRID_SIZE / 2;

        // 蛇身主体 - 圆润的形状
        const bodyColor = this.getGradientColor(index, this.snake.length);
        this.graphics.fillStyle(bodyColor, 1);
        this.graphics.fillCircle(centerX, centerY, GRID_SIZE / 2 - 2);

        // 身体花纹 - 增加可爱感
        this.graphics.fillStyle(0xfbbf24, 0.2); // 金黄色花纹
        this.graphics.fillCircle(centerX, centerY, 2);

        // 身体高光 - 增加立体感
        this.graphics.fillStyle(0xffffff, 0.4);
        this.graphics.fillEllipse(centerX - 2, centerY - 2, 4, 3);

        // 边框
        this.graphics.lineStyle(1, 0x0284c7, 0.6);
        this.graphics.strokeCircle(centerX, centerY, GRID_SIZE / 2 - 2);

        // 添加小斑点装饰
        if (index % 2 === 0) { // 每隔一段添加装饰
          this.graphics.fillStyle(0xf472b6, 0.3); // 粉色斑点
          this.graphics.fillCircle(centerX + 3, centerY, 1);
        }
      }
    });

    // 绘制食物/道具
    if (this.foodManager && this.foodManager.getCurrentFood()) {
      this.foodManager.render(this.graphics);
    }
  }

  updateSpeed() {
    // 计算应该达到的速度等级 - 支持前后期不同的升级节奏
    let newLevel = 1;
    let remainingFood = this.foodCount;

    // 前期升级（1-6级）：每3个食物升级
    const basicLevelFood = Math.min(remainingFood, 6 * this.speedConfig.foodPerLevelBasic);
    const basicLevels = Math.floor(basicLevelFood / this.speedConfig.foodPerLevelBasic);
    newLevel += basicLevels;
    remainingFood -= basicLevelFood;

    // 后期升级（7-10级）：每4个食物升级
    if (remainingFood > 0 && newLevel < this.speedConfig.levelDelays.length) {
      const advancedLevels = Math.floor(remainingFood / this.speedConfig.foodPerLevelAdvanced);
      newLevel += Math.min(advancedLevels, this.speedConfig.levelDelays.length - newLevel);
    }

    // 限制最大等级
    newLevel = Math.min(newLevel, this.speedConfig.levelDelays.length);

    // 如果速度等级提升
    if (newLevel > this.speedLevel) {
      const oldLevel = this.speedLevel;
      this.speedLevel = newLevel;
      this.moveDelay = this.speedConfig.levelDelays[this.speedLevel - 1];

      // 更新速度显示
      this.speedText.setText(
        `速度: ${this.speedConfig.levelNames[this.speedLevel - 1]} (${this.speedLevel}级)`
      );

      // 显示升级提示
      this.showSpeedUpNotification(oldLevel, this.speedLevel);
    }
  }

  showSpeedUpNotification(_oldLevel, newLevel) {
    // 创建升级提示 - 移至右上角，适中字体
    const screenWidth = this.cameras?.main?.width || 800;
    const notification = this.add.text(screenWidth - 180, 50,
      `🚀 ${this.speedConfig.levelNames[newLevel - 1]}`,
      {
        fontSize: '16px', // 适中字体，从12px增加到16px
        fill: '#ffd700',
        backgroundColor: 'rgba(0,0,0,0.4)', // 稍微增强背景对比度
        padding: { x: 6, y: 3 } // 适中内边距
      }
    ).setOrigin(0).setAlpha(0.7); // 适度透明度，从0.5增加到0.7

    // 极简动画效果 - 快速淡出
    this.tweens.add({
      targets: notification,
      alpha: 0,
      y: 45, // 轻微上移
      duration: 1000, // 1秒后消失，让用户有足够时间看到
      delay: 600, // 0.6秒延迟，增加显示时间
      ease: 'Linear',
      onComplete: () => {
        notification.destroy();
      }
    });
  }

  getEyeOffset() {
    // 根据方向返回眼睛的位置偏移
    const offsets = {
      'RIGHT': { left: { x: 4, y: -3 }, right: { x: 4, y: 3 } },
      'LEFT': { left: { x: -4, y: -3 }, right: { x: -4, y: 3 } },
      'UP': { left: { x: -3, y: -4 }, right: { x: 3, y: -4 } },
      'DOWN': { left: { x: -3, y: 4 }, right: { x: 3, y: 4 } }
    };
    return offsets[this.direction] || offsets['RIGHT'];
  }

  getGradientColor(index, totalLength) {
    // 从头到尾的渐变颜色
    const ratio = index / totalLength;
    const startColor = { r: 14, g: 165, b: 233 }; // 0x0ea5e9
    const endColor = { r: 2, g: 132, b: 199 }; // 0x0284c7

    const r = Math.floor(startColor.r + (endColor.r - startColor.r) * ratio);
    const g = Math.floor(startColor.g + (endColor.g - startColor.g) * ratio);
    const b = Math.floor(startColor.b + (endColor.b - startColor.b) * ratio);

    return (r << 16) | (g << 8) | b;
  }

  /**
   * 初始化粒子池系统
   */
  initializeParticlePool() {
    if (this.particlePool.poolInitialized) return;

    console.log('🎯 初始化粒子池系统...');

    // 预创建粒子对象
    for (let i = 0; i < this.particlePool.maxParticles; i++) {
      const particle = {
        gameObject: null,
        active: false,
        inUse: false,
        lastUsed: 0,
        type: 'circle' // circle, rectangle, text
      };
      this.particlePool.particles.push(particle);
    }

    this.particlePool.poolInitialized = true;
    console.log(`✅ 粒子池初始化完成，预创建 ${this.particlePool.maxParticles} 个粒子对象`);
  }

  /**
   * 从粒子池获取粒子
   */
  getParticleFromPool() {
    // 查找未使用的粒子
    for (let i = 0; i < this.particlePool.particles.length; i++) {
      const particle = this.particlePool.particles[i];
      if (!particle.inUse) {
        particle.inUse = true;
        particle.active = true;
        particle.lastUsed = Date.now();
        return particle;
      }
    }

    // 如果没有可用粒子，尝试回收最久未使用的
    const oldestParticle = this.particlePool.particles.reduce((oldest, current) => {
      if (!current.inUse) return current;
      return current.lastUsed < oldest.lastUsed ? current : oldest;
    });

    if (oldestParticle && !oldestParticle.active) {
      this.cleanupParticle(oldestParticle);
      oldestParticle.inUse = true;
      oldestParticle.active = true;
      oldestParticle.lastUsed = Date.now();
      return oldestParticle;
    }

    return null; // 池已满
  }

  /**
   * 归还粒子到池中
   */
  returnParticleToPool(particle) {
    if (!particle) return;

    particle.inUse = false;
    particle.active = false;
    particle.lastUsed = Date.now();

    // 将粒子从活动列表移除
    const index = this.particlePool.activeParticles.indexOf(particle);
    if (index > -1) {
      this.particlePool.activeParticles.splice(index, 1);
    }
  }

  /**
   * 清理粒子对象
   */
  cleanupParticle(particle) {
    if (!particle) return;

    if (particle.gameObject && this.children) {
      // 停止所有tween动画
      this.tweens.killTweensOf(particle.gameObject);

      // 销毁游戏对象
      if (particle.gameObject.destroy) {
        particle.gameObject.destroy();
      }
    }

    particle.gameObject = null;
    particle.active = false;
  }

  /**
   * 创建优化的粒子效果
   */
  createOptimizedParticles(x, y, color, intensity = 1, type = 'circle') {
    // 大幅减少粒子数量以避免渲染负担和闪烁
    const particleCount = Math.min(Math.max(1, Math.floor(2 * intensity)), 4); // 从4-8减少到1-4
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particleData = this.getParticleFromPool();
      if (!particleData) {
        console.warn('⚠️ 粒子池已满，跳过粒子创建');
        break;
      }

      const angle = (Math.PI * 2 * i) / particleCount;
      const size = 0.3 + Math.random() * 0.7; // 极小的粒子尺寸

      // 创建粒子游戏对象
      if (type === 'circle') {
        particleData.gameObject = this.add.circle(x, y, size, color);
      } else if (type === 'rectangle') {
        particleData.gameObject = this.add.rectangle(x, y, size * 2, size * 2, color);
      }

      if (particleData.gameObject) {
        particleData.gameObject.setAlpha(0.2); // 进一步降低初始透明度
        particleData.type = type;

        this.particlePool.activeParticles.push(particleData);
        particles.push(particleData);

        // 极简的粒子动画
        const distance = 8 + Math.random() * 12; // 极小的移动距离
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;

        this.tweens.add({
          targets: particleData.gameObject,
          x: targetX,
          y: targetY,
          alpha: 0,
          scale: 0,
          duration: 80 + Math.random() * 80, // 极短的动画时长
          ease: 'Linear', // 使用线性动画避免突兀的缓动效果
          onComplete: () => {
            this.returnParticleToPool(particleData);
          }
        });
      }
    }

    return particles;
  }

  /**
   * 创建优化的文本粒子效果
   */
  createOptimizedTextParticle(x, y, text, color = '#ffffff') {
    const particleData = this.getParticleFromPool();
    if (!particleData) {
      console.warn('⚠️ 粒子池已满，跳过文本粒子创建');
      return null;
    }

    particleData.gameObject = this.add.text(x, y, text, {
      fontSize: '14px',
      fill: '#ffffff',
      stroke: color,
      strokeThickness: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5);

    particleData.type = 'text';
    this.particlePool.activeParticles.push(particleData);

    // 文本动画
    this.tweens.add({
      targets: particleData.gameObject,
      y: y - 20,
      alpha: 0,
      scale: 1.1,
      duration: 800, // 稍长的文本动画时长
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.returnParticleToPool(particleData);
      }
    });

    return particleData;
  }

  /**
   * 清理所有粒子
   */
  cleanupAllParticles() {
    // 停止所有tween动画
    this.tweens.killTweensOf(this.particlePool.activeParticles.map(p => p.gameObject));

    // 销毁所有活动粒子
    this.particlePool.activeParticles.forEach(particle => {
      this.cleanupParticle(particle);
    });

    this.particlePool.activeParticles = [];

    // 重置所有粒子状态
    this.particlePool.particles.forEach(particle => {
      particle.inUse = false;
      particle.active = false;
      particle.gameObject = null;
    });
  }

  gameOver() {
    this.scene.pause();

    // 清理所有粒子效果
    this.cleanupAllParticles();

    // 播放游戏结束音效
    if (this.soundManager) {
      this.soundManager.playGameOverSound();
    }

    const gameOverText = this.add.text(300, 250, '游戏结束', {
      fontSize: '48px',
      fill: '#ff6b6b'
    }).setOrigin(0.5);

    const finalScoreText = this.add.text(300, 320, `最终分数: ${this.score}`, {
      fontSize: '32px',
      fill: '#fff'
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      if (this.onGameOver) {
        this.onGameOver(this.score);
      }
    });
  }
}

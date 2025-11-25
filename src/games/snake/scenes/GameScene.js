import Phaser from 'phaser';

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
    this.moveDelay = 150; // 移动间隔（毫秒）
    this.baseMoveDelay = 150; // 基础移动延迟
    this.foodCount = 0; // 吃到的食物数量
    this.speedLevel = 1; // 当前速度等级

    // 速度调整配置
    this.speedConfig = {
      // 每5个食物升一级
      foodPerLevel: 5,
      // 速度等级对应的延迟时间
      levelDelays: [150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50],
      // 速度等级名称
      levelNames: ['新手', '入门', '普通', '熟练', '优秀', '专家', '大师', '王者', '传奇', '神话', '极限']
    };

    // 动画相关
    this.animationTime = 0;
    this.foodAnimationTime = 0;
    this.eyeBlinkTime = 0;
    this.isBlinking = false;

    // this.snakeSprites = []; // 我们将使用更简单的渲染方法
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

    // 创建食物
    this.spawnFood();

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
    this.speedText = this.add.text(16, 45, '速度: 新手 (1级)', {
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

    // 绘制网格（可选）
    this.drawGrid();
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
    // 更新动画时间
    this.animationTime += 16; // 约60fps
    this.foodAnimationTime += 16;
    this.eyeBlinkTime += 16;

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

    // 移动蛇
    if (time >= this.moveTime) {
      this.moveSnake();
      this.moveTime = time + this.moveDelay;
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

    // 检查是否吃到食物
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.scoreText.setText('分数: ' + this.score);
      this.spawnFood();

      // 更新食物计数
      this.foodCount++;
      this.foodText.setText(`食物: ${this.foodCount}`);

      // 检查是否需要提升速度等级
      this.updateSpeed();
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

  spawnFood() {
    let validPosition = false;
    let foodX, foodY;

    while (!validPosition) {
      foodX = Phaser.Math.Between(0, GRID_WIDTH - 1);
      foodY = Phaser.Math.Between(0, GRID_HEIGHT - 1);

      validPosition = true;
      for (let segment of this.snake) {
        if (segment.x === foodX && segment.y === foodY) {
          validPosition = false;
          break;
        }
      }
    }

    this.food = { x: foodX, y: foodY };
  }

  render() {
    // 清除之前的图形
    if (this.graphics) {
      this.graphics.clear();
    } else {
      this.graphics = this.add.graphics();
    }

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

    // 绘制可爱的食物，带浮动动画
    const foodCenterX = this.food.x * GRID_SIZE + GRID_SIZE / 2;
    const foodCenterY = this.food.y * GRID_SIZE + GRID_SIZE / 2;

    // 浮动效果
    const floatOffset = Math.sin(this.foodAnimationTime * 0.003) * 2;
    const foodY = foodCenterY + floatOffset;

    // 食物主体 - 苹果形状
    this.graphics.fillStyle(0xf87171, 1); // 红色苹果
    this.graphics.fillCircle(foodCenterX, foodY, GRID_SIZE / 2 - 2);

    // 苹果叶子 - 增加可爱感
    this.graphics.fillStyle(0x34d399, 1); // 绿色叶子
    this.graphics.fillEllipse(foodCenterX, foodY - 6, 3, 2);

    // 苹果梗
    this.graphics.lineStyle(1, 0x92400e, 1); // 棕色梗
    this.graphics.beginPath();
    this.graphics.moveTo(foodCenterX, foodY - 6);
    this.graphics.lineTo(foodCenterX, foodY - 8);
    this.graphics.strokePath();

    // 食物高光 - 更立体
    this.graphics.fillStyle(0xffffff, 0.6);
    this.graphics.fillEllipse(foodCenterX - 3, foodY - 3, 4, 3);

    // 可爱的小脸 - 让食物也有表情
    this.graphics.fillStyle(0x1e293b, 1); // 深色眼睛
    this.graphics.fillCircle(foodCenterX - 3, foodY, 1);
    this.graphics.fillCircle(foodCenterX + 3, foodY, 1);

    // 微笑嘴巴
    this.graphics.lineStyle(1, 0x1e293b, 1);
    this.graphics.beginPath();
    this.graphics.arc(foodCenterX, foodY + 1, 2, 0.2, Math.PI - 0.2);
    this.graphics.strokePath();

    // 腮红 - 增加可爱感
    this.graphics.fillStyle(0xfbbf24, 0.3); // 金黄色腮红
    this.graphics.fillEllipse(foodCenterX - 4, foodY + 2, 2, 1);
    this.graphics.fillEllipse(foodCenterX + 4, foodY + 2, 2, 1);

    // 边框
    this.graphics.lineStyle(1, 0xdc2626, 0.8);
    this.graphics.strokeCircle(foodCenterX, foodY, GRID_SIZE / 2 - 2);
  }

  updateSpeed() {
    // 计算应该达到的速度等级
    const newLevel = Math.min(
      Math.floor(this.foodCount / this.speedConfig.foodPerLevel) + 1,
      this.speedConfig.levelDelays.length
    );

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

  showSpeedUpNotification(oldLevel, newLevel) {
    // 创建升级提示
    const notification = this.add.text(300, 200,
      `🚀 速度提升！${this.speedConfig.levelNames[oldLevel - 1]} → ${this.speedConfig.levelNames[newLevel - 1]}`,
      {
        fontSize: '24px',
        fill: '#ffd700',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5).setStroke('#ff6b6b', 2);

    // 动画效果
    notification.setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: notification,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.out',
      onComplete: () => {
        this.tweens.add({
          targets: notification,
          alpha: 0,
          scale: 0.8,
          duration: 1000,
          delay: 1500,
          ease: 'Power2',
          onComplete: () => {
            notification.destroy();
          }
        });
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

  gameOver() {
    this.scene.pause();

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

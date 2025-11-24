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
  }

  create() {
    // 初始化蛇
    this.snake = [
      { x: 15, y: 15 },
      { x: 14, y: 15 },
      { x: 13, y: 15 }
    ];

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

    this.add.text(300, 300, '使用方向键或触摸控制', {
      fontSize: '18px',
      fill: '#48dbfb'
    }).setOrigin(0.5).setAlpha(0.7);

    // 绘制网格（可选）
    this.drawGrid();
  }

  drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 0.3);

    for (let x = 0; x <= GRID_WIDTH; x++) {
      graphics.moveTo(x * GRID_SIZE, 0);
      graphics.lineTo(x * GRID_SIZE, GRID_HEIGHT * GRID_SIZE);
    }

    for (let y = 0; y <= GRID_HEIGHT; y++) {
      graphics.moveTo(0, y * GRID_SIZE);
      graphics.lineTo(GRID_WIDTH * GRID_SIZE, y * GRID_SIZE);
    }

    graphics.strokePath();
  }

  update(time) {
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

      // 加速
      if (this.moveDelay > 50) {
        this.moveDelay -= 2;
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

    // 绘制蛇
    this.snake.forEach((segment, index) => {
      const color = index === 0 ? 0x48dbfb : 0x0ea5e9;
      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      );
    });

    // 绘制食物
    this.graphics.fillStyle(0xff6b6b, 1);
    this.graphics.fillCircle(
      this.food.x * GRID_SIZE + GRID_SIZE / 2,
      this.food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2
    );
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

import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor(onGameOver) {
    super('GameScene');
    this.onGameOver = onGameOver;
    this.score = 0;
    this.lives = 3;
  }

  create() {
    // 设置世界边界（左、右、上有边界，下无边界）
    this.physics.world.setBoundsCollision(true, true, true, false);

    // 创建挡板
    this.paddle = this.add.rectangle(400, 550, 100, 20, 0x0ea5e9);
    this.physics.add.existing(this.paddle);
    this.paddle.body.setImmovable(true);
    this.paddle.body.setCollideWorldBounds(true);

    // 创建球
    this.ball = this.add.circle(400, 500, 10, 0xffffff);
    this.physics.add.existing(this.ball);
    this.ball.body.setCollideWorldBounds(true);
    this.ball.body.setBounce(1, 1);
    this.ball.body.setVelocity(200, -200);
    this.ball.body.onWorldBounds = true;

    // 创建砖块
    this.bricks = this.physics.add.group();
    this.createBricks();

    // 碰撞检测
    this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
    this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);

    // 输入控制
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointermove', (pointer) => {
      this.paddle.x = Phaser.Math.Clamp(pointer.x, 50, 750);
    });

    // UI 文本
    this.scoreText = this.add.text(16, 16, '分数: 0', {
      fontSize: '24px',
      fill: '#fff'
    });

    this.livesText = this.add.text(700, 16, '生命: 3', {
      fontSize: '24px',
      fill: '#fff'
    });

    // 游戏提示
    this.add.text(400, 300, '移动鼠标或使用方向键控制挡板', {
      fontSize: '20px',
      fill: '#0ea5e9'
    }).setOrigin(0.5);
  }

  createBricks() {
    const colors = [0xff6b6b, 0xfeca57, 0x48dbfb, 0xff9ff3, 0x54a0ff];
    const rows = 5;
    const cols = 10;
    const brickWidth = 70;
    const brickHeight = 30;
    const padding = 10;
    const offsetX = 35;
    const offsetY = 80;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * (brickWidth + padding);
        const y = offsetY + row * (brickHeight + padding);
        const brick = this.add.rectangle(x, y, brickWidth, brickHeight, colors[row]);
        this.physics.add.existing(brick);
        brick.body.setImmovable(true);
        this.bricks.add(brick);
      }
    }
  }

  hitPaddle(ball, paddle) {
    // 根据击球位置改变球的方向
    const diff = ball.x - paddle.x;
    ball.body.setVelocityX(diff * 10);
  }

  hitBrick(ball, brick) {
    brick.destroy();
    this.score += 10;
    this.scoreText.setText('分数: ' + this.score);

    // 检查是否所有砖块都被消除
    if (this.bricks.countActive() === 0) {
      this.gameWin();
    }
  }

  update() {
    // 键盘控制挡板
    if (this.cursors.left.isDown) {
      this.paddle.x -= 8;
    } else if (this.cursors.right.isDown) {
      this.paddle.x += 8;
    }

    // 限制挡板范围
    this.paddle.x = Phaser.Math.Clamp(this.paddle.x, 50, 750);

    // 检查球是否掉落
    if (this.ball.y > 600) {
      this.lives--;
      this.livesText.setText('生命: ' + this.lives);

      if (this.lives <= 0) {
        this.gameOver();
      } else {
        this.resetBall();
      }
    }
  }

  resetBall() {
    this.ball.setPosition(400, 500);
    this.ball.body.setVelocity(200, -200);
  }

  gameWin() {
    this.physics.pause();
    const winText = this.add.text(400, 300, '恭喜通关！', {
      fontSize: '48px',
      fill: '#0ea5e9'
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      if (this.onGameOver) {
        this.onGameOver(this.score);
      }
    });
  }

  gameOver() {
    this.physics.pause();
    const gameOverText = this.add.text(400, 300, '游戏结束', {
      fontSize: '48px',
      fill: '#ff6b6b'
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      if (this.onGameOver) {
        this.onGameOver(this.score);
      }
    });
  }
}

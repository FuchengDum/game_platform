import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor(onGameOver) {
    super('GameScene');
    this.onGameOver = onGameOver;
    this.score = 0;
    this.lives = 3;

    // 轨迹效果相关
    this.ballTrail = [];
    this.maxTrailLength = 10;
  }

  create() {
    // 设置世界边界（左、右、上有边界，下无边界）
    this.physics.world.setBoundsCollision(true, true, true, false);

    // 创建挡板
    this.paddle = this.add.rectangle(400, 550, 100, 20, 0x0ea5e9);
    this.physics.add.existing(this.paddle);
    this.paddle.body.setImmovable(true);
    this.paddle.body.setCollideWorldBounds(true);

    // 创建增强的球
    this.ball = this.add.circle(400, 500, 12, 0xffffff);

    // 添加球的内部层次设计
    this.ballInner = this.add.circle(400, 500, 8, 0xf0f9ff); // 浅蓝色内圈
    this.ballCenter = this.add.circle(400, 500, 4, 0x7dd3fc); // 中心高光

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
    const maxSpeed = 300; // 最大速度
    const minSpeed = 200; // 最小速度

    // 计算击球位置的比例 (-1 到 1)
    let hitPosition = diff / (paddle.width / 2);
    hitPosition = Phaser.Math.Clamp(hitPosition, -1, 1);

    // 基于击球位置计算角度，但限制在合理范围内
    const maxAngle = Math.PI / 3; // 60度最大角度
    const angle = hitPosition * maxAngle;

    // 计算新的速度向量，确保速度在合理范围内
    const speed = Math.max(minSpeed, maxSpeed);
    const velocityX = Math.sin(angle) * speed;
    const velocityY = -Math.abs(Math.cos(angle) * speed);

    ball.body.setVelocity(velocityX, velocityY);

    // 确保球向上反弹
    if (ball.body.velocity.y > 0) {
      ball.body.setVelocityY(-ball.body.velocity.y);
    }
  }

  hitBrick(ball, brick) {
    // 创建碰撞效果
    this.createCollisionEffect(brick.x, brick.y);

    brick.destroy();
    this.score += 10;
    this.scoreText.setText('分数: ' + this.score);

    // 检查是否所有砖块都被消除
    if (this.bricks.countActive() === 0) {
      this.gameWin();
    }
  }

  createCollisionEffect(x, y) {
    // 创建碰撞粒子效果
    const particles = this.add.particles(x, y, {
      frame: ['circle', 'square'],
      scale: { start: 0.5, end: 0 },
      speed: { min: 50, max: 150 },
      lifespan: 800,
      quantity: 8,
      tint: 0xffd700
    });

    // 发射粒子
    particles.explode();
  }

  update() {
    // 更新球轨迹
    this.updateBallTrail();

    // 键盘控制挡板
    if (this.cursors.left.isDown) {
      this.paddle.x -= 8;
    } else if (this.cursors.right.isDown) {
      this.paddle.x += 8;
    }

    // 限制挡板范围
    this.paddle.x = Phaser.Math.Clamp(this.paddle.x, 50, 750);

    // 安全检查：确保球始终有速度
    if (this.ball && this.ball.body) {
      // 同步内圈和中心高光位置
      if (this.ballInner && this.ballCenter) {
        this.ballInner.x = this.ball.x;
        this.ballInner.y = this.ball.y;
        this.ballCenter.x = this.ball.x;
        this.ballCenter.y = this.ball.y;
      }

      const speed = Math.sqrt(
        this.ball.body.velocity.x ** 2 + this.ball.body.velocity.y ** 2
      );

      // 如果球速度过低，重置速度
      if (speed < 100) {
        this.ball.body.setVelocity(200, -200);
      }
    }

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

    // 清除轨迹
    this.clearBallTrail();

    // 重置内圈位置
    if (this.ballInner && this.ballCenter) {
      this.ballInner.x = this.ball.x;
      this.ballInner.y = this.ball.y;
      this.ballCenter.x = this.ball.x;
      this.ballCenter.y = this.ball.y;
    }
  }

  updateBallTrail() {
    if (!this.ball) return;

    // 添加新的轨迹点
    this.ballTrail.push({
      x: this.ball.x,
      y: this.ball.y,
      alpha: 1
    });

    // 限制轨迹长度
    if (this.ballTrail.length > this.maxTrailLength) {
      this.ballTrail.shift();
    }

    // 更新轨迹透明度
    this.ballTrail.forEach((point, index) => {
      point.alpha = (index + 1) / this.ballTrail.length * 0.5;
    });

    // 渲染轨迹
    this.renderBallTrail();
  }

  renderBallTrail() {
    // 清除之前的轨迹
    if (this.trailGraphics) {
      this.trailGraphics.clear();
    } else {
      this.trailGraphics = this.add.graphics();
    }

    // 绘制轨迹
    this.ballTrail.forEach((point, index) => {
      if (index > 0) { // 不绘制第一个点（球本体）
        const size = 2 + (index / this.ballTrail.length) * 6;
        this.trailGraphics.fillStyle(0x7dd3fc, point.alpha * 0.3);
        this.trailGraphics.fillCircle(point.x, point.y, size);
      }
    });
  }

  clearBallTrail() {
    this.ballTrail = [];
    if (this.trailGraphics) {
      this.trailGraphics.clear();
    }
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

/**
 * 游戏渲染器
 * 负责渲染游戏画面，包括网格、蛇、食物等
 */
const GRID_SIZE = 20;

export class GameRenderer {
  constructor(scene) {
    this.scene = scene;
    this.graphics = null;
  }

  /**
   * 初始化渲染器
   */
  init() {
    this.graphics = this.scene.add.graphics();
  }

  /**
   * 绘制蛇
   */
  drawSnake(snake, isBlinking = false) {
    if (!snake || snake.length === 0) return;

    snake.forEach((segment, index) => {
      const x = segment.x * GRID_SIZE + GRID_SIZE / 2;
      const y = segment.y * GRID_SIZE + GRID_SIZE / 2;

      if (index === 0) {
        // 蛇头
        this.drawSnakeHead(x, y, isBlinking);
      } else {
        // 蛇身
        this.drawSnakeBody(x, y, index, snake.length);
      }
    });
  }

  /**
   * 绘制蛇头
   */
  drawSnakeHead(x, y, isBlinking) {
    const headColor = 0x4ade80;
    const eyeColor = isBlinking ? headColor : 0x1a1a2e;

    // 蛇头主体
    this.graphics.fillStyle(headColor);
    this.graphics.fillCircle(x, y, GRID_SIZE / 2 - 1);

    // 眼睛
    this.graphics.fillStyle(eyeColor);
    const eyeSize = 2;
    const eyeOffset = GRID_SIZE / 4;

    this.graphics.fillCircle(x - eyeOffset, y - eyeOffset, eyeSize);
    this.graphics.fillCircle(x + eyeOffset, y - eyeOffset, eyeSize);
  }

  /**
   * 绘制蛇身
   */
  drawSnakeBody(x, y, index, totalLength) {
    // 渐变颜色
    const intensity = Math.max(0.3, 1 - (index / totalLength) * 0.5);
    const color = Math.floor(0x22c55e * intensity);

    this.graphics.fillStyle(color);
    this.graphics.fillCircle(x, y, GRID_SIZE / 2 - 2);
  }

  /**
   * 绘制食物
   */
  drawFood(food) {
    if (!food) return;

    const x = food.x * GRID_SIZE + GRID_SIZE / 2;
    const y = food.y * GRID_SIZE + GRID_SIZE / 2;

    // 食物主体
    this.graphics.fillStyle(0xef4444);
    this.graphics.fillCircle(x, y, GRID_SIZE / 2 - 2);

    // 食物高光
    this.graphics.fillStyle(0xfca5a5);
    this.graphics.fillCircle(x - 2, y - 2, 2);
  }

  /**
   * 清除画布
   */
  clear() {
    if (this.graphics) {
      this.graphics.clear();
    }
  }

  /**
   * 完整渲染
   */
  render(snake, food, isBlinking = false) {
    if (!this.graphics) {
      return;
    }

    this.clear();

    // 绘制背景
    this.graphics.fillStyle(0x1a1a2e);
    this.graphics.fillRect(0, 0, 600, 600);

    // 绘制简单网格线
    this.graphics.lineStyle(1, 0x2a2a4e, 0.3);
    for (let i = 0; i <= 30; i++) {
      const pos = i * 20;
      // 垂直线
      this.graphics.beginPath();
      this.graphics.moveTo(pos, 0);
      this.graphics.lineTo(pos, 600);
      this.graphics.strokePath();

      // 水平线
      this.graphics.beginPath();
      this.graphics.moveTo(0, pos);
      this.graphics.lineTo(600, pos);
      this.graphics.strokePath();
    }

    // 绘制蛇
    this.drawSnake(snake, isBlinking);

    // 绘制食物
    this.drawFood(food);
  }

  /**
   * 销毁渲染器
   */
  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}
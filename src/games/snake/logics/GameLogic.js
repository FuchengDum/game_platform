/**
 * 游戏逻辑管理器
 * 负责游戏的核心逻辑，包括碰撞检测、游戏循环等
 */
const GRID_WIDTH = 30;
const GRID_HEIGHT = 30;

export class GameLogic {
  constructor() {
    this.score = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.highScore = localStorage.getItem('snakeHighScore') || 0;
  }

  /**
   * 初始化游戏
   */
  init() {
    this.score = 0;
    this.isGameOver = false;
    this.isPaused = false;
  }

  /**
   * 生成随机食物位置
   */
  generateRandomFood(snake) {
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * 30),
        y: Math.floor(Math.random() * 30)
      };
    } while (this.isFoodOnSnake(food, snake));

    return food;
  }

  /**
   * 检查食物是否在蛇身上
   */
  isFoodOnSnake(food, snake) {
    return snake.some(segment => segment.x === food.x && segment.y === food.y);
  }

  /**
   * 检查是否吃到食物
   */
  checkFoodCollision(snakeHead, food) {
    return snakeHead.x === food.x && snakeHead.y === food.y;
  }

  /**
   * 处理吃到食物
   */
  handleFoodEaten() {
    this.score += 10;
    return this.generateRandomFood(this.snake);
  }

  /**
   * 检查游戏是否结束
   */
  checkGameOver(snakeController) {
    return snakeController.checkWallCollision(30, 30) ||
           snakeController.checkSelfCollision();
  }

  /**
   * 处理游戏结束
   */
  handleGameOver() {
    this.isGameOver = true;

    // 更新最高分
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snakeHighScore', this.highScore);
    }

    return {
      score: this.score,
      highScore: this.highScore,
      isNewRecord: this.score >= this.highScore && this.score > 0
    };
  }

  /**
   * 暂停/恢复游戏
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  /**
   * 获取游戏状态
   */
  getGameState() {
    return {
      score: this.score,
      highScore: this.highScore,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused
    };
  }

  /**
   * 计算游戏得分等级
   */
  getScoreLevel() {
    if (this.score < 50) return '初学者';
    if (this.score < 100) return '入门';
    if (this.score < 200) return '熟练';
    if (this.score < 300) return '优秀';
    if (this.score < 500) return '专家';
    if (this.score < 800) return '大师';
    return '传奇';
  }

  /**
   * 获取游戏统计信息
   */
  getGameStats(snakeController) {
    const speedInfo = snakeController.getSpeedInfo();

    return {
      score: this.score,
      highScore: this.highScore,
      level: speedInfo.level,
      speedName: speedInfo.name,
      snakeLength: snakeController.getLength(),
      foodEaten: speedInfo.foodCount,
      scoreLevel: this.getScoreLevel(),
      isGameOver: this.isGameOver,
      isPaused: this.isPaused
    };
  }
}
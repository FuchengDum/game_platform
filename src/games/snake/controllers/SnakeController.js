/**
 * 贪吃蛇控制器
 * 负责处理蛇的移动逻辑和方向控制
 */
export class SnakeController {
  constructor(gridConfig = { gridCount: 30, isDynamic: false }) {
    this.gridConfig = gridConfig;
    this.gridWidth = gridConfig.gridCount;
    this.gridHeight = gridConfig.gridCount;

    this.snake = [];
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.moveDelay = 120;
    this.baseMoveDelay = 120;
    this.moveTime = 0;
    this.foodCount = 0;
    this.speedLevel = 1;

    // 速度配置
    this.speedConfig = {
      foodPerLevelBasic: 3,
      foodPerLevelAdvanced: 4,
      levelDelays: [120, 110, 100, 90, 80, 70, 65, 60, 55, 50],
      levelNames: ['熟练', '优秀', '专家', '大师', '王者', '传奇', '神话', '至尊', '极速', '闪电']
    };
  }

  /**
   * 初始化蛇
   */
  init() {
    // 根据网格大小设置蛇的初始位置（居中）
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);

    this.snake = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY }
    ];
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.moveDelay = 120;
    this.baseMoveDelay = 120;
    this.foodCount = 0;
    this.speedLevel = 1;
    this.moveTime = 0;
  }

  /**
   * 更新移动方向
   */
  setDirection(newDirection) {
    // 防止蛇掉头
    const opposites = {
      'UP': 'DOWN',
      'DOWN': 'UP',
      'LEFT': 'RIGHT',
      'RIGHT': 'LEFT'
    };

    if (opposites[newDirection] !== this.direction) {
      this.nextDirection = newDirection;
    }
  }

  /**
   * 移动蛇
   */
  move() {
    this.direction = this.nextDirection;

    const head = { ...this.snake[0] };

    switch (this.direction) {
      case 'UP':
        head.y--;
        break;
      case 'DOWN':
        head.y++;
        break;
      case 'LEFT':
        head.x--;
        break;
      case 'RIGHT':
        head.x++;
        break;
    }

    this.snake.unshift(head);
    return head;
  }

  /**
   * 移除蛇尾
   */
  removeTail() {
    this.snake.pop();
  }

  /**
   * 增长蛇
   */
  grow() {
    // 蛇增长时不移除尾部
  }

  /**
   * 检查是否撞墙
   */
  checkWallCollision(gridWidth = this.gridWidth, gridHeight = this.gridHeight) {
    const head = this.snake[0];
    return head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight;
  }

  /**
   * 检查是否撞到自己
   */
  checkSelfCollision() {
    const head = this.snake[0];
    for (let i = 1; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取下一个头部位置（不移动蛇）
   */
  getNextHeadPosition() {
    const head = { ...this.snake[0] };
    const direction = this.nextDirection;

    switch (direction) {
      case 'UP':
        head.y--;
        break;
      case 'DOWN':
        head.y++;
        break;
      case 'LEFT':
        head.x--;
        break;
      case 'RIGHT':
        head.x++;
        break;
    }

    return head;
  }

  /**
   * 检查指定位置是否会发生碰撞
   */
  checkCollisionAt(newHead, gridWidth = this.gridWidth, gridHeight = this.gridHeight) {
    // 检查墙壁碰撞
    if (newHead.x < 0 || newHead.x >= gridWidth ||
        newHead.y < 0 || newHead.y >= gridHeight) {
      return true;
    }

    // 检查自碰撞
    for (let i = 0; i < this.snake.length; i++) {
      if (newHead.x === this.snake[i].x && newHead.y === this.snake[i].y) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取当前网格尺寸
   */
  getGridSize() {
    return {
      width: this.gridWidth,
      height: this.gridHeight,
      gridCount: this.gridConfig.gridCount,
      isDynamic: this.gridConfig.isDynamic
    };
  }

  /**
   * 更新速度等级
   */
  updateSpeed() {
    const foodForNextLevel = this.speedLevel <= 6
      ? this.speedConfig.foodPerLevelBasic
      : this.speedConfig.foodPerLevelAdvanced;

    const requiredFood = this.speedLevel === 1
      ? foodForNextLevel
      : this.speedLevel <= 6
        ? foodForNextLevel * this.speedLevel
        : 18 + (this.speedLevel - 6) * foodForNextLevel;

    if (this.foodCount >= requiredFood && this.speedLevel < 10) {
      this.speedLevel++;
      this.moveDelay = this.speedConfig.levelDelays[this.speedLevel - 1];
      return true; // 速度提升
    }

    return false;
  }

  /**
   * 获取当前速度信息
   */
  getSpeedInfo() {
    return {
      level: this.speedLevel,
      name: this.speedConfig.levelNames[this.speedLevel - 1],
      delay: this.moveDelay,
      foodCount: this.foodCount
    };
  }

  /**
   * 吃到食物
   */
  eatFood() {
    this.foodCount++;
    this.updateSpeed();
  }

  /**
   * 获取蛇的长度
   */
  getLength() {
    return this.snake.length;
  }

  /**
   * 获取蛇身
   */
  getSnake() {
    return this.snake;
  }
}
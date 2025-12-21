/**
 * 贪吃蛇控制器
 * 负责处理蛇的移动逻辑和方向控制
 * 支持传统4方向和360度移动模式
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

    // 360度移动支持
    this.is360Mode = false;
    this.directionVector = { x: 1, y: 0, magnitude: 0, angle: 0 };
    this.targetDirectionVector = { x: 1, y: 0, magnitude: 0, angle: 0 };
    this.smoothingFactor = 0.3; // 方向变化平滑因子
    this.minMagnitudeForTurn = 0.2; // 最小幅度阈值

    // 网格对齐和移动历史
    this.lastGridDirection = 'RIGHT';
    this.moveHistory = [];
    this.maxHistorySize = 5;

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

    // 初始化360度移动状态
    this.is360Mode = false;
    this.directionVector = { x: 1, y: 0, magnitude: 0, angle: 0 };
    this.targetDirectionVector = { x: 1, y: 0, magnitude: 0, angle: 0 };
    this.lastGridDirection = 'RIGHT';
    this.moveHistory = [];
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

  /**
   * 启用360度移动模式
   */
  enable360Mode(enabled = true) {
    this.is360Mode = enabled;
    if (!enabled) {
      // 切换回传统模式时重置方向向量
      this.directionVector = { x: 1, y: 0, magnitude: 0, angle: 0 };
      this.targetDirectionVector = { x: 1, y: 0, magnitude: 0, angle: 0 };
    }
  }

  /**
   * 设置360度方向向量
   */
  setDirectionVector(vector) {
    if (!this.is360Mode || !vector) return;

    // 更新目标方向向量
    this.targetDirectionVector = { ...vector };

    // 只有当幅度超过阈值时才更新实际方向
    if (vector.magnitude >= this.minMagnitudeForTurn) {
      // 平滑过渡到新方向
      this.directionVector.x = this.lerp(
        this.directionVector.x,
        vector.x,
        this.smoothingFactor
      );
      this.directionVector.y = this.lerp(
        this.directionVector.y,
        vector.y,
        this.smoothingFactor
      );
      this.directionVector.magnitude = vector.magnitude;
      this.directionVector.angle = Math.atan2(
        this.directionVector.y,
        this.directionVector.x
      );

      // 更新对应的网格方向（用于碰撞检测等）
      this.updateGridDirectionFromVector();
    }
  }

  /**
   * 从方向向量更新网格方向
   */
  updateGridDirectionFromVector() {
    const { x, y } = this.directionVector;

    // 将连续方向转换为离散的4个主要方向
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    if (absX > absY) {
      // 水平方向为主
      this.nextDirection = x > 0 ? 'RIGHT' : 'LEFT';
    } else {
      // 垂直方向为主
      this.nextDirection = y > 0 ? 'DOWN' : 'UP';
    }

    // 防止掉头
    const opposites = {
      'UP': 'DOWN',
      'DOWN': 'UP',
      'LEFT': 'RIGHT',
      'RIGHT': 'LEFT'
    };

    if (opposites[this.nextDirection] === this.direction) {
      this.nextDirection = this.direction;
    }
  }

  /**
   * 线性插值函数
   */
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  /**
   * 获取当前方向向量
   */
  getDirectionVector() {
    return { ...this.directionVector };
  }

  /**
   * 获取当前移动角度（弧度）
   */
  getMovementAngle() {
    return this.directionVector.angle;
  }

  /**
   * 检查是否正在移动（360度模式）
   */
  isMoving() {
    return this.is360Mode
      ? this.directionVector.magnitude > this.minMagnitudeForTurn
      : true; // 传统模式下始终在移动
  }

  /**
   * 计算平滑的头部移动位置（360度模式专用）
   */
  calculateSmooth360Movement() {
    if (!this.is360Mode) {
      return null;
    }

    const head = this.snake[0];
    const magnitude = Math.min(this.directionVector.magnitude, 1.0);

    // 如果没有足够的移动输入，保持当前位置
    if (magnitude < this.minMagnitudeForTurn) {
      return null;
    }

    // 根据方向向量计算下一个网格位置
    // 这里使用网格对齐，但考虑了360度方向的平滑过渡
    let nextX = head.x;
    let nextY = head.y;

    const { x, y } = this.directionVector;

    // 根据主要方向分量决定移动方向
    if (Math.abs(x) > Math.abs(y)) {
      // 水平移动为主
      nextX += x > 0 ? 1 : -1;
    } else {
      // 垂直移动为主
      nextY += y > 0 ? 1 : -1;
    }

    // 添加移动历史以平滑移动轨迹
    this.addToMoveHistory({ x: nextX, y: nextY });

    return { x: nextX, y: nextY };
  }

  /**
   * 添加移动到历史记录
   */
  addToMoveHistory(position) {
    this.moveHistory.push(position);
    if (this.moveHistory.length > this.maxHistorySize) {
      this.moveHistory.shift();
    }
  }

  /**
   * 获取预测的移动路径
   */
  getPredictedPath(steps = 3) {
    if (!this.is360Mode || this.moveHistory.length === 0) {
      return [];
    }

    const path = [];
    let currentPos = this.snake[0];
    const trend = this.calculateMovementTrend();

    for (let i = 1; i <= steps; i++) {
      const nextPos = {
        x: Math.round(currentPos.x + trend.x * i),
        y: Math.round(currentPos.y + trend.y * i)
      };

      // 确保位置在网格范围内
      nextPos.x = Math.max(0, Math.min(this.gridWidth - 1, nextPos.x));
      nextPos.y = Math.max(0, Math.min(this.gridHeight - 1, nextPos.y));

      path.push(nextPos);
    }

    return path;
  }

  /**
   * 计算移动趋势
   */
  calculateMovementTrend() {
    if (this.moveHistory.length < 2) {
      return { x: 1, y: 0 }; // 默认向右
    }

    const recent = this.moveHistory.slice(-3); // 取最近3次移动
    let totalX = 0;
    let totalY = 0;

    for (let i = 1; i < recent.length; i++) {
      totalX += recent[i].x - recent[i - 1].x;
      totalY += recent[i].y - recent[i - 1].y;
    }

    const avgX = totalX / (recent.length - 1);
    const avgY = totalY / (recent.length - 1);

    // 归一化
    const magnitude = Math.sqrt(avgX * avgX + avgY * avgY);
    if (magnitude > 0) {
      return { x: avgX / magnitude, y: avgY / magnitude };
    }

    return { x: 1, y: 0 };
  }

  /**
   * 重写move方法以支持360度移动
   */
  move360() {
    if (!this.is360Mode) {
      return this.move();
    }

    // 更新方向
    this.direction = this.nextDirection;

    // 计算平滑移动位置
    const smoothPosition = this.calculateSmooth360Movement();

    let head;
    if (smoothPosition) {
      head = smoothPosition;
    } else {
      // 回退到传统网格移动
      head = this.move();
      return head;
    }

    this.snake.unshift(head);

    // 更新移动历史
    this.addToMoveHistory(head);

    return head;
  }

  /**
   * 检查360度移动是否会碰撞
   */
  check360Collision(nextPosition) {
    if (!this.is360Mode || !nextPosition) {
      return false;
    }

    // 检查墙壁碰撞
    if (nextPosition.x < 0 || nextPosition.x >= this.gridWidth ||
        nextPosition.y < 0 || nextPosition.y >= this.gridHeight) {
      return true;
    }

    // 检查自碰撞
    for (let i = 0; i < this.snake.length; i++) {
      if (nextPosition.x === this.snake[i].x && nextPosition.y === this.snake[i].y) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取360度移动统计信息
   */
  get360Stats() {
    return {
      is360Mode: this.is360Mode,
      currentDirection: this.directionVector,
      targetDirection: this.targetDirectionVector,
      movementAngle: this.directionVector.angle,
      movementMagnitude: this.directionVector.magnitude,
      isMoving: this.isMoving(),
      moveHistory: [...this.moveHistory],
      predictedPath: this.getPredictedPath()
    };
  }
}
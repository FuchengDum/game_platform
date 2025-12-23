/**
 * 贪吃蛇控制器
 * 负责处理蛇的移动逻辑和方向控制
 * 支持传统4方向和360度移动模式
 */
export class SnakeController {
  constructor(gridConfig = { worldGridSize: 200, viewportGridSize: 30, isDynamic: false }) {
    this.gridConfig = gridConfig;
    // 使用世界大小作为游戏边界，而不是视口大小
    this.gridWidth = gridConfig.worldGridSize || gridConfig.gridCount;
    this.gridHeight = gridConfig.worldGridSize || gridConfig.gridCount;

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

    // 特殊效果系统
    this.activeEffects = {
      speed: null,
      shield: null,
      magnet: null
    };
    this.effectUpdateInterval = 100; // 效果更新间隔(ms)
    this.lastEffectUpdateTime = 0;
  }

  /**
   * 初始化蛇
   */
  init() {
    // 蛇出生在世界中心,而不是视口中心
    // 参考 slither.io 设计:蛇出生在大世界中心,摄像机聚焦于蛇
    const worldGridSize = this.gridConfig.worldGridSize || this.gridConfig.gridCount || 200;
    const centerX = Math.floor(worldGridSize / 2);  // 世界中心: 100
    const centerY = Math.floor(worldGridSize / 2);  // 世界中心: 100

    this.snake = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY }
    ];

    // 初始方向改为向上,避免向左移出边界
    this.direction = 'UP';
    this.nextDirection = 'UP';
    this.moveDelay = 120;
    this.baseMoveDelay = 120;
    this.foodCount = 0;
    this.speedLevel = 1;
    this.moveTime = 0;

    console.log('🐍 蛇初始化位置(世界中心):', {
      世界大小: `${this.gridWidth}×${this.gridHeight}`,
      初始位置: `(${centerX}, ${centerY})`,
      完整蛇身: this.snake.map(s => `(${s.x}, ${s.y})`).join(', '),
      初始方向: 'UP'
    });

    // 初始化360度移动状态
    this.is360Mode = false;
    this.directionVector = { x: 1, y: 0, magnitude: 0, angle: 0 };
    this.targetDirectionVector = { x: 1, y: 0, magnitude: 0, angle: 0 };
    this.lastGridDirection = 'UP';
    this.moveHistory = [];

    // 重置特殊效果
    this.resetEffects();
  }

  /**
   * 更新移动方向
   * 修改：允许设置任意方向，包括反向，在移动时专门处理
   */
  setDirection(newDirection) {
    // 直接设置新方向，允许反向移动
    // 反向移动的特殊处理将在碰撞检测阶段进行
    this.nextDirection = newDirection;
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

    // 详细日志:帮助调试边界碰撞问题
    if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
      console.warn('🚧 墙壁碰撞检测:', {
        蛇头位置: `(${head.x}, ${head.y})`,
        世界大小: `${gridWidth}×${gridHeight}`,
        有效坐标: `X: 0-${gridWidth - 1}, Y: 0-${gridHeight - 1}`,
        碰撞原因: [
          head.x < 0 ? 'X坐标小于0(左边界)' : null,
          head.x >= gridWidth ? `X坐标大于等于${gridWidth}(右边界)` : null,
          head.y < 0 ? 'Y坐标小于0(上边界)' : null,
          head.y >= gridHeight ? `Y坐标大于等于${gridHeight}(下边界)` : null
        ].filter(Boolean).join(' 或 ')
      });
      return true;
    }

    return false;
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
   * 修改：蛇头接近蛇尾时视为安全移动，因为蛇尾会被移除
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
        // 如果蛇头会移动到蛇尾位置（最后一个位置），且蛇长度大于1
        // 这是安全的，因为蛇尾会在移动后被移除
        if (i === this.snake.length - 1 && this.snake.length > 1) {
          return false; // 安全移动：蛇头可以移动到蛇尾位置
        }
        // 其他情况（撞到身体其他部位）仍然是致命碰撞
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

    // 检查是否为快速反向操作
    if (vector.magnitude >= this.minMagnitudeForTurn && this.snake.length > 1) {
      const isReverse = this.checkIfReverseDirection(vector);
      if (isReverse) {
        console.log(`🚫 检测到快速反向操作，阻止以防止游戏结束`);
        return; // 阻止反向操作
      }
    }

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
   * 检查是否为反向操作（防止快速反向导致游戏结束）
   */
  checkIfReverseDirection(newVector) {
    if (this.snake.length < 2) return false;

    // 获取蛇头和蛇颈的位置
    const head = this.snake[0];
    const neck = this.snake[1]; // 蛇头后的第一个身体部分

    // 计算当前移动方向（从蛇颈到蛇头的向量）
    const currentDirectionX = head.x - neck.x;
    const currentDirectionY = head.y - neck.y;

    // 计算新的移动方向（归一化的摇杆向量）
    const newDirectionX = newVector.x;
    const newDirectionY = newVector.y;

    // 计算点积，判断是否为反向（点积为负表示角度大于90度）
    const dotProduct = currentDirectionX * newDirectionX + currentDirectionY * newDirectionY;

    // 如果点积小于0且新的方向强度足够，认为是反向操作
    if (dotProduct < -0.5 && newVector.magnitude > 0.7) {
      return true;
    }

    return false;
  }

  /**
   * 从方向向量更新网格方向
   * 在360度模式下保持方向向量的连续性，同时提供传统方向支持
   */
  updateGridDirectionFromVector() {
    const { x, y } = this.directionVector;

    // 在360度模式下，主要使用方向向量而不是传统四方向
    if (this.is360Mode) {
      // 360度模式下，为了兼容性仍然设置一个主要方向
      // 但实际移动使用calculateSmooth360Movement中的完整向量计算
      const absX = Math.abs(x);
      const absY = Math.abs(y);

      if (absX > absY) {
        // 水平方向为主
        this.nextDirection = x > 0 ? 'RIGHT' : 'LEFT';
      } else {
        // 垂直方向为主
        this.nextDirection = y > 0 ? 'DOWN' : 'UP';
      }
    } else {
      // 传统模式：严格四方向转换
      const absX = Math.abs(x);
      const absY = Math.abs(y);

      if (absX > absY) {
        this.nextDirection = x > 0 ? 'RIGHT' : 'LEFT';
      } else {
        this.nextDirection = y > 0 ? 'DOWN' : 'UP';
      }

      // 防止掉头（仅传统模式）
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
   * 真正的360度移动实现，支持任意角度移动
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

    // 真正的360度移动计算
    const { x, y, angle } = this.directionVector;

    // 移动距离：每次移动一个网格单位，但方向可以是任意角度
    const moveDistance = 1.0;

    // 计算下一个位置（支持浮点坐标）
    let nextX = head.x + Math.cos(angle) * moveDistance;
    let nextY = head.y + Math.sin(angle) * moveDistance;

    // 网格对齐：为了保持游戏的网格特性，将位置对齐到最近的网格点
    // 但保留移动方向，允许更流畅的转向
    const gridAlignedX = Math.round(nextX);
    const gridAlignedY = Math.round(nextY);

    // 只有当移动距离超过半个网格单位时才真正移动到新网格
    const distanceFromCurrent = Math.sqrt(
      Math.pow(gridAlignedX - head.x, 2) +
      Math.pow(gridAlignedY - head.y, 2)
    );

    if (distanceFromCurrent >= 0.5) {
      // 移除反向移动阻止逻辑，在碰撞检测阶段统一处理
      // 这样可以让反向移动被正确地处理为方向改变而不是游戏结束

      // 添加移动历史
      this.addToMoveHistory({ x: gridAlignedX, y: gridAlignedY });

      return { x: gridAlignedX, y: gridAlignedY };
    }

    return null;
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
        // 如果蛇头会移动到蛇尾位置，且蛇长度大于1
        // 这是安全的，因为蛇尾会在移动后被移除
        if (i === this.snake.length - 1 && this.snake.length > 1) {
          return false; // 安全移动：蛇头可以移动到蛇尾位置
        }
        return true;
      }
    }

    return false;
  }

  
  /**
   * 应用速度提升效果
   * @param {number} multiplier - 速度倍数
   * @param {number} duration - 持续时间（毫秒）
   */
  applySpeedBoost(multiplier = 1.2, duration = 5000) {
    if (!multiplier || multiplier <= 1 || duration <= 0) return;

    console.log(`⚡ 速度提升效果: ${multiplier}倍速度, ${duration}ms持续时间`);

    // 设置速度效果
    this.activeEffects.speed = {
      multiplier: multiplier,
      endTime: Date.now() + duration,
      originalDelay: this.baseMoveDelay
    };

    // 立即应用速度变化
    this.updateMoveDelay();
  }

  /**
   * 应用护盾效果
   * @param {number} strength - 护盾强度（生命值）
   * @param {number} duration - 持续时间（毫秒）
   */
  applyShield(strength = 1, duration = 5000) {
    if (!strength || strength <= 0 || duration <= 0) return;

    console.log(`🛡️ 护盾效果: 强度${strength}, ${duration}ms持续时间`);

    // 设置护盾效果
    this.activeEffects.shield = {
      strength: strength,
      endTime: Date.now() + duration,
      currentStrength: strength
    };
  }

  /**
   * 更新所有活跃效果
   */
  updateEffects() {
    const currentTime = Date.now();

    // 检查并更新速度效果
    if (this.activeEffects.speed && currentTime >= this.activeEffects.speed.endTime) {
      console.log('⏱️ 速度提升效果结束');
      this.activeEffects.speed = null;
      this.updateMoveDelay();
    }

    // 检查并更新护盾效果
    if (this.activeEffects.shield && currentTime >= this.activeEffects.shield.endTime) {
      console.log('⏱️ 护盾效果结束');
      this.activeEffects.shield = null;
    }

    // 可以在这里添加磁铁效果的更新逻辑
  }

  /**
   * 更新移动延迟（考虑速度效果）
   */
  updateMoveDelay() {
    if (this.activeEffects.speed) {
      // 应用速度倍数
      this.moveDelay = Math.max(
        30, // 最小移动延迟
        Math.floor(this.baseMoveDelay / this.activeEffects.speed.multiplier)
      );
    } else {
      this.moveDelay = this.baseMoveDelay;
    }
  }

  /**
   * 重置所有效果
   */
  resetEffects() {
    this.activeEffects = {
      speed: null,
      shield: null,
      magnet: null
    };
    this.updateMoveDelay();
  }

  /**
   * 检查护盾状态并处理碰撞
   * @param {Object} collisionInfo - 碰撞信息
   * @returns {boolean} - 是否应该保护蛇免受伤害
   */
  checkShieldProtection(collisionInfo) {
    if (!this.activeEffects.shield || this.activeEffects.shield.currentStrength <= 0) {
      return false;
    }

    // 消耗护盾强度
    this.activeEffects.shield.currentStrength--;
    console.log(`🛡️ 护盾保护: 剩余强度 ${this.activeEffects.shield.currentStrength}`);

    // 如果护盾强度为0，移除护盾效果
    if (this.activeEffects.shield.currentStrength <= 0) {
      this.activeEffects.shield = null;
      console.log('💥 护盾破碎');
    }

    return true;
  }

  /**
   * 获取当前效果状态
   */
  getActiveEffects() {
    return {
      speed: this.activeEffects.speed ? {
        multiplier: this.activeEffects.speed.multiplier,
        timeRemaining: Math.max(0, this.activeEffects.speed.endTime - Date.now()),
        isActive: true
      } : { isActive: false },
      shield: this.activeEffects.shield ? {
        strength: this.activeEffects.shield.currentStrength,
        timeRemaining: Math.max(0, this.activeEffects.shield.endTime - Date.now()),
        isActive: true
      } : { isActive: false },
      magnet: this.activeEffects.magnet ? {
        timeRemaining: Math.max(0, this.activeEffects.magnet.endTime - Date.now()),
        isActive: true
      } : { isActive: false }
    };
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
      predictedPath: this.getPredictedPath(),
      activeEffects: this.getActiveEffects()
    };
  }

  /**
   * 更新世界大小（用于响应式调整）
   */
  updateWorldSize() {
    if (this.gridConfig && this.gridConfig.worldGridSize) {
      const oldWidth = this.gridWidth;
      const oldHeight = this.gridHeight;

      this.gridWidth = this.gridConfig.worldGridSize;
      this.gridHeight = this.gridConfig.worldGridSize;

      console.log('🐍 SnakeController世界大小更新:', {
        from: `${oldWidth}×${oldHeight}`,
        to: `${this.gridWidth}×${this.gridHeight}`
      });

      // 如果蛇的位置超出了新的世界边界，将其移回边界内
      if (this.snake.length > 0) {
        this.snake.forEach(segment => {
          segment.x = Math.max(0, Math.min(this.gridWidth - 1, segment.x));
          segment.y = Math.max(0, Math.min(this.gridHeight - 1, segment.y));
        });
      }
    }
  }
}
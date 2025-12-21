/**
 * 游戏渲染器
 * 负责渲染游戏画面，包括网格、蛇、食物等
 */
const GRID_SIZE = 20;

export class GameRenderer {
  constructor(scene) {
    this.scene = scene;
    this.graphics = null;
    // 动态网格配置
    this.isMobile = this.detectMobile();
    this.gridConfig = this.calculateGridConfig();

    // 分数显示相关
    this.scoreText = null;
    this.infoTexts = [];
  }

  /**
   * 检测是否为移动设备
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth < 768;
  }

  /**
   * 计算网格配置 - 参考Slither.io设计理念
   */
  calculateGridConfig() {
    // 参考Slither.io设计：巨大的游戏世界，但只显示玩家周围区域
    // 使用更大的游戏世界，让蛇有足够的空间移动

    // 游戏世界大小（实际游戏逻辑使用的网格）
    const worldGridSize = 200; // 200x200的巨大世界，参考Slither.io

    // 视口大小（屏幕上显示的网格区域）
    let viewportGridSize;

    if (this.isMobile) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight - 60; // 减去顶部控制栏高度
      const minDimension = Math.min(screenWidth, screenHeight);

      // 移动端显示区域根据屏幕大小调整
      if (minDimension < 400) {
        viewportGridSize = 25; // 超小屏幕显示25x25
      } else if (minDimension < 600) {
        viewportGridSize = 35; // 小屏幕显示35x35
      } else if (minDimension < 800) {
        viewportGridSize = 45; // 中屏幕显示45x45
      } else {
        viewportGridSize = 55; // 大屏幕移动设备显示55x55
      }
    } else {
      // PC端显示更大的区域
      viewportGridSize = 70; // PC端显示70x70的视口
    }

    return {
      worldGridSize: worldGridSize,    // 实际游戏世界大小
      viewportGridSize: viewportGridSize, // 屏幕显示的视口大小
      gridCount: viewportGridSize,      // 保持兼容性，使用视口大小
      isDynamic: true,
      useCameraFollow: true            // 启用摄像头跟随
    };
  }

  /**
   * 获取当前网格配置
   */
  getGridConfig() {
    return this.gridConfig;
  }

  /**
   * 初始化渲染器
   */
  init() {
    this.graphics = this.scene.add.graphics();
    this.createScoreDisplay();
  }

  /**
   * 创建分数显示
   */
  createScoreDisplay() {
    const sceneWidth = this.scene.cameras.main.width;

    if (this.isMobile) {
      // 移动端：在顶部显示分数
      this.scoreText = this.scene.add.text(10, 10, '', {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: { x: 8, y: 4 },
        borderRadius: 8
      });
      this.scoreText.setOrigin(0, 0);
      this.scoreText.setScrollFactor(0); // 固定在屏幕上

      // 速度等级显示
      this.infoTexts.push(
        this.scene.add.text(sceneWidth - 10, 10, '', {
          fontSize: '14px',
          color: '#fbbf24',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: { x: 8, y: 4 },
          borderRadius: 8
        }).setOrigin(1, 0).setScrollFactor(0)
      );

      // 网格大小提示 - 增加更多信息
      const gridArea = this.gridConfig.gridCount * this.gridConfig.gridCount;
      this.infoTexts.push(
        this.scene.add.text(sceneWidth / 2, 10, `${this.gridConfig.gridCount}×${this.gridConfig.gridCount} (${gridArea}格)`, {
          fontSize: '12px',
          color: '#94a3b8',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: { x: 6, y: 3 },
          borderRadius: 6
        }).setOrigin(0.5, 0).setScrollFactor(0)
      );
    } else {
      // PC端：在左上角显示分数信息
      const startY = 20;
      this.scoreText = this.scene.add.text(20, startY, '', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: { x: 12, y: 8 },
        borderRadius: 10
      });
      this.scoreText.setOrigin(0, 0);
      this.scoreText.setScrollFactor(0);

      // 速度信息
      this.infoTexts.push(
        this.scene.add.text(20, startY + 40, '', {
          fontSize: '16px',
          color: '#10b981',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: { x: 10, y: 6 },
          borderRadius: 8
        }).setOrigin(0, 0).setScrollFactor(0)
      );

      // 蛇长度信息
      this.infoTexts.push(
        this.scene.add.text(20, startY + 75, '', {
          fontSize: '16px',
          color: '#3b82f6',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: { x: 10, y: 6 },
          borderRadius: 8
        }).setOrigin(0, 0).setScrollFactor(0)
      );

      // 最高分信息
      this.infoTexts.push(
        this.scene.add.text(20, startY + 110, '', {
          fontSize: '14px',
          color: '#fbbf24',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: { x: 10, y: 6 },
          borderRadius: 8
        }).setOrigin(0, 0).setScrollFactor(0)
      );
    }
  }

  /**
   * 更新分数显示
   */
  updateScoreDisplay(gameStats, gameState) {
    if (!this.scoreText) return;

    if (this.isMobile) {
      // 移动端：简洁显示
      this.scoreText.setText(`🏆 ${gameState.score} 分`);

      // 更新速度等级显示
      if (this.infoTexts[0]) {
        const speedIcon = this.getSpeedIcon(gameStats.speedName);
        this.infoTexts[0].setText(`${speedIcon} ${gameStats.speedName}`);
      }
    } else {
      // PC端：详细信息显示
      this.scoreText.setText(`🎮 得分: ${gameState.score}`);

      // 更新速度信息
      if (this.infoTexts[0]) {
        this.infoTexts[0].setText(`⚡ 速度: Lv.${gameStats.level} ${gameStats.speedName}`);
      }

      // 更新蛇长度信息
      if (this.infoTexts[1]) {
        this.infoTexts[1].setText(`🐍 长度: ${gameStats.snakeLength} 节`);
      }

      // 更新最高分信息
      if (this.infoTexts[2]) {
        const recordText = gameState.isNewRecord ? '🆕 新纪录!' : `📈 最高分`;
        this.infoTexts[2].setText(`${recordText}: ${gameState.highScore}`);
      }
    }
  }

  /**
   * 获取速度等级图标
   */
  getSpeedIcon(speedName) {
    const icons = {
      '熟练': '🟢',
      '优秀': '🔵',
      '专家': '🟡',
      '大师': '🟠',
      '王者': '🔴',
      '传奇': '👑',
      '神话': '⚡',
      '至尊': '🔥',
      '极速': '💫',
      '闪电': '⚡'
    };
    return icons[speedName] || '⚡';
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
   * 绘制居中的蛇
   */
  drawSnakeCentered(snake, isBlinking, offsetX, offsetY, gridSize) {
    if (!snake || snake.length === 0) return;

    snake.forEach((segment, index) => {
      const x = offsetX + segment.x * gridSize + gridSize / 2;
      const y = offsetY + segment.y * gridSize + gridSize / 2;

      if (index === 0) {
        // 蛇头
        this.drawSnakeHeadCentered(x, y, gridSize, isBlinking);
      } else {
        // 蛇身
        this.drawSnakeBodyCentered(x, y, gridSize, index, snake.length);
      }
    });
  }

  /**
   * 绘制居中的蛇头
   */
  drawSnakeHeadCentered(x, y, gridSize, isBlinking) {
    const headColor = 0x4ade80;
    const eyeColor = isBlinking ? headColor : 0x1a1a2e;

    // 蛇头主体
    this.graphics.fillStyle(headColor);
    this.graphics.fillCircle(x, y, gridSize / 2 - 1);

    // 眼睛
    this.graphics.fillStyle(eyeColor);
    const eyeSize = Math.max(2, gridSize / 10);
    const eyeOffset = gridSize / 4;

    this.graphics.fillCircle(x - eyeOffset, y - eyeOffset, eyeSize);
    this.graphics.fillCircle(x + eyeOffset, y - eyeOffset, eyeSize);
  }

  /**
   * 绘制居中的蛇身
   */
  drawSnakeBodyCentered(x, y, gridSize, index, totalLength) {
    // 渐变颜色
    const intensity = Math.max(0.3, 1 - (index / totalLength) * 0.5);
    const color = Math.floor(0x22c55e * intensity);

    this.graphics.fillStyle(color);
    this.graphics.fillCircle(x, y, gridSize / 2 - 2);
  }

  /**
   * 绘制居中的食物
   */
  drawFoodCentered(food, offsetX, offsetY, gridSize) {
    if (!food) return;

    const x = offsetX + food.x * gridSize + gridSize / 2;
    const y = offsetY + food.y * gridSize + gridSize / 2;

    // 食物主体
    this.graphics.fillStyle(0xef4444);
    this.graphics.fillCircle(x, y, gridSize / 2 - 2);

    // 食物高光
    this.graphics.fillStyle(0xfca5a5);
    const highlightSize = Math.max(2, gridSize / 8);
    this.graphics.fillCircle(x - highlightSize, y - highlightSize, highlightSize);
  }

  /**
   * 绘制PowerUpManager的食物
   * @param {Object} foodItem - PowerUpManager的食物对象 { position, type }
   * @param {number} offsetX - X偏移量
   * @param {number} offsetY - Y偏移量
   * @param {number} gridSize - 网格大小
   */
  drawPowerUpFood(foodItem, offsetX, offsetY, gridSize) {
    if (!foodItem || !foodItem.position || !foodItem.type) return;

    const x = offsetX + foodItem.position.x * gridSize + gridSize / 2;
    const y = offsetY + foodItem.position.y * gridSize + gridSize / 2;
    const foodType = foodItem.type;
    const size = (gridSize / 2 - 2) * (foodType.visual?.size || 1.0);
    const color = foodType.color || 0xff6b6b;

    // 绘制食物主体
    this.graphics.fillStyle(color);
    this.graphics.fillCircle(x, y, size);

    // 根据食物类型添加特殊视觉效果
    if (foodType.visual?.particles && size > gridSize * 0.3) {
      // 绘制粒子效果
      this.drawFoodParticles(x, y, size, foodType.visual.particleColor || color);
    }

    // 添加稀有度边框
    const rarityColors = {
      common: 0x666666,
      uncommon: 0x22c55e,
      rare: 0x3b82f6,
      epic: 0xa855f7,
      legendary: 0xf59e0b
    };
    const borderColor = rarityColors[foodType.rarity] || 0x666666;
    this.graphics.lineStyle(2, borderColor);
    this.graphics.strokeCircle(x, y, size);

    // 大型食物添加发光效果
    if (size > gridSize * 0.4) {
      this.graphics.lineStyle(1, color, 0.3);
      this.graphics.strokeCircle(x, y, size * 1.2);
    }

    // 食物高光
    this.graphics.fillStyle(0xffffff, 0.4);
    const highlightSize = Math.max(2, size / 4);
    this.graphics.fillCircle(x - highlightSize, y - highlightSize, highlightSize);
  }

  /**
   * 绘制食物粒子效果
   * @param {number} centerX - 中心X坐标
   * @param {number} centerY - 中心Y坐标
   * @param {number} mainRadius - 主圆半径
   * @param {number} particleColor - 粒子颜色
   */
  drawFoodParticles(centerX, centerY, mainRadius, particleColor) {
    const particleCount = 4;
    const particleRadius = mainRadius * 0.15;
    const distance = mainRadius * 1.8;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      this.graphics.fillStyle(particleColor, 0.6);
      this.graphics.fillCircle(x, y, particleRadius);
    }
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
   * @param {Array} snake - 蛇身体段落数组
   * @param {Array|Object} food - 食物数组或单个食物对象（向后兼容）
   * @param {boolean} isBlinking - 是否在眨眼
   * @param {Object} gameStats - 游戏统计数据
   * @param {Object} gameState - 游戏状态
   */
  render(snake, food, isBlinking = false, gameStats = null, gameState = null) {
    if (!this.graphics) {
      return;
    }

    // 获取游戏场景的实际尺寸
    const sceneWidth = this.scene.cameras.main.width;
    const sceneHeight = this.scene.cameras.main.height;

    // 计算游戏区域尺寸（保持正方形，并留有适当边距）
    const padding = this.isMobile ? Math.min(sceneWidth, sceneHeight) * 0.015 : 10; // 移动端1.5%边距，PC端固定10px

    // 计算最大游戏区域，考虑左侧贴边的布局
    let maxGameSize;
    if (this.isMobile) {
      // 移动端：利用更多水平空间，右侧保留padding
      maxGameSize = Math.min(sceneWidth - padding * 1.5, sceneHeight - padding * 2);
    } else {
      // PC端：保持对称布局
      maxGameSize = Math.min(sceneWidth, sceneHeight) - (padding * 2);
    }

    const gameSize = Math.max(320, maxGameSize); // 最小320px，确保有足够空间

    // 计算游戏区域的偏移量
    let offsetX, offsetY;
    if (this.isMobile) {
      // 移动端：左侧贴边，减少左侧间距
      offsetX = padding * 0.5; // 左侧间距只有padding的一半
      offsetY = (sceneHeight - gameSize) / 2; // 垂直方向保持居中
    } else {
      // PC端：保持居中，但减少整体边距
      offsetX = (sceneWidth - gameSize) / 2;
      offsetY = (sceneHeight - gameSize) / 2;
    }

    // 摄像头跟随逻辑 - 参考Slither.io设计
    let cameraOffsetX = 0;
    let cameraOffsetY = 0;

    if (this.gridConfig.useCameraFollow && snake.length > 0) {
      const snakeHead = snake[0];
      const worldGridSize = this.gridConfig.worldGridSize;
      const viewportGridSize = this.gridConfig.viewportGridSize;
      const gridSize = gameSize / viewportGridSize;

      // 计算蛇头在世界中的位置
      const worldX = snakeHead.x * gridSize;
      const worldY = snakeHead.y * gridSize;

      // 计算摄像头应该偏移到让蛇头居中的位置
      cameraOffsetX = -worldX + sceneWidth / 2;
      cameraOffsetY = -worldY + sceneHeight / 2;

      // 限制摄像头边界，不能超出世界边界
      const maxOffsetX = 0;
      const maxOffsetY = 0;
      const minOffsetX = -(worldGridSize * gridSize - sceneWidth);
      const minOffsetY = -(worldGridSize * gridSize - sceneHeight);

      cameraOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, cameraOffsetX));
      cameraOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, cameraOffsetY));

      // 应用摄像头偏移
      offsetX += cameraOffsetX;
      offsetY += cameraOffsetY;
    }

    this.clear();

    // 绘制背景
    this.graphics.fillStyle(0x1a1a2e);
    this.graphics.fillRect(0, 0, sceneWidth, sceneHeight);

    // 使用视口网格配置进行渲染
    const viewportGridSize = this.gridConfig.viewportGridSize;
    const gridSize = gameSize / viewportGridSize;

    // 绘制视口内的网格线
    this.graphics.lineStyle(1, 0x2a2a4e, 0.3);
    for (let i = 0; i <= viewportGridSize; i++) {
      // 垂直线
      const x = offsetX + i * gridSize;
      this.graphics.beginPath();
      this.graphics.moveTo(x, offsetY);
      this.graphics.lineTo(x, offsetY + gameSize);
      this.graphics.strokePath();

      // 水平线
      const y = offsetY + i * gridSize;
      this.graphics.beginPath();
      this.graphics.moveTo(offsetX, y);
      this.graphics.lineTo(offsetX + gameSize, y);
      this.graphics.strokePath();
    }

    // 更新绘制函数以使用居中坐标
    this.drawSnakeCentered(snake, isBlinking, offsetX, offsetY, gridSize);

    // 绘制食物 - 支持数组和单个对象
    if (Array.isArray(food)) {
      // 绘制多个食物（PowerUpManager系统）
      food.forEach(foodItem => {
        if (foodItem && foodItem.position) {
          // PowerUpManager的食物对象格式：{ position: {x, y}, type: {...} }
          this.drawPowerUpFood(foodItem, offsetX, offsetY, gridSize);
        } else if (foodItem) {
          // 兼容旧格式
          this.drawFoodCentered(foodItem, offsetX, offsetY, gridSize);
        }
      });
    } else {
      // 绘制单个食物（传统系统）
      this.drawFoodCentered(food, offsetX, offsetY, gridSize);
    }

    // 更新分数显示
    if (gameStats && gameState) {
      this.updateScoreDisplay(gameStats, gameState);
    }
  }

  /**
   * 销毁渲染器
   */
  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }

    // 清理分数显示文本
    if (this.scoreText) {
      this.scoreText.destroy();
      this.scoreText = null;
    }

    // 清理其他信息文本
    this.infoTexts.forEach(text => {
      if (text) {
        text.destroy();
      }
    });
    this.infoTexts = [];
  }
}
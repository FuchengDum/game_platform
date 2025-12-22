/**
 * 游戏渲染器
 * 负责渲染游戏世界、蛇、食物和UI元素
 * 采用视口+摄像头跟随模式，支持大世界+小视口
 */

export class GameRenderer {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.scoreText = null;
    this.infoTexts = [];
    this.isMobile = this.detectMobile();
    this.gridConfig = this.calculateGridConfig();
    this.createScoreDisplay();
  }

  /**
   * 检测是否为移动设备
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth < 768;
  }

  /**
   * 计算网格配置（固定值，不再动态调整）
   */
  calculateGridConfig() {
    // 游戏世界大小（实际游戏逻辑使用的网格）
    const worldGridSize = 200; // 200x200的巨大世界

    // 视口大小（屏幕上显示的网格区域）- 固定值
    let viewportGridSize;

    if (this.isMobile) {
      viewportGridSize = 25; // 移动端固定25x25网格
      console.log('🎮 移动端网格配置（固定）:', { viewportGridSize, worldGridSize });
    } else {
      viewportGridSize = 80; // PC端固定80x80网格
      console.log('🖥️ PC端网格配置（固定）:', { viewportGridSize, worldGridSize });
    }

    return {
      worldGridSize,
      viewportGridSize,
      gridCount: viewportGridSize,
      isDynamic: false,
      useCameraFollow: true
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
    // 移动端使用MobileUIRenderer显示HUD，这里不再创建
    if (this.isMobile) {
      console.log('📱 移动端：跳过GameRenderer HUD创建，使用MobileUIRenderer');
      return;
    }

    const sceneWidth = this.scene.cameras.main.width;

    // PC端：在左上角显示分数信息
    const infoY = 16;

    this.scoreText = this.scene.add.text(20, infoY, '', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: { x: 12, y: 8 },
      borderRadius: 8,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, shadowBlur: 8 }
    });
    this.scoreText.setOrigin(0, 0);
    this.scoreText.setScrollFactor(0);

    this.infoTexts.push(
      this.scene.add.text(sceneWidth - 20, infoY, '', {
        fontSize: '16px',
        color: '#fbbf24',
        fontStyle: 'bold',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: { x: 10, y: 6 },
        borderRadius: 6
      }).setOrigin(1, 0).setScrollFactor(0)
    );
  }

  /**
   * 更新分数显示
   */
  updateScoreDisplay(gameStats, gameState) {
    // 移动端使用MobileUIRenderer，不更新此HUD
    if (this.isMobile || !this.scoreText) return;

    const { score, speedLevel } = gameStats;
    const scoreText = `得分: ${score}`;
    this.scoreText.setText(scoreText);

    if (this.infoTexts.length > 0) {
      const speedText = `速度: ${speedLevel}`;
      this.infoTexts[0].setText(speedText);
    }
  }

  /**
   * 渲染游戏场景
   */
  render(snake, food, isBlinking, gameStats, gameState) {
    if (!this.graphics) return;

    // 清空画布
    this.graphics.clear();

    // 获取场景尺寸
    const sceneWidth = this.scene.cameras.main.width;
    const sceneHeight = this.scene.cameras.main.height;

    console.log('🎮 GameRenderer: 最终场景尺寸', {
      sceneWidth,
      sceneHeight,
      isLandscape: sceneWidth > sceneHeight
    });

    // 计算游戏区域尺寸（根据设备类型优化布局）
    let gameSize, padding;

    if (this.isMobile) {
      padding = 0;
      const isLandscape = sceneWidth > sceneHeight;

      if (isLandscape) {
        // 横屏模式：使用屏幕较小边（高度）作为游戏大小，保持元素视觉一致
        gameSize = Math.min(sceneWidth, sceneHeight);
        console.log('📱 横屏模式：使用较小边保持元素尺寸', {
          width: sceneWidth,
          height: sceneHeight,
          gameSize: gameSize
        });
      } else {
        // 竖屏模式：使用较小的维度确保完整显示
        gameSize = Math.min(sceneWidth, sceneHeight);
        console.log('📱 竖屏模式：使用较小维度', {
          width: sceneWidth,
          height: sceneHeight,
          gameSize: gameSize
        });
      }

      gameSize = Math.max(300, gameSize);
    } else {
      padding = 10;
      const availableSize = Math.min(sceneWidth, sceneHeight) - (padding * 2);
      gameSize = Math.max(600, Math.min(availableSize, 1000));
    }

    // 计算游戏区域的偏移量
    let offsetX, offsetY;
    if (this.isMobile) {
      const isLandscape = sceneWidth > sceneHeight;

      if (isLandscape) {
        // 横屏模式：游戏区域居中（因为gameSize使用较小边）
        offsetX = (sceneWidth - gameSize) / 2;
        offsetY = (sceneHeight - gameSize) / 2;
        console.log('📱 横屏偏移量：游戏区域居中', {
          offsetX: offsetX,
          offsetY: offsetY,
          sceneWidth: sceneWidth,
          sceneHeight: sceneHeight,
          gameSize: gameSize
        });
      } else {
        // 竖屏模式：横向居中，纵向填满
        offsetX = (sceneWidth - gameSize) / 2;
        offsetY = (sceneHeight - gameSize) / 2;
      }
    } else {
      // PC端：完全居中布局
      offsetX = (sceneWidth - gameSize) / 2;
      offsetY = (sceneHeight - gameSize) / 2;
    }

    // 摄像头跟随逻辑
    let cameraOffsetX = 0;
    let cameraOffsetY = 0;

    if (this.gridConfig.useCameraFollow && snake.length > 0) {
      const snakeHead = snake[0];
      const worldGridSize = this.gridConfig.worldGridSize;
      const viewportGridSize = this.gridConfig.viewportGridSize;
      const gridSize = gameSize / viewportGridSize;

      const worldX = snakeHead.x * gridSize;
      const worldY = snakeHead.y * gridSize;

      cameraOffsetX = -worldX + sceneWidth / 2;
      cameraOffsetY = -worldY + sceneHeight / 2;

      const maxOffsetX = 0;
      const maxOffsetY = 0;
      const minOffsetX = -(worldGridSize * gridSize - sceneWidth);
      const minOffsetY = -(worldGridSize * gridSize - sceneHeight);

      cameraOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, cameraOffsetX));
      cameraOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, cameraOffsetY));
    }

    // 使用视口网格配置进行渲染
    const viewportGridSize = this.gridConfig.viewportGridSize;
    const gridSize = gameSize / viewportGridSize;

    // 移动端和PC端使用固定的元素大小比例
    let baseSnakeSize, baseFoodSize;

    if (this.isMobile) {
      // 移动端：固定比例，不动态调整
      baseSnakeSize = Math.max(3, gridSize * 0.35);
      baseFoodSize = Math.max(2.5, gridSize * 0.30);

      console.log('🎮 移动端元素大小（固定比例）:', {
        gridSize: gridSize.toFixed(2),
        baseSnakeSize: baseSnakeSize.toFixed(2),
        baseFoodSize: baseFoodSize.toFixed(2),
        ratio: '蛇35% / 食物30%'
      });
    } else {
      // PC端：固定比例
      baseSnakeSize = Math.max(4, gridSize * 0.40);
      baseFoodSize = Math.max(3, gridSize * 0.35);

      console.log('🖥️ PC端元素大小（固定比例）:', {
        gridSize: gridSize.toFixed(2),
        baseSnakeSize: baseSnakeSize.toFixed(2),
        baseFoodSize: baseFoodSize.toFixed(2),
        ratio: '蛇40% / 食物35%'
      });
    }

    // 绘制视口内的网格线
    // 应用摄像头偏移量：绘制坐标 = 游戏区域偏移 + 摄像头偏移
    this.graphics.lineStyle(1, 0x2a2a4e, 0.3);
    for (let i = 0; i <= viewportGridSize; i++) {
      const x = offsetX + cameraOffsetX + i * gridSize;
      this.graphics.beginPath();
      this.graphics.moveTo(x, offsetY + cameraOffsetY);
      this.graphics.lineTo(x, offsetY + cameraOffsetY + gameSize);
      this.graphics.strokePath();

      const y = offsetY + cameraOffsetY + i * gridSize;
      this.graphics.beginPath();
      this.graphics.moveTo(offsetX + cameraOffsetX, y);
      this.graphics.lineTo(offsetX + cameraOffsetX + gameSize, y);
      this.graphics.strokePath();
    }

    // 更新绘制函数以使用居中坐标 + 摄像头偏移
    this.drawSnakeCentered(snake, isBlinking, offsetX + cameraOffsetX, offsetY + cameraOffsetY, gridSize, baseSnakeSize);

    // 绘制食物
    if (Array.isArray(food)) {
      food.forEach(foodItem => {
        if (foodItem && foodItem.position) {
          this.drawPowerUpFood(foodItem, offsetX + cameraOffsetX, offsetY + cameraOffsetY, gridSize, baseFoodSize);
        } else if (foodItem) {
          this.drawFoodCentered(foodItem, offsetX + cameraOffsetX, offsetY + cameraOffsetY, gridSize, baseFoodSize);
        }
      });
    } else {
      this.drawFoodCentered(food, offsetX + cameraOffsetX, offsetY + cameraOffsetY, gridSize, baseFoodSize);
    }

    // 更新分数显示
    if (gameStats && gameState) {
      this.updateScoreDisplay(gameStats, gameState);
    }
  }

  /**
   * 绘制蛇（居中坐标）
   */
  drawSnakeCentered(snake, isBlinking, offsetX, offsetY, gridSize, baseSnakeSize) {
    if (!snake || snake.length === 0) return;

    snake.forEach((segment, index) => {
      const x = offsetX + segment.x * gridSize;
      const y = offsetY + segment.y * gridSize;
      const radius = baseSnakeSize;

      if (index === 0) {
        // 蛇头
        this.graphics.fillStyle(isBlinking ? 0x00ff00 : 0x4ade80, 0.9);
        this.graphics.fillCircle(x, y, radius * 1.2);

        // 蛇头高光
        this.graphics.fillStyle(0xffffff, 0.4);
        this.graphics.fillCircle(x - radius * 0.3, y - radius * 0.3, radius * 0.4);
      } else {
        // 蛇身
        const alpha = 1 - (index / snake.length) * 0.5;
        this.graphics.fillStyle(0x22c55e, alpha);
        this.graphics.fillCircle(x, y, radius);
      }
    });
  }

  /**
   * 绘制食物（居中坐标）
   */
  drawFoodCentered(food, offsetX, offsetY, gridSize, baseFoodSize) {
    if (!food) return;

    const x = offsetX + food.x * gridSize;
    const y = offsetY + food.y * gridSize;
    const radius = baseFoodSize;

    // 发光效果
    this.graphics.lineStyle(2, 0xf59e0b, 0.5);
    this.graphics.strokeCircle(x, y, radius * 1.5);

    // 本体
    this.graphics.fillStyle(0xfbbf24, 1);
    this.graphics.fillCircle(x, y, radius);
  }

  /**
   * 绘制PowerUp食物
   */
  drawPowerUpFood(powerUpFood, offsetX, offsetY, gridSize, baseFoodSize) {
    if (!powerUpFood || !powerUpFood.position) return;

    const x = offsetX + powerUpFood.position.x * gridSize;
    const y = offsetY + powerUpFood.position.y * gridSize;
    const radius = baseFoodSize;

    const type = powerUpFood.type || { color: 0xffffff };
    const color = type.color || 0xffffff;

    // 发光效果
    this.graphics.lineStyle(2, color, 0.5);
    this.graphics.strokeCircle(x, y, radius * 1.5);

    // 本体
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(x, y, radius);
  }

  /**
   * 销毁渲染器
   */
  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
    if (this.scoreText) {
      this.scoreText.destroy();
      this.scoreText = null;
    }
    this.infoTexts.forEach(text => text.destroy());
    this.infoTexts = [];
  }
}

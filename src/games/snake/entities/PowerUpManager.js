/**
 * PowerUpManager - 高级食物和道具生态系统管理器
 * 实现多样化的食物类型、生成模式、视觉效果和效果堆叠系统
 */

import { EffectManager } from '../systems/EffectManager.js';

export class PowerUpManager {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.effectManager = new EffectManager();

    // 基础配置 - 增强为battle arena模式
    this.gridSize = config.gridSize || 60; // 扩大网格支持battle arena
    this.maxFoodItems = config.maxFoodItems || 100; // 支持50-100个食物
    this.spawnCooldown = config.spawnCooldown || 500; // 更快的生成速度
    this.lastSpawnTime = 0;
    this.isBattleArenaMode = config.isBattleArenaMode !== false; // 默认开启battle arena

    // 食物生态系统配置
    this.foodEcosystem = this.initializeFoodEcosystem();
    this.activeFoodItems = new Map(); // foodId -> food object
    this.spawnPatternManager = new SpawnPatternManager();
    this.visualEffectManager = new VisualEffectManager(scene);

    // 游戏平衡配置
    this.gameBalance = {
      rarityMultiplier: 1.0,
      difficultyScaling: 1.0,
      scoreMultiplier: 1.0
    };

    // 统计信息
    this.statistics = {
      totalSpawned: 0,
      totalConsumed: 0,
      rarityDistribution: {},
      effectUsageStats: {}
    };

    // 事件系统
    this.eventListeners = new Map();
  }

  /**
   * 初始化食物生态系统定义
   */
  initializeFoodEcosystem() {
    return {
      // 基础食物类型 - battle arena大小变体
      NORMAL_SMALL: {
        id: 'NORMAL_SMALL',
        name: '小食物',
        color: 0x4ade80,
        score: 5,
        rarity: 'common',
        effect: {
          type: 'growth',
          value: 1,
          duration: 0
        },
        visual: {
          size: 0.6,
          animation: 'pulse',
          particles: false
        },
        spawnChance: 0.25
      },

      NORMAL_MEDIUM: {
        id: 'NORMAL_MEDIUM',
        name: '中食物',
        color: 0x22c55e,
        score: 15,
        rarity: 'common',
        effect: {
          type: 'growth',
          value: 3,
          duration: 0
        },
        visual: {
          size: 1.0,
          animation: 'pulse',
          particles: false
        },
        spawnChance: 0.15
      },

      NORMAL_LARGE: {
        id: 'NORMAL_LARGE',
        name: '大食物',
        color: 0x16a34a,
        score: 25,
        rarity: 'uncommon',
        effect: {
          type: 'growth',
          value: 5,
          duration: 0
        },
        visual: {
          size: 1.4,
          animation: 'pulse',
          particles: true,
          particleColor: 0x16a34a
        },
        spawnChance: 0.05
      },

      // Growth Food - 红色成长食物 (Requirement 6)
      GROWTH_FOOD: {
        id: 'GROWTH_FOOD',
        name: '成长食物',
        color: 0xef4444, // 红色
        score: 20,
        rarity: 'uncommon',
        effect: {
          type: 'growth',
          value: 3,
          duration: 0
        },
        visual: {
          size: 1.2,
          animation: 'bounce',
          particles: true,
          particleColor: 0xef4444
        },
        spawnChance: 0.12
      },

      // Speed Food - 黄色速度食物 (Requirement 6)
      SPEED_FOOD: {
        id: 'SPEED_FOOD',
        name: '速度食物',
        color: 0xeab308, // 黄色
        score: 25,
        rarity: 'uncommon',
        effect: {
          type: 'speed',
          value: 1.2,
          duration: 10000 // 10秒速度提升
        },
        visual: {
          size: 1.1,
          animation: 'flash',
          particles: true,
          particleColor: 0xeab308
        },
        spawnChance: 0.10
      },

      // Shield Food - 紫色护盾食物 (Requirement 6)
      SHIELD_FOOD: {
        id: 'SHIELD_FOOD',
        name: '护盾食物',
        color: 0xa855f7, // 紫色
        score: 30,
        rarity: 'rare',
        effect: {
          type: 'shield',
          value: 1,
          duration: 5000 // 5秒护盾
        },
        visual: {
          size: 1.3,
          animation: 'rotate',
          particles: true,
          particleColor: 0xa855f7
        },
        spawnChance: 0.06
      },

      // 成长类食物
      SUPER_GROWTH: {
        id: 'SUPER_GROWTH',
        name: '超级成长',
        color: 0x22c55e,
        score: 25,
        rarity: 'uncommon',
        effect: {
          type: 'growth',
          value: 3,
          duration: 0
        },
        visual: {
          size: 1.3,
          animation: 'bounce',
          particles: true,
          particleColor: 0x22c55e
        },
        spawnChance: 0.15
      },

      MEGA_GROWTH: {
        id: 'MEGA_GROWTH',
        name: '巨量成长',
        color: 0x16a34a,
        score: 50,
        rarity: 'rare',
        effect: {
          type: 'growth',
          value: 5,
          duration: 0
        },
        visual: {
          size: 1.6,
          animation: 'spiral',
          particles: true,
          particleColor: 0x16a34a
        },
        spawnChance: 0.05
      },

      // 速度类食物
      SPEED_BOOST: {
        id: 'SPEED_BOOST',
        name: '速度提升',
        color: 0x3b82f6,
        score: 20,
        rarity: 'uncommon',
        effect: {
          type: 'speed',
          value: 1.5,
          duration: 5000
        },
        visual: {
          size: 1.1,
          animation: 'flash',
          particles: true,
          particleColor: 0x3b82f6
        },
        spawnChance: 0.12
      },

      SPEED_BURST: {
        id: 'SPEED_BURST',
        name: '速度爆发',
        color: 0x2563eb,
        score: 35,
        rarity: 'rare',
        effect: {
          type: 'speed',
          value: 2.0,
          duration: 3000
        },
        visual: {
          size: 1.4,
          animation: 'lightning',
          particles: true,
          particleColor: 0x2563eb
        },
        spawnChance: 0.04
      },

      // 护盾类食物
      SHIELD: {
        id: 'SHIELD',
        name: '防护盾',
        color: 0x06b6d4,
        score: 30,
        rarity: 'uncommon',
        effect: {
          type: 'shield',
          value: 1,
          duration: 8000
        },
        visual: {
          size: 1.2,
          animation: 'rotate',
          particles: true,
          particleColor: 0x06b6d4
        },
        spawnChance: 0.08
      },

      MEGA_SHIELD: {
        id: 'MEGA_SHIELD',
        name: '超级护盾',
        color: 0x0891b2,
        score: 60,
        rarity: 'rare',
        effect: {
          type: 'shield',
          value: 3,
          duration: 12000
        },
        visual: {
          size: 1.5,
          animation: 'orbit',
          particles: true,
          particleColor: 0x0891b2
        },
        spawnChance: 0.03
      },

      // 磁铁类食物
      MAGNET: {
        id: 'MAGNET',
        name: '磁铁吸引',
        color: 0xa855f7,
        score: 25,
        rarity: 'uncommon',
        effect: {
          type: 'magnet',
          value: 100,
          duration: 6000
        },
        visual: {
          size: 1.1,
          animation: 'magnetic',
          particles: true,
          particleColor: 0xa855f7
        },
        spawnChance: 0.1
      },

      SUPER_MAGNET: {
        id: 'SUPER_MAGNET',
        name: '超级磁铁',
        color: 0x9333ea,
        score: 45,
        rarity: 'rare',
        effect: {
          type: 'magnet',
          value: 200,
          duration: 8000
        },
        visual: {
          size: 1.4,
          animation: 'vortex',
          particles: true,
          particleColor: 0x9333ea
        },
        spawnChance: 0.04
      },

      // 分数倍数类
      SCORE_MULTIPLIER: {
        id: 'SCORE_MULTIPLIER',
        name: '分数倍增',
        color: 0xf59e0b,
        score: 15,
        rarity: 'uncommon',
        effect: {
          type: 'score_multiplier',
          value: 2.0,
          duration: 10000
        },
        visual: {
          size: 1.2,
          animation: 'glow',
          particles: true,
          particleColor: 0xf59e0b
        },
        spawnChance: 0.1
      },

      MEGA_SCORE: {
        id: 'MEGA_SCORE',
        name: '巨量分数',
        color: 0xd97706,
        score: 100,
        rarity: 'epic',
        effect: {
          type: 'score_multiplier',
          value: 5.0,
          duration: 5000
        },
        visual: {
          size: 1.8,
          animation: 'rainbow',
          particles: true,
          particleColor: 0xf59e0b
        },
        spawnChance: 0.01
      },

      // 特殊效果类
      TIME_FREEZE: {
        id: 'TIME_FREEZE',
        name: '时间冻结',
        color: 0x6366f1,
        score: 40,
        rarity: 'rare',
        effect: {
          type: 'time_freeze',
          value: 3.0,
          duration: 4000
        },
        visual: {
          size: 1.3,
          animation: 'freeze',
          particles: true,
          particleColor: 0x6366f1
        },
        spawnChance: 0.03
      },

      GHOST_MODE: {
        id: 'GHOST_MODE',
        name: '幽灵模式',
        color: 0x8b5cf6,
        score: 35,
        rarity: 'rare',
        effect: {
          type: 'ghost',
          value: 1,
          duration: 6000
        },
        visual: {
          size: 1.2,
          animation: 'phase',
          particles: true,
          particleColor: 0x8b5cf6
        },
        spawnChance: 0.04
      },

      // 传说级食物
      RAINBOW_FEAST: {
        id: 'RAINBOW_FEAST',
        name: '彩虹盛宴',
        color: 0xec4899,
        score: 200,
        rarity: 'legendary',
        effect: {
          type: 'combo',
          effects: ['growth', 'speed', 'shield', 'score_multiplier'],
          values: [2, 1.3, 1, 3.0],
          duration: 8000
        },
        visual: {
          size: 2.0,
          animation: 'rainbow_explosion',
          particles: true,
          particleColor: 0xec4899
        },
        spawnChance: 0.002
      }
    };
  }

  /**
   * 初始化battle arena食物生成
   */
  initializeBattleArena(snakeBody) {
    if (!this.isBattleArenaMode) return;

    const initialFoodCount = 50 + Math.floor(Math.random() * 50); // 50-100个食物
    console.log(`🎮 初始化Battle Arena，生成${initialFoodCount}个食物`);

    for (let i = 0; i < initialFoodCount; i++) {
      this.spawnFood(snakeBody, { score: 0 });
    }
  }

  /**
   * 更新食物生态系统
   */
  update(deltaTime, snakeBody, gameStats) {
    // 清理已消耗的食物
    this.cleanupConsumedFood();

    // 更新现有食物的动画
    this.updateFoodAnimations(deltaTime);

    // Battle arena模式下的磁铁效果
    if (this.isBattleArenaMode) {
      this.applyMagnetEffect(snakeBody[0] || { x: this.gridSize / 2, y: this.gridSize / 2 });
    }

    // 检查是否需要生成新食物
    if (this.shouldSpawnFood(gameStats)) {
      this.spawnFood(snakeBody, gameStats);
    }

    // 更新效果管理器
    this.effectManager.update(deltaTime);

    // 更新视觉效果
    this.visualEffectManager.update(deltaTime);
  }

  /**
   * 判断是否应该生成新食物
   */
  shouldSpawnFood(gameStats) {
    const now = Date.now();

    // 检查生成冷却时间
    if (now - this.lastSpawnTime < this.spawnCooldown) {
      return false;
    }

    // 检查最大食物数量限制
    if (this.activeFoodItems.size >= this.maxFoodItems) {
      return false;
    }

    let spawnChance;

    if (this.isBattleArenaMode) {
      // Battle arena模式下的生成逻辑
      const foodRatio = this.activeFoodItems.size / this.maxFoodItems;
      if (foodRatio < 0.3) {
        // 食物太少时，提高生成概率
        spawnChance = 0.9;
      } else if (foodRatio < 0.6) {
        // 中等数量时正常生成
        spawnChance = 0.6;
      } else {
        // 接近最大数量时降低生成概率
        spawnChance = 0.2;
      }

      // 根据分数略微增加稀有食物概率
      const scoreBonus = Math.min(0.1, gameStats.score / 50000);
      spawnChance += scoreBonus;
    } else {
      // 传统模式下的生成逻辑
      spawnChance = Math.min(0.8, 0.3 + (gameStats.score / 10000) * 0.5);
    }

    return Math.random() < spawnChance;
  }

  /**
   * 生成新食物
   */
  spawnFood(snakeBody, gameStats) {
    const position = this.findValidSpawnPosition(snakeBody);
    if (!position) {
      return null;
    }

    const foodType = this.selectFoodType(gameStats);
    const foodId = `${foodType.id}_${Date.now()}_${Math.random()}`;

    const foodItem = {
      id: foodId,
      type: foodType,
      position: { ...position },
      spawnTime: Date.now(),
      animationTime: 0,
      isConsumed: false,
      visualEffects: []
    };

    this.activeFoodItems.set(foodId, foodItem);
    this.lastSpawnTime = Date.now();
    this.statistics.totalSpawned++;

    // 创建视觉效果
    this.visualEffectManager.createSpawnEffect(foodItem);

    // 触发生成事件
    this.triggerEvent('food_spawned', foodItem);

    console.log(`🍽️ 生成食物: ${foodType.name} at (${position.x}, ${position.y})`);

    return foodItem;
  }

  /**
   * 根据概率和游戏状态选择食物类型
   */
  selectFoodType(gameStats) {
    const foodTypes = Object.values(this.foodEcosystem);
    const adjustedTypes = foodTypes.map(type => ({
      ...type,
      adjustedChance: this.calculateAdjustedChance(type, gameStats)
    }));

    // 根据调整后的概率选择
    const totalChance = adjustedTypes.reduce((sum, type) => sum + type.adjustedChance, 0);
    let random = Math.random() * totalChance;

    for (const type of adjustedTypes) {
      random -= type.adjustedChance;
      if (random <= 0) {
        return type;
      }
    }

    return this.foodEcosystem.NORMAL; // 默认返回普通食物
  }

  /**
   * 计算调整后的生成概率
   */
  calculateAdjustedChance(foodType, gameStats) {
    let chance = foodType.spawnChance;

    // 根据分数调整稀有度
    const scoreMultiplier = 1 + (gameStats.score / 50000) * this.gameBalance.rarityMultiplier;

    // 根据稀有度调整
    const rarityMultipliers = {
      common: 1.0,
      uncommon: 1.2,
      rare: 1.5,
      epic: 2.0,
      legendary: 3.0
    };

    const rarityMultiplier = rarityMultipliers[foodType.rarity] || 1.0;

    return chance * scoreMultiplier * rarityMultiplier * this.gameBalance.difficultyScaling;
  }

  /**
   * 查找有效的生成位置
   */
  findValidSpawnPosition(snakeBody) {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const x = Math.floor(Math.random() * this.gridSize);
      const y = Math.floor(Math.random() * this.gridSize);

      if (this.isPositionValid(x, y, snakeBody)) {
        return { x, y };
      }

      attempts++;
    }

    console.warn('⚠️ 无法找到有效的食物生成位置');
    return null;
  }

  /**
   * 检查位置是否有效
   */
  isPositionValid(x, y, snakeBody) {
    // 检查是否在蛇身上
    for (const segment of snakeBody) {
      if (Math.abs(segment.x - x) < 1 && Math.abs(segment.y - y) < 1) {
        return false;
      }
    }

    // 检查是否离其他食物太近
    for (const foodItem of this.activeFoodItems.values()) {
      const distance = Math.abs(foodItem.position.x - x) + Math.abs(foodItem.position.y - y);
      if (distance < 3) {
        return false;
      }
    }

    // 检查是否离蛇头太近
    if (snakeBody.length > 0) {
      const head = snakeBody[0];
      const distance = Math.abs(head.x - x) + Math.abs(head.y - y);
      if (distance < 4) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查蛇头是否碰到食物
   */
  checkCollision(snakeHead) {
    for (const [foodId, foodItem] of this.activeFoodItems) {
      const distance = Math.sqrt(
        Math.pow(snakeHead.x - foodItem.position.x, 2) +
        Math.pow(snakeHead.y - foodItem.position.y, 2)
      );

      if (distance < 0.8) { // 碰撞检测阈值
        return foodItem;
      }
    }

    return null;
  }

  /**
   * 检查护盾碰撞处理 (Requirement 6 - 护盾弹跳机制)
   */
  checkShieldCollision(snakeController, collisionType, collisionData) {
    const shieldLevel = this.getEffectMultipliers().shield;
    if (shieldLevel === 0) {
      return null; // 没有护盾，正常处理碰撞
    }

    // 护盾激活时的弹跳处理
    console.log(`🛡️ 护盾弹跳! 等级: ${shieldLevel}, 碰撞类型: ${collisionType}`);

    return {
      bounced: true,
      shieldLevel: shieldLevel,
      speedReduction: 0.7, // 弹跳后速度降低30%
      shieldRemaining: this.effectManager.getEffectRemainingTime('shield'),
      bounceDirection: this.calculateBounceDirection(collisionType, collisionData)
    };
  }

  /**
   * 计算弹跳方向
   */
  calculateBounceDirection(collisionType, collisionData) {
    switch (collisionType) {
      case 'wall':
        // 墙壁碰撞 - 反弹方向
        if (collisionData.side === 'top' || collisionData.side === 'bottom') {
          return { x: collisionData.direction.x, y: -collisionData.direction.y };
        } else {
          return { x: -collisionData.direction.x, y: collisionData.direction.y };
        }

      case 'body':
        // 身体碰撞 - 根据碰撞位置计算反弹
        const angle = Math.atan2(
          collisionData.headPosition.y - collisionData.collisionPoint.y,
          collisionData.headPosition.x - collisionData.collisionPoint.x
        );
        return {
          x: Math.cos(angle),
          y: Math.sin(angle)
        };

      default:
        return { x: 0, y: 0 };
    }
  }

  /**
   * 消费食物并应用效果
   */
  consumeFood(foodItem, snakeController) {
    if (!foodItem || foodItem.isConsumed) {
      return null;
    }

    foodItem.isConsumed = true;
    this.statistics.totalConsumed++;

    // 更新稀有度统计
    const rarity = foodItem.type.rarity;
    this.statistics.rarityDistribution[rarity] =
      (this.statistics.rarityDistribution[rarity] || 0) + 1;

    // 创建消费视觉效果
    this.visualEffectManager.createConsumeEffect(foodItem);

    // 应用食物效果
    const result = this.applyFoodEffect(foodItem, snakeController);

    // 从活跃列表中移除
    this.activeFoodItems.delete(foodItem.id);

    // 触发消费事件
    this.triggerEvent('food_consumed', { foodItem, result });

    console.log(`🍴 消费食物: ${foodItem.type.name}, 效果: ${result.effects.join(', ')}`);

    return result;
  }

  /**
   * 应用食物效果
   */
  applyFoodEffect(foodItem, snakeController) {
    const result = {
      score: foodItem.type.score * this.gameBalance.scoreMultiplier,
      effects: [],
      growth: 0
    };

    const effect = foodItem.type.effect;

    switch (effect.type) {
      case 'growth':
        result.growth = effect.value;
        result.effects.push(`成长+${effect.value}`);
        break;

      case 'speed':
        this.effectManager.addEffect('speed_boost', effect.duration, {
          speedMultiplier: effect.value
        }, foodItem.type.name);
        result.effects.push(`速度x${effect.value}`);
        break;

      case 'shield':
        this.effectManager.addEffect('shield', effect.duration, {
          shieldLevel: effect.value
        }, foodItem.type.name);
        result.effects.push(`护盾Lv.${effect.value}`);
        break;

      case 'magnet':
        this.effectManager.addEffect('magnet', effect.duration, {
          magnetRange: effect.value
        }, foodItem.type.name);
        result.effects.push(`磁铁${effect.value}px`);
        break;

      case 'score_multiplier':
        this.effectManager.addEffect('score_multiplier', effect.duration, {
          scoreMultiplier: effect.value
        }, foodItem.type.name);
        result.effects.push(`分数x${effect.value}`);
        break;

      case 'time_freeze':
        this.effectManager.addEffect('time_freeze', effect.duration, {
          timeScale: effect.value
        }, foodItem.type.name);
        result.effects.push(`时间减缓`);
        break;

      case 'ghost':
        this.effectManager.addEffect('ghost', effect.duration, {
          phaseThroughWalls: true
        }, foodItem.type.name);
        result.effects.push(`幽灵模式`);
        break;

      case 'combo':
        // 组合效果
        effect.effects.forEach((subEffect, index) => {
          const value = effect.values[index];
          const comboFoodItem = { ...foodItem, type: { ...foodItem.type, effect: { type: subEffect, value, duration: effect.duration } } };
          this.applyFoodEffect(comboFoodItem, snakeController);
        });
        result.effects.push('全能组合');
        break;

      default:
        result.effects.push('无效果');
    }

    return result;
  }

  /**
   * 更新食物动画
   */
  updateFoodAnimations(deltaTime) {
    for (const foodItem of this.activeFoodItems.values()) {
      if (foodItem.isConsumed) continue;

      foodItem.animationTime += deltaTime;
      this.visualEffectManager.updateFoodAnimation(foodItem, deltaTime);
    }
  }

  /**
   * 清理已消耗的食物
   */
  cleanupConsumedFood() {
    for (const [foodId, foodItem] of this.activeFoodItems) {
      if (foodItem.isConsumed) {
        this.activeFoodItems.delete(foodId);
      }
    }
  }

  /**
   * 渲染所有食物
   */
  render(graphics) {
    for (const foodItem of this.activeFoodItems.values()) {
      if (foodItem.isConsumed) continue;

      this.renderFoodItem(graphics, foodItem);
    }

    // 渲染视觉效果
    this.visualEffectManager.render(graphics);
  }

  /**
   * 渲染单个食物
   */
  renderFoodItem(graphics, foodItem) {
    const { position, type, animationTime } = foodItem;
    const cellSize = 20; // 网格单元格大小

    // 计算屏幕坐标
    const x = position.x * cellSize + cellSize / 2;
    const y = position.y * cellSize + cellSize / 2;

    // 应用动画变换
    const animationTransform = this.calculateAnimationTransform(type.visual.animation, animationTime);

    // 绘制食物
    graphics.save();
    graphics.translate(x, y);
    graphics.rotate(animationTransform.rotation);
    graphics.scale(animationTransform.scale, animationTransform.scale);

    // 主体
    graphics.fillStyle(type.color, 1);
    graphics.beginPath();
    graphics.arc(0, 0, cellSize * 0.4 * type.visual.size, 0, Math.PI * 2);
    graphics.fill();

    // 边框
    graphics.strokeStyle = type.color;
    graphics.globalAlpha = 0.5;
    graphics.lineWidth = 2;
    graphics.stroke();
    graphics.globalAlpha = 1;

    // 高光效果
    const gradient = graphics.createRadialGradient(-3, -3, 0, 0, 0, cellSize * 0.3);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    graphics.fillStyle = gradient;
    graphics.beginPath();
    graphics.arc(0, 0, cellSize * 0.3 * type.visual.size, 0, Math.PI * 2);
    graphics.fill();

    graphics.restore();
  }

  /**
   * 计算动画变换
   */
  calculateAnimationTransform(animation, time) {
    const t = time / 1000; // 转换为秒

    switch (animation) {
      case 'pulse':
        return {
          rotation: 0,
          scale: 1 + Math.sin(t * 3) * 0.1
        };

      case 'bounce':
        return {
          rotation: 0,
          scale: 1 + Math.abs(Math.sin(t * 4)) * 0.15
        };

      case 'rotate':
        return {
          rotation: t * 2,
          scale: 1
        };

      case 'flash':
        return {
          rotation: 0,
          scale: 1 + (Math.sin(t * 8) > 0 ? 0.2 : 0)
        };

      case 'glow':
        return {
          rotation: t,
          scale: 1 + Math.sin(t * 2) * 0.1
        };

      default:
        return {
          rotation: 0,
          scale: 1
        };
    }
  }

  /**
   * 获取当前效果倍数
   */
  getEffectMultipliers() {
    return {
      speed: this.effectManager.getSpeedMultiplier(),
      score: this.effectManager.getScoreMultiplier(),
      shield: this.effectManager.hasEffect('shield') ?
        this.effectManager.activeEffects.get('shield').properties.shieldLevel : 0,
      magnet: this.effectManager.hasEffect('magnet') ?
        this.effectManager.activeEffects.get('magnet').properties.magnetRange : 0
    };
  }

  /**
   * 应用磁铁效果
   */
  applyMagnetEffect(snakeHead) {
    const magnetRange = this.getEffectMultipliers().magnet;
    if (magnetRange === 0) return;

    for (const foodItem of this.activeFoodItems.values()) {
      if (foodItem.isConsumed) continue;

      const distance = Math.sqrt(
        Math.pow(snakeHead.x - foodItem.position.x, 2) +
        Math.pow(snakeHead.y - foodItem.position.y, 2)
      );

      if (distance < magnetRange / 20 && distance > 1) { // 转换为网格单位
        // 向蛇头吸引食物
        const pullStrength = 0.1 * (1 - distance / (magnetRange / 20));
        const dx = snakeHead.x - foodItem.position.x;
        const dy = snakeHead.y - foodItem.position.y;
        const normalization = Math.sqrt(dx * dx + dy * dy);

        foodItem.position.x += (dx / normalization) * pullStrength;
        foodItem.position.y += (dy / normalization) * pullStrength;
      }
    }
  }

  /**
   * 触发事件
   */
  triggerEvent(eventName, data) {
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(eventName, callback) {
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    return {
      ...this.statistics,
      activeFoodCount: this.activeFoodItems.size,
      effectStats: this.effectManager.getStatistics(),
      foodDistribution: Object.fromEntries(
        Array.from(this.activeFoodItems.values()).map(food => [food.type.id, food.type.name])
      )
    };
  }

  /**
   * 调整游戏平衡
   */
  adjustGameBalance(settings) {
    Object.assign(this.gameBalance, settings);
  }

  /**
   * 重置管理器
   */
  reset() {
    this.activeFoodItems.clear();
    this.effectManager.clearAllEffects();
    this.visualEffectManager.clearAllEffects();
    this.statistics = {
      totalSpawned: 0,
      totalConsumed: 0,
      rarityDistribution: {},
      effectUsageStats: {}
    };
  }

  /**
   * 处理食物消费
   * @param {Object} foodItem - 被消费的食物项
   * @param {Object} snakeHead - 蛇头位置
   */
  onFoodConsumed(foodItem, snakeHead) {
    if (!foodItem) return;

    // 更新统计
    this.statistics.totalConsumed++;

    // 更新稀有度分布
    const rarity = foodItem.type.rarity || 'common';
    this.statistics.rarityDistribution[rarity] = (this.statistics.rarityDistribution[rarity] || 0) + 1;

    // 应用食物效果
    if (foodItem.type.effect) {
      this.applyFoodEffect(foodItem.type.effect, snakeHead);
    }

    // 创建消费视觉效果
    this.visualEffectManager.createConsumeEffect(foodItem);

    // 触发消费事件
    this.triggerEvent('food_consumed', { foodItem, snakeHead });

    console.log(`🎯 食物消费: ${foodItem.type.name} (${rarity})`);
  }

  /**
   * 应用食物效果
   * @param {Object} effect - 效果对象
   * @param {Object} target - 目标位置
   */
  applyFoodEffect(effect, target) {
    // 直接在场景中找到SnakeController并应用效果
    const snakeController = this.scene.snakeController;
    if (!snakeController) return;

    switch (effect.type) {
      case 'speed':
        snakeController.applySpeedBoost(effect.value, effect.duration);
        console.log(`⚡ 应用速度效果: ${effect.value}倍, ${effect.duration}ms`);
        break;

      case 'shield':
        snakeController.applyShield(effect.value, effect.duration);
        console.log(`🛡️ 应用护盾效果: 强度${effect.value}, ${effect.duration}ms`);
        break;

      case 'magnet':
        this.activateMagnetEffect(effect.value, effect.duration);
        console.log(`🧲 应用磁铁效果: 范围${effect.value}, ${effect.duration}ms`);
        break;

      case 'growth':
        // 成长效果在游戏逻辑中处理
        console.log(`🌱 成长效果: +${effect.value}长度`);
        break;

      default:
        console.log(`❓ 未知效果类型: ${effect.type}`);
        break;
    }
  }

  /**
   * 激活磁铁效果
   * @param {number} value - 磁铁强度（格数）
   * @param {number} duration - 持续时间（毫秒）
   */
  activateMagnetEffect(value = 3, duration = 5000) {
    console.log(`🧲 磁铁效果激活: ${value}格范围, ${duration}ms持续时间`);

    // 将附近的食物吸引到蛇的周围
    const snakeBody = this.scene.snakeController?.getSnake() || [];
    if (snakeBody.length === 0) return;

    const snakeHead = snakeBody[0];
    const affectedFoods = [];

    this.activeFoodItems.forEach((foodItem, foodId) => {
      const distance = Math.sqrt(
        Math.pow(foodItem.position.x - snakeHead.x, 2) +
        Math.pow(foodItem.position.y - snakeHead.y, 2)
      );

      // 如果食物在磁铁范围内
      if (distance <= value && distance > 0) {
        affectedFoods.push({ foodItem, foodId, distance });
      }
    });

    // 按距离排序，吸引最近的食物
    affectedFoods.sort((a, b) => a.distance - b.distance);

    // 吸引最多3个最近的食物
    const maxAttracted = Math.min(3, affectedFoods.length);
    for (let i = 0; i < maxAttracted; i++) {
      const { foodItem, foodId } = affectedFoods[i];

      // 将食物移动到蛇头附近
      const angle = Math.atan2(
        foodItem.position.y - snakeHead.y,
        foodItem.position.x - snakeHead.x
      );

      foodItem.position.x = snakeHead.x + Math.cos(angle) * 2;
      foodItem.position.y = snakeHead.y + Math.sin(angle) * 2;

      // 确保食物在有效位置
      foodItem.position.x = Math.max(0, Math.min(this.gridSize - 1, foodItem.position.x));
      foodItem.position.y = Math.max(0, Math.min(this.gridSize - 1, foodItem.position.y));

      console.log(`🧲 食物被吸引: ${foodItem.type.name} -> (${foodItem.position.x}, ${foodItem.position.y})`);
    }

    // 创建磁铁视觉效果
    this.visualEffectManager.createMagnetEffect(snakeHead, value, duration);
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.reset();
    this.eventListeners.clear();
  }
}

/**
 * 生成模式管理器
 */
class SpawnPatternManager {
  constructor() {
    this.patterns = {
      random: (gridSize, existingFood) => this.randomPattern(gridSize, existingFood),
      cluster: (gridSize, existingFood) => this.clusterPattern(gridSize, existingFood),
      spiral: (gridSize, existingFood) => this.spiralPattern(gridSize, existingFood),
      line: (gridSize, existingFood) => this.linePattern(gridSize, existingFood)
    };

    this.currentPattern = 'random';
  }

  selectPattern(gameStats) {
    // 根据分数选择不同的生成模式
    if (gameStats.score > 1000) {
      const patterns = Object.keys(this.patterns);
      this.currentPattern = patterns[Math.floor(Math.random() * patterns.length)];
    }
  }

  generatePosition(gridSize, existingFood) {
    return this.patterns[this.currentPattern](gridSize, existingFood);
  }

  randomPattern(gridSize, existingFood) {
    return {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };
  }

  clusterPattern(gridSize, existingFood) {
    // 在现有食物附近生成
    if (existingFood.length > 0) {
      const reference = existingFood[Math.floor(Math.random() * existingFood.length)];
      const angle = Math.random() * Math.PI * 2;
      const distance = 2 + Math.random() * 3;

      return {
        x: Math.max(0, Math.min(gridSize - 1, Math.floor(reference.x + Math.cos(angle) * distance))),
        y: Math.max(0, Math.min(gridSize - 1, Math.floor(reference.y + Math.sin(angle) * distance)))
      };
    }

    return this.randomPattern(gridSize, existingFood);
  }

  spiralPattern(gridSize, existingFood) {
    const centerX = gridSize / 2;
    const centerY = gridSize / 2;
    const angle = Date.now() / 1000;
    const radius = (gridSize / 3) + Math.sin(Date.now() / 2000) * (gridSize / 6);

    return {
      x: Math.max(0, Math.min(gridSize - 1, Math.floor(centerX + Math.cos(angle) * radius))),
      y: Math.max(0, Math.min(gridSize - 1, Math.floor(centerY + Math.sin(angle) * radius)))
    };
  }

  linePattern(gridSize, existingFood) {
    const isHorizontal = Math.random() > 0.5;
    const position = Math.floor(Math.random() * gridSize);

    if (isHorizontal) {
      return {
        x: Math.floor(Math.random() * gridSize),
        y: position
      };
    } else {
      return {
        x: position,
        y: Math.floor(Math.random() * gridSize)
      };
    }
  }
}

/**
 * 视觉效果管理器
 */
class VisualEffectManager {
  constructor(scene) {
    this.scene = scene;
    this.activeEffects = [];
    this.particleSystems = new Map();
  }

  createSpawnEffect(foodItem) {
    // 生成时的粒子效果
    this.createParticles(foodItem.position.x, foodItem.position.y, foodItem.type.visual.particleColor, 10);
  }

  createConsumeEffect(foodItem) {
    // 消费时的爆炸效果
    this.createParticles(foodItem.position.x, foodItem.position.y, foodItem.type.color, 20);
  }

  createMagnetEffect(center, range, duration) {
    // 磁铁效果的视觉表现
    console.log(`🧲 创建磁铁视觉效果: 中心(${center.x}, ${center.y}), 范围${range}, 持续${duration}ms`);

    // 创建磁铁场的视觉指示器
    const effect = {
      type: 'magnet',
      center: { ...center },
      range: range,
      duration: duration,
      startTime: Date.now(),
      lifeTime: duration,
      pulsePhase: 0
    };

    this.activeEffects.push(effect);

    // 创建磁铁边界圆环效果
    this.createMagneticRings(center, range);

    // 创建磁铁指示器粒子
    this.createMagneticIndicators(center, range);
  }

  createMagneticRings(center, range) {
    // 创建磁力圆环
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = (range * (i + 1)) / ringCount;
      const particleCount = Math.floor(2 * Math.PI * ringRadius); // 每单位半径一个粒子

      for (let j = 0; j < particleCount; j++) {
        const angle = (j / particleCount) * 2 * Math.PI;
        const x = center.x + Math.cos(angle) * ringRadius;
        const y = center.y + Math.sin(angle) * ringRadius;

        // 磁场粒子颜色（紫色系）
        const magnetColor = 0xa855f7; // 紫色
        this.createParticles(x, y, magnetColor, 1);
      }
    }

    console.log(`🌀 创建${ringCount}个磁力圆环，范围${range}格`);
  }

  createMagneticIndicators(center, range) {
    // 创建磁力指示器（8个方向）
    const directions = 8;
    for (let i = 0; i < directions; i++) {
      const angle = (i / directions) * 2 * Math.PI;
      const indicatorDistance = range * 1.2; // 略超出磁力范围

      const x = center.x + Math.cos(angle) * indicatorDistance;
      const y = center.y + Math.sin(angle) * indicatorDistance;

      // 磁力指示器颜色（淡紫色）
      const indicatorColor = 0xc084fc; // 浅紫色
      this.createParticles(x, y, indicatorColor, 2);
    }

    console.log(`🎯 创建${directions}个磁力指示器`);
  }

  createParticles(x, y, color, count) {
    // 这里应该实现具体的粒子效果
    // 由于是简化版本，暂时只记录效果
    if (count === 1) {
      console.log(`✨ 创建单粒子: 位置(${x.toFixed(1)}, ${y.toFixed(1)}), 颜色: ${color}`);
    } else {
      console.log(`✨ 创建粒子效果: ${count}个粒子在(${x.toFixed(1)}, ${y.toFixed(1)}), 颜色: ${color}`);
    }
  }

  updateFoodAnimation(foodItem, deltaTime) {
    // 更新食物的动画状态
    // 这里可以实现具体的动画逻辑
  }

  update(deltaTime) {
    // 更新所有视觉效果
    this.activeEffects = this.activeEffects.filter(effect => {
      effect.lifeTime -= deltaTime;
      return effect.lifeTime > 0;
    });
  }

  render(graphics) {
    // 渲染所有视觉效果
    for (const effect of this.activeEffects) {
      // 渲染单个效果
    }
  }

  clearAllEffects() {
    this.activeEffects = [];
    this.particleSystems.clear();
  }
}


export default PowerUpManager;

/**
 * PowerUpManager - 高级食物和道具生态系统管理器
 * 实现多样化的食物类型、生成模式、视觉效果和效果堆叠系统
 */

import { EffectManager } from '../systems/EffectManager.js';

export class PowerUpManager {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.effectManager = new EffectManager();

    // 基础配置
    this.gridSize = config.gridSize || 30;
    this.maxFoodItems = config.maxFoodItems || 8;
    this.spawnCooldown = config.spawnCooldown || 2000;
    this.lastSpawnTime = 0;

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
      // 基础食物类型
      NORMAL: {
        id: 'NORMAL',
        name: '普通食物',
        color: 0x4ade80,
        score: 10,
        rarity: 'common',
        effect: {
          type: 'growth',
          value: 1,
          duration: 0
        },
        visual: {
          size: 1.0,
          animation: 'pulse',
          particles: false
        },
        spawnChance: 0.4
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
   * 更新食物生态系统
   */
  update(deltaTime, snakeBody, gameStats) {
    // 清理已消耗的食物
    this.cleanupConsumedFood();

    // 更新现有食物的动画
    this.updateFoodAnimations(deltaTime);

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

    // 根据分数调整生成概率
    const scoreAdjustedChance = Math.min(0.8, 0.3 + (gameStats.score / 10000) * 0.5);

    return Math.random() < scoreAdjustedChance;
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
    graphics.strokeStyle = type.color, 0.5);
    graphics.lineWidth = 2;
    graphics.stroke();

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

  createParticles(x, y, color, count) {
    // 这里应该实现具体的粒子效果
    // 由于是简化版本，暂时只记录效果
    console.log(`✨ 创建粒子效果: ${count}个粒子在(${x}, ${y}), 颜色: ${color}`);
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
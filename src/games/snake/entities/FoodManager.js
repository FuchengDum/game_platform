/**
 * 食物/道具管理器
 * 负责生成、管理和处理所有食物和道具
 */

import { PowerUp } from './PowerUp.js';
import configModule from '../config/PowerUpConfig.js';

const GRID_WIDTH = 30;
const GRID_HEIGHT = 30;

export class FoodManager {
  constructor(scene) {
    this.scene = scene;
    this.currentFood = null;
    this.lastSpawnTime = 0;
    this.spawnCooldown = 100; // 最小生成间隔，防止连续生成特殊道具
  }

  /**
   * 生成新的食物或道具
   */
  spawnFood(snakeBody, currentTime = Date.now()) {
    // 检查生成冷却时间
    if (currentTime - this.lastSpawnTime < this.spawnCooldown) {
      return;
    }

    const position = this.findValidPosition(snakeBody);
    const foodType = this.selectFoodType();

    this.currentFood = new PowerUp(
      foodType.id,
      position.x,
      position.y,
      this.scene
    );

    this.lastSpawnTime = currentTime;

    console.log(`🎲 生成道具: ${foodType.name} (${foodType.id}) at (${position.x}, ${position.y})`);
  }

  /**
   * 根据概率选择食物类型
   */
  selectFoodType() {
    const random = Math.random();
    let cumulative = 0;

    // 遍历所有道具类型，根据概率选择
    for (const [typeId, config] of Object.entries(configModule.POWER_UP_TYPES)) {
      cumulative += config.probability;
      if (random <= cumulative) {
        return configModule.POWER_UP_TYPES[typeId];
      }
    }

    // 默认返回普通食物
    return configModule.POWER_UP_TYPES.NORMAL;
  }

  /**
   * 查找有效的生成位置
   */
  findValidPosition(snakeBody) {
    let validPosition = null;
    let attempts = 0;
    const maxAttempts = 100;

    while (!validPosition && attempts < maxAttempts) {
      const x = Math.floor(Math.random() * GRID_WIDTH);
      const y = Math.floor(Math.random() * GRID_HEIGHT);

      if (this.isPositionValid(x, y, snakeBody)) {
        validPosition = { x, y };
      }

      attempts++;
    }

    if (!validPosition) {
      console.warn('⚠️ 无法找到有效的食物生成位置');
      // 如果找不到有效位置，在角落生成
      validPosition = { x: 1, y: 1 };
    }

    return validPosition;
  }

  /**
   * 检查位置是否有效（不在蛇身上）
   */
  isPositionValid(x, y, snakeBody) {
    // 检查是否在蛇身上
    for (const segment of snakeBody) {
      if (segment.x === x && segment.y === y) {
        return false;
      }
    }

    // 检查是否过于接近蛇头（避免立即吃到）
    if (snakeBody.length > 0) {
      const head = snakeBody[0];
      const distance = Math.abs(head.x - x) + Math.abs(head.y - y);
      if (distance < 3) {
        return false; // 距离蛇头太近
      }
    }

    return true;
  }

  /**
   * 检查蛇是否吃到食物
   */
  checkCollision(snakeHead) {
    if (!this.currentFood) {
      return null;
    }

    if (snakeHead.x === this.currentFood.x &&
        snakeHead.y === this.currentFood.y) {
      return this.currentFood;
    }

    return null;
  }

  /**
   * 处理食物被吃掉
   */
  consumeFood() {
    if (!this.currentFood) {
      return null;
    }

    const consumedFood = this.currentFood;

    // 确保config存在，如果不存在则使用默认值
    const foodName = consumedFood.config?.name || '未知道具';
    const foodScore = consumedFood.config?.score || 10;

    if (!consumedFood.config) {
      console.error('❌ 道具配置缺失，使用默认值');
    }

    // 尝试应用效果，如果失败也要继续
    let effect = null;
    try {
      effect = consumedFood.applyEffect();
    } catch (error) {
      console.error('❌ 应用道具效果失败:', error);
      // 即使效果应用失败，也提供基本的分数和效果
      effect = {
        type: 'none',
        value: 1,
        duration: 0,
        name: foodName
      };
    }

    // 清理粒子系统和资源
    try {
      consumedFood.destroy();
    } catch (error) {
      console.error('❌ 清理道具资源失败:', error);
    }

    // 清除引用
    this.currentFood = null;

    console.log(`🍴 道具被吃掉: ${foodName}`);

    return {
      score: foodScore,
      effect: effect
    };
  }

  /**
   * 渲染食物
   */
  render(graphics) {
    if (!this.currentFood) {
      return;
    }

    this.currentFood.render(graphics);
  }

  /**
   * 更新动画
   */
  update(deltaTime) {
    if (this.currentFood) {
      this.currentFood.update(deltaTime);
    }
  }

  /**
   * 获取当前食物信息
   */
  getCurrentFood() {
    return this.currentFood;
  }

  /**
   * 强制移除当前食物
   */
  clearFood() {
    if (this.currentFood) {
      this.currentFood.destroy();
      this.currentFood = null;
    }
  }

  /**
   * 调整特殊道具的概率（用于难度调整）
   */
  adjustSpecialFoodProbability(multiplier = 1.0) {
    // 这个方法可以用于根据分数或难度调整特殊道具出现概率
    // multiplier > 1 增加概率, < 1 减少概率

    for (const [typeId, config] of Object.entries(configModule.POWER_UP_TYPES)) {
      if (typeId !== 'NORMAL') {
        config.originalProbability = config.originalProbability || config.probability;
        config.probability = Math.min(0.5, config.originalProbability * multiplier);
      } else {
        // 调整普通食物概率，确保总和为1
        const specialProbabilitySum = Object.entries(configModule.POWER_UP_TYPES)
          .filter(([id]) => id !== 'NORMAL')
          .reduce((sum, [id, cfg]) => sum + cfg.probability, 0);
        config.probability = Math.max(0.2, 1 - specialProbabilitySum);
      }
    }

    console.log('🎲 道具概率已调整:', configModule.POWER_UP_TYPES);
  }

  /**
   * 重置概率到默认值
   */
  resetProbabilities() {
    const defaultProbabilities = {
      normal: 0.6,
      speed_up: 0.15,
      slow_down: 0.15,
      double_score: 0.1
    };

    for (const [typeId, defaultProb] of Object.entries(defaultProbabilities)) {
      if (configModule.POWER_UP_TYPES[typeId]) {
        configModule.POWER_UP_TYPES[typeId].probability = defaultProb;
      }
    }

    console.log('🎲 道具概率已重置:', configModule.POWER_UP_TYPES);
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    const stats = {
      currentFood: this.currentFood ? this.currentFood.config.name : null,
      lastSpawnTime: this.lastSpawnTime,
      probabilityDistribution: {}
    };

    for (const [typeId, config] of Object.entries(configModule.POWER_UP_TYPES)) {
      stats.probabilityDistribution[typeId] = config.probability;
    }

    return stats;
  }
}

export default FoodManager;
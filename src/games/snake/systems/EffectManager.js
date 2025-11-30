/**
 * 效果管理器
 * 负责管理所有活动效果，包括计时和状态管理
 */

export class EffectManager {
  constructor() {
    this.activeEffects = new Map(); // effectType -> {startTime, duration, properties, name}
    this.effectCallbacks = new Map(); // effectType -> callback function
    this.soundEffects = new Map(); // effectType -> sound config
  }

  /**
   * 添加新效果
   */
  addEffect(effectType, duration, properties = {}, name = '') {
    const effectData = {
      startTime: Date.now(),
      duration,
      properties,
      name: name || effectType,
      id: `${effectType}_${Date.now()}`
    };

    // 如果已有相同效果，刷新时间
    if (this.activeEffects.has(effectType)) {
      console.log(`🔄 刷新效果: ${effectType}`);
      this.activeEffects.set(effectType, effectData);
    } else {
      console.log(`✨ 添加效果: ${effectType} (${duration}ms)`);
      this.activeEffects.set(effectType, effectData);
    }

    // 触发效果开始回调
    if (this.effectCallbacks.has(effectType)) {
      const callback = this.effectCallbacks.get(effectType);
      callback('start', effectData);
    }

    return effectData.id;
  }

  /**
   * 移除效果
   */
  removeEffect(effectType) {
    if (this.activeEffects.has(effectType)) {
      const effectData = this.activeEffects.get(effectType);
      this.activeEffects.delete(effectType);

      console.log(`❌ 效果结束: ${effectType}`);

      // 触发效果结束回调
      if (this.effectCallbacks.has(effectType)) {
        const callback = this.effectCallbacks.get(effectType);
        callback('end', effectData);
      }

      return effectData;
    }

    return null;
  }

  /**
   * 更新所有活动效果
   */
  update(deltaTime) {
    const currentTime = Date.now();
    const expiredEffects = [];

    // 检查过期效果
    for (const [effectType, effectData] of this.activeEffects) {
      const elapsed = currentTime - effectData.startTime;

      if (elapsed >= effectData.duration) {
        expiredEffects.push(effectType);
      } else {
        // 更新效果回调
        if (this.effectCallbacks.has(effectType)) {
          const callback = this.effectCallbacks.get(effectType);
          callback('update', effectData, {
            elapsed,
            remaining: effectData.duration - elapsed,
            progress: elapsed / effectData.duration
          });
        }
      }
    }

    // 移除过期效果
    for (const effectType of expiredEffects) {
      this.removeEffect(effectType);
    }
  }

  /**
   * 获取速度倍数
   */
  getSpeedMultiplier() {
    let multiplier = 1.0;

    for (const [effectType, effectData] of this.activeEffects) {
      if (effectData.properties.speedMultiplier) {
        multiplier *= effectData.properties.speedMultiplier;
      }
    }

    return Math.max(0.3, Math.min(2.0, multiplier)); // 限制在合理范围
  }

  /**
   * 获取分数倍数
   */
  getScoreMultiplier() {
    let multiplier = 1.0;

    for (const [effectType, effectData] of this.activeEffects) {
      if (effectData.properties.scoreMultiplier) {
        multiplier *= effectData.properties.scoreMultiplier;
      }
    }

    return multiplier;
  }

  /**
   * 检查是否有指定效果
   */
  hasEffect(effectType) {
    return this.activeEffects.has(effectType);
  }

  /**
   * 获取效果剩余时间
   */
  getEffectRemainingTime(effectType) {
    if (!this.activeEffects.has(effectType)) {
      return 0;
    }

    const effectData = this.activeEffects.get(effectType);
    const elapsed = Date.now() - effectData.startTime;
    return Math.max(0, effectData.duration - elapsed);
  }

  /**
   * 获取效果进度 (0-1)
   */
  getEffectProgress(effectType) {
    if (!this.activeEffects.has(effectType)) {
      return 0;
    }

    const effectData = this.activeEffects.get(effectType);
    const elapsed = Date.now() - effectData.startTime;
    return Math.min(1, elapsed / effectData.duration);
  }

  /**
   * 获取所有活动效果的信息
   */
  getActiveEffectsInfo() {
    const effectsInfo = [];
    const currentTime = Date.now();

    for (const [effectType, effectData] of this.activeEffects) {
      const elapsed = currentTime - effectData.startTime;
      const remaining = Math.max(0, effectData.duration - elapsed);
      const progress = elapsed / effectData.duration;

      effectsInfo.push({
        type: effectType,
        name: effectData.name,
        startTime: effectData.startTime,
        duration: effectData.duration,
        remaining,
        progress,
        properties: effectData.properties
      });
    }

    return effectsInfo;
  }

  /**
   * 设置效果回调
   */
  setEffectCallback(effectType, callback) {
    this.effectCallbacks.set(effectType, callback);
  }

  /**
   * 移除效果回调
   */
  removeEffectCallback(effectType) {
    this.effectCallbacks.delete(effectType);
  }

  /**
   * 清除所有效果
   */
  clearAllEffects() {
    const clearedEffects = Array.from(this.activeEffects.keys());
    this.activeEffects.clear();
    console.log('🧹 清除所有效果:', clearedEffects);
    return clearedEffects;
  }

  /**
   * 暂停所有效果（用于游戏暂停）
   */
  pauseEffects() {
    this.pausedEffects = new Map(this.activeEffects);
    this.pauseTime = Date.now();
    this.activeEffects.clear();
  }

  /**
   * 恢复所有效果（用于游戏恢复）
   */
  resumeEffects() {
    if (!this.pausedEffects) {
      return;
    }

    const pauseDuration = Date.now() - this.pauseTime;

    // 调整效果开始时间
    for (const [effectType, effectData] of this.pausedEffects) {
      effectData.startTime += pauseDuration;
      this.activeEffects.set(effectType, effectData);
    }

    this.pausedEffects = null;
    this.pauseTime = null;
  }

  /**
   * 获取效果统计信息
   */
  getStatistics() {
    const stats = {
      activeCount: this.activeEffects.size,
      totalEffects: this.activeEffects.size,
      speedMultiplier: this.getSpeedMultiplier(),
      scoreMultiplier: this.getScoreMultiplier(),
      effects: this.getActiveEffectsInfo()
    };

    return stats;
  }

  /**
   * 格式化效果显示文本
   */
  formatEffectsDisplay() {
    const effectsInfo = this.getActiveEffectsInfo();
    const displayTexts = [];

    for (const effect of effectsInfo) {
      const remainingSeconds = Math.ceil(effect.remaining / 1000);
      let icon = '';

      // 根据效果类型选择图标
      switch(effect.type) {
        case 'speed_up':
          icon = '⚡';
          break;
        case 'slow_down':
          icon = '💧';
          break;
        case 'double_score':
          icon = '⭐';
          break;
        default:
          icon = '✨';
      }

      displayTexts.push(`${icon} ${effect.name}: ${remainingSeconds}s`);
    }

    return displayTexts.length > 0 ? displayTexts.join(' | ') : '';
  }

  /**
   * 创建效果进度条数据
   */
  getProgressBarsData() {
    const progressBars = [];
    const colorMap = {
      speed_up: 0x3b82f6,    // 蓝色
      slow_down: 0x10b981,   // 绿色
      double_score: 0xf59e0b  // 金色
    };

    for (const [effectType, effectData] of this.activeEffects) {
      const progress = this.getEffectProgress(effectType);
      const color = colorMap[effectType] || 0x6b7280;

      progressBars.push({
        type: effectType,
        progress,
        color,
        remaining: Math.ceil(effectData.duration - (Date.now() - effectData.startTime))
      });
    }

    return progressBars;
  }
}

export default EffectManager;
/**
 * 触觉反馈系统
 * 为移动端游戏提供丰富的振动反馈体验
 */

import { HapticPattern } from '../types/MobileTypes.js';

export class HapticFeedback {
  constructor(config = {}) {
    // 默认配置
    this.defaultConfig = {
      enabled: true,
      intensity: 0.7, // 0.0 到 1.0
      patterns: {
        // 基础反馈模式
        light: [10],
        medium: [20],
        heavy: [50],

        // 游戏事件反馈
        move: [5],
        collision: [100, 50, 100],
        eat: [15, 30, 15],
        gameOver: [200, 100, 200, 100, 200],
        levelUp: [50, 30, 50, 30, 100],

        // UI交互反馈
        buttonPress: [10],
        menuOpen: [20],
        menuClose: [15],

        // 特殊效果
        success: [10, 50, 10],
        warning: [50, 30, 50],
        error: [100],

        // 节奏模式
        rhythm: [8, 4, 8, 4, 8],
        heartbeat: [20, 40, 20, 40, 20, 60]
      },
      adaptiveIntensity: true,
      batterySaving: true,
      userPreferences: {
        enabled: true,
        intensity: 0.7,
        disableOnLowBattery: false
      }
    };

    // 合并配置
    this.config = { ...this.defaultConfig, ...config };

    // 系统兼容性检查
    this.isSupported = this.checkSupport();
    this.supportsAdvancedVibration = this.checkAdvancedSupport();

    // 状态管理
    this.isEnabled = this.config.enabled && this.isSupported;
    this.currentIntensity = this.config.intensity;
    this.lastVibrationTime = 0;
    this.vibrationQueue = [];
    this.isProcessingQueue = false;

    // 用户交互状态 - 解决浏览器振动安全策略
    this.hasUserInteraction = false;
    this.pendingVibrations = [];
    this.isWaitingForInteraction = false;

    // 性能监控
    this.metrics = {
      totalVibrations: 0,
      totalVibrationTime: 0,
      averageIntensity: 0,
      batteryUsage: 0
    };

    // 电池状态
    this.batteryLevel = 1.0;
    this.isLowBattery = false;

    // 用户偏好设置
    this.userPreferences = { ...this.config.userPreferences };

    // 初始化
    this.initialize();
  }

  /**
   * 初始化触觉反馈系统
   */
  async initialize() {
    if (!this.isSupported) {
      console.warn('Haptic feedback not supported on this device');
      return;
    }

    // 设置用户交互监听器
    this.setupUserInteractionListeners();

    // 检查电池API
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.batteryLevel = battery.level;
        this.isLowBattery = battery.level < 0.2;

        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.isLowBattery = battery.level < 0.2;
          this.handleBatteryChange();
        });
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }

    // 加载用户偏好设置
    this.loadUserPreferences();

    // 开始处理振动队列
    this.startQueueProcessor();
  }

  /**
   * 检查基础振动支持
   */
  checkSupport() {
    return 'vibrate' in navigator;
  }

  /**
   * 检查高级振动支持（如Vibration API的完整功能）
   */
  checkAdvancedSupport() {
    // 检查是否支持模式振动
    return this.isSupported && navigator.vibrate.length > 1;
  }

  /**
   * 设置用户交互监听器
   * 解决浏览器振动安全策略问题
   */
  setupUserInteractionListeners() {
    // 监听用户交互事件
    const interactionEvents = [
      'click', 'touchstart', 'touchend', 'pointerdown',
      'pointerup', 'mousedown', 'mouseup', 'keydown', 'keyup'
    ];

    const handleUserInteraction = (event) => {
      if (!this.hasUserInteraction) {
        this.hasUserInteraction = true;
        console.log('User interaction detected, haptic feedback enabled');

        // 移除事件监听器以避免重复处理
        interactionEvents.forEach(eventType => {
          document.removeEventListener(eventType, handleUserInteraction);
        });

        // 执行待处理的振动
        this.processPendingVibrations();
      }
    };

    // 添加事件监听器
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, handleUserInteraction, {
        once: false,  // 防止事件被移除后还能触发
        passive: true
      });
    });

    // 检查是否已经有用户交互（页面加载后）
    if (document.visibilityState === 'visible' &&
        (document.hasFocus() || performance.now() > 1000)) {
      // 如果页面已经加载并活跃，尝试检测之前的交互
      this.hasUserInteraction = true;
    }
  }

  /**
   * 处理待处理的振动
   */
  processPendingVibrations() {
    if (this.pendingVibrations.length > 0) {
      console.log(`Processing ${this.pendingVibrations.length} pending vibrations`);

      // 执行所有待处理的振动
      this.pendingVibrations.forEach(({ pattern, callback }) => {
        this.executeVibration(pattern);
        if (callback) callback();
      });

      // 清空待处理队列
      this.pendingVibrations = [];
    }
  }

  /**
   * 触发基础振动模式
   */
  trigger(pattern) {
    if (!this.shouldVibrate()) {
      return false;
    }

    const vibrationPattern = this.getPattern(pattern);
    if (!vibrationPattern) {
      console.warn(`Unknown haptic pattern: ${pattern}`);
      return false;
    }

    return this.executeVibration(vibrationPattern);
  }

  /**
   * 触发自定义振动
   */
  triggerCustom(pattern, intensity = null) {
    if (!this.shouldVibrate()) {
      return false;
    }

    const adjustedPattern = this.adjustPatternForIntensity(pattern, intensity);
    return this.executeVibration(adjustedPattern);
  }

  /**
   * 触发连续振动（如节奏游戏）
   */
  triggerContinuous(pattern, duration = 1000, interval = 100) {
    if (!this.shouldVibrate()) {
      return false;
    }

    const startTime = Date.now();
    const continuousPattern = [];

    for (let time = 0; time < duration; time += interval) {
      continuousPattern.push(time, pattern);
    }

    return this.executeVibration(continuousPattern);
  }

  /**
   * 触发渐变振动
   */
  triggerFadeIn(duration = 500, maxIntensity = null) {
    if (!this.shouldVibrate()) {
      return false;
    }

    const steps = 10;
    const stepDuration = duration / steps;
    const pattern = [];

    for (let i = 0; i < steps; i++) {
      const intensity = (i + 1) / steps;
      const vibrationTime = Math.round(stepDuration * intensity);
      pattern.push(i * stepDuration * 2, vibrationTime);
    }

    return this.executeVibration(pattern);
  }

  /**
   * 触发渐出振动
   */
  triggerFadeOut(duration = 500) {
    if (!this.shouldVibrate()) {
      return false;
    }

    const steps = 10;
    const stepDuration = duration / steps;
    const pattern = [];

    for (let i = 0; i < steps; i++) {
      const intensity = 1 - (i / steps);
      const vibrationTime = Math.round(stepDuration * intensity);
      pattern.push(i * stepDuration * 2, vibrationTime);
    }

    return this.executeVibration(pattern);
  }

  /**
   * 获取振动模式
   */
  getPattern(pattern) {
    if (Array.isArray(pattern)) {
      return pattern; // 直接返回数组模式
    }

    if (typeof pattern === 'string') {
      return this.config.patterns[pattern] || this.config.patterns[this.config.patterns.light];
    }

    if (typeof pattern === 'number') {
      return [pattern]; // 单个持续时间
    }

    return null;
  }

  /**
   * 调整振动强度
   */
  adjustPatternForIntensity(pattern, intensity = null) {
    const targetIntensity = intensity !== null ? intensity : this.currentIntensity;

    if (targetIntensity === 1.0) {
      return pattern; // 无需调整
    }

    return pattern.map(duration => Math.round(duration * targetIntensity));
  }

  /**
   * 执行振动
   */
  executeVibration(pattern) {
    if (!this.isSupported) {
      return false;
    }

    try {
      // 防抖检查
      const now = Date.now();
      if (now - this.lastVibrationTime < 16) { // 16ms防抖
        return false;
      }

      // 检查用户交互状态
      if (!this.hasUserInteraction) {
        // 如果没有用户交互，添加到待处理队列
        this.pendingVibrations.push({
          pattern,
          timestamp: now
        });

        // 如果是第一次添加，显示提示
        if (!this.isWaitingForInteraction) {
          this.isWaitingForInteraction = true;
          console.log('Haptic feedback waiting for user interaction...');
        }

        return false; // 返回false表示未执行，但已经排队
      }

      // 执行振动
      const success = navigator.vibrate(pattern);

      if (success) {
        this.lastVibrationTime = now;
        this.updateMetrics(pattern);
        return true;
      } else {
        // 振动执行失败，可能是浏览器策略问题
        console.warn('Vibration blocked by browser policy');
        return false;
      }

    } catch (error) {
      // 处理浏览器策略错误
      if (error.message && error.message.includes('user gesture')) {
        console.log('Vibration requires user interaction, adding to queue');
        this.pendingVibrations.push({
          pattern,
          timestamp: Date.now()
        });
        return false;
      }

      console.error('Vibration failed:', error);
      return false;
    }
  }

  /**
   * 队列振动（避免冲突）
   */
  queueVibration(pattern, priority = 0) {
    this.vibrationQueue.push({
      pattern,
      priority,
      timestamp: Date.now()
    });

    // 按优先级排序
    this.vibrationQueue.sort((a, b) => b.priority - a.priority);

    if (!this.isProcessingQueue) {
      this.processVibrationQueue();
    }
  }

  /**
   * 处理振动队列
   */
  processVibrationQueue() {
    if (this.vibrationQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const vibration = this.vibrationQueue.shift();

    // 检查振动是否过期（超过100ms的振动将被丢弃）
    if (Date.now() - vibration.timestamp > 100) {
      setTimeout(() => this.processVibrationQueue(), 0);
      return;
    }

    // 执行振动
    this.executeVibration(vibration.pattern);

    // 继续处理队列
    setTimeout(() => this.processVibrationQueue(), 16);
  }

  /**
   * 开始队列处理器
   */
  startQueueProcessor() {
    // 这个方法确保队列处理器持续运行
    setInterval(() => {
      if (this.vibrationQueue.length > 0 && !this.isProcessingQueue) {
        this.processVibrationQueue();
      }
    }, 50);
  }

  /**
   * 判断是否应该振动
   */
  shouldVibrate() {
    if (!this.isSupported || !this.isEnabled) {
      return false;
    }

    // 检查用户偏好
    if (!this.userPreferences.enabled) {
      return false;
    }

    // 检查电池设置
    if (this.config.batterySaving && this.isLowBattery && this.userPreferences.disableOnLowBattery) {
      return false;
    }

    // 防抖检查 - 但不阻止待处理队列
    const now = Date.now();
    if (now - this.lastVibrationTime < 16 && this.hasUserInteraction) {
      return false;
    }

    // 总是返回true，让executeVibration处理用户交互和队列
    return true;
  }

  /**
   * 处理电池变化
   */
  handleBatteryChange() {
    if (this.isLowBattery && this.config.batterySaving) {
      // 在低电量时降低振动强度
      this.currentIntensity = Math.max(0.3, this.config.intensity * 0.5);
    } else {
      this.currentIntensity = this.config.intensity;
    }
  }

  /**
   * 更新性能指标
   */
  updateMetrics(pattern) {
    this.metrics.totalVibrations++;

    const totalVibrationTime = pattern
      .filter((_, index) => index % 2 === 0) // 只计算振动持续时间
      .reduce((sum, duration) => sum + duration, 0);

    this.metrics.totalVibrationTime += totalVibrationTime;

    // 更新平均强度
    this.metrics.averageIntensity =
      (this.metrics.averageIntensity * (this.metrics.totalVibrations - 1) + this.currentIntensity) /
      this.metrics.totalVibrations;
  }

  /**
   * 加载用户偏好设置
   */
  loadUserPreferences() {
    try {
      const saved = localStorage.getItem('hapticFeedbackPreferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        this.userPreferences = { ...this.userPreferences, ...preferences };
        this.currentIntensity = this.userPreferences.intensity;
        this.isEnabled = this.userPreferences.enabled;
      }
    } catch (error) {
      console.warn('Failed to load haptic preferences:', error);
    }
  }

  /**
   * 保存用户偏好设置
   */
  saveUserPreferences() {
    try {
      localStorage.setItem('hapticFeedbackPreferences', JSON.stringify(this.userPreferences));
    } catch (error) {
      console.warn('Failed to save haptic preferences:', error);
    }
  }

  /**
   * 设置启用状态
   */
  setEnabled(enabled) {
    this.isEnabled = enabled && this.isSupported;
    this.userPreferences.enabled = this.isEnabled;
    this.saveUserPreferences();
  }

  /**
   * 设置强度
   */
  setIntensity(intensity) {
    this.currentIntensity = Math.max(0, Math.min(1, intensity));
    this.userPreferences.intensity = this.currentIntensity;
    this.saveUserPreferences();
  }

  /**
   * 设置电池节省模式
   */
  setBatterySaving(enabled) {
    this.config.batterySaving = enabled;
    this.handleBatteryChange();
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      supported: this.isSupported,
      advancedSupport: this.supportsAdvancedVibration,
      currentIntensity: this.currentIntensity,
      batteryLevel: this.batteryLevel,
      isLowBattery: this.isLowBattery,
      hasUserInteraction: this.hasUserInteraction,
      isWaitingForInteraction: this.isWaitingForInteraction,
      pendingVibrations: this.pendingVibrations.length,
      metrics: { ...this.metrics },
      userPreferences: { ...this.userPreferences }
    };
  }

  /**
   * 手动触发用户交互状态
   * 用于在已知用户已交互的情况下启用触觉反馈
   */
  setUserInteraction(interacted = true) {
    this.hasUserInteraction = interacted;
    if (interacted) {
      this.processPendingVibrations();
    }
  }

  /**
   * 检查是否等待用户交互
   */
  isWaitingForUserInteraction() {
    return this.isWaitingForInteraction && !this.hasUserInteraction;
  }

  /**
   * 获取可用的振动模式
   */
  getAvailablePatterns() {
    return Object.keys(this.config.patterns);
  }

  /**
   * 添加自定义振动模式
   */
  addPattern(name, pattern) {
    this.config.patterns[name] = pattern;
  }

  /**
   * 移除振动模式
   */
  removePattern(name) {
    delete this.config.patterns[name];
  }

  /**
   * 清空振动队列
   */
  clearQueue() {
    this.vibrationQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * 停止当前振动
   */
  stop() {
    if (this.isSupported) {
      navigator.vibrate(0);
    }
    this.clearQueue();
  }

  /**
   * 测试振动
   */
  test(pattern = 'medium') {
    this.trigger(pattern);
  }

  /**
   * 销毁触觉反馈系统
   */
  destroy() {
    this.stop();

    // 清理用户交互监听器
    // 注意：由于事件监听器是匿名函数，它们会在页面卸载时自动清理
    // 我们只需要重置状态
    this.hasUserInteraction = false;
    this.pendingVibrations = [];
    this.isWaitingForInteraction = false;

    this.saveUserPreferences();
  }

  // 静态方法：创建预设配置
  static createGamingConfig() {
    return {
      enabled: true,
      intensity: 0.8,
      adaptiveIntensity: true,
      batterySaving: false,
      patterns: {
        // 游戏专用模式
        move: [3],
        turn: [5],
        boost: [10, 20, 10],
        collision: [80, 40, 80],
        eat: [12, 24, 12],
        powerUp: [15, 10, 15, 10, 30],
        levelUp: [30, 20, 30, 20, 50],
        gameOver: [150, 75, 150, 75, 200],
        achievement: [20, 30, 20, 30, 20, 60]
      }
    };
  }

  static createAccessibilityConfig() {
    return {
      enabled: true,
      intensity: 1.0,
      adaptiveIntensity: false,
      batterySaving: false,
      patterns: {
        // 无障碍专用模式
        announcement: [100],
        warning: [50, 25, 50],
        error: [150],
        success: [25, 50, 25],
        direction: {
          up: [20],
          down: [20, 10, 20],
          left: [15, 15],
          right: [15, 5, 15]
        }
      }
    };
  }
}

export default HapticFeedback;
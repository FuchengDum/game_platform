/**
 * 移动端性能管理器
 * 监控和优化游戏性能，自动调整质量设置
 */

import { PerformanceMetrics } from '../types/MobileTypes.js';

export class MobilePerformanceManager {
  constructor(phaserScene, config = {}) {
    this.scene = phaserScene;

    // 默认配置
    this.defaultConfig = {
      targetFPS: 60,
      minFPS: 30,
      criticalFPS: 20,
      monitoringInterval: 1000, // 1秒
      adjustmentThreshold: 5, // 连续5次低于阈值才调整
      historySize: 10, // FPS历史记录大小

      // 性能等级
      qualityLevels: {
        ultra: {
          particleCount: 20,
          effectsEnabled: true,
          highQualityTextures: true,
          antiAliasing: true,
          shadowQuality: 'high',
          renderDistance: 100
        },
        high: {
          particleCount: 15,
          effectsEnabled: true,
          highQualityTextures: true,
          antiAliasing: true,
          shadowQuality: 'medium',
          renderDistance: 80
        },
        medium: {
          particleCount: 10,
          effectsEnabled: true,
          highQualityTextures: false,
          antiAliasing: false,
          shadowQuality: 'low',
          renderDistance: 60
        },
        low: {
          particleCount: 5,
          effectsEnabled: false,
          highQualityTextures: false,
          antiAliasing: false,
          shadowQuality: 'none',
          renderDistance: 40
        }
      },

      // 自适应设置
      adaptiveQuality: true,
      batterySaving: true,
      thermalThrottling: true,

      // 优化策略
      optimizationStrategies: {
        reduceParticles: true,
        disableEffects: true,
        lowerTextureQuality: true,
        reduceRenderDistance: true,
        adjustUpdateRate: true
      }
    };

    // 合并配置
    this.config = { ...this.defaultConfig, ...config };

    // 性能监控
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      renderTime: 0,
      updateTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      textureMemory: 0,
      batteryLevel: 1.0,
      thermalState: 'normal'
    };

    // FPS历史
    this.fpsHistory = [];
    this.consecutiveLowFPS = 0;
    this.consecutiveHighFPS = 0;

    // 当前质量等级
    this.currentQuality = 'high';
    this.isOptimizationActive = false;

    // 监控定时器
    this.monitoringTimer = null;

    // 设备能力检测
    this.deviceCapabilities = this.detectDeviceCapabilities();

    // 性能回调
    this.onPerformanceWarningCallback = null;
    this.onQualityChangeCallback = null;
    this.onOptimizationToggleCallback = null;

    // 初始化
    this.initialize();
  }

  /**
   * 初始化性能管理器
   */
  initialize() {
    // 设置初始质量等级
    this.setInitialQuality();

    // 开始性能监控
    this.startMonitoring();

    // 监听电池和温度变化
    this.setupDeviceMonitoring();

    // 监听页面可见性变化
    this.setupVisibilityMonitoring();

    console.log('MobilePerformanceManager initialized with quality:', this.currentQuality);
  }

  /**
   * 检测设备能力
   */
  detectDeviceCapabilities() {
    const capabilities = {
      cores: navigator.hardwareConcurrency || 4,
      memory: navigator.deviceMemory || 4, // GB
      pixelRatio: window.devicePixelRatio || 1,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android.*Mobile/i.test(navigator.userAgent) && window.innerWidth > 768,
      webgl: !!window.WebGLRenderingContext,
      webgl2: !!window.WebGL2RenderingContext,
      offscreenCanvas: !!window.OffscreenCanvas
    };

    // 计算设备性能评分
    capabilities.performanceScore = this.calculatePerformanceScore(capabilities);

    return capabilities;
  }

  /**
   * 计算设备性能评分
   */
  calculatePerformanceScore(capabilities) {
    let score = 0;

    // CPU核心数
    score += Math.min(capabilities.cores / 8, 1) * 25;

    // 内存大小
    score += Math.min(capabilities.memory / 8, 1) * 25;

    // 像素比（高像素比需要更多性能）
    score += Math.max(0, 1 - (capabilities.pixelRatio - 1) / 2) * 15;

    // WebGL支持
    score += (capabilities.webgl ? 15 : 0) + (capabilities.webgl2 ? 10 : 0);

    // 其他特性
    score += (capabilities.offscreenCanvas ? 10 : 0);

    return Math.round(score);
  }

  /**
   * 设置初始质量等级
   */
  setInitialQuality() {
    const score = this.deviceCapabilities.performanceScore;

    if (score >= 80) {
      this.currentQuality = 'ultra';
    } else if (score >= 60) {
      this.currentQuality = 'high';
    } else if (score >= 40) {
      this.currentQuality = 'medium';
    } else {
      this.currentQuality = 'low';
    }

    this.applyQualitySettings(this.currentQuality);
  }

  /**
   * 开始性能监控
   */
  startMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = setInterval(() => {
      this.updateMetrics();
      this.analyzePerformance();
    }, this.config.monitoringInterval);
  }

  /**
   * 停止性能监控
   */
  stopMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  /**
   * 更新性能指标
   */
  updateMetrics() {
    // FPS计算
    if (this.scene && this.scene.game && this.scene.game.loop) {
      const fps = this.scene.game.loop.actualFps;
      this.metrics.fps = Math.round(fps);
      this.metrics.frameTime = 1000 / fps;
    }

    // 内存使用情况
    if (performance.memory) {
      this.metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024); // MB
    }

    // 绘制调用次数（如果支持）
    if (this.scene && this.scene.renderer) {
      // 这里需要根据具体渲染器实现
      this.metrics.drawCalls = this.scene.renderer.drawCalls || 0;
    }

    // 添加到FPS历史
    this.fpsHistory.push(this.metrics.fps);
    if (this.fpsHistory.length > this.config.historySize) {
      this.fpsHistory.shift();
    }

    // 计算平均FPS
    const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    this.metrics.averageFPS = Math.round(avgFPS);
  }

  /**
   * 分析性能并优化
   */
  analyzePerformance() {
    const currentFPS = this.metrics.fps;
    const avgFPS = this.metrics.averageFPS;

    // 检查低FPS情况
    if (currentFPS < this.config.criticalFPS) {
      this.consecutiveLowFPS++;
      this.consecutiveHighFPS = 0;

      if (this.consecutiveLowFPS >= this.config.adjustmentThreshold) {
        this.handlePerformanceCrisis();
      }
    } else if (currentFPS < this.config.minFPS) {
      this.consecutiveLowFPS++;
      this.consecutiveHighFPS = 0;

      if (this.consecutiveLowFPS >= this.config.adjustmentThreshold) {
        this.handlePerformanceIssue();
      }
    } else if (currentFPS >= this.config.targetFPS - 5) {
      this.consecutiveLowFPS = 0;
      this.consecutiveHighFPS++;

      if (this.consecutiveHighFPS >= this.config.adjustmentThreshold * 2) {
        this.considerQualityUpgrade();
      }
    } else {
      this.consecutiveLowFPS = 0;
      this.consecutiveHighFPS = 0;
    }

    // 检查内存使用
    if (this.metrics.memoryUsage > 150) { // 150MB阈值
      this.handleMemoryPressure();
    }
  }

  /**
   * 处理性能危机
   */
  handlePerformanceCrisis() {
    console.warn('Performance crisis detected! FPS:', this.metrics.fps);

    // 立即降低质量
    this.downgradeQuality();

    // 触发性能警告
    if (this.onPerformanceWarningCallback) {
      this.onPerformanceWarningCallback({
        type: 'crisis',
        fps: this.metrics.fps,
        quality: this.currentQuality
      });
    }

    this.consecutiveLowFPS = 0; // 重置计数器
  }

  /**
   * 处理性能问题
   */
  handlePerformanceIssue() {
    console.warn('Performance issue detected! FPS:', this.metrics.fps);

    if (this.config.adaptiveQuality) {
      this.optimizePerformance();
    }

    if (this.onPerformanceWarningCallback) {
      this.onPerformanceWarningCallback({
        type: 'issue',
        fps: this.metrics.fps,
        quality: this.currentQuality
      });
    }

    this.consecutiveLowFPS = Math.floor(this.config.adjustmentThreshold / 2); // 部分重置
  }

  /**
   * 考虑质量升级
   */
  considerQualityUpgrade() {
    if (this.currentQuality === 'ultra') {
      return; // 已经是最高质量
    }

    const qualities = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = qualities.indexOf(this.currentQuality);
    const nextQuality = qualities[currentIndex + 1];

    // 检查是否可以安全升级
    if (this.canUpgradeQuality(nextQuality)) {
      this.upgradeQuality();
    }
  }

  /**
   * 优化性能
   */
  optimizePerformance() {
    const strategies = this.config.optimizationStrategies;
    const currentLevel = this.config.qualityLevels[this.currentQuality];

    // 根据策略优化
    if (strategies.reduceParticles && currentLevel.particleCount > 5) {
      this.reduceParticleCount();
    }

    if (strategies.disableEffects && currentLevel.effectsEnabled) {
      this.disableEffects();
    }

    if (strategies.lowerTextureQuality && currentLevel.highQualityTextures) {
      this.lowerTextureQuality();
    }

    if (strategies.reduceRenderDistance && currentLevel.renderDistance > 40) {
      this.reduceRenderDistance();
    }

    if (strategies.adjustUpdateRate) {
      this.adjustUpdateRate();
    }

    this.isOptimizationActive = true;

    if (this.onOptimizationToggle) {
      this.onOptimizationToggle(true);
    }
  }

  /**
   * 降级质量
   */
  downgradeQuality() {
    const qualities = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = qualities.indexOf(this.currentQuality);

    if (currentIndex > 0) {
      const newQuality = qualities[currentIndex - 1];
      this.setQuality(newQuality);
    }
  }

  /**
   * 升级质量
   */
  upgradeQuality() {
    const qualities = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = qualities.indexOf(this.currentQuality);

    if (currentIndex < qualities.length - 1) {
      const newQuality = qualities[currentIndex + 1];
      this.setQuality(newQuality);
    }
  }

  /**
   * 设置质量等级
   */
  setQuality(quality) {
    if (!this.config.qualityLevels[quality]) {
      console.error(`Unknown quality level: ${quality}`);
      return;
    }

    const oldQuality = this.currentQuality;
    this.currentQuality = quality;

    this.applyQualitySettings(quality);

    if (this.onQualityChangeCallback) {
      this.onQualityChangeCallback({
        from: oldQuality,
        to: quality,
        metrics: this.getMetrics()
      });
    }

    console.log(`Quality changed from ${oldQuality} to ${quality}`);
  }

  /**
   * 应用质量设置
   */
  applyQualitySettings(quality) {
    const settings = this.config.qualityLevels[quality];

    if (!settings) return;

    // 更新粒子数量
    this.setParticleCount(settings.particleCount);

    // 更新特效设置
    this.setEffectsEnabled(settings.effectsEnabled);

    // 更新纹理质量
    this.setTextureQuality(settings.highQualityTextures);

    // 更新抗锯齿
    this.setAntiAliasing(settings.antiAliasing);

    // 更新阴影质量
    this.setShadowQuality(settings.shadowQuality);

    // 更新渲染距离
    this.setRenderDistance(settings.renderDistance);
  }

  /**
   * 设置粒子数量
   */
  setParticleCount(count) {
    // 这里需要根据具体的粒子系统实现
    this.scene.events.emit('performance:setParticleCount', count);
  }

  /**
   * 设置特效启用状态
   */
  setEffectsEnabled(enabled) {
    this.scene.events.emit('performance:setEffectsEnabled', enabled);
  }

  /**
   * 设置纹理质量
   */
  setTextureQuality(highQuality) {
    this.scene.events.emit('performance:setTextureQuality', highQuality);
  }

  /**
   * 设置抗锯齿
   */
  setAntiAliasing(enabled) {
    this.scene.events.emit('performance:setAntiAliasing', enabled);
  }

  /**
   * 设置阴影质量
   */
  setShadowQuality(quality) {
    this.scene.events.emit('performance:setShadowQuality', quality);
  }

  /**
   * 设置渲染距离
   */
  setRenderDistance(distance) {
    this.scene.events.emit('performance:setRenderDistance', distance);
  }

  /**
   * 处理内存压力
   */
  handleMemoryPressure() {
    console.warn('Memory pressure detected:', this.metrics.memoryUsage, 'MB');

    // 清理未使用的纹理
    this.cleanupTextures();

    // 强制垃圾回收（如果支持）
    if (window.gc) {
      window.gc();
    }

    // 降低质量
    if (this.currentQuality !== 'low') {
      this.downgradeQuality();
    }
  }

  /**
   * 清理纹理
   */
  cleanupTextures() {
    if (this.scene && this.scene.textures) {
      this.scene.textures.each((texture) => {
        if (!texture.visible) {
          this.scene.textures.remove(texture.key);
        }
      });
    }
  }

  /**
   * 设置设备监控
   */
  setupDeviceMonitoring() {
    // 电池监控
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        this.metrics.batteryLevel = battery.level;

        battery.addEventListener('levelchange', () => {
          this.metrics.batteryLevel = battery.level;
          this.handleBatteryChange();
        });

        battery.addEventListener('chargingchange', () => {
          this.handleBatteryChange();
        });
      });
    }

    // 温度监控（实验性API）
    if ('thermal' in navigator) {
      // 实现温度监控逻辑
    }
  }

  /**
   * 处理电池变化
   */
  handleBatteryChange() {
    if (this.config.batterySaving && this.metrics.batteryLevel < 0.2) {
      // 低电量时启用省电模式
      if (this.currentQuality !== 'low') {
        this.setQuality('low');
      }
    }
  }

  /**
   * 设置可见性监控
   */
  setupVisibilityMonitoring() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面隐藏时降低性能消耗
        this.pausePerformanceMonitoring();
      } else {
        // 页面显示时恢复正常性能
        this.resumePerformanceMonitoring();
      }
    });
  }

  /**
   * 暂停性能监控
   */
  pausePerformanceMonitoring() {
    this.stopMonitoring();
    if (this.scene && this.scene.game) {
      this.scene.game.loop.sleep();
    }
  }

  /**
   * 恢复性能监控
   */
  resumePerformanceMonitoring() {
    this.startMonitoring();
    if (this.scene && this.scene.game) {
      this.scene.game.loop.wake();
    }
  }

  /**
   * 检查是否可以升级质量
   */
  canUpgradeQuality(targetQuality) {
    // 检查设备能力
    if (this.deviceCapabilities.performanceScore < 70 && targetQuality === 'ultra') {
      return false;
    }

    // 检查电池状态
    if (this.config.batterySaving && this.metrics.batteryLevel < 0.5) {
      return false;
    }

    // 检查内存使用
    if (this.metrics.memoryUsage > 100) {
      return false;
    }

    return true;
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    return {
      ...this.metrics,
      currentQuality: this.currentQuality,
      deviceCapabilities: this.deviceCapabilities,
      isOptimizationActive: this.isOptimizationActive,
      consecutiveLowFPS: this.consecutiveLowFPS,
      consecutiveHighFPS: this.consecutiveHighFPS
    };
  }

  /**
   * 设置性能警告回调
   */
  onPerformanceWarning(callback) {
    this.onPerformanceWarningCallback = callback;
  }

  /**
   * 设置质量变化回调
   */
  onQualityChange(callback) {
    this.onQualityChangeCallback = callback;
  }

  /**
   * 设置优化切换回调
   */
  onOptimizationToggle(callback) {
    this.onOptimizationToggleCallback = callback;
  }

  /**
   * 重置优化状态
   */
  resetOptimization() {
    this.isOptimizationActive = false;
    this.consecutiveLowFPS = 0;
    this.consecutiveHighFPS = 0;

    if (this.onOptimizationToggle) {
      this.onOptimizationToggle(false);
    }
  }

  /**
   * 强制垃圾回收
   */
  forceGC() {
    if (window.gc) {
      window.gc();
    } else {
      console.warn('Manual garbage collection not available');
    }
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const report = {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      deviceInfo: this.deviceCapabilities,
      settings: this.config,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  /**
   * 生成性能建议
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.fps < 30) {
      recommendations.push('Consider lowering quality settings for better performance');
    }

    if (this.metrics.memoryUsage > 150) {
      recommendations.push('High memory usage detected, try closing other applications');
    }

    if (this.deviceCapabilities.performanceScore < 50) {
      recommendations.push('Device performance is limited, use low quality settings');
    }

    if (this.metrics.batteryLevel < 0.2) {
      recommendations.push('Low battery level detected, enable battery saving mode');
    }

    if (!this.deviceCapabilities.webgl) {
      recommendations.push('WebGL not supported, consider upgrading your browser');
    }

    return recommendations;
  }

  /**
   * 销毁性能管理器
   */
  destroy() {
    this.stopMonitoring();
    this.resetOptimization();

    // 移除事件监听器
    this.onPerformanceWarningCallback = null;
    this.onQualityChangeCallback = null;
    this.onOptimizationToggleCallback = null;

    console.log('MobilePerformanceManager destroyed');
  }
}

export default MobilePerformanceManager;
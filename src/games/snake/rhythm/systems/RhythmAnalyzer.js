/**
 * RhythmAnalyzer - 音乐节奏分析系统
 * 实现Requirement 7: 音乐同步游戏玩法系统
 * 使用Web Audio API进行实时音频分析，检测节拍并提供节奏同步机制
 */

export class RhythmAnalyzer {
  constructor(config = {}) {
    // 基础配置
    this.isEnabled = config.enabled !== false;
    this.beatSensitivity = config.beatSensitivity || 1.0;
    this.minBPM = config.minBPM || 60;
    this.maxBPM = config.maxBPM || 200;

    // 音频上下文和分析器
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;

    // 节拍检测相关
    this.beatDetector = new BeatDetector(this.minBPM, this.maxBPM);
    this.tempoEstimator = new TempoEstimator();

    // 节奏数据
    this.currentBeatData = {
      bpm: 120,
      beatInterval: 500, // ms
      nextBeatTime: 0,
      beatPhase: 0,
      isOnBeat: false,
      confidence: 0,
      lastBeatTime: 0
    };

    // 连击系统
    this.comboSystem = new RhythmComboSystem();

    // 视觉指示器数据
    this.visualData = {
      beatIndicators: [],
      rhythmEffects: [],
      optimalTimingWindow: 150, // ms before/after beat
      currentTimingWindow: 0
    };

    // 事件系统
    this.eventListeners = new Map();

    // 调试和统计
    this.statistics = {
      beatsDetected: 0,
      comboHits: 0,
      totalAnalysisTime: 0,
      averageConfidence: 0,
      genreDetections: {}
    };
  }

  /**
   * 初始化音频分析器
   */
  async initialize(audioElement = null) {
    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // 创建分析器节点
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // 设置数据数组
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // 连接音频源
      if (audioElement) {
        this.source = this.audioContext.createMediaElementSource(audioElement);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      } else {
        // 使用默认音频输出
        this.analyser.connect(this.audioContext.destination);
      }

      console.log('🎵 RhythmAnalyzer初始化成功');
      this.triggerEvent('initialized', { enabled: this.isEnabled });

      return true;
    } catch (error) {
      console.error('❌ RhythmAnalyzer初始化失败:', error);
      this.isEnabled = false;
      return false;
    }
  }

  /**
   * 开始节奏分析
   */
  start() {
    if (!this.isEnabled || !this.audioContext) {
      console.warn('⚠️ RhythmAnalyzer未启用或未初始化');
      return false;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.beatDetector.reset();
    this.tempoEstimator.reset();
    this.comboSystem.reset();

    this.lastAnalysisTime = Date.now();
    this.isAnalyzing = true;

    console.log('🎵 开始节奏分析');
    this.triggerEvent('analysis_started');

    return true;
  }

  /**
   * 停止节奏分析
   */
  stop() {
    this.isAnalyzing = false;
    console.log('🔇 停止节奏分析');
    this.triggerEvent('analysis_stopped', this.statistics);
  }

  /**
   * 更新节奏分析 (主循环)
   */
  update(deltaTime) {
    if (!this.isAnalyzing || !this.analyser) {
      return;
    }

    const currentTime = Date.now();

    // 获取音频数据
    this.analyser.getByteFrequencyData(this.dataArray);

    // 分析音频特征
    const audioFeatures = this.extractAudioFeatures();

    // 更新节拍检测
    this.updateBeatDetection(audioFeatures, currentTime);

    // 更新节奏数据
    this.updateRhythmData(currentTime);

    // 更新视觉指示器
    this.updateVisualIndicators(currentTime);

    // 更新连击系统
    this.comboSystem.update(this.currentBeatData, currentTime);

    // 更新统计
    this.updateStatistics(audioFeatures);

    // 触发更新事件
    this.triggerEvent('rhythm_update', {
      beatData: this.currentBeatData,
      visualData: this.visualData,
      comboData: this.comboSystem.getCurrentCombo()
    });
  }

  /**
   * 提取音频特征
   */
  extractAudioFeatures() {
    if (!this.dataArray) return null;

    // 计算能量
    let totalEnergy = 0;
    let bassEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;

    const bassRange = Math.floor(this.dataArray.length * 0.1);
    const midRange = Math.floor(this.dataArray.length * 0.5);

    for (let i = 0; i < this.dataArray.length; i++) {
      const value = this.dataArray[i];
      totalEnergy += value;

      if (i < bassRange) {
        bassEnergy += value;
      } else if (i < midRange) {
        midEnergy += value;
      } else {
        highEnergy += value;
      }
    }

    // 归一化
    const normalization = this.dataArray.length * 255;

    return {
      totalEnergy: totalEnergy / normalization,
      bassEnergy: bassEnergy / (bassRange * 255),
      midEnergy: midEnergy / ((midRange - bassRange) * 255),
      highEnergy: highEnergy / ((this.dataArray.length - midRange) * 255),
      spectralCentroid: this.calculateSpectralCentroid(),
      zeroCrossingRate: this.calculateZeroCrossingRate()
    };
  }

  /**
   * 计算频谱质心 (音调亮度)
   */
  calculateSpectralCentroid() {
    if (!this.dataArray) return 0;

    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      weightedSum += i * this.dataArray[i];
      magnitudeSum += this.dataArray[i];
    }

    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  /**
   * 计算过零率 (节奏复杂性)
   */
  calculateZeroCrossingRate() {
    if (!this.dataArray) return 0;

    let crossings = 0;
    const threshold = 128; // 零点阈值

    for (let i = 1; i < this.dataArray.length; i++) {
      const prev = this.dataArray[i - 1] - threshold;
      const curr = this.dataArray[i] - threshold;

      if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
        crossings++;
      }
    }

    return crossings / this.dataArray.length;
  }

  /**
   * 更新节拍检测
   */
  updateBeatDetection(audioFeatures, currentTime) {
    if (!audioFeatures) return;

    // 检测节拍
    const beatResult = this.beatDetector.detect(audioFeatures, currentTime);

    if (beatResult.isBeat) {
      this.currentBeatData.lastBeatTime = currentTime;
      this.currentBeatData.isOnBeat = true;
      this.currentBeatData.confidence = beatResult.confidence;

      // 更新BPM估算
      const bpmUpdate = this.tempoEstimator.update(currentTime);
      if (bpmUpdate) {
        this.currentBeatData.bpm = bpmUpdate.bpm;
        this.currentBeatData.beatInterval = 60000 / bpmUpdate.bpm;
      }

      // 计算下一个节拍时间
      this.currentBeatData.nextBeatTime = currentTime + this.currentBeatData.beatInterval;

      // 触发节拍事件
      this.triggerEvent('beat_detected', {
        time: currentTime,
        bpm: this.currentBeatData.bpm,
        confidence: beatResult.confidence
      });

      // 检查连击
      this.comboSystem.checkBeatHit(currentTime, this.visualData.currentTimingWindow);

      this.statistics.beatsDetected++;
    } else {
      this.currentBeatData.isOnBeat = false;
    }
  }

  /**
   * 更新节奏数据
   */
  updateRhythmData(currentTime) {
    const timeSinceLastBeat = currentTime - this.currentBeatData.lastBeatTime;
    const beatInterval = this.currentBeatData.beatInterval;

    if (beatInterval > 0) {
      // 计算节拍相位 (0-1, 0为节拍点)
      this.currentBeatData.beatPhase = (timeSinceLastBeat % beatInterval) / beatInterval;
    }

    // 检查是否在节拍时间窗口内
    const timeToNextBeat = this.currentBeatData.nextBeatTime - currentTime;
    this.visualData.currentTimingWindow = Math.abs(timeToNextBeat) < this.visualData.optimalTimingWindow;
  }

  /**
   * 更新视觉指示器
   */
  updateVisualIndicators(currentTime) {
    // 清理旧的效果
    this.visualData.beatIndicators = this.visualData.beatIndicators.filter(
      indicator => currentTime - indicator.startTime < indicator.duration
    );

    // 如果在节拍上，创建新指示器
    if (this.currentBeatData.isOnBeat) {
      this.visualData.beatIndicators.push({
        type: 'beat',
        startTime: currentTime,
        duration: 200,
        intensity: this.currentBeatData.confidence,
        color: this.getBeatColor()
      });
    }

    // 更新节奏效果
    this.visualData.rhythmEffects = this.comboSystem.getVisualEffects(currentTime);
  }

  /**
   * 根据BPM获取节拍颜色
   */
  getBeatColor() {
    const bpm = this.currentBeatData.bpm;

    if (bpm < 80) return 0x3b82f6; // 慢速 - 蓝色
    if (bpm < 120) return 0x10b981; // 中速 - 绿色
    if (bpm < 150) return 0xf59e0b; // 快速 - 黄色
    return 0xef4444; // 极快 - 红色
  }

  /**
   * 检查是否在节拍上 (Requirement 7.2)
   */
  isOnBeat(tolerance = 150) {
    const timeSinceLastBeat = Date.now() - this.currentBeatData.lastBeatTime;
    const beatInterval = this.currentBeatData.beatInterval;

    if (beatInterval === 0) return false;

    const phase = (timeSinceLastBeat % beatInterval) / beatInterval;

    // 检查是否接近节拍点 (phase接近0或1)
    return phase < (tolerance / beatInterval) || phase > (1 - tolerance / beatInterval);
  }

  /**
   * 获取节拍时序信息
   */
  getBeatTiming() {
    return {
      ...this.currentBeatData,
      timeToNextBeat: Math.max(0, this.currentBeatData.nextBeatTime - Date.now()),
      timeSinceLastBeat: Date.now() - this.currentBeatData.lastBeatTime
    };
  }

  /**
   * 获取当前连击信息
   */
  getComboInfo() {
    return this.comboSystem.getCurrentCombo();
  }

  /**
   * 手动触发节拍命中 (用于玩家动作)
   */
  registerPlayerAction() {
    const currentTime = Date.now();
    const wasOnBeat = this.isOnBeat();

    if (wasOnBeat) {
      this.comboSystem.registerHit(currentTime);
      this.statistics.comboHits++;

      this.triggerEvent('rhythm_hit', {
        time: currentTime,
        comboLevel: this.comboSystem.getCurrentCombo().level,
        timingWindow: this.visualData.currentTimingWindow
      });

      return {
        success: true,
        comboBonus: this.comboSystem.getSpeedBonus(),
        timingQuality: this.getTimingQuality()
      };
    } else {
      this.comboSystem.registerMiss(currentTime);

      this.triggerEvent('rhythm_miss', {
        time: currentTime,
        comboLost: this.comboSystem.getCurrentCombo().level === 0
      });

      return {
        success: false,
        comboBonus: 1.0,
        timingQuality: 'miss'
      };
    }
  }

  /**
   * 获取动作时间质量
   */
  getTimingQuality() {
    const timeSinceLastBeat = Date.now() - this.currentBeatData.lastBeatTime;
    const beatInterval = this.currentBeatData.beatInterval;

    if (beatInterval === 0) return 'unknown';

    const phase = Math.abs((timeSinceLastBeat % beatInterval) - beatInterval / 2) / (beatInterval / 2);

    if (phase < 0.1) return 'perfect';
    if (phase < 0.3) return 'great';
    if (phase < 0.5) return 'good';
    return 'poor';
  }

  /**
   * 获取速度倍数 (Requirement 7.2)
   */
  getSpeedMultiplier() {
    const comboInfo = this.comboSystem.getCurrentCombo();
    const baseBonus = this.isOnBeat() ? 1.15 : 1.0; // 节拍上15%加速

    return baseBonus * comboInfo.speedMultiplier;
  }

  /**
   * 自动适应不同音乐类型 (Requirement 7.5)
   */
  adaptToGenre(audioFeatures) {
    if (!audioFeatures) return;

    // 基于音频特征检测音乐类型
    let detectedGenre = 'unknown';

    if (audioFeatures.bassEnergy > 0.6 && audioFeatures.zeroCrossingRate < 0.1) {
      detectedGenre = 'electronic';
      this.beatSensitivity = 1.2;
    } else if (audioFeatures.spectralCentroid > 0.7 && audioFeatures.midEnergy > 0.5) {
      detectedGenre = 'rock';
      this.beatSensitivity = 1.0;
    } else if (audioFeatures.spectralCentroid < 0.4 && audioFeatures.zeroCrossingRate > 0.2) {
      detectedGenre = 'classical';
      this.beatSensitivity = 0.8;
    } else {
      detectedGenre = 'pop';
      this.beatSensitivity = 1.0;
    }

    // 更新统计
    this.statistics.genreDetections[detectedGenre] =
      (this.statistics.genreDetections[detectedGenre] || 0) + 1;

    // 调整检测参数
    this.beatDetector.setSensitivity(this.beatSensitivity);

    console.log(`🎵 检测到音乐类型: ${detectedGenre}, 敏感度: ${this.beatSensitivity}`);
  }

  /**
   * 更新统计信息
   */
  updateStatistics(audioFeatures) {
    if (!audioFeatures) return;

    this.statistics.totalAnalysisTime += 16; // 假设60fps

    // 计算平均置信度
    const totalConfidence = this.statistics.beatsDetected * this.currentBeatData.confidence;
    this.statistics.averageConfidence = this.statistics.beatsDetected > 0 ?
      totalConfidence / this.statistics.beatsDetected : 0;

    // 自动适应音乐类型
    if (Math.random() < 0.01) { // 1%概率重新检测类型
      this.adaptToGenre(audioFeatures);
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    return {
      ...this.statistics,
      currentBPM: this.currentBeatData.bpm,
      comboLevel: this.comboSystem.getCurrentCombo().level,
      accuracy: this.statistics.beatsDetected > 0 ?
        (this.statistics.comboHits / this.statistics.beatsDetected) * 100 : 0
    };
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
   * 销毁分析器
   */
  destroy() {
    this.stop();

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.eventListeners.clear();
    this.comboSystem.reset();

    console.log('🔇 RhythmAnalyzer已销毁');
  }
}

/**
 * 节拍检测器
 */
class BeatDetector {
  constructor(minBPM = 60, maxBPM = 200) {
    this.minBPM = minBPM;
    this.maxBPM = maxBPM;
    this.minInterval = 60000 / maxBPM; // ms
    this.maxInterval = 60000 / minBPM; // ms

    this.lastBeatTime = 0;
    this.energyHistory = [];
    this.sensitivity = 1.0;
  }

  detect(audioFeatures, currentTime) {
    const energy = audioFeatures.totalEnergy;
    const bassEnergy = audioFeatures.bassEnergy;

    // 更新能量历史
    this.energyHistory.push({ time: currentTime, energy, bassEnergy });

    // 只保留最近2秒的历史
    const cutoffTime = currentTime - 2000;
    this.energyHistory = this.energyHistory.filter(entry => entry.time > cutoffTime);

    // 检查是否有足够的能量变化
    if (this.energyHistory.length < 10) {
      return { isBeat: false, confidence: 0 };
    }

    // 计算能量阈值
    const recentEnergy = this.energyHistory.slice(-20);
    const avgEnergy = recentEnergy.reduce((sum, entry) => sum + entry.energy, 0) / recentEnergy.length;
    const threshold = avgEnergy * (1.2 * this.sensitivity);

    // 检查是否符合节拍条件
    const timeSinceLastBeat = currentTime - this.lastBeatTime;
    const isWithinInterval = timeSinceLastBeat >= this.minInterval;

    const isBeat = energy > threshold &&
                   bassEnergy > avgEnergy * 1.5 &&
                   isWithinInterval;

    if (isBeat) {
      this.lastBeatTime = currentTime;
    }

    // 计算置信度
    const confidence = isBeat ?
      Math.min(1.0, (energy - threshold) / threshold) : 0;

    return { isBeat, confidence };
  }

  setSensitivity(sensitivity) {
    this.sensitivity = Math.max(0.5, Math.min(2.0, sensitivity));
  }

  reset() {
    this.lastBeatTime = 0;
    this.energyHistory = [];
  }
}

/**
 * 节奏估算器
 */
class TempoEstimator {
  constructor() {
    this.beatTimes = [];
    this.lastBPM = 120;
    this.confidenceThreshold = 0.7;
  }

  update(currentTime) {
    return null; // 简化实现，返回null表示使用默认BPM
  }

  reset() {
    this.beatTimes = [];
    this.lastBPM = 120;
  }
}

/**
 * 节奏连击系统
 */
class RhythmComboSystem {
  constructor() {
    this.comboLevel = 0;
    this.consecutiveHits = 0;
    this.lastHitTime = 0;
    this.maxComboTimeWindow = 1000; // ms

    this.visualEffects = [];
  }

  checkBeatHit(currentTime, timingWindow) {
    // 检查是否在时间窗口内
  }

  registerHit(currentTime) {
    this.consecutiveHits++;
    this.lastHitTime = currentTime;

    // 更新连击等级
    if (this.consecutiveHits >= 5) {
      this.comboLevel = Math.floor(this.consecutiveHits / 5);
    }

    // 创建视觉效果
    this.visualEffects.push({
      type: 'combo_hit',
      startTime: currentTime,
      duration: 500,
      level: this.comboLevel
    });
  }

  registerMiss(currentTime) {
    this.consecutiveHits = 0;
    this.comboLevel = 0;
  }

  getCurrentCombo() {
    return {
      level: this.comboLevel,
      hits: this.consecutiveHits,
      speedMultiplier: 1.0 + (this.comboLevel * 0.05), // 每级5%加速
      scoreMultiplier: 1.0 + (this.comboLevel * 0.1)   // 每级10%积分
    };
  }

  getSpeedBonus() {
    return 1.0 + (this.comboLevel * 0.05);
  }

  getVisualEffects(currentTime) {
    return this.visualEffects.filter(effect =>
      currentTime - effect.startTime < effect.duration
    );
  }

  update(beatData, currentTime) {
    // 检查连击超时
    if (currentTime - this.lastHitTime > this.maxComboTimeWindow && this.consecutiveHits > 0) {
      this.registerMiss(currentTime);
    }
  }

  reset() {
    this.comboLevel = 0;
    this.consecutiveHits = 0;
    this.lastHitTime = 0;
    this.visualEffects = [];
  }
}

export default RhythmAnalyzer;
/**
 * RhythmAnalyzer 测试文件
 * 用于验证音乐同步游戏玩法功能
 */

import RhythmAnalyzer from './systems/RhythmAnalyzer.js';

export class RhythmTest {
  constructor() {
    this.rhythmAnalyzer = new RhythmAnalyzer({
      enabled: true,
      beatSensitivity: 1.0,
      minBPM: 60,
      maxBPM: 200
    });

    this.testAudio = null;
    this.isRunning = false;
  }

  /**
   * 初始化测试环境
   */
  async initialize() {
    try {
      // 创建测试音频元素
      this.testAudio = new Audio();

      // 初始化节奏分析器
      const success = await this.rhythmAnalyzer.initialize(this.testAudio);

      if (success) {
        console.log('✅ RhythmAnalyzer测试环境初始化成功');
        this.setupEventListeners();
        return true;
      } else {
        console.error('❌ RhythmAnalyzer测试环境初始化失败');
        return false;
      }
    } catch (error) {
      console.error('❌ 测试环境初始化错误:', error);
      return false;
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 节拍检测事件
    this.rhythmAnalyzer.addEventListener('beat_detected', (data) => {
      console.log(`🎵 节拍检测: BPM=${data.bpm.toFixed(1)}, 置信度=${data.confidence.toFixed(2)}`);
    });

    // 节奏命中事件
    this.rhythmAnalyzer.addEventListener('rhythm_hit', (data) => {
      console.log(`🎯 节奏命中! 连击等级: ${data.comboLevel}, 时间窗口: ${data.timingWindow}`);
    });

    // 节奏错过事件
    this.rhythmAnalyzer.addEventListener('rhythm_miss', (data) => {
      console.log(`❌ 节奏错过! 连击丢失: ${data.comboLost}`);
    });

    // 节奏更新事件
    this.rhythmAnalyzer.addEventListener('rhythm_update', (data) => {
      // 更新UI显示
      this.updateRhythmUI(data);
    });
  }

  /**
   * 开始测试
   */
  async startTest(audioFile = null) {
    if (this.isRunning) {
      console.warn('⚠️ 测试已在运行中');
      return false;
    }

    try {
      // 如果提供了音频文件，加载它
      if (audioFile) {
        this.testAudio.src = audioFile;
        await this.testAudio.play();
      }

      // 开始节奏分析
      const success = this.rhythmAnalyzer.start();

      if (success) {
        this.isRunning = true;
        console.log('🎵 RhythmAnalyzer测试开始');
        this.startTestLoop();
        return true;
      }
    } catch (error) {
      console.error('❌ 测试启动失败:', error);
    }

    return false;
  }

  /**
   * 测试循环
   */
  startTestLoop() {
    const testLoop = () => {
      if (!this.isRunning) return;

      // 更新节奏分析器
      this.rhythmAnalyzer.update(16); // 假设60fps

      // 随机模拟玩家动作
      if (Math.random() < 0.05) { // 5%概率模拟动作
        this.simulatePlayerAction();
      }

      requestAnimationFrame(testLoop);
    };

    testLoop();
  }

  /**
   * 模拟玩家动作
   */
  simulatePlayerAction() {
    const result = this.rhythmAnalyzer.registerPlayerAction();

    if (result.success) {
      console.log(`🎮 玩家动作成功! 时间质量: ${result.timingQuality}, 速度加成: ${result.comboBonus.toFixed(2)}x`);
    } else {
      console.log(`🎮 玩家动作失败! 时间质量: ${result.timingQuality}`);
    }
  }

  /**
   * 停止测试
   */
  stopTest() {
    this.isRunning = false;

    if (this.testAudio) {
      this.testAudio.pause();
      this.testAudio.currentTime = 0;
    }

    this.rhythmAnalyzer.stop();

    // 显示测试统计
    const stats = this.rhythmAnalyzer.getStatistics();
    console.log('📊 测试统计:', stats);
  }

  /**
   * 更新节奏UI显示
   */
  updateRhythmUI(data) {
    // 这里可以更新HTML UI来显示节奏信息
    // 在实际游戏中，这会更新游戏画布上的节奏指示器

    const beatData = data.beatData;
    const visualData = data.visualData;
    const comboData = data.comboData;

    // 示例: 在控制台显示当前状态
    if (Math.random() < 0.1) { // 10%概率输出状态，避免控制台刷屏
      console.log(`📊 节奏状态: BPM=${beatData.bpm.toFixed(1)}, 相位=${beatData.beatPhase.toFixed(2)}, 连击=${comboData.level}`);
    }
  }

  /**
   * 测试特定功能
   */
  testSpecificFeatures() {
    console.log('🧪 开始特定功能测试...');

    // 测试1: 节拍时序检查
    const timing1 = this.rhythmAnalyzer.getBeatTiming();
    console.log('⏰ 节拍时序测试:', timing1);

    // 测试2: 连击信息
    const combo1 = this.rhythmAnalyzer.getComboInfo();
    console.log('🔥 连击信息测试:', combo1);

    // 测试3: 速度倍数
    const speed1 = this.rhythmAnalyzer.getSpeedMultiplier();
    console.log('⚡ 速度倍数测试:', speed1.toFixed(2));

    // 测试4: 统计信息
    const stats1 = this.rhythmAnalyzer.getStatistics();
    console.log('📈 统计信息测试:', stats1);
  }

  /**
   * 清理测试环境
   */
  cleanup() {
    this.stopTest();
    this.rhythmAnalyzer.destroy();
    console.log('🧹 RhythmAnalyzer测试环境已清理');
  }
}

// 导出测试类
export default RhythmTest;

// 全局测试函数，可以在浏览器控制台中调用
window.testRhythmAnalyzer = async function() {
  const test = new RhythmTest();
  await test.initialize();

  // 开始测试（无音频文件，使用麦克风或默认音频）
  await test.startTest();

  // 返回测试实例，以便进一步操作
  return test;
};

// 使用示例:
// 在浏览器控制台中运行:
// const test = await testRhythmAnalyzer();
// test.simulatePlayerAction();
// test.stopTest();
/**
 * 音效管理器
 * 使用Web Audio API生成简单音效
 */

export class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.audioContext = null;
    this.masterVolume = 0.6;
    this.enabled = true;

    // 初始化音频上下文
    this.initAudioContext();
  }

  /**
   * 初始化音频上下文
   */
  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('音效系统初始化失败:', error);
      this.enabled = false;
    }
  }

  /**
   * 播放单音调
   */
  playTone(frequency = 440, duration = 200, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    // 恢复音频上下文（如果被暂停）
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // 设置振荡器
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // 设置增益
    gainNode.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

    // 连接节点
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 播放
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  /**
   * 播放吃到普通食物的音效
   */
  playNormalFoodSound() {
    // 清脆的"叮"声，加上低音增强
    this.playTone(880, 80, 'sine');
    this.playTone(220, 100, 'sine'); // 低音层次

    // 短暂的延迟后播放谐波
    setTimeout(() => {
      this.playTone(1320, 60, 'sine');
      this.playTone(1760, 40, 'sine'); // 高音谐波
    }, 50);
  }

  /**
   * 播放吃到加速道具的音效
   */
  playSpeedUpSound() {
    // 强烈的上升音调，营造速度感
    this.playTone(440, 80, 'square');
    this.playTone(554, 60, 'square'); // 五度音程

    setTimeout(() => {
      this.playTone(660, 80, 'square');
      this.playTone(880, 60, 'square'); // 八度音程
    }, 60);

    setTimeout(() => {
      this.playTone(880, 100, 'square');
      this.playTone(1109, 80, 'square'); // 高音和弦
    }, 120);
  }

  /**
   * 播放吃到减速道具的音效
   */
  playSlowDownSound() {
    // 柔和下降的音调，营造时间减缓感
    this.playTone(660, 120, 'sine');
    this.playTone(523, 100, 'sine'); // 低八度

    setTimeout(() => {
      this.playTone(440, 150, 'sine');
      this.playTone(349, 100, 'sine'); // 再低八度
    }, 120);

    // 添加"时间扭曲"音效
    setTimeout(() => {
      this.playTone(220, 200, 'sine'); // 低音嗡鸣
    }, 240);
  }

  /**
   * 播放吃到双倍积分道具的音效
   */
  playDoubleScoreSound() {
    // 璀璨的金币音效，多层次和弦
    this.playTone(1047, 100, 'triangle');
    this.playTone(1319, 80, 'triangle'); // 大三度和弦

    setTimeout(() => {
      this.playTone(1568, 100, 'triangle');
      this.playTone(2093, 60, 'triangle'); // 高音延伸
    }, 75);

    setTimeout(() => {
      this.playTone(1568, 150, 'triangle'); // 加强主音
      this.playTone(2637, 80, 'triangle'); // 超高音闪光
    }, 150);

    // 最终闪光效果
    setTimeout(() => {
      this.playTone(3296, 100, 'sine'); // 闪光音
    }, 225);
  }

  /**
   * 播放游戏结束音效
   */
  playGameOverSound() {
    // 下降的悲伤音调
    this.playTone(523, 200, 'sine');
    setTimeout(() => {
      this.playTone(392, 300, 'sine');
    }, 150);
    setTimeout(() => {
      this.playTone(262, 400, 'sine');
    }, 300);
  }

  /**
   * 播放升级音效
   */
  playLevelUpSound() {
    // 上扬的胜利音调
    this.playTone(523, 150, 'sine');
    setTimeout(() => {
      this.playTone(659, 150, 'sine');
    }, 100);
    setTimeout(() => {
      this.playTone(784, 250, 'sine');
    }, 200);
  }

  /**
   * 播放效果结束音效
   */
  playEffectEndSound() {
    // 短促的提示音
    this.playTone(440, 80, 'sine');
    setTimeout(() => {
      this.playTone(349, 100, 'sine');
    }, 60);
  }

  /**
   * 播放碰撞音效
   */
  playCollisionSound() {
    // 低频撞击声
    this.playTone(150, 100, 'sawtooth');
  }

  /**
   * 设置音量
   */
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 启用/禁用音效
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * 获取音效状态
   */
  getStatus() {
    return {
      enabled: this.enabled,
      volume: this.masterVolume,
      audioContextState: this.audioContext ? this.audioContext.state : 'unavailable'
    };
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export default SoundManager;
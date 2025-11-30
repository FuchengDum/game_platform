/**
 * 道具系统配置
 * 定义所有道具类型的属性和行为
 */

export const POWER_UP_TYPES = {
  NORMAL: {
    id: 'normal',
    name: '普通食物',
    color: 0xf87171,           // 红色
    borderColor: 0xdc2626,     // 深红色边框
    score: 10,
    probability: 0.6,          // 60% 概率
    duration: 0,               // 立即效果
    icon: '🍎',
    sound: 'normal',
    effect: 'none'
  },

  SPEED_UP: {
    id: 'speed_up',
    name: '极速冲刺',
    color: 0x3b82f6,           // 蓝色
    borderColor: 0x1e40af,     // 深蓝色边框
    score: 20,
    probability: 0.15,          // 15% 概率
    duration: 8000,            // 8秒（更充分的加速体验）
    icon: '⚡',
    sound: 'speed_up',
    effect: 'speed_multiplier',
    effectValue: 1.4           // 速度提升40%（更可控）
  },

  SLOW_DOWN: {
    id: 'slow_down',
    name: '时间减缓',
    color: 0x10b981,           // 绿色
    borderColor: 0x047857,     // 深绿色边框
    score: 18,
    probability: 0.15,          // 15% 概率
    duration: 6000,            // 6秒（稍短时间避免惩罚感）
    icon: '💧',
    sound: 'slow_down',
    effect: 'speed_multiplier',
    effectValue: 0.8           // 速度降低20%（减少惩罚感）
  },

  DOUBLE_SCORE: {
    id: 'double_score',
    name: '超级积分',
    color: 0xf59e0b,           // 金色
    borderColor: 0xd97706,     // 深金色边框
    score: 30,
    probability: 0.1,           // 10% 概率
    duration: 10000,           // 10秒（更长的积分奖励期）
    icon: '⭐',
    sound: 'double_score',
    effect: 'score_multiplier',
    effectValue: 2.5            // 积分×2.5（更有吸引力）
  }
};

/**
 * 道具获取时的即时反馈配置
 */
export const FEEDBACK_CONFIG = {
  // 全屏闪光效果
  flash: {
    color: 0xffffff,
    alpha: 0.3,
    duration: 200
  },

  // 屏幕震动
  shake: {
    intensity: 5,
    duration: 150
  },

  // 文字提示动画
  textPopup: {
    fontSize: '32px',
    fill: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 15, y: 8 },
    stroke: '#ffd700',
    strokeThickness: 2
  }
};

/**
 * UI显示配置
 */
export const UI_CONFIG = {
  // 效果状态栏位置
  effectsBar: {
    x: 400,
    y: 100,
    fontSize: '16px',
    fill: '#fbbf24',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: { x: 10, y: 5 }
  },

  // 倒计时进度条
  progressBar: {
    width: 80,
    height: 4,
    backgroundColor: 0x374151,
    fillColor: 0x10b981
  }
};

/**
 * 音效配置
 */
export const SOUND_CONFIG = {
  normal: {
    file: 'sounds/normal_food.mp3',
    volume: 0.6,
    pitch: 1.0
  },
  speed_up: {
    file: 'sounds/speed_up.mp3',
    volume: 0.8,
    pitch: 1.2
  },
  slow_down: {
    file: 'sounds/slow_down.mp3',
    volume: 0.7,
    pitch: 0.8
  },
  double_score: {
    file: 'sounds/double_score.mp3',
    volume: 0.9,
    pitch: 1.5
  },
  effect_end: {
    file: 'sounds/effect_end.mp3',
    volume: 0.5,
    pitch: 1.0
  }
};

/**
 * 粒子效果配置
 */
export const PARTICLE_CONFIG = {
  speed_up: {
    count: 15,
    speed: { min: 100, max: 200 },
    scale: { start: 0.3, end: 0 },
    lifespan: 1000,
    color: 0x3b82f6,
    blendMode: 'ADD'
  },

  slow_down: {
    count: 12,
    speed: { min: 50, max: 120 },
    scale: { start: 0.4, end: 0 },
    lifespan: 1200,
    color: 0x10b981,
    blendMode: 'SCREEN'
  },

  double_score: {
    count: 20,
    speed: { min: 150, max: 250 },
    scale: { start: 0.2, end: 0 },
    lifespan: 800,
    color: 0xf59e0b,
    blendMode: 'ADD'
  }
};

export default {
  POWER_UP_TYPES,
  FEEDBACK_CONFIG,
  UI_CONFIG,
  SOUND_CONFIG,
  PARTICLE_CONFIG
};
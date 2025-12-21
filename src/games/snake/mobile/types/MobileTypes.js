/**
 * 移动端输入数据类型定义
 * 为移动端贪吃蛇游戏提供完整的JavaScript类型支持
 */

/**
 * 基础触摸点信息
 */
export class TouchPoint {
  constructor(x, y, timestamp = Date.now(), pressure = 0.5, identifier = 0) {
    this.x = x;
    this.y = y;
    this.timestamp = timestamp;
    this.pressure = pressure;
    this.identifier = identifier;
  }
}

/**
 * 方向向量 - 360度方向支持
 */
export class DirectionVector {
  constructor(x = 0, y = 0, magnitude = 0, angle = 0) {
    this.x = x;
    this.y = y;
    this.magnitude = magnitude;
    this.angle = angle;
  }
}

/**
 * 虚拟摇杆数据
 */
export class JoystickData {
  constructor() {
    this.isActive = false;
    this.baseX = 0;
    this.baseY = 0;
    this.stickX = 0;
    this.stickY = 0;
    this.direction = new DirectionVector();
    this.touchId = null;
    this.pressure = 0;
    this.lastUpdateTime = 0;
  }
}

/**
 * 触摸事件类型
 */
export const TouchEventType = {
  DOWN: 'pointerdown',
  MOVE: 'pointermove',
  UP: 'pointerup',
  CANCEL: 'pointercancel'
};

/**
 * 移动端输入事件
 */
export class MobileInputEvent {
  constructor(type, touchPoint, timestamp = Date.now()) {
    this.type = type;
    this.touchPoint = touchPoint;
    this.previousPoint = null;
    this.timestamp = timestamp;
    this.isMultiTouch = false;
    this.activeTouchCount = 1;
  }
}

/**
 * 摇杆配置
 */
export class JoystickConfig {
  constructor() {
    this.baseX = 100;
    this.baseY = -100;
    this.baseRadius = 60;
    this.stickRadius = 40;
    this.maxDistance = 80;
    this.showBase = true;
    this.showStick = true;
    this.opacity = {
      base: 0.3,
      stick: 0.8,
      active: 1.0
    };
    this.colors = {
      base: 0x666666,
      stick: 0x999999,
      active: 0x00ff00
    };
    this.animationDuration = 150;
  }
}

/**
 * 移动端输入配置
 */
export class MobileInputConfig {
  constructor() {
    this.joystick = new JoystickConfig();
    this.haptic = {
      enabled: true,
      intensity: 0.7,
      patterns: {
        move: 10,
        collision: 100,
        eat: 15,
        gameOver: 200
      }
    };
    this.performance = {
      updateRate: 60,
      enableThrottling: true,
      maxInputLatency: 16
    };
  }
}

/**
 * 设备方向信息
 */
export class DeviceOrientation {
  constructor() {
    this.type = 'portrait';
    this.isLandscape = false;
    this.width = window.innerWidth || 375;
    this.height = window.innerHeight || 667;
    this.pixelRatio = window.devicePixelRatio || 1;
  }
}

/**
 * 移动端游戏状态
 */
export class MobileGameState {
  constructor() {
    this.isMobile = false;
    this.orientation = new DeviceOrientation();
    this.touchSupport = 'ontouchstart' in window;
    this.hapticSupport = 'vibrate' in navigator;
    this.isActive = false;
    this.inputMode = 'joystick';
    this.lastInputTime = 0;
  }
}

/**
 * 输入处理结果
 */
export class InputResult {
  constructor(success, direction = null, error = null) {
    this.success = success;
    this.direction = direction;
    this.error = error;
    this.timestamp = Date.now();
  }
}

/**
 * 性能指标
 */
export class PerformanceMetrics {
  constructor() {
    this.fps = 60;
    this.inputLatency = 0;
    this.renderTime = 0;
    this.updateTime = 0;
    this.memoryUsage = 0;
    this.batteryLevel = 1.0;
  }
}

/**
 * UI布局信息
 */
export class MobileUILayout {
  constructor() {
    this.gameBoard = {
      x: 0,
      y: 0,
      width: 600,
      height: 600,
      scale: 1
    };
    this.joystick = {
      x: 100,
      y: 100,
      width: 160,
      height: 160,
      visible: false
    };
    this.hud = {
      score: { x: 0, y: 0, visible: true },
      level: { x: 0, y: 0, visible: true },
      pause: { x: 0, y: 0, visible: true }
    };
    this.safeArea = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }
}

/**
 * 触觉反馈模式
 */
export const HapticPattern = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  RHYTHM: 'rhythm'
};

/**
 * 响应式断点配置
 */
export const ResponsiveBreakpoints = {
  small: 600,
  medium: 900,
  large: 1200,
  tablet: 768,
  desktop: 1024
};

// 预定义配置常量
export const PRESET_CONFIGS = {
  gaming: {
    enabled: true,
    intensity: 0.8,
    adaptiveIntensity: true,
    batterySaving: false,
    patterns: {
      move: [3],
      turn: [5],
      boost: [10, 20, 10],
      collision: [80, 40, 80],
      eat: [12, 24, 12],
      powerUp: [15, 10, 15, 10, 30],
      levelUp: [30, 20, 30, 20, 50],
      gameOver: [150, 75, 150, 75, 200]
    }
  },

  accessibility: {
    enabled: true,
    intensity: 1.0,
    adaptiveIntensity: false,
    batterySaving: false,
    patterns: {
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
  }
};

// 工具函数
export const MobileUtils = {
  /**
   * 获取两点间距离
   */
  getDistance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * 角度转弧度
   */
  toRadians(angle) {
    return angle * Math.PI / 180;
  },

  /**
   * 弧度转角度
   */
  toDegrees(radians) {
    return radians * 180 / Math.PI;
  },

  /**
   * 限制数值在指定范围内
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  /**
   * 线性插值
   */
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  },

  /**
   * 归一化向量
   */
  normalizeVector(x, y) {
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude === 0) return { x: 0, y: 0 };
    return { x: x / magnitude, y: y / magnitude };
  }
};

/**
 * 移动端渲染器接口
 */
export class MobileRendererInterface {
  constructor() {
    // 响应式布局
    this.updateLayout = (orientation) => {};

    // 摇杆渲染
    this.renderJoystick = (data) => {};

    // 移动端特效
    this.showTouchEffect = (x, y, type = 'press') => {};

    this.showDirectionIndicator = (angle) => {};

    // 性能适配
    this.adjustQuality = (metrics) => {};

    // 布局查询
    this.getLayout = () => {};
  }
}

export default {
  TouchPoint,
  DirectionVector,
  JoystickData,
  TouchEventType,
  MobileInputEvent,
  JoystickConfig,
  MobileInputConfig,
  DeviceOrientation,
  MobileGameState,
  InputResult,
  PerformanceMetrics,
  MobileUILayout,
  MobileRendererInterface,
  HapticPattern,
  ResponsiveBreakpoints,
  PRESET_CONFIGS,
  MobileUtils
};
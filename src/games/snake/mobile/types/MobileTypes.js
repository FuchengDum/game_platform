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

// 设备检测工具
export const DeviceDetection = {
  /**
   * 检测是否为移动设备
   */
  isMobile() {
    // 优先检查触摸支持
    const hasTouchSupport = 'ontouchstart' in window ||
                              navigator.maxTouchPoints > 0 ||
                              navigator.msMaxTouchPoints > 0;

    // 检查用户代理
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent);

    // 检查DevTools模拟器
    const isDevToolsMobile = window.innerWidth <= 768 ||
                             window.innerHeight <= 1024 ||
                             userAgent.includes('Mobile') ||
                             userAgent.includes('Android');

    return hasTouchSupport || isMobileUserAgent || isDevToolsMobile;
  },

  /**
   * 检测是否为Safari浏览器
   */
  isSafari() {
    const userAgent = navigator.userAgent;
    return (/Safari/.test(userAgent) && !/Chrome|Chromium/.test(userAgent)) ||
           (/iPhone|iPad|iPod/.test(userAgent) && /Apple/.test(navigator.vendor));
  },

  /**
   * 检测是否为Chrome浏览器
   */
  isChrome() {
    return /Chrome/.test(navigator.userAgent) ||
           /Chromium/.test(navigator.userAgent) ||
           /CriOS/.test(navigator.userAgent); // Chrome on iOS
  },

  /**
   * 检测是否为iOS设备
   */
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (/Mac/.test(navigator.platform) && 'ontouchend' in document);
  },

  /**
   * 检测是否为Android设备
   */
  isAndroid() {
    return /Android/.test(navigator.userAgent);
  },

  /**
   * 获取设备类型
   */
  getDeviceType() {
    if (this.isIOS()) return 'ios';
    if (this.isAndroid()) return 'android';
    if (this.isMobile()) return 'mobile';
    return 'desktop';
  },

  /**
   * 检测Web App环境
   */
  isWebApp() {
    return window.navigator.standalone ||
           (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           document.referrer.includes('android-app://');
  },

  /**
   * 检测是否支持振动
   */
  supportsVibration() {
    return 'vibrate' in navigator ||
           ('webkitVibrate' in navigator);
  },

  /**
   * 检测是否支持Pointer Events
   */
  supportsPointerEvents() {
    return 'PointerEvent' in window;
  },

  /**
   * 检测设备像素比
   */
  getPixelRatio() {
    return window.devicePixelRatio || 1;
  },

  /**
   * 检测屏幕方向
   */
  getOrientation() {
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  },

  /**
   * 获取详细的设备信息
   */
  getDeviceInfo() {
    return {
      isMobile: this.isMobile(),
      isTouchDevice: 'ontouchstart' in window,
      browser: {
        safari: this.isSafari(),
        chrome: this.isChrome(),
        firefox: /Firefox/.test(navigator.userAgent),
        edge: /Edge/.test(navigator.userAgent)
      },
      os: {
        ios: this.isIOS(),
        android: this.isAndroid(),
        windows: /Windows/.test(navigator.platform),
        mac: /Mac/.test(navigator.platform),
        linux: /Linux/.test(navigator.platform)
      },
      device: {
        type: this.getDeviceType(),
        pixelRatio: this.getPixelRatio(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        orientation: this.getOrientation()
      },
      capabilities: {
        vibration: this.supportsVibration(),
        pointerEvents: this.supportsPointerEvents(),
        webApp: this.isWebApp(),
        touchPoints: navigator.maxTouchPoints || 1
      }
    };
  }
};

// 触摸事件兼容性工具
export const TouchCompatibility = {
  /**
   * 标准化触摸事件
   */
  normalizeTouchEvent(event) {
    // 处理不同浏览器的事件格式
    let touches = [];
    let changedTouches = [];

    if (event.touches && event.touches.length > 0) {
      // TouchEvent
      touches = Array.from(event.touches);
      changedTouches = Array.from(event.changedTouches);
    } else if (event.pointerType !== undefined) {
      // PointerEvent
      touches = [{
        identifier: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        force: event.pressure || 0.5,
        radiusX: event.width / 2 || 10,
        radiusY: event.height / 2 || 10
      }];

      changedTouches = [{
        identifier: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        force: event.pressure || 0.5,
        radiusX: event.width / 2 || 10,
        radiusY: event.height / 2 || 10
      }];
    } else if (event.x !== undefined) {
      // 简单事件对象
      touches = [{
        identifier: 0,
        clientX: event.x,
        clientY: event.y,
        force: 0.5,
        radiusX: 10,
        radiusY: 10
      }];

      changedTouches = touches;
    }

    return { touches, changedTouches };
  },

  /**
   * 获取事件类型
   */
  getEventType(event) {
    if (event.type === 'pointerdown' || event.type === 'touchstart') return 'down';
    if (event.type === 'pointermove' || event.type === 'touchmove') return 'move';
    if (event.type === 'pointerup' || event.type === 'touchend') return 'up';
    if (event.type === 'pointercancel' || event.type === 'touchcancel') return 'cancel';
    return event.type;
  },

  /**
   * 防止默认行为
   */
  preventDefault(event) {
    if (event.preventDefault) {
      event.preventDefault();
    }
    if (event.stopPropagation) {
      event.stopPropagation();
    }
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
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
  },

  /**
   * 记录调试信息
   */
  debug: function(category, message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const deviceInfo = DeviceDetection.getDeviceInfo();
      console.log(`[Mobile:${category}] ${message}`, {
        device: deviceInfo,
        data: data
      });
    }
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
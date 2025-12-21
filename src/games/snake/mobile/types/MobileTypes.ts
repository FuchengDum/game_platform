/**
 * 移动端输入数据类型定义
 * 为移动端贪吃蛇游戏提供完整的TypeScript类型支持
 */

/**
 * 基础触摸点信息
 */
export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number; // 触摸压力（支持的设备）
  identifier: number; // 触摸点唯一标识
}

/**
 * 方向向量 - 360度方向支持
 */
export interface DirectionVector {
  x: number; // -1 到 1
  y: number; // -1 到 1
  magnitude: number; // 0 到 1
  angle: number; // 角度（弧度）0 到 2π
}

/**
 * 虚拟摇杆数据
 */
export interface JoystickData {
  isActive: boolean;
  baseX: number;
  baseY: number;
  stickX: number;
  stickY: number;
  direction: DirectionVector;
  touchId?: number; // 关联的触摸点ID
  pressure: number; // 触摸压力
  lastUpdateTime: number;
}

/**
 * 触摸事件类型
 */
export enum TouchEventType {
  DOWN = 'pointerdown',
  MOVE = 'pointermove',
  UP = 'pointerup',
  CANCEL = 'pointercancel'
}

/**
 * 移动端输入事件
 */
export interface MobileInputEvent {
  type: TouchEventType;
  touchPoint: TouchPoint;
  previousPoint?: TouchPoint;
  timestamp: number;
  isMultiTouch: boolean;
  activeTouchCount: number;
}

/**
 * 摇杆配置
 */
export interface JoystickConfig {
  baseX: number;
  baseY: number;
  baseRadius: number;
  stickRadius: number;
  maxDistance: number; // 最大拖拽距离
  showBase: boolean;
  showStick: boolean;
  opacity: {
    base: number;
    stick: number;
    active: number;
  };
  colors: {
    base: string;
    stick: string;
    active: string;
  };
  animationDuration: number; // 动画过渡时间(ms)
}

/**
 * 移动端输入配置
 */
export interface MobileInputConfig {
  joystick: JoystickConfig;
  haptic: {
    enabled: boolean;
    intensity: number; // 0.0 到 1.0
    patterns: {
      move: number;
      collision: number;
      eat: number;
      gameOver: number;
    };
  };
  performance: {
    updateRate: number; // Hz
    enableThrottling: boolean;
    maxInputLatency: number; // ms
  };
}

/**
 * 设备方向信息
 */
export interface DeviceOrientation {
  type: 'portrait' | 'landscape' | 'square';
  isLandscape: boolean;
  width: number;
  height: number;
  pixelRatio: number;
}

/**
 * 移动端游戏状态
 */
export interface MobileGameState {
  isMobile: boolean;
  orientation: DeviceOrientation;
  touchSupport: boolean;
  hapticSupport: boolean;
  isActive: boolean;
  inputMode: 'joystick' | 'touch' | 'hybrid';
  lastInputTime: number;
}

/**
 * 输入处理结果
 */
export interface InputResult {
  success: boolean;
  direction?: DirectionVector;
  error?: string;
  timestamp: number;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  fps: number;
  inputLatency: number;
  renderTime: number;
  updateTime: number;
  memoryUsage?: number;
  batteryLevel?: number;
}

/**
 * UI布局信息
 */
export interface MobileUILayout {
  gameBoard: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
  joystick: {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  };
  hud: {
    score: { x: number; y: number; visible: boolean };
    level: { x: number; y: number; visible: boolean };
    pause: { x: number; y: number; visible: boolean };
  };
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * 触觉反馈模式
 */
export enum HapticPattern {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  RHYTHM = 'rhythm'
}

/**
 * 响应式断点配置
 */
export interface ResponsiveBreakpoints {
  small: number; // < 600px
  medium: number; // 600px - 900px
  large: number; // > 900px
  tablet: number; // 768px
  desktop: number; // 1024px
}

/**
 * 移动端特定事件类型
 */
export interface MobileGameEvents {
  'joystick:move': JoystickData;
  'joystick:activate': JoystickData;
  'joystick:deactivate': void;
  'touch:start': MobileInputEvent;
  'touch:move': MobileInputEvent;
  'touch:end': MobileInputEvent;
  'orientation:change': DeviceOrientation;
  'performance:warning': PerformanceMetrics;
  'haptic:feedback': HapticPattern;
}

/**
 * 扩展的游戏输入接口
 * 兼容现有键盘输入的同时添加移动端支持
 */
export interface GameInputInterface {
  // 现有键盘输入支持
  setDirection(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): void;

  // 新增360度方向支持
  setDirectionVector(vector: DirectionVector): void;

  // 移动端输入支持
  setJoystickData(data: JoystickData): void;

  // 输入状态查询
  getCurrentDirection(): DirectionVector;
  getMovementAngle(): number;
  isMoving(): boolean;
}

/**
 * 移动端渲染器接口
 */
export interface MobileRendererInterface {
  // 响应式布局
  updateLayout(orientation: DeviceOrientation): void;

  // 摇杆渲染
  renderJoystick(data: JoystickData): void;

  // 移动端特效
  showTouchEffect(x: number, y: number, type: 'press' | 'release'): void;
  showDirectionIndicator(angle: number): void;

  // 性能适配
  adjustQuality(metrics: PerformanceMetrics): void;

  // 布局查询
  getLayout(): MobileUILayout;
}

/**
 * 移动端输入管理器接口
 */
export interface MobileInputManagerInterface {
  // 初始化与清理
  initialize(config: MobileInputConfig): Promise<void>;
  destroy(): void;

  // 输入处理
  processTouchEvent(event: MobileInputEvent): InputResult;
  updateJoystick(touchPoint: TouchPoint): JoystickData;

  // 状态管理
  getState(): MobileGameState;
  isActive(): boolean;

  // 事件系统
  on<K extends keyof MobileGameEvents>(event: K, handler: (data: MobileGameEvents[K]) => void): void;
  off<K extends keyof MobileGameEvents>(event: K, handler: (data: MobileGameEvents[K]) => void): void;

  // 性能监控
  getMetrics(): PerformanceMetrics;
  resetMetrics(): void;
}
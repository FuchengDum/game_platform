/**
 * 移动端输入处理器
 * 处理原始触摸事件，过滤噪声，转换为标准化方向向量
 */

import {
  MobileInputEvent,
  TouchEventType,
  DirectionVector,
  TouchPoint,
  InputResult,
  MobileInputConfig
} from '../types/MobileTypes.js';

export class MobileInputHandler {
  constructor(config = {}) {
    // 默认配置
    this.defaultConfig = {
      debouncing: {
        enabled: true,
        minInterval: 16, // 16ms for 60Hz
        maxInterval: 100
      },
      filtering: {
        noiseThreshold: 5, // 最小移动距离阈值
        velocityThreshold: 0.2, // 最小速度阈值
        accelerationLimit: 2.0, // 最大加速度限制
        smoothingFactor: 0.7 // 平滑因子 (0-1)
      },
      gesture: {
        swipeMinDistance: 30,
        swipeMinVelocity: 0.3,
        tapMaxDuration: 200,
        tapMaxDistance: 15,
        longPressMinDuration: 500
      },
      multiTouch: {
        enabled: true,
        maxSimultaneousTouches: 5
      },
      edgeDetection: {
        enabled: true,
        edgeThreshold: 20, // 边缘区域像素
        cornerThreshold: 50 // 角落区域像素
      }
    };

    // 合并配置
    this.config = { ...this.defaultConfig, ...config };

    // 输入状态
    this.activeTouches = new Map(); // activeTouchId -> TouchPoint
    this.touchHistory = new Map(); // activeTouchId -> TouchPoint[]
    this.lastProcessedTime = 0;
    this.isProcessing = false;

    // 性能监控
    this.metrics = {
      totalEvents: 0,
      processedEvents: 0,
      filteredEvents: 0,
      averageLatency: 0,
      peakLatency: 0
    };

    // 手势状态
    this.gestureState = {
      isSwipe: false,
      isTap: false,
      isLongPress: false,
      startTime: 0,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    };

    // 回调函数
    this.onDirectionChange = null;
    this.onGestureDetected = null;
    this.onEdgeDetected = null;

    // 滤波器状态
    this.lastDirection = { x: 0, y: 0, magnitude: 0, angle: 0 };
    this.velocityFilter = {
      x: 0,
      y: 0,
      lastTime: 0
    };
  }

  /**
   * 处理原始触摸事件
   */
  processTouchEvent(rawEvent) {
    const startTime = performance.now();

    // 创建标准化的输入事件
    const inputEvent = this.createInputEvent(rawEvent);
    if (!inputEvent) {
      return { success: false, error: 'Invalid input event', timestamp: Date.now() };
    }

    let result;

    try {
      this.isProcessing = true;

      switch (inputEvent.type) {
        case TouchEventType.DOWN:
          result = this.handleTouchDown(inputEvent);
          break;
        case TouchEventType.MOVE:
          result = this.handleTouchMove(inputEvent);
          break;
        case TouchEventType.UP:
        case TouchEventType.CANCEL:
          result = this.handleTouchEnd(inputEvent);
          break;
        default:
          result = { success: false, error: 'Unknown touch event type', timestamp: Date.now() };
      }
    } catch (error) {
      console.error('Error processing touch event:', error);
      result = { success: false, error: error.message, timestamp: Date.now() };
    } finally {
      this.isProcessing = false;
    }

    // 更新性能指标
    this.updateMetrics(startTime, result.success);

    return result;
  }

  /**
   * 创建标准化的输入事件
   */
  createInputEvent(rawEvent) {
    const touchPoint = this.extractTouchPoint(rawEvent);
    if (!touchPoint) {
      return null;
    }

    // 获取前一个触摸点
    const touchId = touchPoint.identifier;
    const previousPoint = this.activeTouches.get(touchId);

    const inputEvent = {
      type: this.getEventType(rawEvent),
      touchPoint,
      previousPoint,
      timestamp: Date.now(),
      isMultiTouch: this.activeTouches.size > 0,
      activeTouchCount: this.activeTouches.size + (rawEvent.type === 'pointerdown' ? 1 : 0)
    };

    return inputEvent;
  }

  /**
   * 提取触摸点信息
   */
  extractTouchPoint(rawEvent) {
    let x, y, identifier, pressure;

    if (rawEvent.changedTouches && rawEvent.changedTouches.length > 0) {
      // TouchEvent
      const touch = rawEvent.changedTouches[0];
      x = touch.clientX;
      y = touch.clientY;
      identifier = touch.identifier;
      pressure = touch.force || 0.5;
    } else if (rawEvent.pointerType) {
      // PointerEvent
      x = rawEvent.clientX;
      y = rawEvent.clientY;
      identifier = rawEvent.pointerId;
      pressure = rawEvent.pressure || 0.5;
    } else if (rawEvent.x !== undefined) {
      // Phaser PointerEvent
      x = rawEvent.x;
      y = rawEvent.y;
      identifier = rawEvent.pointerId || 0;
      pressure = rawEvent.pressure || 0.5;
    } else {
      return null;
    }

    return {
      x: Math.round(x),
      y: Math.round(y),
      timestamp: Date.now(),
      pressure: Math.max(0, Math.min(1, pressure)),
      identifier
    };
  }

  /**
   * 获取事件类型
   */
  getEventType(rawEvent) {
    if (rawEvent.type === 'pointerdown' || rawEvent.type === 'touchstart') {
      return TouchEventType.DOWN;
    } else if (rawEvent.type === 'pointermove' || rawEvent.type === 'touchmove') {
      return TouchEventType.MOVE;
    } else if (rawEvent.type === 'pointerup' || rawEvent.type === 'touchend') {
      return TouchEventType.UP;
    } else if (rawEvent.type === 'pointercancel' || rawEvent.type === 'touchcancel') {
      return TouchEventType.CANCEL;
    }
    return rawEvent.type;
  }

  /**
   * 处理触摸开始
   */
  handleTouchDown(inputEvent) {
    const { touchPoint } = inputEvent;

    // 多点触控限制检查
    if (this.config.multiTouch.enabled &&
        this.activeTouches.size >= this.config.multiTouch.maxSimultaneousTouches) {
      return { success: false, error: 'Too many simultaneous touches', timestamp: Date.now() };
    }

    // 防抖检查
    if (this.config.debouncing.enabled &&
        (Date.now() - this.lastProcessedTime) < this.config.debouncing.minInterval) {
      return { success: false, error: 'Debounced input', timestamp: Date.now() };
    }

    // 添加到活跃触摸点
    this.activeTouches.set(touchPoint.identifier, touchPoint);
    this.touchHistory.set(touchPoint.identifier, [touchPoint]);

    // 初始化手势状态
    this.initializeGesture(touchPoint);

    // 边缘检测
    const edgeResult = this.detectEdge(touchPoint.x, touchPoint.y);
    if (edgeResult.isEdge) {
      this.triggerEdgeCallback(edgeResult);
    }

    this.lastProcessedTime = Date.now();

    return {
      success: true,
      direction: { x: 0, y: 0, magnitude: 0, angle: 0 },
      timestamp: Date.now()
    };
  }

  /**
   * 处理触摸移动
   */
  handleTouchMove(inputEvent) {
    const { touchPoint, previousPoint } = inputEvent;

    if (!previousPoint) {
      return { success: false, error: 'No previous touch point', timestamp: Date.now() };
    }

    const touchId = touchPoint.identifier;
    const history = this.touchHistory.get(touchId) || [];

    // 防抖检查
    if (this.config.debouncing.enabled &&
        (touchPoint.timestamp - this.lastProcessedTime) < this.config.debouncing.minInterval) {
      return { success: false, error: 'Debounced input', timestamp: Date.now() };
    }

    // 噪声过滤
    const noiseResult = this.filterNoise(touchPoint, previousPoint, history);
    if (!noiseResult.passed) {
      return { success: false, error: 'Filtered noise', timestamp: Date.now() };
    }

    // 更新手势状态
    this.updateGesture(touchPoint);

    // 计算方向向量
    const direction = this.calculateDirectionVector(touchPoint, previousPoint, history);

    // 应用平滑滤波
    const smoothedDirection = this.applySmoothingFilter(direction);

    // 更新历史记录
    history.push(touchPoint);
    if (history.length > 10) {
      history.shift(); // 保持历史记录在合理大小
    }
    this.touchHistory.set(touchId, history);

    // 更新活跃触摸点
    this.activeTouches.set(touchId, touchPoint);

    this.lastProcessedTime = Date.now();

    // 触发方向变化回调
    if (this.onDirectionChange && smoothedDirection.magnitude > 0.1) {
      this.onDirectionChange(smoothedDirection);
    }

    return { success: true, direction: smoothedDirection, timestamp: Date.now() };
  }

  /**
   * 处理触摸结束
   */
  handleTouchEnd(inputEvent) {
    const { touchPoint } = inputEvent;

    // 检测手势
    const gesture = this.detectGesture(touchPoint);
    if (gesture.type !== 'none' && this.onGestureDetected) {
      this.onGestureDetected(gesture);
    }

    // 清理状态
    this.activeTouches.delete(touchPoint.identifier);
    this.touchHistory.delete(touchPoint.identifier);

    // 重置滤波器状态
    if (this.activeTouches.size === 0) {
      this.velocityFilter = { x: 0, y: 0, lastTime: 0 };
      this.lastDirection = { x: 0, y: 0, magnitude: 0, angle: 0 };
    }

    this.lastProcessedTime = Date.now();

    return {
      success: true,
      direction: { x: 0, y: 0, magnitude: 0, angle: 0 },
      timestamp: Date.now()
    };
  }

  /**
   * 噪声过滤
   */
  filterNoise(currentPoint, previousPoint, history) {
    // 距离阈值过滤
    const distance = this.getDistance(
      currentPoint.x, currentPoint.y,
      previousPoint.x, previousPoint.y
    );

    if (distance < this.config.filtering.noiseThreshold) {
      return { passed: false, reason: 'Distance below threshold' };
    }

    // 速度阈值过滤
    const timeDiff = currentPoint.timestamp - previousPoint.timestamp;
    const velocity = distance / Math.max(timeDiff, 1);

    if (velocity < this.config.filtering.velocityThreshold) {
      return { passed: false, reason: 'Velocity below threshold' };
    }

    // 加速度限制过滤
    if (history.length >= 2) {
      const prevPrevPoint = history[history.length - 2];
      const prevDistance = this.getDistance(
        previousPoint.x, previousPoint.y,
        prevPrevPoint.x, prevPrevPoint.y
      );
      const prevTimeDiff = previousPoint.timestamp - prevPrevPoint.timestamp;
      const prevVelocity = prevDistance / Math.max(prevTimeDiff, 1);

      const acceleration = Math.abs(velocity - prevVelocity) / Math.max(timeDiff, 1);

      if (acceleration > this.config.filtering.accelerationLimit) {
        return { passed: false, reason: 'Acceleration too high' };
      }
    }

    return { passed: true };
  }

  /**
   * 计算方向向量
   */
  calculateDirectionVector(currentPoint, previousPoint, history) {
    const deltaX = currentPoint.x - previousPoint.x;
    const deltaY = currentPoint.y - previousPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < 1) {
      return { x: 0, y: 0, magnitude: 0, angle: 0 };
    }

    const timeDiff = currentPoint.timestamp - previousPoint.timestamp;
    const velocity = distance / Math.max(timeDiff, 1);

    return {
      x: deltaX / distance,
      y: deltaY / distance,
      magnitude: Math.min(velocity / this.config.filtering.velocityThreshold, 1),
      angle: Math.atan2(deltaY, deltaX)
    };
  }

  /**
   * 应用平滑滤波器
   */
  applySmoothingFilter(newDirection) {
    const smoothing = this.config.filtering.smoothingFactor;

    const smoothedX = this.lastDirection.x * (1 - smoothing) + newDirection.x * smoothing;
    const smoothedY = this.lastDirection.y * (1 - smoothing) + newDirection.y * smoothing;
    const smoothedMagnitude = this.lastDirection.magnitude * (1 - smoothing) + newDirection.magnitude * smoothing;

    const result = {
      x: smoothedX,
      y: smoothedY,
      magnitude: smoothedMagnitude,
      angle: Math.atan2(smoothedY, smoothedX)
    };

    this.lastDirection = result;
    return result;
  }

  /**
   * 初始化手势
   */
  initializeGesture(touchPoint) {
    this.gestureState = {
      isSwipe: false,
      isTap: false,
      isLongPress: false,
      startTime: touchPoint.timestamp,
      startX: touchPoint.x,
      startY: touchPoint.y,
      currentX: touchPoint.x,
      currentY: touchPoint.y
    };
  }

  /**
   * 更新手势状态
   */
  updateGesture(touchPoint) {
    this.gestureState.currentX = touchPoint.x;
    this.gestureState.currentY = touchPoint.y;

    const distance = this.getDistance(
      touchPoint.x, touchPoint.y,
      this.gestureState.startX, this.gestureState.startY
    );

    const duration = touchPoint.timestamp - this.gestureState.startTime;

    // 检测是否为滑动
    if (distance > this.config.gesture.swipeMinDistance ||
        (distance > 10 && duration < 300)) {
      this.gestureState.isSwipe = true;
      this.gestureState.isTap = false;
    }

    // 检测是否为长按
    if (duration > this.config.gesture.longPressMinDuration &&
        distance < this.config.gesture.tapMaxDistance) {
      this.gestureState.isLongPress = true;
    }
  }

  /**
   * 检测手势
   */
  detectGesture(touchPoint) {
    const duration = touchPoint.timestamp - this.gestureState.startTime;
    const distance = this.getDistance(
      touchPoint.x, touchPoint.y,
      this.gestureState.startX, this.gestureState.startY
    );

    // 滑动手势
    if (this.gestureState.isSwipe && distance > this.config.gesture.swipeMinDistance) {
      const velocity = distance / Math.max(duration, 1);
      if (velocity > this.config.gesture.swipeMinVelocity) {
        return {
          type: 'swipe',
          startX: this.gestureState.startX,
          startY: this.gestureState.startY,
          endX: touchPoint.x,
          endY: touchPoint.y,
          distance,
          velocity,
          duration,
          angle: Math.atan2(
            touchPoint.y - this.gestureState.startY,
            touchPoint.x - this.gestureState.startX
          )
        };
      }
    }

    // 点击手势
    if (duration < this.config.gesture.tapMaxDuration &&
        distance < this.config.gesture.tapMaxDistance &&
        !this.gestureState.isSwipe) {
      return {
        type: 'tap',
        x: this.gestureState.startX,
        y: this.gestureState.startY,
        duration
      };
    }

    // 长按手势
    if (this.gestureState.isLongPress) {
      return {
        type: 'longpress',
        x: this.gestureState.startX,
        y: this.gestureState.startY,
        duration
      };
    }

    return { type: 'none' };
  }

  /**
   * 边缘检测
   */
  detectEdge(x, y, viewportWidth = window.innerWidth, viewportHeight = window.innerHeight) {
    if (!this.config.edgeDetection.enabled) {
      return { isEdge: false };
    }

    const edgeThreshold = this.config.edgeDetection.edgeThreshold;
    const cornerThreshold = this.config.edgeDetection.cornerThreshold;

    let edges = [];
    let isCorner = false;
    let cornerType = '';

    // 检测各个边缘
    if (x < edgeThreshold) edges.push('left');
    if (x > viewportWidth - edgeThreshold) edges.push('right');
    if (y < edgeThreshold) edges.push('top');
    if (y > viewportHeight - edgeThreshold) edges.push('bottom');

    // 检测角落
    if (x < cornerThreshold && y < cornerThreshold) {
      isCorner = true;
      cornerType = 'top-left';
    } else if (x > viewportWidth - cornerThreshold && y < cornerThreshold) {
      isCorner = true;
      cornerType = 'top-right';
    } else if (x < cornerThreshold && y > viewportHeight - cornerThreshold) {
      isCorner = true;
      cornerType = 'bottom-left';
    } else if (x > viewportWidth - cornerThreshold && y > viewportHeight - cornerThreshold) {
      isCorner = true;
      cornerType = 'bottom-right';
    }

    return {
      isEdge: edges.length > 0,
      edges,
      isCorner,
      cornerType,
      x,
      y
    };
  }

  /**
   * 触发边缘回调
   */
  triggerEdgeCallback(edgeResult) {
    if (this.onEdgeDetected) {
      this.onEdgeDetected(edgeResult);
    }
  }

  /**
   * 获取两点间距离
   */
  getDistance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 更新性能指标
   */
  updateMetrics(startTime, success) {
    const latency = performance.now() - startTime;
    this.metrics.totalEvents++;

    if (success) {
      this.metrics.processedEvents++;
      this.metrics.averageLatency =
        (this.metrics.averageLatency * (this.metrics.processedEvents - 1) + latency) /
        this.metrics.processedEvents;
      this.metrics.peakLatency = Math.max(this.metrics.peakLatency, latency);
    } else {
      this.metrics.filteredEvents++;
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * 重置性能指标
   */
  resetMetrics() {
    this.metrics = {
      totalEvents: 0,
      processedEvents: 0,
      filteredEvents: 0,
      averageLatency: 0,
      peakLatency: 0
    };
  }

  /**
   * 事件回调设置
   */
  setDirectionChangeCallback(callback) {
    this.onDirectionChange = callback;
  }

  setGestureDetectedCallback(callback) {
    this.onGestureDetected = callback;
  }

  setEdgeDetectedCallback(callback) {
    this.onEdgeDetected = callback;
  }

  /**
   * 获取活跃触摸点
   */
  getActiveTouches() {
    return Array.from(this.activeTouches.values());
  }

  /**
   * 获取活跃触摸点数量
   */
  getActiveTouchCount() {
    return this.activeTouches.size;
  }

  /**
   * 检查是否正在处理
   */
  isProcessingInput() {
    return this.isProcessing;
  }

  /**
   * 清理所有状态
   */
  reset() {
    this.activeTouches.clear();
    this.touchHistory.clear();
    this.gestureState = {
      isSwipe: false,
      isTap: false,
      isLongPress: false,
      startTime: 0,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    };
    this.velocityFilter = { x: 0, y: 0, lastTime: 0 };
    this.lastDirection = { x: 0, y: 0, magnitude: 0, angle: 0 };
  }

  /**
   * 销毁处理器
   */
  destroy() {
    this.reset();
    this.onDirectionChange = null;
    this.onGestureDetected = null;
    this.onEdgeDetected = null;
  }
}

export default MobileInputHandler;
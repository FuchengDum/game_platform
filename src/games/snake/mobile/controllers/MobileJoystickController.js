/**
 * 移动端虚拟摇杆控制器
 * 实现360度全方向虚拟摇杆控制，支持压力感应和视觉反馈
 */

import {
  JoystickData,
  DirectionVector,
  TouchPoint,
  JoystickConfig,
  MobileInputEvent,
  TouchEventType
} from '../types/MobileTypes.js';

export class MobileJoystickController {
  constructor(phaserScene, config = {}) {
    this.scene = phaserScene;

    // 默认配置
    this.defaultConfig = {
      baseX: 100,
      baseY: -100,
      baseRadius: 60,
      stickRadius: 40,
      maxDistance: 80,
      showBase: true,
      showStick: true,
      opacity: {
        base: 0.3,
        stick: 0.8,
        active: 1.0
      },
      colors: {
        base: 0x666666,
        stick: 0x999999,
        active: 0x00ff00
      },
      animationDuration: 150
    };

    // 合并配置
    this.config = { ...this.defaultConfig, ...config };

    // 摇杆状态
    this.joystickData = {
      isActive: false,
      baseX: 0,
      baseY: 0,
      stickX: 0,
      stickY: 0,
      direction: { x: 0, y: 0, magnitude: 0, angle: 0 },
      touchId: null,
      pressure: 0,
      lastUpdateTime: 0
    };

    // 视觉元素
    this.baseGraphics = null;
    this.stickGraphics = null;
    this.indicatorGraphics = null;

    // 性能优化
    this.lastUpdateTime = 0;
    this.updateRate = 60; // 60Hz更新率
    this.updateInterval = 1000 / this.updateRate;

    // 事件回调
    this.onMoveCallback = null;
    this.onActivateCallback = null;
    this.onDeactivateCallback = null;

    // 初始化
    this.initialize();
  }

  /**
   * 初始化摇杆
   */
  initialize() {
    // 计算摇杆位置（从底部左角偏移）
    const { width, height } = this.scene.cameras.main;
    this.config.baseX = this.config.baseX < 0 ? width + this.config.baseX : this.config.baseX;
    this.config.baseY = this.config.baseY < 0 ? height + this.config.baseY : this.config.baseY;

    this.joystickData.baseX = this.config.baseX;
    this.joystickData.baseY = this.config.baseY;
    this.joystickData.stickX = this.config.baseX;
    this.joystickData.stickY = this.config.baseY;

    // 创建视觉元素
    this.createVisualElements();
  }

  /**
   * 创建视觉元素
   */
  createVisualElements() {
    if (this.config.showBase) {
      this.baseGraphics = this.scene.add.graphics();
      this.drawBase();
    }

    if (this.config.showStick) {
      this.stickGraphics = this.scene.add.graphics();
      this.drawStick();
    }

    // 方向指示器
    this.indicatorGraphics = this.scene.add.graphics();

    // 初始状态下隐藏摇杆
    this.setOpacity(0);
  }

  /**
   * 绘制摇杆底座
   */
  drawBase() {
    if (!this.baseGraphics) return;

    this.baseGraphics.clear();

    // 外圈
    this.baseGraphics.lineStyle(3, this.config.colors.base, this.config.opacity.base);
    this.baseGraphics.strokeCircle(
      this.joystickData.baseX,
      this.joystickData.baseY,
      this.config.baseRadius
    );

    // 内圈（指示活动范围）
    this.baseGraphics.lineStyle(1, this.config.colors.base, this.config.opacity.base * 0.5);
    this.baseGraphics.strokeCircle(
      this.joystickData.baseX,
      this.joystickData.baseY,
      this.config.maxDistance
    );

    // 中心点
    this.baseGraphics.fillStyle(this.config.colors.base, this.config.opacity.base * 0.8);
    this.baseGraphics.fillCircle(
      this.joystickData.baseX,
      this.joystickData.baseY,
      5
    );
  }

  /**
   * 绘制摇杆手柄
   */
  drawStick() {
    if (!this.stickGraphics) return;

    this.stickGraphics.clear();

    if (this.joystickData.isActive) {
      // 激活状态颜色
      const color = this.config.colors.active;
      const opacity = this.config.opacity.active;

      // 外圈发光效果
      this.stickGraphics.lineStyle(2, color, opacity * 0.3);
      this.stickGraphics.strokeCircle(
        this.joystickData.stickX,
        this.joystickData.stickY,
        this.config.stickRadius + 5
      );
    } else {
      // 非激活状态颜色
      const color = this.config.colors.stick;
      const opacity = this.config.opacity.stick;
    }

    // 主手柄
    this.stickGraphics.fillStyle(
      this.joystickData.isActive ? this.config.colors.active : this.config.colors.stick,
      this.joystickData.isActive ? this.config.opacity.active : this.config.opacity.stick
    );
    this.stickGraphics.fillCircle(
      this.joystickData.stickX,
      this.joystickData.stickY,
      this.config.stickRadius
    );

    // 压力感应视觉反馈
    if (this.joystickData.pressure > 0.5) {
      const pressureRadius = this.config.stickRadius * (0.5 + this.joystickData.pressure * 0.5);
      this.stickGraphics.lineStyle(
        2,
        this.config.colors.active,
        this.joystickData.pressure * 0.8
      );
      this.stickGraphics.strokeCircle(
        this.joystickData.stickX,
        this.joystickData.stickY,
        pressureRadius
      );
    }
  }

  /**
   * 绘制方向指示器
   */
  drawDirectionIndicator() {
    if (!this.indicatorGraphics) return;

    this.indicatorGraphics.clear();

    if (!this.joystickData.isActive || this.joystickData.direction.magnitude < 0.1) {
      return;
    }

    const { baseX, baseY } = this.joystickData;
    const { x, y, magnitude, angle } = this.joystickData.direction;

    // 计算箭头终点
    const arrowLength = 30 * magnitude;
    const endX = baseX + Math.cos(angle) * arrowLength;
    const endY = baseY + Math.sin(angle) * arrowLength;

    // 绘制方向线
    this.indicatorGraphics.lineStyle(3, 0x00ff00, 0.6);
    this.indicatorGraphics.beginPath();
    this.indicatorGraphics.moveTo(baseX, baseY);
    this.indicatorGraphics.lineTo(endX, endY);
    this.indicatorGraphics.strokePath();

    // 绘制箭头
    const arrowSize = 10;
    const arrowAngle = 0.5;

    this.indicatorGraphics.lineStyle(2, 0x00ff00, 0.8);
    this.indicatorGraphics.beginPath();
    this.indicatorGraphics.moveTo(endX, endY);
    this.indicatorGraphics.lineTo(
      endX - arrowSize * Math.cos(angle - arrowAngle),
      endY - arrowSize * Math.sin(angle - arrowAngle)
    );
    this.indicatorGraphics.moveTo(endX, endY);
    this.indicatorGraphics.lineTo(
      endX - arrowSize * Math.cos(angle + arrowAngle),
      endY - arrowSize * Math.sin(angle + arrowAngle)
    );
    this.indicatorGraphics.strokePath();
  }

  /**
   * 处理触摸开始事件
   */
  handleTouchStart(touchPoint) {
    const distance = this.getDistance(touchPoint.x, touchPoint.y, this.config.baseX, this.config.baseY);

    // 检查是否在摇杆区域内
    if (distance <= this.config.maxDistance * 1.5) {
      this.activate(touchPoint);
      return true;
    }

    return false;
  }

  /**
   * 激活摇杆
   */
  activate(touchPoint) {
    this.joystickData.isActive = true;
    this.joystickData.touchId = touchPoint.identifier;
    this.joystickData.pressure = touchPoint.pressure || 0.5;
    this.joystickData.lastUpdateTime = Date.now();

    // 显示摇杆
    this.setOpacity(1);

    // 更新摇杆位置和方向
    this.updateJoystick(touchPoint);

    // 触发激活回调
    if (this.onActivateCallback) {
      this.onActivateCallback(this.joystickData);
    }

    // 触觉反馈
    this.triggerHapticFeedback('light');
  }

  /**
   * 处理触摸移动事件
   */
  handleTouchMove(touchPoint) {
    if (!this.joystickData.isActive || this.joystickData.touchId !== touchPoint.identifier) {
      return false;
    }

    // 性能优化：限制更新频率
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return true;
    }

    this.lastUpdateTime = now;

    // 更新压力
    this.joystickData.pressure = touchPoint.pressure || 0.5;

    // 更新摇杆
    this.updateJoystick(touchPoint);

    return true;
  }

  /**
   * 更新摇杆位置和方向
   */
  updateJoystick(touchPoint) {
    const deltaX = touchPoint.x - this.config.baseX;
    const deltaY = touchPoint.y - this.config.baseY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 限制最大拖拽距离
    if (distance > this.config.maxDistance) {
      const scale = this.config.maxDistance / distance;
      this.joystickData.stickX = this.config.baseX + deltaX * scale;
      this.joystickData.stickY = this.config.baseY + deltaY * scale;
    } else {
      this.joystickData.stickX = touchPoint.x;
      this.joystickData.stickY = touchPoint.y;
    }

    // 计算方向向量
    this.updateDirectionVector();

    // 更新视觉
    this.updateVisuals();

    // 更新时间戳
    this.joystickData.lastUpdateTime = Date.now();

    // 触发移动回调
    if (this.onMoveCallback) {
      this.onMoveCallback(this.joystickData);
    }
  }

  /**
   * 更新方向向量
   */
  updateDirectionVector() {
    const deltaX = this.joystickData.stickX - this.config.baseX;
    const deltaY = this.joystickData.stickY - this.config.baseY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < 1) {
      // 无移动
      this.joystickData.direction = { x: 0, y: 0, magnitude: 0, angle: 0 };
      return;
    }

    // 归一化方向向量
    this.joystickData.direction = {
      x: deltaX / distance,
      y: deltaY / distance,
      magnitude: Math.min(distance / this.config.maxDistance, 1),
      angle: Math.atan2(deltaY, deltaX)
    };
  }

  /**
   * 处理触摸结束事件
   */
  handleTouchEnd(touchPoint) {
    if (!this.joystickData.isActive || this.joystickData.touchId !== touchPoint.identifier) {
      return false;
    }

    this.deactivate();
    return true;
  }

  /**
   * 停用摇杆
   */
  deactivate() {
    const wasActive = this.joystickData.isActive;

    this.joystickData.isActive = false;
    this.joystickData.touchId = null;
    this.joystickData.pressure = 0;
    this.joystickData.direction = { x: 0, y: 0, magnitude: 0, angle: 0 };

    // 重置摇杆位置
    this.joystickData.stickX = this.config.baseX;
    this.joystickData.stickY = this.config.baseY;

    // 隐藏摇杆
    this.setOpacity(0);

    // 清除方向指示器
    if (this.indicatorGraphics) {
      this.indicatorGraphics.clear();
    }

    // 更新视觉
    this.updateVisuals();

    if (wasActive) {
      // 触发停用回调
      if (this.onDeactivateCallback) {
        this.onDeactivateCallback();
      }

      // 触觉反馈
      this.triggerHapticFeedback('light');
    }
  }

  /**
   * 更新所有视觉元素
   */
  updateVisuals() {
    this.drawBase();
    this.drawStick();
    this.drawDirectionIndicator();
  }

  /**
   * 设置透明度
   */
  setOpacity(opacity) {
    if (this.baseGraphics) {
      this.baseGraphics.alpha = opacity;
    }
    if (this.stickGraphics) {
      this.stickGraphics.alpha = opacity;
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
   * 触觉反馈
   */
  triggerHapticFeedback(type = 'light') {
    if (!navigator.vibrate) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      warning: [50, 30, 50],
      error: [100]
    };

    const pattern = patterns[type] || patterns.light;
    navigator.vibrate(pattern);
  }

  /**
   * 事件回调设置
   */
  onMove(callback) {
    this.onMoveCallback = callback;
  }

  onActivate(callback) {
    this.onActivateCallback = callback;
  }

  onDeactivate(callback) {
    this.onDeactivateCallback = callback;
  }

  /**
   * 获取当前摇杆数据
   */
  getJoystickData() {
    return { ...this.joystickData };
  }

  /**
   * 获取方向向量
   */
  getDirectionVector() {
    return { ...this.joystickData.direction };
  }

  /**
   * 检查是否激活
   */
  isActive() {
    return this.joystickData.isActive;
  }

  /**
   * 更新位置（用于屏幕旋转等情况）
   */
  updatePosition(x, y) {
    const deltaX = x - this.config.baseX;
    const deltaY = y - this.config.baseY;

    this.config.baseX = x;
    this.config.baseY = y;
    this.joystickData.baseX = x;
    this.joystickData.baseY = y;

    // 如果摇杆激活，同步更新手柄位置
    if (this.joystickData.isActive) {
      this.joystickData.stickX += deltaX;
      this.joystickData.stickY += deltaY;
      this.updateDirectionVector();
    } else {
      this.joystickData.stickX = x;
      this.joystickData.stickY = y;
    }

    this.updateVisuals();
  }

  /**
   * 设置可见性
   */
  setVisible(visible) {
    if (this.baseGraphics) {
      this.baseGraphics.visible = visible;
    }
    if (this.stickGraphics) {
      this.stickGraphics.visible = visible;
    }
    if (this.indicatorGraphics) {
      this.indicatorGraphics.visible = visible;
    }
  }

  /**
   * 销毁摇杆
   */
  destroy() {
    if (this.baseGraphics) {
      this.baseGraphics.destroy();
      this.baseGraphics = null;
    }
    if (this.stickGraphics) {
      this.stickGraphics.destroy();
      this.stickGraphics = null;
    }
    if (this.indicatorGraphics) {
      this.indicatorGraphics.destroy();
      this.indicatorGraphics = null;
    }

    this.onMoveCallback = null;
    this.onActivateCallback = null;
    this.onDeactivateCallback = null;

    this.joystickData.isActive = false;
  }
}

export default MobileJoystickController;
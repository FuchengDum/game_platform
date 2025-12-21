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
  TouchEventType,
  DeviceDetection,
  TouchCompatibility,
  MobileUtils
} from '../types/MobileTypes.js';

export class MobileJoystickController {
  constructor(phaserScene, config = {}, hapticFeedback = null) {
    this.scene = phaserScene;
    this.hapticFeedback = hapticFeedback;

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
    // 获取设备信息用于调试
    const deviceInfo = DeviceDetection.getDeviceInfo();
    MobileUtils.debug('Joystick', 'Initializing joystick', deviceInfo);

    // 获取相机尺寸并计算摇杆位置
    const camera = this.scene.cameras.main;
    const { width, height } = camera;

    // 计算摇杆位置（从底部左角偏移）
    this.config.baseX = this.config.baseX < 0 ? width + this.config.baseX : this.config.baseX;
    this.config.baseY = this.config.baseY < 0 ? height + this.config.baseY : this.config.baseY;

    // 移动设备适配：调整摇杆位置到更适合触摸的区域
    if (deviceInfo.isMobile) {
      // 在移动设备上，将摇杆放在左下角更容易操作的位置
      const minMargin = Math.max(this.config.baseRadius + 20, 120); // 最小边距
      this.config.baseX = Math.max(minMargin, this.config.baseX);
      this.config.baseY = Math.min(height - minMargin, this.config.baseY);
    }

    // 设置摇杆数据
    this.joystickData.baseX = this.config.baseX;
    this.joystickData.baseY = this.config.baseY;
    this.joystickData.stickX = this.config.baseX;
    this.joystickData.stickY = this.config.baseY;

    // 浏览器特殊处理
    if (deviceInfo.browser.safari) {
      // Safari特殊处理：大幅提高透明度确保可见性
      this.config.opacity.base = Math.max(this.config.opacity.base, 0.8);  // 从0.3提高到0.8
      this.config.opacity.stick = Math.max(this.config.opacity.stick, 1.0); // 从0.5提高到1.0
      this.config.opacity.active = 1.0;

      // Safari还需要特殊颜色调整
      this.config.colors.base = 0x999999;  // 使用更亮的颜色
      this.config.colors.stick = 0xcccccc;  // 使用更亮的颜色

      MobileUtils.debug('Joystick', 'Safari detected -大幅调整透明度和颜色', {
        baseOpacity: this.config.opacity.base,
        stickOpacity: this.config.opacity.stick,
        baseColor: this.config.colors.base.toString(16),
        stickColor: this.config.colors.stick.toString(16)
      });
    } else if (deviceInfo.browser.chrome) {
      // Chrome特殊处理：确保触摸事件正确绑定
      this.config.updateRate = Math.max(this.config.updateRate, 120); // 提高更新率
      MobileUtils.debug('Joystick', 'Chrome detected, optimizing touch event handling');
    }

    // 响应式调整：根据屏幕尺寸调整摇杆大小
    const minDimension = Math.min(width, height);
    if (minDimension < 600) {
      const scale = minDimension / 600;
      this.config.baseRadius *= scale;
      this.config.stickRadius *= scale;
      this.config.maxDistance *= scale;
      MobileUtils.debug('Joystick', 'Responsive scaling applied', { scale });
    }

    // 创建视觉元素
    this.createVisualElements();

    // 设置触摸事件监听器（Phaser层面）
    this.setupPhaserTouchEvents();

    MobileUtils.debug('Joystick', 'Joystick initialized', {
      position: { x: this.config.baseX, y: this.config.baseY },
      screenSize: { width, height },
      opacity: this.config.opacity,
      isMobile: deviceInfo.isMobile,
      browser: deviceInfo.browser
    });
  }

  /**
   * 创建视觉元素
   */
  createVisualElements() {
    // 设置滚动因子确保UI固定
    const setScrollFactor = (graphics) => {
      if (graphics && graphics.setScrollFactor) {
        graphics.setScrollFactor(0);
      }
    };

    if (this.config.showBase) {
      this.baseGraphics = this.scene.add.graphics();
      setScrollFactor(this.baseGraphics);
      this.drawBase();
    }

    if (this.config.showStick) {
      this.stickGraphics = this.scene.add.graphics();
      setScrollFactor(this.stickGraphics);
      this.drawStick();
    }

    // 方向指示器
    this.indicatorGraphics = this.scene.add.graphics();
    setScrollFactor(this.indicatorGraphics);

    // 初始状态下显示半透明摇杆（便于调试和Safari显示）
    this.setOpacity(this.config.opacity.base);
  }

  /**
   * 绘制摇杆底座
   */
  drawBase() {
    if (!this.baseGraphics) return;

    this.baseGraphics.clear();

    const deviceInfo = DeviceDetection.getDeviceInfo();
    const isSafari = deviceInfo.browser.safari;

    // Safari特殊处理：使用更粗的线条和更高的对比度
    const lineThickness = isSafari ? 5 : 3;
    const centerRadius = isSafari ? 8 : 5;

    // 外圈 - Safari使用双线增强可见性
    if (isSafari) {
      // 外层白线
      this.baseGraphics.lineStyle(lineThickness + 2, 0xffffff, this.config.opacity.base * 0.3);
      this.baseGraphics.strokeCircle(
        this.joystickData.baseX,
        this.joystickData.baseY,
        this.config.baseRadius + 2
      );
    }

    // 主外圈
    this.baseGraphics.lineStyle(lineThickness, this.config.colors.base, this.config.opacity.base);
    this.baseGraphics.strokeCircle(
      this.joystickData.baseX,
      this.joystickData.baseY,
      this.config.baseRadius
    );

    // 内圈（指示活动范围）
    this.baseGraphics.lineStyle(isSafari ? 2 : 1, this.config.colors.base, this.config.opacity.base * 0.5);
    this.baseGraphics.strokeCircle(
      this.joystickData.baseX,
      this.joystickData.baseY,
      this.config.maxDistance
    );

    // 中心点 - Safari使用更大的中心点
    this.baseGraphics.fillStyle(this.config.colors.base, this.config.opacity.base * 0.9);
    this.baseGraphics.fillCircle(
      this.joystickData.baseX,
      this.joystickData.baseY,
      centerRadius
    );

    // Safari添加中心点边框
    if (isSafari) {
      this.baseGraphics.lineStyle(1, 0xffffff, this.config.opacity.base * 0.5);
      this.baseGraphics.strokeCircle(
        this.joystickData.baseX,
        this.joystickData.baseY,
        centerRadius
      );
    }
  }

  /**
   * 绘制摇杆手柄
   */
  drawStick() {
    if (!this.stickGraphics) return;

    this.stickGraphics.clear();

    const deviceInfo = DeviceDetection.getDeviceInfo();
    const isSafari = deviceInfo.browser.safari;

    // Safari特殊处理：使用更大的手柄和更明显的视觉效果
    const stickRadius = isSafari ? this.config.stickRadius * 1.2 : this.config.stickRadius;
    const glowRadius = isSafari ? this.config.stickRadius + 8 : this.config.stickRadius + 5;

    if (this.joystickData.isActive) {
      // 激活状态颜色
      const color = this.config.colors.active;
      const opacity = this.config.opacity.active;

      // Safari使用多层发光效果
      if (isSafari) {
        // 外层白色发光
        this.stickGraphics.lineStyle(4, 0xffffff, opacity * 0.2);
        this.stickGraphics.strokeCircle(
          this.joystickData.stickX,
          this.joystickData.stickY,
          glowRadius + 4
        );
      }

      // 外圈发光效果
      this.stickGraphics.lineStyle(3, color, opacity * 0.4);
      this.stickGraphics.strokeCircle(
        this.joystickData.stickX,
        this.joystickData.stickY,
        glowRadius
      );
    }

    // 主手柄
    this.stickGraphics.fillStyle(
      this.joystickData.isActive ? this.config.colors.active : this.config.colors.stick,
      this.joystickData.isActive ? this.config.opacity.active : this.config.opacity.stick
    );
    this.stickGraphics.fillCircle(
      this.joystickData.stickX,
      this.joystickData.stickY,
      stickRadius
    );

    // Safari添加手柄边框增强可见性
    if (isSafari) {
      this.stickGraphics.lineStyle(2, 0xffffff,
        (this.joystickData.isActive ? this.config.opacity.active : this.config.opacity.stick) * 0.5
      );
      this.stickGraphics.strokeCircle(
        this.joystickData.stickX,
        this.joystickData.stickY,
        stickRadius
      );
    }

    // 压力感应视觉反馈 - Safari使用更明显的效果
    if (this.joystickData.pressure > 0.3) { // 降低压力阈值
      const pressureRadius = stickRadius * (0.7 + this.joystickData.pressure * 0.6);
      this.stickGraphics.lineStyle(
        isSafari ? 3 : 2,
        this.config.colors.active,
        this.joystickData.pressure * 0.9
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
    const deviceInfo = DeviceDetection.getDeviceInfo();

    MobileUtils.debug('Joystick', 'Touch start detected', {
      position: { x: touchPoint.x, y: touchPoint.y },
      distance: distance,
      maxDistance: this.config.maxDistance * 1.5,
      browser: deviceInfo.browser,
      touchId: touchPoint.identifier
    });

    // 扩大触摸区域以提升用户体验，特别是在移动设备上
    const effectiveRadius = deviceInfo.isMobile ? this.config.maxDistance * 2 : this.config.maxDistance * 1.5;

    // 检查是否在摇杆区域内
    if (distance <= effectiveRadius) {
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

    // Safari特殊处理：即使在停用状态也保持高可见性
    const deviceInfo = DeviceDetection.getDeviceInfo();
    if (deviceInfo.browser.safari) {
      // Safari中始终保持高可见性
      this.setOpacity(0.9); // 几乎完全不透明
    } else {
      // 其他浏览器使用正常透明度
      this.setOpacity(this.config.opacity.base);
    }

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
    if (this.hapticFeedback) {
      this.hapticFeedback.trigger(type);
    }
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
   * 设置Phaser触摸事件监听器
   */
  setupPhaserTouchEvents() {
    if (!this.scene.input) {
      MobileUtils.debug('Joystick', 'Scene input not available, skipping event setup');
      return;
    }

    const deviceInfo = DeviceDetection.getDeviceInfo();

    // 禁用默认的右键菜单和触摸行为
    const canvas = this.scene.game.canvas;
    if (canvas) {
      canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });

      // Safari特殊处理：防止默认的触摸行为
      if (deviceInfo.browser.safari) {
        canvas.addEventListener('touchstart', (e) => {
          if (e.touches.length === 1) {
            e.preventDefault();
          }
        }, { passive: false });

        canvas.style.touchAction = 'none';
        canvas.style.userSelect = 'none';
      }

      // Chrome特殊处理：确保触摸事件正确传递
      if (deviceInfo.browser.chrome) {
        canvas.style.touchAction = 'none';
        canvas.style.pointerEvents = 'auto';
      }
    }

    // 设置Phaser输入事件优先级和配置
    this.scene.input.topOnly = false;
    this.scene.input.enableDebug = process.env.NODE_ENV === 'development';

    // 设置触摸事件
    this.scene.input.on('pointerdown', this.handlePhaserPointerDown.bind(this));
    this.scene.input.on('pointermove', this.handlePhaserPointerMove.bind(this));
    this.scene.input.on('pointerup', this.handlePhaserPointerUp.bind(this));
    this.scene.input.on('pointerout', this.handlePhaserPointerOut.bind(this));

    // 添加额外的事件监听以确保跨浏览器兼容性
    this.scene.input.on('pointerover', this.handlePhaserPointerOver.bind(this));

    MobileUtils.debug('Joystick', 'Phaser touch events setup completed', {
      browser: deviceInfo.browser,
      touchAction: canvas?.style.touchAction,
      canvasEvents: ['contextmenu', deviceInfo.browser.safari ? 'touchstart' : null].filter(Boolean)
    });
  }

  /**
   * 处理Phaser指针按下事件
   */
  handlePhaserPointerDown(pointer) {
    const deviceInfo = DeviceDetection.getDeviceInfo();

    // 转换坐标系统 - 使用Phaser的坐标系统
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const touchPoint = {
      x: worldPoint.x,
      y: worldPoint.y,
      identifier: pointer.pointerId,
      pressure: pointer.pressure || 0.5,
      timestamp: Date.now()
    };

    MobileUtils.debug('Joystick', 'Phaser pointer down', {
      position: { screen: { x: pointer.x, y: pointer.y }, world: { x: worldPoint.x, y: worldPoint.y } },
      isMobile: deviceInfo.isMobile,
      browser: deviceInfo.browser,
      touchId: pointer.pointerId,
      joystickPosition: { x: this.config.baseX, y: this.config.baseY }
    });

    // 检查是否在摇杆区域内
    const handled = this.handleTouchStart(touchPoint);

    if (handled) {
      // 防止事件传播 - Chrome兼容性处理
      if (pointer.event) {
        try {
          pointer.event.stopPropagation();
          pointer.event.preventDefault();
        } catch (e) {
          // 如果事件已经被处理，忽略错误
          MobileUtils.debug('Joystick', 'Event already handled or prevented', { error: e.message });
        }
      }
    }

    return handled;
  }

  /**
   * 处理Phaser指针移动事件
   */
  handlePhaserPointerMove(pointer) {
    if (!this.joystickData.isActive) return false;

    // 转换坐标系统
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const touchPoint = {
      x: worldPoint.x,
      y: worldPoint.y,
      identifier: pointer.pointerId,
      pressure: pointer.pressure || 0.5,
      timestamp: Date.now()
    };

    const handled = this.handleTouchMove(touchPoint);

    if (handled) {
      // 防止事件传播 - Chrome兼容性处理
      if (pointer.event) {
        try {
          pointer.event.stopPropagation();
          pointer.event.preventDefault();
        } catch (e) {
          MobileUtils.debug('Joystick', 'Move event already handled', { error: e.message });
        }
      }
    }

    return handled;
  }

  /**
   * 处理Phaser指针抬起事件
   */
  handlePhaserPointerUp(pointer) {
    if (!this.joystickData.isActive) return false;

    // 转换坐标系统以保持一致性
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const touchPoint = {
      x: worldPoint.x,
      y: worldPoint.y,
      identifier: pointer.pointerId,
      pressure: pointer.pressure || 0.5,
      timestamp: Date.now()
    };

    const handled = this.handleTouchEnd(touchPoint);

    if (handled) {
      // 防止事件传播 - Chrome兼容性处理
      if (pointer.event) {
        try {
          pointer.event.stopPropagation();
          pointer.event.preventDefault();
        } catch (e) {
          MobileUtils.debug('Joystick', 'Up event already handled', { error: e.message });
        }
      }
    }

    return handled;
  }

  /**
   * 处理Phaser指针进入事件
   */
  handlePhaserPointerOver(pointer) {
    const deviceInfo = DeviceDetection.getDeviceInfo();
    MobileUtils.debug('Joystick', 'Pointer over detected', {
      position: { x: pointer.x, y: pointer.y },
      isActive: this.joystickData.isActive
    });
  }

  /**
   * 处理Phaser指针离开事件
   */
  handlePhaserPointerOut(pointer) {
    if (this.joystickData.isActive) {
      const deviceInfo = DeviceDetection.getDeviceInfo();
      MobileUtils.debug('Joystick', 'Pointer out - deactivating joystick', {
        position: { x: pointer.x, y: pointer.y },
        browser: deviceInfo.browser
      });

      // 模拟触摸结束
      this.handlePhaserPointerUp(pointer);
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

    MobileUtils.debug('Joystick', 'Joystick destroyed');
  }
}

export default MobileJoystickController;
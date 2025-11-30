/**
 * 效果UI管理器
 * 负责显示活动效果、倒计时和进度条
 */

export class EffectsUI {
  constructor(scene, x = 16, y = 100) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    // UI元素
    this.effectsText = null;
    this.progressBarContainer = null;
    this.effectIcons = new Map();

    // UI配置 - 增强视觉效果
    this.config = {
      fontSize: '16px',
      fill: '#fbbf24',
      backgroundColor: 'rgba(0,0,0,0.8)', // 稍微增强背景对比度
      padding: { x: 12, y: 6 },
      barWidth: 120, // 增加进度条宽度
      barHeight: 8, // 稍微增加进度条高度
      barSpacing: 12, // 增加间距
      iconSpacing: 35, // 增加图标间距

      // 新增视觉效果配置
      glowIntensity: 0.8,
      pulseSpeed: 0.003,
      borderRadius: 4,
      shadowBlur: 8,
      shadowOpacity: 0.6
    };

    this.init();
  }

  /**
   * 初始化UI元素
   */
  init() {
    // 效果状态文本
    this.effectsText = this.scene.add.text(this.x, this.y, '', {
      fontSize: this.config.fontSize,
      fill: this.config.fill,
      backgroundColor: this.config.backgroundColor,
      padding: this.config.padding
    }).setAlpha(0.9);

    // 进度条容器
    this.progressBarContainer = this.scene.add.graphics();
  }

  /**
   * 更新效果显示
   */
  update(effectManager) {
    const activeEffects = effectManager.getActiveEffectsInfo();

    // 更新文本显示
    this.updateEffectsText(effectManager);

    // 更新进度条
    this.updateProgressBars(activeEffects);

    // 更新图标
    this.updateEffectIcons(activeEffects);
  }

  /**
   * 更新效果文本
   */
  updateEffectsText(effectManager) {
    const effectsText = effectManager.formatEffectsDisplay();
    this.effectsText.setText(effectsText);

    // 根据是否有活动效果调整透明度
    if (effectsText) {
      this.effectsText.setAlpha(1.0);
    } else {
      this.effectsText.setAlpha(0.3);
    }
  }

  /**
   * 更新进度条
   */
  updateProgressBars(activeEffects) {
    this.progressBarContainer.clear();

    if (activeEffects.length === 0) {
      return;
    }

    const startY = this.y + 35;

    activeEffects.forEach((effect, index) => {
      const barY = startY + index * this.config.barSpacing;

      // 背景进度条
      const bgColor = this.adjustColorAlpha(0x374151, 1);
      this.progressBarContainer.fillStyle = bgColor;
      this.progressBarContainer.fillRect(
        this.x,
        barY,
        this.config.barWidth,
        this.config.barHeight
      );

      // 进度条填充 - 增强视觉效果
      const progress = 1 - (effect.remaining / effect.duration);
      const progressWidth = this.config.barWidth * progress;
      const color = this.getEffectColor(effect.type);

      // 绘制发光背景
      this.drawGlowingBar(
        this.progressBarContainer,
        this.x - 2,
        barY - 1,
        this.config.barWidth + 4,
        this.config.barHeight + 2,
        color,
        this.config.glowIntensity * 0.3
      );

      // 主进度条 - 圆角矩形
      this.drawRoundedRect(
        this.progressBarContainer,
        this.x,
        barY,
        progressWidth,
        this.config.barHeight,
        color,
        1
      );

      // 进度条发光效果
      if (progress > 0.1) {
        this.drawGlowingBar(
          this.progressBarContainer,
          this.x,
          barY,
          progressWidth,
          this.config.barHeight,
          color,
          this.config.glowIntensity * 0.5
        );
      }

      // 动态边框 - 根据剩余时间改变颜色强度
      const borderIntensity = Math.max(0.3, effect.remaining / effect.duration);
      this.progressBarContainer.lineStyle(2, color, borderIntensity);
      this.drawRoundedRect(
        this.progressBarContainer,
        this.x,
        barY,
        this.config.barWidth,
        this.config.barHeight,
        null,
        0
      );

      // 剩余时间文本 - 创建文本对象而不是在graphics上绘制
      const remainingSeconds = Math.ceil(effect.remaining / 1000);
      const timeText = this.scene.add.text(
        this.x + this.config.barWidth + 10,
        barY + this.config.barHeight - 1,
        `${remainingSeconds}s`,
        {
          fontSize: '10px',
          fill: '#ffffff',
          fontFamily: 'Arial, sans-serif'
        }
      ).setOrigin(0, 0.5); // 左对齐，垂直居中
    });
  }

  /**
   * 更新效果图标
   */
  updateEffectIcons(activeEffects) {
    // 清除旧图标
    for (const [type, icon] of this.effectIcons) {
      icon.destroy();
    }
    this.effectIcons.clear();

    // 创建新图标
    const iconY = this.y + 80;
    activeEffects.forEach((effect, index) => {
      const iconX = this.x + index * this.config.iconSpacing;
      const icon = this.createEffectIcon(effect.type, iconX, iconY);
      this.effectIcons.set(effect.type, icon);
    });
  }

  /**
   * 创建效果图标
   */
  createEffectIcon(effectType, x, y) {
    const iconConfig = {
      speed_up: {
        emoji: '⚡',
        color: 0x3b82f6,
        animation: 'pulse'
      },
      slow_down: {
        emoji: '💧',
        color: 0x10b981,
        animation: 'wave'
      },
      double_score: {
        emoji: '⭐',
        color: 0xf59e0b,
        animation: 'rotate'
      }
    };

    const config = iconConfig[effectType] || iconConfig.speed_up;

    // 创建图标背景
    const bg = this.scene.add.circle(x, y, 15, config.color, 0.2);
    bg.setStrokeStyle(2, config.color, 1);

    // 创建图标文本
    const iconText = this.scene.add.text(x, y, config.emoji, {
      fontSize: '20px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // 创建容器
    const container = this.scene.add.container(0, 0, [bg, iconText]);

    // 应用动画
    this.applyIconAnimation(container, config.animation);

    return container;
  }

  /**
   * 应用图标动画
   */
  applyIconAnimation(container, animationType) {
    switch (animationType) {
      case 'pulse':
        this.scene.tweens.add({
          targets: container,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        break;

      case 'wave':
        this.scene.tweens.add({
          targets: container,
          y: container.y - 3,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        break;

      case 'rotate':
        this.scene.tweens.add({
          targets: container,
          angle: 360,
          duration: 2000,
          repeat: -1,
          ease: 'Linear'
        });
        break;
    }
  }

  /**
   * 获取效果颜色
   */
  getEffectColor(effectType) {
    const colorMap = {
      speed_up: 0x3b82f6,    // 蓝色
      slow_down: 0x10b981,   // 绿色
      double_score: 0xf59e0b  // 金色
    };

    return colorMap[effectType] || 0x6b7280;
  }

  /**
   * 显示效果激活通知
   */
  showEffectActivated(effectType, effectName) {
    const effectColor = this.getEffectColor(effectType);
    const notification = this.scene.add.text(400, 200, `${this.getEffectEmoji(effectType)} ${effectName} 激活！`, {
      fontSize: '28px',
      fill: `#${effectColor.toString(16).padStart(6, '0')}`,
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);

    // 动画效果
    notification.setAlpha(0).setScale(0.5);

    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      scale: 1.1,
      duration: 300,
      ease: 'Back.out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: notification,
          alpha: 0,
          y: 180,
          scale: 0.9,
          duration: 1000,
          delay: 1500,
          ease: 'Power2',
          onComplete: () => {
            notification.destroy();
          }
        });
      }
    });
  }

  /**
   * 绘制发光条
   */
  drawGlowingBar(graphics, x, y, width, height, color, intensity) {
    // 外发光层 - 使用带透明度的颜色
    const outerColor = this.adjustColorAlpha(color, intensity * 0.3);
    graphics.fillStyle = outerColor;
    graphics.fillRect(x, y, width, height);

    // 内发光层
    const innerColor = this.adjustColorAlpha(0xffffff, intensity * 0.2);
    graphics.fillStyle = innerColor;
    graphics.fillRect(x + 2, y + 1, width - 4, height - 2);
  }

  /**
   * 绘制圆角矩形
   */
  drawRoundedRect(graphics, x, y, width, height, fillColor, strokeColor) {
    if (fillColor) {
      const fillColorWithAlpha = this.adjustColorAlpha(fillColor, 1);
      graphics.fillStyle = fillColorWithAlpha;
      // 手动绘制圆角矩形
      this.drawCustomRoundedRect(graphics, x, y, width, height, this.config.borderRadius, true);
    }

    if (strokeColor) {
      graphics.lineStyle(2, strokeColor, 1);
      this.drawCustomRoundedRect(graphics, x, y, width, height, this.config.borderRadius, false);
    }
  }

  /**
   * 手动绘制圆角矩形
   */
  drawCustomRoundedRect(graphics, x, y, width, height, radius, shouldFill) {
    graphics.beginPath();
    // 移动到左上角
    graphics.moveTo(x + radius, y);
    // 绘制四条边
    graphics.lineTo(x + width - radius, y);
    graphics.lineTo(x + width - radius, y + height);
    graphics.lineTo(x + radius, y + height);
    graphics.lineTo(x + radius, y);
    graphics.closePath();

    if (shouldFill) {
      graphics.fillPath();
    } else {
      graphics.strokePath();
    }
  }

  /**
   * 显示效果结束通知
   */
  showEffectEnded(effectType, effectName) {
    const notification = this.scene.add.text(400, 200, `${this.getEffectEmoji(effectType)} ${effectName} 结束`, {
      fontSize: '24px',
      fill: '#9ca3af',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5);

    // 动画效果 - 增强版
    notification.setAlpha(0);
    notification.setScale(0.8);

    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      scale: 1.1,
      duration: 300,
      ease: 'Back.out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: notification,
          alpha: 0,
          scale: 0.9,
          duration: 1000,
          delay: 800,
          ease: 'Power2',
          onComplete: () => {
            notification.destroy();
          }
        });
      }
    });
  }

  /**
   * 获取效果表情符号
   */
  getEffectEmoji(effectType) {
    const emojiMap = {
      speed_up: '⚡',
      slow_down: '💧',
      double_score: '⭐'
    };

    return emojiMap[effectType] || '✨';
  }

  /**
   * 获取动态颜色 - 根据剩余时间调整亮度
   */
  getDynamicColor(baseColor, remainingRatio) {
    // 剩余时间越少，颜色越亮
    const brightness = 0.7 + (1 - remainingRatio) * 0.3;
    return this.adjustColorBrightness(baseColor, brightness);
  }

  /**
   * 调整颜色亮度
   */
  adjustColorBrightness(color, factor) {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    const newR = Math.min(255, Math.floor(r * factor));
    const newG = Math.min(255, Math.floor(g * factor));
    const newB = Math.min(255, Math.floor(b * factor));

    return (newR << 16) | (newG << 8) | newB;
  }

  /**
   * 调整颜色透明度
   */
  adjustColorAlpha(color, alpha) {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const a = Math.floor(alpha * 255);

    return (a << 24) | (r << 16) | (g << 8) | b;
  }

  /**
   * 设置可见性
   */
  setVisible(visible) {
    this.effectsText.setVisible(visible);
    this.progressBarContainer.setVisible(visible);

    for (const [type, icon] of this.effectIcons) {
      icon.setVisible(visible);
    }
  }

  /**
   * 设置透明度
   */
  setAlpha(alpha) {
    this.effectsText.setAlpha(alpha);
    this.progressBarContainer.setAlpha(alpha);

    for (const [type, icon] of this.effectIcons) {
      icon.setAlpha(alpha);
    }
  }

  /**
   * 设置位置
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;

    this.effectsText.setPosition(x, y);
    this.updateProgressBars([]); // 重新渲染进度条位置
    // 图标位置会在下次update时更新
  }

  /**
   * 销毁UI元素
   */
  destroy() {
    if (this.effectsText) {
      this.effectsText.destroy();
    }

    if (this.progressBarContainer) {
      this.progressBarContainer.destroy();
    }

    for (const [type, icon] of this.effectIcons) {
      icon.destroy();
    }
    this.effectIcons.clear();
  }
}

export default EffectsUI;
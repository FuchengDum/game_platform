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

    // 时间文本对象管理 - 修复重复创建问题
    this.timeTexts = new Map();

    // UI配置 - 优化布局确保道具图标完全显示，只显示特殊道具
    this.config = {
      fontSize: '16px',
      fill: '#fbbf24',
      backgroundColor: 'rgba(0,0,0,0.8)', // 稍微增强背景对比度
      padding: { x: 12, y: 6 },
      barWidth: 100, // 减小进度条宽度，给整体布局更多空间
      barHeight: 10, // 减小进度条高度，避免占用过多垂直空间
      barSpacing: 14, // 减小间距，让布局更紧凑
      iconSpacing: 35, // 增加图标间距

      // 新增视觉效果配置
      glowIntensity: 0.8,
      pulseSpeed: 0.003,
      borderRadius: 4,
      shadowBlur: 8,
      shadowOpacity: 0.6,

      // 图标布局配置 - 减小大小以适配游戏界面
      iconSize: 14, // 减小图标背景圆圈大小，避免占用过多空间
      iconOffset: 20, // 减小图标距离进度条左侧的距离
      layoutStartX: 45 // 减小整体布局的起始X位置，节省水平空间
    };

    this.init();
  }

  /**
   * 初始化UI元素
   */
  init() {
    // 效果状态文本 - 保持可见但简化内容
    this.effectsText = this.scene.add.text(this.x, this.y, '道具效果', {
      fontSize: '14px',
      fill: '#fbbf24',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 8, y: 4 }
    }).setAlpha(0.8);

    // 进度条容器 - 确保可见
    this.progressBarContainer = this.scene.add.graphics();
    this.progressBarContainer.setAlpha(1.0);
  }

  /**
   * 更新效果显示
   */
  update(effectManager) {
    const activeEffects = effectManager.getActiveEffectsInfo();

    // 更新文本显示
    this.updateEffectsText(effectManager);

    // 更新进度条（只显示特殊道具，不显示普通食物）
    this.updateProgressBars(activeEffects);

    // 更新图标（只显示特殊道具，不显示普通食物）
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
   * 更新进度条（只显示特殊道具效果，不显示普通食物）
   */
  updateProgressBars(activeEffects) {
    this.progressBarContainer.clear();

    // 过滤掉普通食物效果，只显示特殊道具效果
    const specialEffects = activeEffects.filter(effect => effect.type !== 'normal');

    // 隐藏所有未使用的时间文本
    const activeEffectTypes = new Set(specialEffects.map(effect => effect.type));
    for (const [key, timeText] of this.timeTexts) {
      const effectType = key.replace('_time', '');
      if (!activeEffectTypes.has(effectType)) {
        timeText.setVisible(false);
      }
    }

    if (specialEffects.length === 0) {
      return;
    }

    const startY = this.y + 35;
    const barX = this.config.layoutStartX; // 使用新的布局起始位置

    specialEffects.forEach((effect, index) => {
      const barY = startY + index * this.config.barSpacing;

      // 简化进度条绘制 - 确保可见
      const progress = 1 - (effect.remaining / effect.duration);
      const progressWidth = this.config.barWidth * progress;
      const color = this.getEffectColor(effect.type);

      // 1. 绘制背景进度条（深灰色）
      this.progressBarContainer.fillStyle = 0x374151;
      this.progressBarContainer.fillRect(
        barX,
        barY,
        this.config.barWidth,
        this.config.barHeight
      );

      // 2. 绘制进度条填充（使用效果颜色）
      if (progressWidth > 0) {
        this.progressBarContainer.fillStyle = color;
        this.progressBarContainer.fillRect(
          barX,
          barY,
          progressWidth,
          this.config.barHeight
        );
      }

      // 3. 绘制边框（增强可见性）
      this.progressBarContainer.lineStyle(1, color, 0.8);
      this.progressBarContainer.strokeRect(
        barX,
        barY,
        this.config.barWidth,
        this.config.barHeight
      );

      // 4. 显示增大的时间文本以匹配进度条
      const remainingSeconds = Math.ceil(effect.remaining / 1000);
      const timeTextKey = `${effect.type}_time`;

      let timeText = this.timeTexts.get(timeTextKey);
      if (!timeText) {
        timeText = this.scene.add.text(
          barX + this.config.barWidth + 15, // 增加间距从10到15
          barY + this.config.barHeight / 2,
          `${remainingSeconds}s`,
          {
            fontSize: '16px', // 从12px增加到16px以匹配增大的进度条
            fill: '#fbbf24',
            backgroundColor: 'rgba(0,0,0,0.6)', // 增强背景对比度
            padding: { x: 6, y: 2 } // 增大内边距
          }
        ).setOrigin(0, 0.5);
        this.timeTexts.set(timeTextKey, timeText);
      } else {
        timeText.setPosition(barX + this.config.barWidth + 15, barY + this.config.barHeight / 2);
        timeText.setText(`${remainingSeconds}s`);
        timeText.setVisible(true);
      }
    });
  }

  /**
   * 更新效果图标 - 只显示特殊道具，不显示普通食物
   */
  updateEffectIcons(activeEffects) {
    // 清除旧图标
    for (const [type, icon] of this.effectIcons) {
      icon.destroy();
    }
    this.effectIcons.clear();

    // 过滤掉普通食物效果，只显示特殊道具效果
    const specialEffects = activeEffects.filter(effect => effect.type !== 'normal');

    if (specialEffects.length === 0) {
      return;
    }

    // 将图标放置在进度条左侧，与每个进度条对齐
    const startY = this.y + 35; // 与进度条起始位置对齐
    const iconX = this.config.layoutStartX - this.config.iconOffset; // 图标距离进度条左侧的距离

    // 只处理特殊道具图标，确保每个图标有独立的垂直位置
    specialEffects.forEach((effect, index) => {
      const barY = startY + index * this.config.barSpacing;
      // 图标应该对齐到进度条的垂直中心，而不是顶部
      const iconY = barY + (this.config.barHeight / 2);

      console.log(`图标 ${index}: type=${effect.type}, barY=${barY}, iconY=${iconY}, iconX=${iconX}`);

      const icon = this.createOptimizedEffectIcon(effect.type, iconX, iconY);
      this.effectIcons.set(effect.type, icon);
    });
  }

  
  /**
   * 创建优化的效果图标 - 增强可见性，增大尺寸，包含普通食物
   */
  createOptimizedEffectIcon(effectType, x, y) {
    const iconConfig = {
      normal: {
        emoji: '🍎',
        color: 0x4ade80,
        animation: 'gentle-pulse'
      },
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

    // 创建图标背景 - 使用配置中的图标大小
    const bg = this.scene.add.circle(x, y, this.config.iconSize, config.color, 0.5); // 使用配置的图标大小
    bg.setStrokeStyle(2, config.color, 1.0); // 减小边框宽度以匹配较小的图标

    // 创建图标文本 - 根据图标大小调整字体大小以匹配进度条
    const fontSize = Math.floor(this.config.iconSize * 0.8); // 减小字体比例以匹配较小的图标
    const iconText = this.scene.add.text(x, y, config.emoji, {
      fontSize: `${fontSize}px`, // 动态字体大小
      fill: '#ffffff',
      stroke: '#000000', // 保持黑色描边增强对比度
      strokeThickness: 1 // 减小描边厚度以匹配较小的图标
    }).setOrigin(0.5);

    // 创建容器
    const container = this.scene.add.container(0, 0, [bg, iconText]);

    // 应用增强动画 - 保持适度的动画效果
    this.applyOptimizedIconAnimation(container, config.animation);

    return container;
  }

  /**
   * 创建效果图标 (原方法保留作为备用)
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
   * 应用优化的图标动画 - 增强可见性，包含普通食物动画
   */
  applyOptimizedIconAnimation(container, animationType) {
    switch (animationType) {
      case 'gentle-pulse':
        // 普通食物的温和脉冲动画
        this.scene.tweens.add({
          targets: container,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 1200, // 缓慢脉冲，不干扰
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        break;

      case 'pulse':
        this.scene.tweens.add({
          targets: container,
          scaleX: 1.3, // 从1.1增加到1.3，更明显的脉冲效果
          scaleY: 1.3,
          duration: 600, // 从800ms减少到600ms，更活跃
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        break;

      case 'wave':
        this.scene.tweens.add({
          targets: container,
          y: container.y - 3, // 从2增加到3，更明显的上下移动
          duration: 800, // 从1200ms减少到800ms，更活跃
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        break;

      case 'rotate':
        this.scene.tweens.add({
          targets: container,
          angle: 360,
          duration: 2000, // 从3000ms减少到2000ms，更活跃
          repeat: -1,
          ease: 'Linear'
        });
        break;
    }
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
   * 显示效果激活通知 - 优化字体和位置
   */
  showEffectActivated(effectType, effectName) {
    const effectColor = this.getEffectColor(effectType);
    // 移至屏幕右上角边缘，适中字体
    const screenWidth = this.scene.cameras?.main?.width || 800;
    const notification = this.scene.add.text(screenWidth - 120, 15, `${this.getEffectEmoji(effectType)} ${effectName}`, {
      fontSize: '14px', // 适中字体，从10px增加到14px
      fill: `#${effectColor.toString(16).padStart(6, '0')}`,
      backgroundColor: 'rgba(0,0,0,0.3)', // 稍微增强背景对比度
      padding: { x: 5, y: 2 } // 适中内边距
    }).setOrigin(0).setAlpha(0.6); // 适度透明度，从0.4增加到0.6

    // 极简的动画效果 - 快速淡出
    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 1200, // 1.2秒后完全消失，让用户有足够时间看到
      delay: 500, // 延迟500ms开始淡出，增加显示时间
      ease: 'Linear',
      onComplete: () => {
        notification.destroy();
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

    // 清理时间文本对象
    for (const [key, timeText] of this.timeTexts) {
      timeText.destroy();
    }
    this.timeTexts.clear();
  }
}

export default EffectsUI;
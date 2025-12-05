/**
 * 道具基类
 * 定义所有道具的通用行为和接口
 */

import configModule from '../config/PowerUpConfig.js';

export class PowerUp {
  constructor(type, x, y, scene) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.scene = scene;
    this.animationTime = 0;
    this.config = this.getConfig();
    this.destroyed = false; // 添加销毁标志
  }

  /**
   * 获取道具配置
   */
  getConfig() {
    // 将小写类型转换为大写键名
    const typeKey = this.type.toUpperCase();
    return configModule.POWER_UP_TYPES[typeKey] || configModule.POWER_UP_TYPES.NORMAL;
  }

  /**
   * 初始化粒子效果
   */
  initParticleSystem() {
    if (this.type === 'normal') return; // 普通食物不需要粒子效果
  }

  /**
   * 播放音效
   */
  playSound() {
    // 简单实现 - 后续可以扩展
    if (this.scene.soundManager) {
      switch(this.type) {
        case 'normal':
          this.scene.soundManager.playNormalFoodSound();
          break;
        case 'speed_up':
          this.scene.soundManager.playSpeedUpSound();
          break;
        case 'slow_down':
          this.scene.soundManager.playSlowDownSound();
          break;
        case 'double_score':
          this.scene.soundManager.playDoubleScoreSound();
          break;
        default:
          // 默认音效
          this.scene.soundManager.playNormalFoodSound();
      }
    }
  }

  /**
   * 显示视觉反馈
   */
  showVisualFeedback() {
    // 如果对象已被销毁，直接返回
    if (this.destroyed) return;

    const centerX = this.x * 20 + 10; // GRID_SIZE = 20
    const centerY = this.y * 20 + 10;
    const color = this.config?.color || 0x4ade80;
    const score = this.config?.score || 10;

    // 根据道具类型选择特效强度
    const effectIntensity = this.getEffectIntensity();

    console.log(`🎯 道具 ${this.type} 视觉反馈，强度: ${effectIntensity}`);

    // 使用优化粒子池系统创建极简粒子效果
    if (this.scene.createOptimizedParticles && (this.type === 'speed_up' || this.type === 'slow_down')) {
      // 进一步减弱粒子效果以避免渲染负担和闪烁
      this.scene.createOptimizedParticles(centerX, centerY, color, effectIntensity * 0.3, 'circle'); // 从0.6减弱到0.3

      // 完全移除屏幕震动效果以避免闪烁
      // this.addScreenShake(effectIntensity * 0.4); // 注释掉震动效果
      console.log(`🎯 特殊道具 ${this.type} 禁用屏幕震动以避免界面闪烁`);
    } else if (this.type === 'double_score') {
      // 双倍积分道具也使用减弱的粒子效果
      if (this.scene.createOptimizedParticles) {
        this.scene.createOptimizedParticles(centerX, centerY, color, effectIntensity * 0.4, 'circle'); // 从0.8减弱到0.4
      }
    }

    // 只有普通食物显示分数提示，特殊道具只显示粒子效果避免遮挡
    if (this.type === 'normal') {
      this.showMinimalScorePopup(centerX, centerY, score, color);
    } else {
      console.log(`🎯 特殊道具 ${this.type} 仅显示粒子效果，避免文字遮挡`);
    }
  }

  /**
   * 获取效果强度
   */
  getEffectIntensity() {
    switch (this.type) {
      case 'double_score':
        return 0.8; // 超级积分 - 降低效果强度避免残留
      case 'speed_up':
        return 0.7; // 加速 - 降低效果强度
      case 'slow_down':
        return 0.6; // 减速 - 降低效果强度
      default:
        return 0.3; // 普通食物 - 最弱效果
    }
  }

  /**
   * 创建多层闪光效果
   */
  createMultiLayerFlash(x, y, color, intensity) {
    // 如果对象已被销毁，直接返回
    if (this.destroyed) return;

    // 获取游戏屏幕尺寸
    const screenWidth = this.scene.cameras?.main?.width || 800;
    const screenHeight = this.scene.cameras?.main?.height || 600;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // 根据道具类型调整效果强度和范围
    const effectMultiplier = intensity;
    const baseSize = Math.min(screenWidth, screenHeight) * 0.3; // 基础尺寸为屏幕较小边的30%

    let outerFlash = null;
    let middleFlash = null;
    let innerFlash = null;

    // 外层闪光 - 仅限特殊道具
    if (this.type !== 'normal') {
      outerFlash = this.scene.add.rectangle(
        centerX, centerY, baseSize * 2, baseSize * 2,
        color,
        0.2 * effectMultiplier  // 降低透明度避免过强白屏
      );

      // 中层闪光 - 局部扩散效果
      middleFlash = this.scene.add.rectangle(
        centerX, centerY, baseSize * 1.2, baseSize * 1.2,
        0xffffff,
        0.3 * effectMultiplier
      );

      // 内层闪光 - 道具位置的中心光点
      innerFlash = this.scene.add.circle(
        x, y, 40 * effectMultiplier,
        0xffffff,
        0.6
      );
    }

    // 动画序列 - 优化时长和缓动效果
    if (outerFlash && middleFlash && innerFlash) {
      // 外层扩散动画
      this.scene.tweens.add({
        targets: outerFlash,
        alpha: 0,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 300 * effectMultiplier,  // 缩短时长
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (!this.destroyed && outerFlash) {
            outerFlash.destroy();
          }
        }
      });

      // 中层脉动动画
      this.scene.tweens.add({
        targets: middleFlash,
        alpha: 0,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200 * effectMultiplier,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          if (!this.destroyed && middleFlash) {
            middleFlash.destroy();
          }
        }
      });

      // 内层光点动画
      this.scene.tweens.add({
        targets: innerFlash,
        alpha: 0,
        scale: 1.5,
        duration: 150 * effectMultiplier,  // 更短的时长
        ease: 'Back.easeOut',
        onComplete: () => {
          if (!this.destroyed && innerFlash) {
            innerFlash.destroy();
          }
        }
      });
    }
  }

  /**
   * 添加屏幕震动效果
   */
  addScreenShake(intensity) {
    // 如果对象已被销毁，直接返回
    if (this.destroyed) return;

    const shakeConfig = {
      x: 15 * intensity,
      y: 12 * intensity,
      duration: 300 * intensity,
      ease: 'Power2'
    };

    // 主相机震动
    if (this.scene && this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.shake(shakeConfig.duration, shakeConfig.x, shakeConfig.y);
    }

    // 额外的震动效果（仅限特殊道具）
    if (this.type !== 'normal' && intensity > 1) {
      setTimeout(() => {
        // 在回调中再次检查对象是否已被销毁
        if (!this.destroyed && this.scene && this.scene.cameras && this.scene.cameras.main) {
          this.scene.cameras.main.shake(shakeConfig.duration * 0.5, shakeConfig.x * 0.5, 0);
        }
      }, 100);
    }
  }

  /**
   * 创建粒子爆炸效果（使用粒子池优化）
   */
  createParticleExplosion(x, y, color, intensity) {
    // 如果对象已被销毁，直接返回
    if (this.destroyed) return [];

    // 使用场景的优化粒子系统
    if (this.scene.createOptimizedParticles) {
      console.log('🎯 使用优化粒子池系统创建粒子效果');
      return this.scene.createOptimizedParticles(x, y, color, intensity, 'circle');
    }

    // 备用方案：直接创建少量粒子
    console.warn('⚠️ 粒子池系统不可用，使用备用方案');
    const particleCount = Math.min(3, Math.max(2, Math.floor(3 * intensity)));
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const size = 0.5 + Math.random() * 1; // 极小粒子

      const particle = this.scene.add.circle(x, y, size, color);
      particle.setAlpha(0.3);  // 极低透明度

      particles.push(particle);

      // 极短的动画
      const distance = 10 + Math.random() * 10;  // 极小移动距离
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0,
        duration: 100 + Math.random() * 50,  // 极短动画时长
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (!this.destroyed && particle) {
            particle.destroy();
          }
        }
      });
    }

    return particles;
  }

  /**
   * 创建极简粒子效果
   */
  createMinimalParticleEffect(x, y, color, intensity) {
    // 如果对象已被销毁，直接返回
    if (this.destroyed) return [];

    // 极简粒子效果 - 只有2-3个小粒子
    const particleCount = Math.max(2, Math.floor(3 * intensity));
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const size = 0.5 + Math.random() * 1; // 极小粒子

      const particle = this.scene.add.circle(x, y, size, color);
      particle.setAlpha(0.3);  // 极低透明度

      particles.push(particle);

      // 极短的动画 - 100-150ms
      const distance = 10 + Math.random() * 10;  // 极小移动距离
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0,
        duration: 100 + Math.random() * 50,  // 极短动画时长
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (!this.destroyed && particle) {
            particle.destroy();
          }
        }
      });
    }

    return particles;
  }

  /**
   * 显示极简分数提示（使用粒子池优化）
   */
  showMinimalScorePopup(x, y, score, color) {
    // 如果对象已被销毁，直接返回
    if (this.destroyed) return;

    // 确保颜色值有效
    const safeColor = color || 0x4ade80;
    const colorHex = safeColor.toString(16).padStart(6, '0');

    // 使用场景的优化文本粒子系统
    if (this.scene.createOptimizedTextParticle) {
      console.log('🎯 使用优化文本粒子系统');
      this.scene.createOptimizedTextParticle(x, y, `+${score}`, colorHex);
      return;
    }

    // 备用方案：直接创建文本
    console.warn('⚠️ 文本粒子系统不可用，使用备用方案');
    const scoreText = this.scene.add.text(x, y, `+${score}`, {
      fontSize: '14px',  // 更小字体
      fill: '#ffffff',
      stroke: `#${colorHex}`,
      strokeThickness: 1,  // 极细描边
      backgroundColor: 'rgba(0,0,0,0.3)',  // 更淡背景
      padding: { x: 3, y: 1 }  // 更小内边距
    }).setOrigin(0.5);

    // 极短的动画 - 200ms
    this.scene.tweens.add({
      targets: scoreText,
      y: y - 15,
      alpha: 0,
      scale: 1.02,
      duration: 200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (!this.destroyed && scoreText) {
          scoreText.destroy();
        }
      }
    });
  }

  /**
   * 显示强化版分数提示（已弃用）
   */
  showEnhancedScorePopup(x, y, score, color, intensity) {
    // 如果对象已被销毁，直接返回
    if (this.destroyed) return;

    // 确保颜色值有效
    const safeColor = color || 0x4ade80;
    const colorHex = safeColor.toString(16).padStart(6, '0');

    // 分数文本 - 减小尺寸和效果
    const scoreText = this.scene.add.text(x, y, `+${score}`, {
      fontSize: `${20 + intensity * 4}px`,  // 减小字体
      fill: '#ffffff',
      stroke: `#${colorHex}`,
      strokeThickness: 2,  // 减小描边
      backgroundColor: 'rgba(0,0,0,0.7)',  // 减小背景透明度
      padding: { x: 10, y: 5 },  // 减小内边距
      shadowColor: `#${colorHex}`,
      shadowBlur: 5,  // 减小阴影
      shadowOffsetX: 0,
      shadowOffsetY: 0
    }).setOrigin(0.5);

    // 道具类型标签 - 仅限特殊道具
    let typeLabel = null;
    if (this.type !== 'normal' && this.config?.name) {
      typeLabel = this.scene.add.text(x, y - 30, this.config.name, {
        fontSize: '14px',  // 减小字体
        fill: `#${colorHex}`,
        stroke: '#ffffff',
        strokeThickness: 1,  // 减小描边
        backgroundColor: 'rgba(0,0,0,0.6)',  // 减小背景透明度
        padding: { x: 6, y: 3 }  // 减小内边距
      }).setOrigin(0.5);

      // 标签动画 - 更短的动画
      this.scene.tweens.add({
        targets: typeLabel,
        y: y - 45,
        alpha: 0,
        scale: 1.05,
        duration: 400,  // 缩短时长
        ease: 'Back.out',
        onComplete: () => {
          if (!this.destroyed && typeLabel) {
            typeLabel.destroy();
          }
        }
      });
    }

    // 分数动画 - 更短更精致的动画
    this.scene.tweens.add({
      targets: scoreText,
      y: y - 25,
      alpha: 0,
      scale: 1.05 + intensity * 0.08,  // 进一步减小缩放
      duration: 300 + intensity * 100,  // 进一步缩短时长
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (!this.destroyed && scoreText) {
          scoreText.destroy();
        }
      }
    });
  }

  /**
   * 渲染道具
   */
  render(graphics) {
    const centerX = this.x * 20 + 10; // GRID_SIZE = 20
    const centerY = this.y * 20 + 10;
    const size = 8; // 道具基础大小

    // 根据道具类型选择颜色和样式，确保config存在
    if (!this.config) {
      console.error('❌ PowerUp config is null, cannot render');
      return;
    }
    const color = this.config.color || 0x4ade80;

    // 绘制道具主体
    graphics.fillStyle(color, 1);

    switch (this.type) {
      case 'normal':
        // 普通食物 - 圆形
        graphics.fillCircle(centerX, centerY, size);
        // 添加小点点缀
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillCircle(centerX - 2, centerY - 2, 2);
        break;

      case 'speed_up':
        // 加速道具 - 星形
        this.drawStar(graphics, centerX, centerY, 5, size, size * 0.5);
        // 添加发光效果
        graphics.lineStyle(2, 0x3b82f6, 0.5);
        graphics.strokeCircle(centerX, centerY, size + 2);
        break;

      case 'slow_down':
        // 减速道具 - 六边形
        this.drawPolygon(graphics, centerX, centerY, 6, size);
        // 添加水滴效果
        graphics.fillStyle(0x10b981, 0.6);
        graphics.fillCircle(centerX, centerY, size * 0.7);
        break;

      case 'double_score':
        // 双倍积分 - 钻石形
        this.drawDiamond(graphics, centerX, centerY, size);
        // 添加闪光效果
        graphics.fillStyle(0xfbbf24, 0.8);
        graphics.fillRect(centerX - size * 0.3, centerY - size * 0.3, size * 0.6, size * 0.6);
        break;

      default:
        // 默认圆形
        graphics.fillCircle(centerX, centerY, size);
    }

    // 添加动画效果
    this.animationTime += 16;
    const pulse = Math.sin(this.animationTime * 0.003) * 0.2 + 1;

    // 绘制外圈动画
    if (this.type !== 'normal') {
      graphics.lineStyle(1, color, 0.3 * pulse);
      graphics.strokeCircle(centerX, centerY, size + 4 * pulse);
    }
  }

  /**
   * 绘制星形
   */
  drawStar(graphics, x, y, points, outerRadius, innerRadius) {
    graphics.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * 绘制多边形
   */
  drawPolygon(graphics, x, y, sides, radius) {
    graphics.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * 绘制钻石形
   */
  drawDiamond(graphics, x, y, size) {
    graphics.beginPath();
    graphics.moveTo(x, y - size);
    graphics.lineTo(x + size, y);
    graphics.lineTo(x, y + size);
    graphics.lineTo(x - size, y);
    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * 更新动画
   */
  update(deltaTime) {
    this.animationTime += deltaTime;
  }

  /**
   * 应用效果
   */
  applyEffect() {
    // 播放音效
    this.playSound();

    // 显示视觉反馈
    this.showVisualFeedback();

    // 返回效果数据
    return {
      type: this.type,
      value: this.config.value || 1,
      duration: this.config.duration || 5000,
      name: this.config.name || this.type
    };
  }

  /**
   * 销毁道具
   */
  destroy() {
    // 设置销毁标志
    this.destroyed = true;

    // 清理资源
    this.scene = null;
    this.config = null;
  }
}

export default PowerUp;
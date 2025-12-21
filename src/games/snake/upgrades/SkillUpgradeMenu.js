/**
 * SkillUpgradeMenu - 技能升级菜单界面
 * 提供技能升级、皮肤管理和进度显示功能
 */

import SkillManager from './managers/SkillManager.js';

export class SkillUpgradeMenu {
  constructor(scene, skillManager) {
    this.scene = scene;
    this.skillManager = skillManager;
    this.isVisible = false;
    this.selectedSkill = null;

    // UI元素
    this.container = null;
    this.skillCards = new Map();
    this.progressBar = null;
    this.statsDisplay = null;
    this.skinSelector = null;

    // 动画状态
    this.animations = {
      cardHover: null,
      levelUp: null,
      unlockEffect: null
    };

    this.setupEventListeners();
  }

  /**
   * 初始化菜单UI
   */
  initialize() {
    // 创建主容器
    this.container = this.scene.add.container(400, 300);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);

    // 创建背景
    this.createBackground();

    // 创建标题
    this.createTitle();

    // 创建玩家状态显示
    this.createPlayerStats();

    // 创建技能卡片
    this.createSkillCards();

    // 创建皮肤选择器
    this.createSkinSelector();

    // 创建控制按钮
    this.createControlButtons();

    console.log('🎓 技能升级菜单初始化完成');
  }

  /**
   * 创建背景
   */
  createBackground() {
    // 主背景
    const bg = this.scene.add.rectangle(0, 0, 700, 500, 0x1f2937);
    bg.setStrokeStyle(2, 0x4b5563);
    this.container.add(bg);

    // 半透明遮罩
    const overlay = this.scene.add.rectangle(0, 0, 800, 600, 0x000000, 0.5);
    overlay.setScrollFactor(0);
    this.overlay = overlay;
  }

  /**
   * 创建标题
   */
  createTitle() {
    const title = this.scene.add.text(0, -220, '🎓 技能升级', {
      fontSize: '28px',
      fill: '#fbbf24',
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.container.add(title);
  }

  /**
   * 创建玩家状态显示
   */
  createPlayerStats() {
    const stats = this.skillManager.getStatistics();
    const progress = stats.progress;

    // 等级和经验值显示
    const levelText = this.scene.add.text(-250, -170, `等级: ${progress.level}`, {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    });

    const expText = this.scene.add.text(-250, -145, `经验: ${progress.experience}/${this.skillManager.getExperienceForLevel(progress.level + 1)}`, {
      fontSize: '14px',
      fill: '#d1d5db',
      fontFamily: 'Arial, sans-serif'
    });

    const pointsText = this.scene.add.text(-250, -120, `技能点: ${progress.skillPoints}`, {
      fontSize: '16px',
      fill: '#10b981',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    });

    // 经验进度条
    const expBarBg = this.scene.add.rectangle(0, -95, 400, 8, 0x374151);
    const expBarFill = this.scene.add.rectangle(-200, -95, 200, 8, 0x10b981);
    expBarFill.setOrigin(0, 0.5);

    this.container.add([levelText, expText, pointsText, expBarBg, expBarFill]);

    // 保存引用以便更新
    this.statsDisplay = {
      levelText,
      expText,
      pointsText,
      expBarFill
    };

    this.updatePlayerStats();
  }

  /**
   * 创建技能卡片
   */
  createSkillCards() {
    const menuData = this.skillManager.getUpgradeMenuData();
    const skillTypes = Object.keys(menuData);

    skillTypes.forEach((skillType, index) => {
      const skillData = menuData[skillType];
      const card = this.createSkillCard(skillType, skillData, index);
      this.skillCards.set(skillType, card);
      this.container.add(card.container);
    });
  }

  /**
   * 创建单个技能卡片
   */
  createSkillCard(skillType, skillData, index) {
    const x = -200 + (index % 2) * 220;
    const y = -20 + Math.floor(index / 2) * 140;

    // 卡片容器
    const cardContainer = this.scene.add.container(x, y);

    // 卡片背景
    const bg = this.scene.add.rectangle(0, 0, 200, 120, 0x374151);
    bg.setStrokeStyle(2, skillData.canUpgrade ? 0x10b981 : 0x6b7280);
    cardContainer.add(bg);

    // 技能图标
    const icon = this.scene.add.text(-80, -30, skillData.icon, {
      fontSize: '24px'
    });
    cardContainer.add(icon);

    // 技能名称
    const name = this.scene.add.text(-30, -30, skillData.name, {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    });
    cardContainer.add(name);

    // 技能描述
    const description = this.scene.add.text(-80, -5, skillData.description, {
      fontSize: '12px',
      fill: '#d1d5db',
      fontFamily: 'Arial, sans-serif',
      wordWrap: { width: 180 }
    });
    cardContainer.add(description);

    // 当前等级
    const levelText = this.scene.add.text(-80, 20, `等级: ${skillData.currentLevel}/${skillData.maxLevel}`, {
      fontSize: '14px',
      fill: '#fbbf24',
      fontFamily: 'Arial, sans-serif'
    });
    cardContainer.add(levelText);

    // 效益显示
    const benefitText = this.scene.add.text(20, 20, this.formatBenefit(skillType, skillData.currentBenefit), {
      fontSize: '12px',
      fill: '#10b981',
      fontFamily: 'Arial, sans-serif'
    });
    cardContainer.add(benefitText);

    // 升级按钮
    const upgradeButton = this.scene.add.text(0, 45,
      skillData.canUpgrade ? `升级 (${skillData.nextLevelCost}点)` : '已满级',
      {
        fontSize: '14px',
        fill: skillData.canUpgrade ? '#10b981' : '#6b7280',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: skillData.canUpgrade ? '#065f46' : '#374151',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5);

    if (skillData.canUpgrade) {
      upgradeButton.setInteractive({ useHandCursor: true });
      upgradeButton.on('pointerdown', () => {
        this.upgradeSkill(skillType);
      });

      // 悬停效果
      upgradeButton.on('pointerover', () => {
        upgradeButton.setStyle({ fill: '#34d399' });
        bg.setStrokeStyle(3, 0x34d399);
      });

      upgradeButton.on('pointerout', () => {
        upgradeButton.setStyle({ fill: '#10b981' });
        bg.setStrokeStyle(2, 0x10b981);
      });
    }

    cardContainer.add(upgradeButton);

    // 设置交互区域
    cardContainer.setSize(200, 120);
    cardContainer.setInteractive({ useHandCursor: true });

    cardContainer.on('pointerdown', () => {
      this.selectSkill(skillType);
    });

    return {
      container: cardContainer,
      bg,
      upgradeButton,
      levelText,
      benefitText
    };
  }

  /**
   * 创建皮肤选择器
   */
  createSkinSelector() {
    const skinTitle = this.scene.add.text(-200, 180, '🎨 皮肤选择', {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold'
    });

    this.container.add(skinTitle);

    // 皮肤选项容器
    const skinContainer = this.scene.add.container(0, 220);

    const skins = this.skillManager.cosmeticSystem.getAllSkins();
    const progress = this.skillManager.playerProgress;

    skins.forEach((skin, index) => {
      const x = -150 + (index % 3) * 100;
      const y = Math.floor(index / 3) * 60;

      const skinCard = this.createSkinCard(skin, x, y, progress);
      skinContainer.add(skinCard);
    });

    this.container.add(skinContainer);
    this.skinSelector = { container: skinContainer, title: skinTitle };
  }

  /**
   * 创建皮肤卡片
   */
  createSkinCard(skin, x, y, progress) {
    const isUnlocked = progress.unlockedSkins.includes(skin.id);
    const isEquipped = progress.currentSkin === skin.id;

    // 卡片背景
    const bg = this.scene.add.rectangle(x, y, 80, 50,
      isEquipped ? 0x065f46 : (isUnlocked ? 0x374151 : 0x1f2937));
    bg.setStrokeStyle(2,
      isEquipped ? 0x10b981 : (isUnlocked ? 0x6b7280 : 0x4b5563));

    // 皮肤颜色预览
    let colorPreview;
    if (skin.color === 'rainbow') {
      colorPreview = this.scene.add.text(x, y - 10, '🌈', { fontSize: '20px' });
    } else if (skin.color === 'gold') {
      colorPreview = this.scene.add.text(x, y - 10, '⭐', { fontSize: '20px' });
    } else {
      colorPreview = this.scene.add.circle(x, y - 10, 8, skin.color);
    }

    // 皮肤名称
    const name = this.scene.add.text(x, y + 10, skin.name, {
      fontSize: '11px',
      fill: isUnlocked ? '#ffffff' : '#6b7280',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // 状态文本
    const statusText = this.scene.add.text(x, y + 25,
      isEquipped ? '装备中' : (isUnlocked ? '已解锁' : `${skin.requirement.level}级解锁`), {
      fontSize: '9px',
      fill: isEquipped ? '#10b981' : (isUnlocked ? '#d1d5db' : '#4b5563'),
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // 交互
    if (isUnlocked && !isEquipped) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        this.equipSkin(skin.id);
      });

      bg.on('pointerover', () => {
        bg.setStrokeStyle(3, 0x10b981);
      });

      bg.on('pointerout', () => {
        bg.setStrokeStyle(2, 0x6b7280);
      });
    }

    return { bg, colorPreview, name, statusText };
  }

  /**
   * 创建控制按钮
   */
  createControlButtons() {
    // 关闭按钮
    const closeButton = this.scene.add.text(320, -220, '❌', {
      fontSize: '20px'
    }).setInteractive({ useHandCursor: true });

    closeButton.on('pointerdown', () => {
      this.hide();
    });

    // 重置按钮
    const resetButton = this.scene.add.text(0, 230, '🔄 重置进度', {
      fontSize: '14px',
      fill: '#ef4444',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#7f1d1d',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resetButton.on('pointerdown', () => {
      this.resetProgress();
    });

    this.container.add([closeButton, resetButton]);
  }

  /**
   * 升级技能
   */
  upgradeSkill(skillType) {
    const result = this.skillManager.upgradeSkill(skillType);

    if (result.success) {
      console.log(`✅ 技能升级成功: ${skillType}`);
      this.refreshSkillCard(skillType);
      this.updatePlayerStats();
      this.playUpgradeAnimation(skillType);
    } else {
      console.log(`❌ 技能升级失败: ${result.error}`);
    }
  }

  /**
   * 装备皮肤
   */
  equipSkin(skinId) {
    const success = this.skillManager.equipSkin(skinId);

    if (success) {
      console.log(`✅ 皮肤装备成功: ${skinId}`);
      this.refreshSkinSelector();
    }
  }

  /**
   * 重置进度
   */
  resetProgress() {
    const success = this.skillManager.resetProgress();

    if (success) {
      this.refreshAll();
      console.log('✅ 进度重置成功');
    }
  }

  /**
   * 选择技能
   */
  selectSkill(skillType) {
    this.selectedSkill = skillType;

    // 高亮选中的技能卡片
    this.skillCards.forEach((card, type) => {
      if (type === skillType) {
        card.bg.setStrokeStyle(3, 0x10b981);
      } else {
        const menuData = this.skillManager.getUpgradeMenuData();
        const skillData = menuData[type];
        card.bg.setStrokeStyle(2, skillData.canUpgrade ? 0x10b981 : 0x6b7280);
      }
    });
  }

  /**
   * 格式化效益显示
   */
  formatBenefit(skillType, benefit) {
    switch (skillType) {
      case 'speed':
        return `+${((benefit - 1) * 100).toFixed(0)}% 速度`;
      case 'magnet':
        return `${benefit} 格范围`;
      case 'shield':
        return `${(benefit / 1000).toFixed(1)} 秒`;
      case 'multiplier':
        return `x${benefit.toFixed(1)} 积分`;
      default:
        return benefit.toString();
    }
  }

  /**
   * 更新玩家统计显示
   */
  updatePlayerStats() {
    const stats = this.skillManager.getStatistics();
    const progress = stats.progress;

    if (this.statsDisplay) {
      this.statsDisplay.levelText.setText(`等级: ${progress.level}`);
      this.statsDisplay.expText.setText(`经验: ${progress.experience}/${this.skillManager.getExperienceForLevel(progress.level + 1)}`);
      this.statsDisplay.pointsText.setText(`技能点: ${progress.skillPoints}`);

      // 更新经验条
      const expProgress = progress.experience / this.skillManager.getExperienceForLevel(progress.level + 1);
      this.statsDisplay.expBarFill.displayWidth = 400 * expProgress;
    }
  }

  /**
   * 刷新技能卡片
   */
  refreshSkillCard(skillType) {
    const menuData = this.skillManager.getUpgradeMenuData();
    const skillData = menuData[skillType];
    const card = this.skillCards.get(skillType);

    if (card) {
      card.levelText.setText(`等级: ${skillData.currentLevel}/${skillData.maxLevel}`);
      card.benefitText.setText(this.formatBenefit(skillType, skillData.currentBenefit));

      if (skillData.canUpgrade) {
        card.upgradeButton.setText(`升级 (${skillData.nextLevelCost}点)`);
        card.upgradeButton.setStyle({ fill: '#10b981' });
        card.bg.setStrokeStyle(2, 0x10b981);
      } else {
        card.upgradeButton.setText('已满级');
        card.upgradeButton.setStyle({ fill: '#6b7280' });
        card.bg.setStrokeStyle(2, 0x6b7280);
      }
    }
  }

  /**
   * 刷新所有技能卡片
   */
  refreshAllSkillCards() {
    const menuData = this.skillManager.getUpgradeMenuData();

    this.skillCards.forEach((card, skillType) => {
      const skillData = menuData[skillType];
      this.refreshSkillCard(skillType);
    });
  }

  /**
   * 刷新皮肤选择器
   */
  refreshSkinSelector() {
    // 重新创建皮肤选择器
    this.skinSelector.container.destroy();
    this.createSkinSelector();
  }

  /**
   * 刷新所有UI元素
   */
  refreshAll() {
    this.updatePlayerStats();
    this.refreshAllSkillCards();
    this.refreshSkinSelector();
  }

  /**
   * 播放升级动画
   */
  playUpgradeAnimation(skillType) {
    const card = this.skillCards.get(skillType);
    if (card) {
      // 闪烁效果
      this.scene.tweens.add({
        targets: card.bg,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          card.bg.setAlpha(1);
        }
      });
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    this.skillManager.addEventListener('level_up', (data) => {
      this.updatePlayerStats();
      this.refreshAllSkillCards();
    });

    this.skillManager.addEventListener('skill_upgraded', (data) => {
      this.refreshSkillCard(data.skillType);
    });

    this.skillManager.addEventListener('cosmetic_unlocked', (data) => {
      this.refreshSkinSelector();
    });
  }

  /**
   * 显示菜单
   */
  show() {
    this.overlay.setVisible(true);
    this.container.setVisible(true);
    this.isVisible = true;
    this.refreshAll();
  }

  /**
   * 隐藏菜单
   */
  hide() {
    this.overlay.setVisible(false);
    this.container.setVisible(false);
    this.isVisible = false;
  }

  /**
   * 切换菜单显示状态
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 销毁菜单
   */
  destroy() {
    this.container.destroy();
    this.overlay.destroy();
    this.skillCards.clear();
  }
}

export default SkillUpgradeMenu;
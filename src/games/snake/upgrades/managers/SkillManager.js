/**
 * SkillManager - 技能和升级系统管理器
 * 实现Requirement 9: 动态技能和升级系统
 * 提供经验值、等级、技能点分配、皮肤解锁和持久化保存功能
 */

export class SkillManager {
  constructor(config = {}) {
    // 配置
    this.config = {
      saveKey: config.saveKey || 'snake_skill_progress',
      autoSave: config.autoSave !== false,
      validationEnabled: config.validationEnabled !== false,
      maxLevel: config.maxLevel || 100,
      version: config.version || '1.0.0'
    };

    // 玩家进度数据
    this.playerProgress = this.initializePlayerProgress();

    // 技能系统配置
    this.skillTrees = this.initializeSkillTrees();

    // 皮肤系统
    this.cosmeticSystem = new CosmeticSystem();

    // 数据验证器
    this.dataValidator = new ProgressionDataValidator();

    // 事件系统
    this.eventListeners = new Map();

    // 自动保存定时器
    this.autoSaveInterval = null;
    this.setupAutoSave();

    // 统计数据
    this.statistics = {
      totalTimePlayed: 0,
      gamesPlayed: 0,
      highestScore: 0,
      totalFoodEaten: 0,
      skillsUpgraded: 0,
      cosmeticsUnlocked: 0
    };

    console.log('🎓 SkillManager初始化完成');
  }

  /**
   * 初始化玩家进度数据
   */
  initializePlayerProgress() {
    const savedData = this.loadProgressData();

    if (savedData && this.dataValidator.isValid(savedData)) {
      console.log('📁 加载已保存的进度数据');
      return savedData;
    } else {
      console.log('🆕 创建新的进度数据');
      return this.createNewProgress();
    }
  }

  /**
   * 创建新的进度数据
   */
  createNewProgress() {
    return {
      // 基础进度
      level: 1,
      experience: 0,
      skillPoints: 0,
      totalExperience: 0,

      // 技能等级
      skills: {
        speed: 0,        // 基础移动速度 +5% per level
        magnet: 0,       // 磁铁范围 +1 grid per level
        shield: 0,       // 护盾持续时间 +1 sec per level
        multiplier: 0    // 积分倍数 +10% per level
      },

      // 皮肤系统
      unlockedSkins: ['classic'], // 默认皮肤
      currentSkin: 'classic',

      // 元数据
      createdAt: Date.now(),
      lastPlayed: Date.now(),
      version: this.config.version,
      playtime: 0,

      // 成就和里程碑
      achievements: [],
      milestones: []
    };
  }

  /**
   * 初始化技能树配置
   */
  initializeSkillTrees() {
    return {
      speed: {
        name: '速度强化',
        description: '提升基础移动速度',
        maxLevel: 20,
        costPerLevel: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200],
        benefitPerLevel: 0.05, // 5% per level
        icon: '⚡',
        color: 0x3b82f6
      },

      magnet: {
        name: '磁力范围',
        description: '增加食物吸引范围',
        maxLevel: 15,
        costPerLevel: [8, 12, 16, 20, 24, 28, 32, 36, 40, 45, 50, 55, 60, 65, 70],
        benefitPerLevel: 1, // 1 grid per level
        icon: '🧲',
        color: 0xa855f7
      },

      shield: {
        name: '护盾强化',
        description: '延长护盾持续时间',
        maxLevel: 10,
        costPerLevel: [15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
        benefitPerLevel: 1000, // 1 second per level (1000ms)
        icon: '🛡️',
        color: 0x06b6d4
      },

      multiplier: {
        name: '积分倍增',
        description: '提升分数获取倍数',
        maxLevel: 25,
        costPerLevel: [5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38, 41, 44, 47, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95],
        benefitPerLevel: 0.10, // 10% per level
        icon: '💰',
        color: 0xf59e0b
      }
    };
  }

  /**
   * 授予经验值
   */
  awardExperience(amount, source = 'game') {
    if (amount <= 0) return;

    this.playerProgress.experience += amount;
    this.playerProgress.totalExperience += amount;
    this.playerProgress.lastPlayed = Date.now();

    console.log(`📈 获得 ${amount} 经验值 (来源: ${source})`);

    // 检查是否升级
    const leveledUp = this.checkLevelUp();

    // 保存数据
    if (this.config.autoSave) {
      this.saveProgressData();
    }

    // 触发事件
    this.triggerEvent('experience_gained', {
      amount,
      source,
      totalExperience: this.playerProgress.totalExperience,
      leveledUp
    });

    return leveledUp;
  }

  /**
   * 检查并处理升级
   */
  checkLevelUp() {
    const currentLevel = this.playerProgress.level;
    const experienceNeeded = this.getExperienceForLevel(currentLevel + 1);

    let leveledUp = false;
    let levelsGained = 0;

    while (this.playerProgress.experience >= experienceNeeded && currentLevel + levelsGained < this.config.maxLevel) {
      this.playerProgress.experience -= experienceNeeded;
      levelsGained++;

      const nextLevelExp = this.getExperienceForLevel(currentLevel + levelsGained + 1);
      if (this.playerProgress.experience < nextLevelExp) {
        break;
      }
    }

    if (levelsGained > 0) {
      this.playerProgress.level += levelsGained;
      this.playerProgress.skillPoints += levelsGained;
      leveledUp = true;

      console.log(`🎉 升级了 ${levelsGained} 级! 当前等级: ${this.playerProgress.level}, 技能点: ${this.playerProgress.skillPoints}`);

      // 检查里程碑解锁
      this.checkMilestoneUnlocks();

      // 触发升级事件
      this.triggerEvent('level_up', {
        newLevel: this.playerProgress.level,
        levelsGained,
        skillPointsAwarded: levelsGained,
        totalSkillPoints: this.playerProgress.skillPoints
      });
    }

    return leveledUp;
  }

  /**
   * 获取升级所需经验值
   */
  getExperienceForLevel(level) {
    // 经验公式: 100 * level^1.5
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /**
   * 升级技能
   */
  upgradeSkill(skillType, levels = 1) {
    if (!this.skillTrees[skillType]) {
      console.error(`❌ 无效的技能类型: ${skillType}`);
      return { success: false, error: 'Invalid skill type' };
    }

    const skill = this.skillTrees[skillType];
    const currentLevel = this.playerProgress.skills[skillType];

    // 检查最大等级
    if (currentLevel >= skill.maxLevel) {
      console.log(`⚠️ 技能 ${skillType} 已达到最大等级`);
      return { success: false, error: 'Max level reached' };
    }

    // 计算升级成本
    const totalCost = this.calculateUpgradeCost(skillType, levels);

    // 检查技能点
    if (this.playerProgress.skillPoints < totalCost) {
      console.log(`⚠️ 技能点不足。需要 ${totalCost}, 当前有 ${this.playerProgress.skillPoints}`);
      return { success: false, error: 'Insufficient skill points' };
    }

    // 执行升级
    const actualLevels = Math.min(levels, skill.maxLevel - currentLevel);
    const actualCost = this.calculateUpgradeCost(skillType, actualLevels);

    this.playerProgress.skills[skillType] += actualLevels;
    this.playerProgress.skillPoints -= actualCost;

    console.log(`🔧 升级技能 ${skillType} +${actualLevels} 级 (花费 ${actualCost} 技能点)`);

    this.statistics.skillsUpgraded += actualLevels;

    // 保存数据
    if (this.config.autoSave) {
      this.saveProgressData();
    }

    // 触发事件
    this.triggerEvent('skill_upgraded', {
      skillType,
      oldLevel: currentLevel,
      newLevel: this.playerProgress.skills[skillType],
      levelsGained: actualLevels,
      cost: actualCost
    });

    return {
      success: true,
      levelsGained: actualLevels,
      newLevel: this.playerProgress.skills[skillType],
      remainingPoints: this.playerProgress.skillPoints
    };
  }

  /**
   * 计算升级成本
   */
  calculateUpgradeCost(skillType, levels) {
    const skill = this.skillTrees[skillType];
    const currentLevel = this.playerProgress.skills[skillType];

    let totalCost = 0;
    for (let i = 0; i < levels; i++) {
      const level = currentLevel + i;
      if (level < skill.maxLevel) {
        totalCost += skill.costPerLevel[level] || skill.costPerLevel[skill.costPerLevel.length - 1];
      }
    }

    return totalCost;
  }

  /**
   * 获取技能效益
   */
  getSkillBenefits() {
    return {
      speed: 1 + (this.playerProgress.skills.speed * this.skillTrees.speed.benefitPerLevel),
      magnet: this.playerProgress.skills.magnet * this.skillTrees.magnet.benefitPerLevel,
      shield: this.playerProgress.skills.shield * this.skillTrees.shield.benefitPerLevel,
      multiplier: 1 + (this.playerProgress.skills.multiplier * this.skillTrees.multiplier.benefitPerLevel)
    };
  }

  /**
   * 检查里程碑解锁
   */
  checkMilestoneUnlocks() {
    const level = this.playerProgress.level;
    const milestones = [
      { level: 10, reward: 'skin_speedster', type: 'cosmetic' },
      { level: 25, reward: 'skin_rainbow', type: 'cosmetic' },
      { level: 50, reward: 'skin_diamond', type: 'cosmetic' },
      { level: 75, reward: 'skill_point_bonus', type: 'bonus' },
      { level: 100, reward: 'skin_legendary', type: 'cosmetic' }
    ];

    milestones.forEach(milestone => {
      if (level >= milestone.level && !this.playerProgress.milestones.includes(milestone.level)) {
        this.playerProgress.milestones.push(milestone.level);

        if (milestone.type === 'cosmetic') {
          this.unlockCosmetic(milestone.reward);
        } else if (milestone.type === 'bonus') {
          this.playerProgress.skillPoints += 5; // 奖励5个技能点
        }

        console.log(`🏆 达成里程碑! 等级 ${milestone.level}: 奖励 ${milestone.reward}`);

        this.triggerEvent('milestone_reached', {
          level: milestone.level,
          reward: milestone.reward,
          type: milestone.type
        });
      }
    });
  }

  /**
   * 解锁皮肤
   */
  unlockCosmetic(skinId) {
    if (this.cosmeticSystem.unlockSkin(skinId)) {
      this.playerProgress.unlockedSkins.push(skinId);
      this.statistics.cosmeticsUnlocked++;

      console.log(`🎨 解锁新皮肤: ${skinId}`);

      this.triggerEvent('cosmetic_unlocked', { skinId });

      // 保存数据
      if (this.config.autoSave) {
        this.saveProgressData();
      }

      return true;
    }

    return false;
  }

  /**
   * 装备皮肤
   */
  equipSkin(skinId) {
    if (this.playerProgress.unlockedSkins.includes(skinId)) {
      this.playerProgress.currentSkin = skinId;

      console.log(`👔 装备皮肤: ${skinId}`);

      this.triggerEvent('skin_equipped', { skinId });

      // 保存数据
      if (this.config.autoSave) {
        this.saveProgressData();
      }

      return true;
    }

    console.error(`❌ 未解锁的皮肤: ${skinId}`);
    return false;
  }

  /**
   * 获取皮肤信息
   */
  getSkinInfo(skinId) {
    return this.cosmeticSystem.getSkinInfo(skinId);
  }

  /**
   * 处理游戏结束统计
   */
  processGameEnd(gameStats) {
    // 计算经验值奖励
    const scoreXP = Math.floor(gameStats.score / 10);
    const survivalXP = Math.floor(gameStats.survivalTime / 1000);
    const foodXP = gameStats.foodEaten * 2;
    const totalXP = scoreXP + survivalXP + foodXP;

    // 更新统计
    this.statistics.gamesPlayed++;
    this.statistics.totalTimePlayed += gameStats.survivalTime;
    this.statistics.totalFoodEaten += gameStats.foodEaten;
    this.statistics.highestScore = Math.max(this.statistics.highestScore, gameStats.score);

    // 授予经验值
    const leveledUp = this.awardExperience(totalXP, 'game_end');

    // 检查成就
    this.checkAchievements(gameStats);

    console.log(`🎮 游戏结束。获得 ${totalXP} 经验值 (分数:${scoreXP}, 生存:${survivalXP}, 食物:${foodXP})`);

    return {
      experienceGained: totalXP,
      leveledUp,
      newLevel: this.playerProgress.level,
      skillPointsAwarded: leveledUp ? 1 : 0
    };
  }

  /**
   * 检查成就
   */
  checkAchievements(gameStats) {
    const achievements = [
      { id: 'first_game', name: '初次游戏', condition: () => this.statistics.gamesPlayed === 1 },
      { id: 'speed_demon', name: '速度恶魔', condition: () => gameStats.maxSpeed > 10 },
      { id: 'survivor', name: '生存专家', condition: () => gameStats.survivalTime > 300000 }, // 5分钟
      { id: 'collector', name: '收集者', condition: () => gameStats.foodEaten > 100 },
      { id: 'high_scorer', name: '高分玩家', condition: () => gameStats.score > 1000 }
    ];

    achievements.forEach(achievement => {
      if (!this.playerProgress.achievements.includes(achievement.id) && achievement.condition()) {
        this.playerProgress.achievements.push(achievement.id);

        console.log(`🏅 解锁成就: ${achievement.name}`);

        this.triggerEvent('achievement_unlocked', {
          id: achievement.id,
          name: achievement.name
        });
      }
    });
  }

  /**
   * 获取保存数据
   */
  getSaveData() {
    return {
      ...this.playerProgress,
      statistics: this.statistics,
      version: this.config.version
    };
  }

  /**
   * 加载进度数据
   */
  loadProgressData() {
    try {
      const savedData = localStorage.getItem(this.config.saveKey);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error('❌ 加载进度数据失败:', error);
      return null;
    }
  }

  /**
   * 保存进度数据
   */
  saveProgressData() {
    try {
      const saveData = this.getSaveData();
      localStorage.setItem(this.config.saveKey, JSON.stringify(saveData));
      console.log('💾 进度数据已保存');
      return true;
    } catch (error) {
      console.error('❌ 保存进度数据失败:', error);
      return false;
    }
  }

  /**
   * 重置进度数据
   */
  resetProgress() {
    if (confirm('确定要重置所有进度吗？此操作不可撤销！')) {
      // 清理本地存储
      localStorage.removeItem(this.config.saveKey);

      // 重置数据
      this.playerProgress = this.createNewProgress();
      this.statistics = {
        totalTimePlayed: 0,
        gamesPlayed: 0,
        highestScore: 0,
        totalFoodEaten: 0,
        skillsUpgraded: 0,
        cosmeticsUnlocked: 0
      };

      console.log('🔄 进度数据已重置');
      this.triggerEvent('progress_reset');

      return true;
    }

    return false;
  }

  /**
   * 设置自动保存
   */
  setupAutoSave() {
    if (this.config.autoSave) {
      this.autoSaveInterval = setInterval(() => {
        this.saveProgressData();
      }, 30000); // 每30秒自动保存
    }
  }

  /**
   * 获取升级菜单数据
   */
  getUpgradeMenuData() {
    const benefits = this.getSkillBenefits();
    const menuData = {};

    Object.entries(this.skillTrees).forEach(([skillType, skillConfig]) => {
      const currentLevel = this.playerProgress.skills[skillType];
      const nextLevelCost = this.calculateUpgradeCost(skillType, 1);
      const canUpgrade = currentLevel < skillConfig.maxLevel &&
                        this.playerProgress.skillPoints >= nextLevelCost;

      menuData[skillType] = {
        ...skillConfig,
        currentLevel,
        nextLevelCost,
        canUpgrade,
        maxUpgrades: skillConfig.maxLevel - currentLevel,
        currentBenefit: benefits[skillType],
        nextBenefit: benefits[skillType] + skillConfig.benefitPerLevel
      };
    });

    return menuData;
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    return {
      ...this.statistics,
      progress: {
        level: this.playerProgress.level,
        experience: this.playerProgress.experience,
        totalExperience: this.playerProgress.totalExperience,
        skillPoints: this.playerProgress.skillPoints
      },
      skills: this.playerProgress.skills,
      cosmetics: {
        unlocked: this.playerProgress.unlockedSkins.length,
        current: this.playerProgress.currentSkin
      }
    };
  }

  /**
   * 触发事件
   */
  triggerEvent(eventName, data) {
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(eventName, callback) {
    if (this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 销毁管理器
   */
  destroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    // 最后一次保存
    if (this.config.autoSave) {
      this.saveProgressData();
    }

    this.eventListeners.clear();
    console.log('🔇 SkillManager已销毁');
  }
}

/**
 * 皮肤系统
 */
class CosmeticSystem {
  constructor() {
    this.skins = {
      classic: {
        name: '经典',
        description: '默认蛇皮肤',
        color: 0x4ade80,
        unlockType: 'default',
        rarity: 'common'
      },
      speedster: {
        name: '极速',
        description: '速度主题皮肤',
        color: 0x3b82f6,
        unlockType: 'milestone',
        rarity: 'rare',
        requirement: { level: 10 }
      },
      rainbow: {
        name: '彩虹',
        description: '七彩炫酷皮肤',
        color: 'rainbow',
        unlockType: 'milestone',
        rarity: 'epic',
        requirement: { level: 25 }
      },
      diamond: {
        name: '钻石',
        description: '闪亮钻石皮肤',
        color: 0x06b6d4,
        unlockType: 'milestone',
        rarity: 'legendary',
        requirement: { level: 50 }
      },
      legendary: {
        name: '传奇',
        description: '传说中的至尊皮肤',
        color: 'gold',
        unlockType: 'milestone',
        rarity: 'legendary',
        requirement: { level: 100 }
      }
    };
  }

  unlockSkin(skinId) {
    const skin = this.skins[skinId];
    if (!skin) {
      console.error(`❌ 无效的皮肤ID: ${skinId}`);
      return false;
    }

    // 这里可以添加更多解锁逻辑
    return true;
  }

  getSkinInfo(skinId) {
    return this.skins[skinId] || null;
  }

  getAllSkins() {
    return Object.entries(this.skins).map(([id, skin]) => ({
      id,
      ...skin
    }));
  }
}

/**
 * 进度数据验证器
 */
class ProgressionDataValidator {
  isValid(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // 检查必要字段
    const requiredFields = ['level', 'experience', 'skillPoints', 'skills', 'unlockedSkins'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.warn(`⚠️ 进度数据缺少必要字段: ${field}`);
        return false;
      }
    }

    // 检查数据类型和范围
    if (typeof data.level !== 'number' || data.level < 1 || data.level > 1000) {
      return false;
    }

    if (typeof data.experience !== 'number' || data.experience < 0) {
      return false;
    }

    if (typeof data.skillPoints !== 'number' || data.skillPoints < 0) {
      return false;
    }

    // 检查技能数据
    if (typeof data.skills !== 'object' || data.skills === null) {
      return false;
    }

    const skillTypes = ['speed', 'magnet', 'shield', 'multiplier'];
    for (const skillType of skillTypes) {
      if (!(skillType in data.skills) || typeof data.skills[skillType] !== 'number') {
        return false;
      }
    }

    return true;
  }
}

export default SkillManager;
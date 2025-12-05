import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import config from './config';

/**
 * 打砖块游戏主类
 */
export default class BreakoutGame {
  constructor(containerId, onGameOver) {
    this.containerId = containerId;
    this.onGameOver = onGameOver;
    this.game = null;
  }

  /**
   * 启动游戏
   */
  start() {
    const gameConfig = {
      type: Phaser.AUTO,
      parent: this.containerId,
      ...config.gameConfig,
      scene: [new GameScene(this.onGameOver)],
      backgroundColor: '#1a1a2e'
    };

    this.game = new Phaser.Game(gameConfig);
  }

  /**
   * 销毁游戏实例
   */
  destroy() {
    if (this.game) {
      console.log('🗑️ Destroying Breakout game...');

      // 停止所有场景
      if (this.game.scene) {
        this.game.scene.scenes.forEach(scene => {
          if (scene.scene.isActive()) {
            scene.scene.stop();
          }
        });
      }

      // 销毁游戏实例（removeCanvas: true 会移除 canvas 元素）
      this.game.destroy(true, false);
      this.game = null;

      console.log('✅ Breakout game destroyed');
    }
  }

  /**
   * 暂停游戏
   */
  pause() {
    if (this.game) {
      this.game.scene.pause('GameScene');
    }
  }

  /**
   * 恢复游戏
   */
  resume() {
    if (this.game) {
      this.game.scene.resume('GameScene');
    }
  }
}

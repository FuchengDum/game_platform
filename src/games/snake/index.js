import Phaser from 'phaser';
import GameSceneSlim from './scenes/GameSceneSlim';
import config from './config';

/**
 * 贪吃蛇游戏主类
 */
export default class SnakeGame {
  constructor(containerId, onGameOver) {
    this.containerId = containerId;
    this.onGameOver = onGameOver;
    this.game = null;
  }

  start() {
    try {
      const gameConfig = {
        type: Phaser.AUTO,
        parent: this.containerId,
        ...config.gameConfig,
        scene: [new GameSceneSlim(this.onGameOver)],
        backgroundColor: '#1a1a2e'
      };

      this.game = new Phaser.Game(gameConfig);
    } catch (error) {
      throw error;
    }
  }

  destroy() {
    if (this.game) {
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
    }
  }

  pause() {
    if (this.game) {
      this.game.scene.pause('GameSceneSlim');
    }
  }

  resume() {
    if (this.game) {
      this.game.scene.resume('GameSceneSlim');
    }
  }
}

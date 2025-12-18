/**
 * 打砖块游戏配置
 */
export default {
  name: '打砖块',
  description: '经典的打砖块游戏，控制挡板击碎所有砖块！',
  icon: '🧱',
  category: 'arcade',
  difficulty: '简单',
  thumbnail: '/src/games/breakout/assets/images/thumbnail.svg',
  controls: {
    desktop: '鼠标移动或左右方向键',
    mobile: '触摸屏幕移动挡板'
  },
  gameConfig: {
    width: 800,
    height: 600,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      parent: 'phaser-game',
      width: '100%',
      height: '100%',
      min: {
        width: 320,
        height: 240
      },
      max: {
        width: 960,
        height: 720
      }
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    render: {
      pixelArt: false,
      antialias: true,
      powerPreference: 'high-performance'
    },
    fps: {
      target: 60,
      forceSetTimeOut: true
    }
  }
};

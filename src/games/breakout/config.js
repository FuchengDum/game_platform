/**
 * 打砖块游戏配置
 */
export default {
  name: '打砖块',
  description: '经典的打砖块游戏，控制挡板击碎所有砖块！',
  icon: '🧱',
  category: 'arcade',
  difficulty: '简单',
  thumbnail: 'https://via.placeholder.com/400x300/0ea5e9/ffffff?text=Breakout',
  controls: {
    desktop: '鼠标移动或左右方向键',
    mobile: '触摸屏幕移动挡板'
  },
  gameConfig: {
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    }
  }
};

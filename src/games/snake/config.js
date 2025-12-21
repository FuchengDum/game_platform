/**
 * 贪吃蛇游戏配置
 */
export default {
  name: '贪吃蛇',
  description: '经典贪吃蛇游戏，吃食物让蛇变长，小心不要撞到自己！',
  icon: '🐍',
  category: 'arcade',
  difficulty: '中等',
  thumbnail: '/src/games/snake/assets/images/thumbnail.svg',
  controls: {
    desktop: '方向键控制',
    mobile: '滑动屏幕控制方向'
  },
  gameConfig: {
    width: '100%',
    height: '100%',
    scale: {
      mode: 'RESIZE',  // 使用RESIZE模式，更适合容器响应式
      autoCenter: 'CENTER_BOTH',
      width: '100%',
      height: '100%',
      resizeParent: true,
      expandParent: true
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
    banner: false
  }
};

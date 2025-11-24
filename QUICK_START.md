# ⚡ 快速启动指南

## 第一次运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器访问
# http://localhost:3000
```

## 添加你的第一个游戏

### 方法 1: 使用命令行（推荐）

```bash
# 创建游戏目录
mkdir -p src/games/my-game/scenes

# 复制模板
cp -r src/games/breakout/* src/games/my-game/

# 编辑配置文件
# src/games/my-game/config.js
```

### 方法 2: 手动创建

1. **创建目录结构**
```
src/games/my-game/
├── config.js
├── index.js
└── scenes/
    └── GameScene.js
```

2. **编辑 config.js**
```javascript
export default {
  name: '我的游戏',
  description: '游戏描述',
  icon: '🎯',
  category: 'arcade',
  difficulty: '简单',
  thumbnail: 'https://via.placeholder.com/400x300',
  controls: {
    desktop: '方向键控制',
    mobile: '触摸控制'
  },
  gameConfig: {
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 }
      }
    }
  }
};
```

3. **编辑 GameScene.js**
```javascript
import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor(onGameOver) {
    super('GameScene');
    this.onGameOver = onGameOver;
    this.score = 0;
  }

  create() {
    // 你的游戏逻辑
    this.scoreText = this.add.text(16, 16, '分数: 0', {
      fontSize: '24px',
      fill: '#fff'
    });
  }

  update() {
    // 游戏循环
  }

  gameOver() {
    this.scene.pause();
    this.time.delayedCall(2000, () => {
      if (this.onGameOver) {
        this.onGameOver(this.score);
      }
    });
  }
}
```

4. **编辑 index.js**
```javascript
import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import config from './config';

export default class MyGame {
  constructor(containerId, onGameOver) {
    this.containerId = containerId;
    this.onGameOver = onGameOver;
    this.game = null;
  }

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

  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }

  pause() {
    if (this.game) {
      this.game.scene.pause('GameScene');
    }
  }

  resume() {
    if (this.game) {
      this.game.scene.resume('GameScene');
    }
  }
}
```

5. **刷新浏览器** - 你的游戏会自动出现在游戏大厅！

## 常用命令

```bash
# 开发模式（热更新）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

## 项目结构速览

```
phaser-game-hub/
├── src/
│   ├── games/           # 🎮 所有游戏都在这里
│   │   ├── breakout/    # 打砖块示例
│   │   └── snake/       # 贪吃蛇示例
│   ├── components/      # React 组件
│   ├── store/           # 状态管理
│   └── utils/           # 工具函数
├── README.md            # 📖 完整文档
├── DEVELOPMENT.md       # 🚀 开发指南
└── package.json         # 项目配置
```

## 下一步

- 📖 阅读 [README.md](./README.md) 了解完整功能
- 🚀 查看 [DEVELOPMENT.md](./DEVELOPMENT.md) 学习游戏开发
- 🎮 参考 `src/games/breakout` 和 `src/games/snake` 示例
- 🎨 自定义 `tailwind.config.js` 修改主题

## 需要帮助？

- [Phaser 官方文档](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 示例](https://phaser.io/examples)
- [React 文档](https://react.dev/)

---

**开始创作吧！** 🎮✨

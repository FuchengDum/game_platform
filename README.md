# 🎮 Phaser 游戏大厅

一个基于 **Phaser 3** 和 **React** 构建的多游戏集成平台，支持快速开发和集成各类小游戏。

## ✨ 特性

- 🎯 **模块化架构** - 每个游戏独立开发，易于维护和扩展
- 🎨 **现代化 UI** - 使用 Tailwind CSS 构建的响应式界面
- 📊 **数据管理** - 统一的积分、记录和成就系统
- ⚡ **性能优化** - 按需加载游戏，代码分割优化
- 🎮 **多平台支持** - 支持桌面和移动设备
- 🔧 **开发友好** - 热更新、清晰的项目结构

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看游戏大厅。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 📁 项目结构

```
phaser-game-hub/
├── src/
│   ├── components/          # React 组件
│   │   ├── Layout.jsx       # 布局组件
│   │   ├── Home.jsx         # 游戏大厅首页
│   │   └── GameContainer.jsx # 游戏容器
│   ├── games/               # 游戏目录
│   │   ├── breakout/        # 打砖块游戏
│   │   │   ├── config.js    # 游戏配置
│   │   │   ├── index.js     # 游戏主类
│   │   │   └── scenes/      # 游戏场景
│   │   └── snake/           # 贪吃蛇游戏
│   │       ├── config.js
│   │       ├── index.js
│   │       └── scenes/
│   ├── store/               # 状态管理
│   │   └── gameStore.js     # Zustand store
│   ├── utils/               # 工具函数
│   │   └── gameRegistry.js  # 游戏注册中心
│   ├── styles/              # 样式文件
│   │   └── index.css        # 全局样式
│   ├── App.jsx              # 应用根组件
│   └── main.jsx             # 应用入口
├── index.html               # HTML 模板
├── package.json             # 项目配置
├── vite.config.js           # Vite 配置
└── tailwind.config.js       # Tailwind 配置
```

## 🎮 已集成游戏

### 1. 打砖块 (Breakout) 🧱
- **类型**: 街机
- **难度**: 简单
- **操作**: 鼠标移动或方向键
- **目标**: 击碎所有砖块

### 2. 贪吃蛇 (Snake) 🐍
- **类型**: 街机
- **难度**: 中等
- **操作**: 方向键或触摸滑动
- **目标**: 吃食物让蛇变长，避免撞到自己

## 🔧 如何添加新游戏

### 步骤 1: 创建游戏目录

在 `src/games/` 下创建新游戏目录，例如 `my-game/`：

```bash
mkdir -p src/games/my-game/scenes
```

### 步骤 2: 创建游戏配置

创建 `src/games/my-game/config.js`：

```javascript
export default {
  name: '我的游戏',
  description: '游戏描述',
  icon: '🎯',
  category: 'arcade', // arcade, puzzle, action, casual
  difficulty: '简单', // 简单, 中等, 困难
  thumbnail: 'https://via.placeholder.com/400x300',
  controls: {
    desktop: '键盘操作说明',
    mobile: '触摸操作说明'
  },
  gameConfig: {
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 300 },
        debug: false
      }
    }
  }
};
```

### 步骤 3: 创建游戏场景

创建 `src/games/my-game/scenes/GameScene.js`：

```javascript
import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor(onGameOver) {
    super('GameScene');
    this.onGameOver = onGameOver;
    this.score = 0;
  }

  preload() {
    // 加载资源
  }

  create() {
    // 初始化游戏对象
    this.scoreText = this.add.text(16, 16, '分数: 0', {
      fontSize: '24px',
      fill: '#fff'
    });
  }

  update() {
    // 游戏循环逻辑
  }

  gameOver() {
    this.scene.pause();
    // 显示游戏结束界面
    this.time.delayedCall(2000, () => {
      if (this.onGameOver) {
        this.onGameOver(this.score);
      }
    });
  }
}
```

### 步骤 4: 创建游戏主类

创建 `src/games/my-game/index.js`：

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

### 步骤 5: 自动注册

游戏会自动被 `gameRegistry.js` 检测和注册，无需手动配置！

## 🎨 自定义样式

### 修改主题颜色

编辑 `tailwind.config.js`：

```javascript
theme: {
  extend: {
    colors: {
      game: {
        bg: '#1a1a2e',      // 背景色
        card: '#16213e',    // 卡片色
        accent: '#0f3460',  // 强调色
      }
    }
  }
}
```

### 添加自定义样式

在 `src/styles/index.css` 中添加：

```css
.my-custom-class {
  @apply bg-primary-500 text-white rounded-lg;
}
```

## 📊 状态管理

使用 Zustand 管理全局状态：

```javascript
import useGameStore from '@/store/gameStore';

function MyComponent() {
  const userData = useGameStore((state) => state.userData);
  const updateGameRecord = useGameStore((state) => state.updateGameRecord);

  // 更新游戏记录
  updateGameRecord('my-game', 100);
}
```

## 🔌 API 参考

### GameContainer 组件

游戏容器组件自动处理：
- ✅ 游戏加载和初始化
- ✅ 暂停/继续/重启控制
- ✅ 游戏结束处理
- ✅ 分数记录

### 游戏主类接口

每个游戏主类必须实现：

```javascript
class MyGame {
  constructor(containerId, onGameOver) {}
  start() {}      // 启动游戏
  destroy() {}    // 销毁游戏实例
  pause() {}      // 暂停游戏
  resume() {}     // 恢复游戏
}
```

### 游戏结束回调

```javascript
onGameOver(score) {
  // score: 最终分数
  // 自动保存记录并返回大厅
}
```

## 🛠️ 技术栈

- **前端框架**: React 18
- **游戏引擎**: Phaser 3.80+
- **构建工具**: Vite 5
- **状态管理**: Zustand 4
- **路由**: React Router 6
- **样式**: Tailwind CSS 3
- **语言**: JavaScript (ES6+)

## 📝 开发建议

### 性能优化

1. **资源优化**
   - 使用纹理图集合并小图片
   - 压缩音频文件
   - 使用对象池复用游戏对象

2. **代码分割**
   - 游戏按需加载（已实现）
   - 使用动态 import

3. **渲染优化**
   - 限制粒子数量
   - 使用 WebGL 渲染器
   - 避免频繁的 DOM 操作

### 调试技巧

1. **启用 Phaser 调试模式**
```javascript
physics: {
  arcade: {
    debug: true  // 显示物理边界
  }
}
```

2. **使用浏览器开发工具**
   - React DevTools
   - Performance 面板
   - Network 面板

### 最佳实践

1. **遵循 SOLID 原则**
   - 单一职责：每个场景专注一个功能
   - 开闭原则：通过配置扩展游戏

2. **代码复用**
   - 提取公共游戏逻辑
   - 创建可复用的 Phaser 组件

3. **错误处理**
   - 捕获游戏加载错误
   - 提供友好的错误提示

## 🎯 游戏开发示例

### 示例 1: 简单的点击游戏

```javascript
// src/games/clicker/scenes/GameScene.js
export default class GameScene extends Phaser.Scene {
  create() {
    this.score = 0;
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      fill: '#fff'
    });

    // 创建可点击的目标
    const target = this.add.circle(400, 300, 50, 0xff6b6b);
    target.setInteractive();

    target.on('pointerdown', () => {
      this.score += 10;
      this.scoreText.setText('Score: ' + this.score);

      // 移动到随机位置
      target.x = Phaser.Math.Between(50, 750);
      target.y = Phaser.Math.Between(50, 550);
    });
  }
}
```

### 示例 2: 使用精灵动画

```javascript
preload() {
  this.load.spritesheet('player', 'assets/player.png', {
    frameWidth: 32,
    frameHeight: 48
  });
}

create() {
  // 创建动画
  this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  // 播放动画
  const player = this.add.sprite(400, 300, 'player');
  player.play('walk');
}
```

## 🤝 贡献指南

欢迎贡献新游戏或改进现有功能！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingGame`)
3. 提交更改 (`git commit -m 'Add some AmazingGame'`)
4. 推送到分支 (`git push origin feature/AmazingGame`)
5. 开启 Pull Request

## 📄 许可证

MIT License

## 🔗 相关链接

- [Phaser 官方文档](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 示例](https://phaser.io/examples)
- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## 💡 常见问题

### Q: 如何添加音效？

```javascript
preload() {
  this.load.audio('jump', 'assets/audio/jump.mp3');
}

create() {
  this.jumpSound = this.sound.add('jump');
}

// 播放音效
this.jumpSound.play();
```

### Q: 如何实现排行榜？

可以扩展 `gameStore.js` 添加排行榜功能，或集成后端 API。

### Q: 如何部署到生产环境？

```bash
npm run build
# 将 dist 目录部署到任何静态托管服务
# 如 Vercel, Netlify, GitHub Pages 等
```

### Q: 游戏在移动端表现不佳？

1. 降低游戏分辨率
2. 减少粒子效果
3. 优化物理计算
4. 使用对象池

---

**开始创建你的游戏吧！** 🎮✨

# 🔧 故障排除指南

## 常见问题及解决方案

### 1. 游戏无法打开或加载失败

#### 症状
- 点击游戏卡片后显示"游戏加载失败"
- 浏览器控制台显示模块加载错误
- 游戏页面一直显示"加载中..."

#### 解决方案

**步骤 1: 检查浏览器控制台**

打开浏览器开发者工具（F12），查看控制台输出：

```
应该看到类似的日志：
📦 Game modules found: ['../games/breakout/config.js', '../games/snake/config.js']
✅ Registered game: breakout
✅ Registered game: snake
```

**步骤 2: 验证游戏文件结构**

确保游戏目录结构正确：

```bash
src/games/your-game/
├── config.js       # 必须存在
├── index.js        # 必须存在
└── scenes/
    └── GameScene.js  # 必须存在
```

**步骤 3: 检查文件导出**

确保每个文件都有正确的 `export default`：

```javascript
// config.js
export default {
  name: '游戏名称',
  // ...
};

// index.js
export default class MyGame {
  // ...
}

// GameScene.js
export default class GameScene extends Phaser.Scene {
  // ...
}
```

**步骤 4: 清除缓存并重启**

```bash
# 停止开发服务器 (Ctrl+C)
# 删除缓存
rm -rf node_modules/.vite

# 重启
npm run dev
```

### 2. 游戏画面不显示

#### 症状
- 游戏页面加载成功，但看不到游戏画面
- 只显示游戏信息卡片，没有 Phaser 画布

#### 解决方案

**检查 1: 确认容器 ID**

游戏主类中的容器 ID 必须是 `'phaser-game'`：

```javascript
// index.js
start() {
  const gameConfig = {
    parent: 'phaser-game',  // 必须是这个 ID
    // ...
  };
}
```

**检查 2: 验证游戏配置**

确保 `config.js` 中的 `gameConfig` 正确：

```javascript
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
```

**检查 3: 查看 Phaser 错误**

打开控制台，查找 Phaser 相关错误：

```
Phaser v3.80.1
WebGL Renderer
Canvas Renderer
```

如果看到错误，根据错误信息修复。

### 3. 游戏运行但无法交互

#### 症状
- 游戏画面显示正常
- 键盘/鼠标输入无响应
- 游戏对象不移动

#### 解决方案

**检查 1: 输入系统初始化**

确保在 `create()` 中初始化输入：

```javascript
create() {
  // 键盘输入
  this.cursors = this.input.keyboard.createCursorKeys();

  // 鼠标/触摸输入
  this.input.on('pointerdown', (pointer) => {
    // 处理点击
  });
}
```

**检查 2: update() 方法**

确保 `update()` 方法存在并正确处理输入：

```javascript
update() {
  if (this.cursors.left.isDown) {
    // 处理左键
  }
}
```

**检查 3: 物理系统**

如果使用物理引擎，确保对象已添加到物理世界：

```javascript
this.physics.add.existing(this.player);
```

### 4. 游戏性能问题

#### 症状
- 游戏卡顿
- 帧率低
- 浏览器变慢

#### 解决方案

**优化 1: 减少粒子数量**

```javascript
this.emitter = this.particles.createEmitter({
  maxParticles: 50,  // 限制粒子数量
  // ...
});
```

**优化 2: 使用对象池**

```javascript
// 创建对象池
this.bulletPool = this.physics.add.group({
  classType: Bullet,
  maxSize: 30,
  runChildUpdate: true
});

// 复用对象而不是创建新对象
const bullet = this.bulletPool.get();
```

**优化 3: 禁用调试模式**

```javascript
gameConfig: {
  physics: {
    arcade: {
      debug: false  // 生产环境必须关闭
    }
  }
}
```

**优化 4: 降低分辨率**

```javascript
gameConfig: {
  width: 600,   // 从 800 降低到 600
  height: 450,  // 从 600 降低到 450
}
```

### 5. 游戏结束后无法返回大厅

#### 症状
- 游戏结束后卡住
- 无法返回游戏大厅
- 控制台显示回调错误

#### 解决方案

**检查 1: 确保传递回调**

游戏场景必须接收并保存回调：

```javascript
export default class GameScene extends Phaser.Scene {
  constructor(onGameOver) {
    super('GameScene');
    this.onGameOver = onGameOver;  // 保存回调
  }

  gameOver() {
    this.physics.pause();
    this.time.delayedCall(2000, () => {
      if (this.onGameOver) {  // 检查回调存在
        this.onGameOver(this.score);
      }
    });
  }
}
```

**检查 2: 游戏主类传递回调**

```javascript
start() {
  const gameConfig = {
    scene: [new GameScene(this.onGameOver)],  // 传递回调
  };
}
```

### 6. 暂停/继续功能不工作

#### 症状
- 点击暂停按钮无效
- 游戏无法暂停或恢复

#### 解决方案

**检查 1: 实现暂停方法**

游戏主类必须实现这些方法：

```javascript
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
```

**检查 2: 场景名称一致**

确保场景名称与构造函数中的名称一致：

```javascript
constructor(onGameOver) {
  super('GameScene');  // 这个名称
}

// 必须与暂停/恢复中使用的名称一致
this.game.scene.pause('GameScene');
```

### 7. 样式问题

#### 症状
- 游戏大厅样式混乱
- 按钮或卡片显示异常
- 颜色不正确

#### 解决方案

**检查 1: Tailwind CSS 配置**

确保 `tailwind.config.js` 正确配置：

```javascript
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
],
```

**检查 2: 导入样式文件**

确保在 `main.jsx` 中导入样式：

```javascript
import './styles/index.css';
```

**检查 3: 重新构建**

```bash
# 停止服务器
# 删除构建缓存
rm -rf node_modules/.vite
rm -rf dist

# 重新启动
npm run dev
```

### 8. 依赖安装问题

#### 症状
- `npm install` 失败
- 缺少依赖包
- 版本冲突

#### 解决方案

**方案 1: 清除并重新安装**

```bash
# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

**方案 2: 使用特定版本**

```bash
npm install phaser@3.80.1 react@18.2.0 react-dom@18.2.0
```

**方案 3: 检查 Node.js 版本**

```bash
node --version  # 应该是 v16+ 或 v18+
```

如果版本过低，升级 Node.js。

### 9. 开发服务器无法启动

#### 症状
- `npm run dev` 失败
- 端口被占用
- Vite 错误

#### 解决方案

**方案 1: 更换端口**

编辑 `vite.config.js`：

```javascript
server: {
  port: 3001,  // 改为其他端口
}
```

**方案 2: 杀死占用端口的进程**

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**方案 3: 检查配置文件**

确保 `vite.config.js` 语法正确，没有错误。

### 10. 生产构建失败

#### 症状
- `npm run build` 失败
- 构建错误
- 打包体积过大

#### 解决方案

**方案 1: 检查代码错误**

```bash
npm run lint  # 运行代码检查
```

修复所有 ESLint 错误。

**方案 2: 优化构建配置**

编辑 `vite.config.js`：

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'phaser': ['phaser'],
        'react-vendor': ['react', 'react-dom']
      }
    }
  }
}
```

**方案 3: 检查资源路径**

确保所有资源路径正确，使用相对路径或公共路径。

## 调试技巧

### 1. 启用详细日志

项目已经添加了详细的控制台日志，查看浏览器控制台：

- 📦 模块发现
- ✅ 游戏注册
- 🎮 游戏加载
- 🎯 实例创建
- 🏁 游戏结束

### 2. 使用 Phaser 调试模式

临时启用物理调试：

```javascript
gameConfig: {
  physics: {
    arcade: {
      debug: true  // 显示碰撞边界
    }
  }
}
```

### 3. React DevTools

安装 React DevTools 浏览器扩展，查看组件状态和 props。

### 4. 网络面板

检查资源加载情况，确保所有文件都正确加载。

## 获取帮助

如果以上方案都无法解决问题：

1. **查看完整日志**
   - 打开浏览器控制台
   - 复制所有错误信息

2. **检查文件结构**
   ```bash
   tree src/games/your-game
   ```

3. **验证代码语法**
   ```bash
   npm run lint
   ```

4. **参考示例游戏**
   - 对比 `src/games/breakout`
   - 对比 `src/games/snake`

5. **查阅文档**
   - [README.md](./README.md)
   - [DEVELOPMENT.md](./DEVELOPMENT.md)
   - [Phaser 官方文档](https://photonstorm.github.io/phaser3-docs/)

## 常用命令速查

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 清除缓存
rm -rf node_modules/.vite

# 完全重装
rm -rf node_modules package-lock.json && npm install
```

---

**记住**: 大多数问题都可以通过查看浏览器控制台日志来诊断！

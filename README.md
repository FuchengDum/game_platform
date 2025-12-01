# 🎮 Phaser 游戏大厅

一个基于 **Phaser 3** 和 **React** 构建的多游戏集成平台，支持快速开发和集成各类小游戏。

## ✨ 核心特性

- 🎯 **模块化架构** - 每个游戏独立开发，易于维护和扩展
- 🎨 **现代化 UI** - 使用 Tailwind CSS 构建的响应式界面
- 📊 **数据管理** - 统一的积分、记录和成就系统
- ⚡ **性能优化** - 按需加载游戏，代码分割优化
- 🎮 **多平台支持** - 支持桌面和移动设备
- 🔧 **开发友好** - 热更新、清晰的项目结构

## 🚀 快速开始

### 环境要求
- Node.js 16+
- 现代浏览器 (Chrome, Firefox, Safari, Edge)

### 安装和运行

```bash
# 克隆项目
git clone [repository-url]
cd phaser-game-hub

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 开始游戏体验！

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 🎮 游戏集合

### 已集成游戏

| 游戏 | 类型 | 难度 | 操控方式 | 特色 |
|------|------|------|----------|------|
| [🧱 打砖块](src/games/breakout/README.md) | 街机 | 简单 | 鼠标/方向键 | 经典街机体验，多彩砖块系统 |
| [🐍 贪吃蛇](src/games/snake/README.md) | 街机 | 中等 | 方向键/WASD | 道具系统，等级进阶机制 |

### 游戏特色

#### 打砖块游戏 🧱
- 经典街机玩法，适合所有年龄段
- 多种砖块类型和分值系统
- 精确的物理碰撞检测
- 连击奖励和特殊砖块

#### 贪吃蛇游戏 🐍
- 现代化经典游戏体验
- 丰富的道具系统（加速、减速、双倍积分）
- 等级系统和连击奖励机制
- 流畅的操控和视觉反馈

## 📁 项目架构

```
phaser-game-hub/
├── src/
│   ├── components/          # React 组件
│   │   ├── Layout.jsx       # 布局组件
│   │   ├── Home.jsx         # 游戏大厅首页
│   │   └── GameContainer.jsx # 游戏容器
│   ├── games/               # 游戏目录
│   │   ├── breakout/        # 打砖块游戏
│   │   │   ├── README.md    # 📖 游戏说明
│   │   │   └── ...          # 游戏文件
│   │   └── snake/           # 贪吃蛇游戏
│   │       ├── README.md    # 📖 游戏说明
│   │       └── ...          # 游戏文件
│   ├── store/               # 状态管理
│   ├── utils/               # 工具函数
│   └── styles/              # 样式文件
├── docs/                    # 项目文档
│   ├── DEVELOPMENT.md       # 开发指南
│   ├── TROUBLESHOOTING.md   # 故障排除
│   └── CHANGELOG.md         # 更新日志
└── package.json             # 项目配置
```

## 🔧 开发指南

### 添加新游戏

1. **创建游戏目录**
   ```bash
   mkdir -p src/games/my-game
   ```

2. **创建游戏配置** (`config.js`)
3. **创建游戏场景** (`scenes/GameScene.js`)
4. **创建游戏主类** (`index.js`)
5. **添加游戏说明** (`README.md`)

📖 **详细开发指南**: 查看 [DEVELOPMENT.md](DEVELOPMENT.md) 获取完整的开发步骤和代码模板。

### 开发工具

- **热更新**: 修改代码自动刷新
- **游戏调试**: 内置调试工具
- **性能监控**: 实时性能指标
- **错误追踪**: 详细的错误信息

## 🛠️ 技术栈

- **前端框架**: React 18
- **游戏引擎**: Phaser 3.80+
- **构建工具**: Vite 5
- **状态管理**: Zustand 4
- **路由系统**: React Router 6
- **样式框架**: Tailwind CSS 3
- **开发语言**: JavaScript (ES6+)

## 📊 系统要求

### 最低要求
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+
- **内存**: 4GB RAM
- **分辨率**: 1024×768
- **网络**: 稳定的互联网连接

### 推荐配置
- **浏览器**: 最新版本 Chrome/Firefox
- **内存**: 8GB+ RAM
- **分辨率**: 1920×1080+
- **显卡**: 支持硬件加速

## 🔍 故障排除

遇到问题？查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 获取常见问题解决方案。

### 常见问题
- **游戏无法加载**: 检查网络连接和浏览器控制台
- **控制无响应**: 刷新页面并检查键盘快捷键冲突
- **性能问题**: 关闭其他标签页，确保硬件加速开启

## 📈 项目状态

- **版本**: v1.0.1
- **开发状态**: 🟢 活跃开发中
- **已集成游戏**: 2个
- **支持平台**: Web (Desktop & Mobile)

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出改进建议！

1. **报告问题**: 使用 GitHub Issues
2. **功能建议**: 标记为 "enhancement"
3. **代码贡献**: 提交 Pull Request
4. **文档改进**: 提交文档相关 PR

## 📞 联系方式

- **项目主页**: [GitHub Repository]
- **问题反馈**: [GitHub Issues]
- **讨论交流**: [GitHub Discussions]

## 📜 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- 📖 [开发指南](DEVELOPMENT.md) - 详细的开发文档
- 🐛 [故障排除](TROUBLESHOOTING.md) - 常见问题解决方案
- 📋 [更新日志](CHANGELOG.md) - 版本更新记录
- 🎯 [打砖块游戏说明](src/games/breakout/README.md)
- 🐍 [贪吃蛇游戏说明](src/games/snake/README.md)

---

**快速开始**: `npm install && npm run dev` | **端口**: 3000 | **引擎**: Phaser 3.x
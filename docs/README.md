# 📚 项目文档导航

## 🏠 快速导航

- **[📖 主文档](../README.md)** - 项目概述和快速开始
- **[🚀 开发指南](../DEVELOPMENT.md)** - 详细的开发步骤和代码模板
- **[🐛 故障排除](../TROUBLESHOOTING.md)** - 常见问题解决方案
- **[📋 更新日志](../CHANGELOG.md)** - 版本更新记录

## 🎮 游戏文档

### 已集成游戏

| 游戏 | 文档链接 | 状态 | 特性 |
|------|----------|------|------|
| 🧱 打砖块 | [游戏说明](../src/games/breakout/README.md) | ✅ 完成 | 多彩砖块、物理引擎、连击系统 |
| 🐍 贪吃蛇 | [游戏说明](../src/games/snake/README.md) | ✅ 完成 | 道具系统、等级进阶、连击奖励 |

### 游戏开发

- **[添加新游戏](../DEVELOPMENT.md#添加新游戏)** - 完整的游戏开发指南
- **[游戏类型模板](../DEVELOPMENT.md#游戏类型模板)** - 4种游戏类型的代码模板
- **[常用代码片段](../DEVELOPMENT.md#常用代码片段)** - 10+个实用代码模板

## 🏗️ 架构文档

### 核心组件

| 组件 | 描述 | 状态 | 文档 |
|------|------|------|------|
| React 大厅 | 游戏选择和管理界面 | ✅ 稳定 | [README](../README.md#项目架构) |
| 游戏容器 | 统一的游戏加载和管理 | ✅ 稳定 | [API 参考](../README.md#api-参考) |
| 游戏注册系统 | 自动发现和注册游戏 | ✅ 稳定 | [开发指南](../DEVELOPMENT.md#自动注册) |
| 状态管理 | Zustand 全局状态管理 | ✅ 稳定 | [状态管理](../README.md#状态管理) |

### 技术栈

- **前端框架**: React 18
- **游戏引擎**: Phaser 3.80+
- **构建工具**: Vite 5
- **状态管理**: Zustand 4
- **路由系统**: React Router 6
- **样式框架**: Tailwind CSS 3

## 🛠️ 开发工具

### 调试和优化

- **[性能优化](../README.md#性能优化)** - 资源优化和代码分割
- **[调试技巧](../DEVELOPMENT.md#调试技巧)** - 开发工具使用指南
- **[故障排除](../TROUBLESHOOTING.md)** - 10+个常见问题解决方案

### 项目管理

- **[项目总结](../PROJECT_SUMMARY.md)** - 详细的技术架构和功能统计
- **[优化计划](../GAME_OPTIMIZATION_TODO.md)** - 功能规划和实施计划
- **[快速开始](../QUICK_START.md)** - 新手入门指南

## 📝 文档结构

```
项目根目录/
├── 📖 README.md                    # 项目主要文档
├── 🚀 DEVELOPMENT.md               # 开发指南
├── 🐛 TROUBLESHOOTING.md           # 故障排除
├── 📋 CHANGELOG.md                 # 更新日志
├── 📊 PROJECT_SUMMARY.md           # 项目总结
├── 📚 QUICK_START.md               # 快速开始
├── 🎯 GAME_OPTIMIZATION_TODO.md    # 优化计划
└── 📁 docs/
    └── 📚 README.md                 # 文档导航（当前文件）
```

## 🎯 文档使用指南

### 新手开发者

1. **开始学习**: [快速开始](../QUICK_START.md) → [主文档](../README.md)
2. **添加游戏**: [开发指南](../DEVELOPMENT.md) → [游戏模板](../DEVELOPMENT.md#游戏类型模板)
3. **遇到问题**: [故障排除](../TROUBLESHOOTING.md)

### 进阶开发者

1. **架构理解**: [项目总结](../PROJECT_SUMMARY.md) → [技术栈](../README.md#技术栈)
2. **性能优化**: [性能优化](../README.md#性能优化) → [优化计划](../GAME_OPTIMIZATION_TODO.md)
3. **功能扩展**: [开发指南](../DEVELOPMENT.md) → [API 参考](../README.md#api-参考)

### 游戏玩家

1. **游戏说明**: 查看 [游戏文档](#游戏文档) 了解详细规则
2. **技术问题**: 查看 [故障排除](../TROUBLESHOOTING.md) 获取解决方案
3. **版本更新**: 查看 [更新日志](../CHANGELOG.md) 了解最新功能

## 🔗 快速链接

### 核心文档
- 📖 [项目主页](../README.md)
- 🚀 [快速开始](../QUICK_START.md)
- 🛠️ [开发指南](../DEVELOPMENT.md)
- 🐛 [故障排除](../TROUBLESHOOTING.md)

### 游戏相关
- 🧱 [打砖块游戏](../src/games/breakout/README.md)
- 🐍 [贪吃蛇游戏](../src/games/snake/README.md)

### 项目管理
- 📊 [项目总结](../PROJECT_SUMMARY.md)
- 📋 [更新日志](../CHANGELOG.md)
- 🎯 [优化计划](../GAME_OPTIMIZATION_TODO.md)

## 📞 获取帮助

- **技术问题**: 查看 [故障排除指南](../TROUBLESHOOTING.md)
- **功能建议**: 提交 [GitHub Issue](https://github.com/[your-repo]/issues)
- **文档改进**: 提交 [文档 PR](https://github.com/[your-repo]/pulls)

---

**最后更新**: 2024-01-XX | **版本**: v1.0.1 | **状态**: 🟢 最新
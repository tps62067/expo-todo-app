# Expo Todo App 📝

一个基于Expo的待办事项和笔记应用，包含任务管理、笔记功能和数据同步。

## 功能特性

- 📋 任务管理：创建、编辑、删除待办事项
- 📝 笔记功能：支持富文本笔记编辑
- 🏷️ 标签系统：为任务和笔记添加标签
- 📊 项目管理：按项目组织任务和笔记
- 🔍 搜索功能：快速查找任务和笔记
- 📱 跨平台：支持iOS、Android和Web
- 💾 本地存储：使用SQLite数据库

## 技术栈

- **框架**: Expo SDK 53
- **语言**: TypeScript
- **UI**: React Native
- **路由**: Expo Router
- **数据库**: SQLite (expo-sqlite)
- **状态管理**: React Context
- **样式**: StyleSheet

## 开始使用

1. 安装依赖

   ```bash
   npm install
   ```

2. 启动应用

   ```bash
   npx expo start
   ```

3. 选择运行平台
   - 按 `a` 在Android模拟器中打开
   - 按 `i` 在iOS模拟器中打开
   - 按 `w` 在Web浏览器中打开
   - 扫描二维码在Expo Go中打开

## 项目结构

```
├── app/                 # 应用页面 (Expo Router)
│   ├── (tabs)/         # 标签页导航
│   ├── note/           # 笔记相关页面
│   └── task/           # 任务相关页面
├── lib/                # 核心业务逻辑
│   ├── database/       # 数据库层
│   ├── services/       # 服务层
│   ├── repositories/   # 仓储层
│   └── models/         # 数据模型
├── src/                # UI组件和工具
│   ├── components/     # React组件
│   ├── hooks/          # 自定义Hooks
│   └── utils/          # 工具函数
└── assets/             # 静态资源
```

## 开发说明

### 数据库架构

应用使用SQLite数据库，包含以下主要表：
- `tasks` - 任务表
- `notes` - 笔记表
- `projects` - 项目表
- `tags` - 标签表
- `notebooks` - 笔记本表

### 架构设计

采用分层架构：
- **表示层**: React Native组件
- **服务层**: 业务逻辑处理
- **仓储层**: 数据访问抽象
- **数据层**: SQLite数据库

## 构建和部署

### 开发构建
```bash
npm run android  # Android开发构建
npm run ios      # iOS开发构建
npm run web      # Web开发构建
```

### 生产构建
```bash
eas build --platform android
eas build --platform ios
```

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 许可证

本项目采用MIT许可证。
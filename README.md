# LeetCode Status Card Generator

一个用于生成 LeetCode 用户状态卡片的工具，可以显示用户的做题统计和最近活动。

## 功能特性

- 🎯 显示用户总体做题进度和统计
- 📊 按难度分类的做题统计（Easy/Medium/Hard）
- 📝 显示最近5次提交记录
- 🎨 多种主题支持（Light/Dark/Nord）
- 🎨 现代化的卡片设计，参考 LeetCode-Stats-Card 项目
- 🔄 自动更新数据

## 安装

```bash
npm install
```

## 使用方法

### 1. 设置用户名

可以通过环境变量设置 LeetCode 用户名：

```bash
export LEETCODE_USERNAME="your_username"
```

或者直接修改 `scripts/generate_svg.js` 文件中的默认值：

```javascript
const USERNAME = process.env.LEETCODE_USERNAME || 'your_username';
```

### 2. 生成状态卡片

```bash
# 使用默认主题（light）
npm run generate

# 使用特定主题
npm run generate:light    # 浅色主题
npm run generate:dark     # 深色主题
npm run generate:nord     # Nord主题

# 或者通过环境变量设置主题
THEME=dark npm run generate
```

生成的SVG文件将保存在 `stats/` 目录下。

### 3. 自动更新（GitHub Actions）

项目已配置 GitHub Actions 工作流，可以自动更新状态卡片。工作流文件位于 `.github/workflows/generate-leetcode-card.yml`。

## 输出示例

生成的SVG卡片包含以下信息：

- **用户信息**: 用户名和排名
- **总体进度**: 圆形进度条显示已解决的题目总数
- **难度分布**: 三个难度级别的进度条
- **最近活动**: 最近5次提交记录，包括：
  - 提交日期
  - 提交状态（AC/WA/TLE/MLE/RE/CE）
  - 使用的编程语言
  - 题目标题

## 技术栈

- Node.js
- leetcode-query 库（用于获取 LeetCode 数据）
- SVG 生成
- 多主题支持系统

## 自定义

你可以修改 `scripts/generate_svg.js` 文件来自定义：

- 卡片尺寸和布局
- 颜色主题（支持 Light/Dark/Nord 三种预设主题）
- 字体样式
- 显示的信息内容
- 添加新的主题

### 添加新主题

在 `THEMES` 对象中添加新的主题配置：

```javascript
const THEMES = {
    // ... 现有主题
    custom: {
        card: '#your-color',
        border: '#your-color',
        text: '#your-color',
        // ... 其他颜色配置
    }
};
```

## 注意事项

- 需要网络连接来获取 LeetCode 数据
- 某些用户数据可能需要登录才能访问
- 建议不要过于频繁地调用 API 以避免被限制

## 许可证

MIT License 
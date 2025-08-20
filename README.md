# LeetCode Stats Card（极简动画版）

一个用于生成 LeetCode 个人卡片的工具。当前卡片为极简风格，包含用户名、站内排名、总解题数（圆环动画）与按难度划分的进度条（动画）。

## 功能特性

- **极简信息**：仅显示用户名、排名、总解题数和难度进度条
- **动画效果**：使用 SMIL 与渐显动画，圆环与三条进度条会按比例动态绘制
- **纯 SVG 输出**：生成的 `stats/<username>.svg` 可直接在浏览器中打开
- **元数据输出**：额外生成 `stats/<username>.json`，包含 `totalSolved` 等信息
- **CI 友好**：工作流仅在解题总数增加时才提交代码，避免因排名波动触发提交

## 安装

```bash
npm install
```

## 使用

1) 设置用户名（可选，默认 `matthewhan`）

```bash
export LEETCODE_USERNAME="your_username"
```

2) 生成卡片

```bash
# 默认主题（light）
npm run generate

# 指定主题（保留参数，当前样式以固定色为主）
npm run generate:light
npm run generate:dark
npm run generate:nord

# 或者直接用环境变量
THEME=dark npm run generate
```

生成文件位于：

- `stats/<username>.svg`
- `stats/<username>.json`

3) 在其他 README 中引用（示例）：

```md
![LeetCode Stats](https://raw.githubusercontent.com/Matthew-Han/leetcode-stats-card/main/stats/matthewhan.svg)
```

## GitHub Actions（自动更新）

工作流：`.github/workflows/generate-leetcode-card.yml`

- 定时与手动触发
- 运行脚本生成 `stats/<username>.svg` 与 `stats/<username>.json`
- 比较上一次提交的 `stats/<username>.json` 中 `totalSolved`
- 仅当 `totalSolved` 增加时才 `git add stats && commit && push`
- 需要在仓库 Secrets 配置 `PAT`

## 配置项

- `LEETCODE_USERNAME`：LeetCode 用户名（默认 `matthewhan`）
- `THEME`：`light`|`dark`|`nord`（保留参数；当前样式主色通过内联样式定义，若需自定义可直接编辑 `scripts/generate_svg.js` 中的 `<style>` 部分）

## 常见问题

- **为什么看不到动画？**
  - 某些平台的 SVG 渲染可能不播放 SMIL 动画。建议在浏览器直接打开生成的 SVG 或使用 raw 链接查看。

## 技术栈

- Node.js（建议 20）
- `leetcode-query`（拉取统计数据）
- SVG + SMIL 动画

## 许可证

MIT License
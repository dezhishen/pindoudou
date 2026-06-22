# 🧩 拼豆图案生成器

纯前端图片转拼豆图案工具。

## 技术栈

- Vue 3 + TypeScript
- Vite 5
- Tailwind CSS 3
- pnpm

## 快速开始

```bash
pnpm install
pnpm run dev
```

## 构建

```bash
pnpm run build   # 输出到 dist/
```

## 功能

- 上传图片，自动裁剪
- Canvas 实时解析像素
- 拼豆颜色智能匹配（36 种标准色）
- 精度可调（粗糙 ↔ 精细）
- 单元格选中 + 批量改色
- 导出 PNG

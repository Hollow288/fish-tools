# Fish Tools

一个使用 Next.js App Router 构建的轻量工具站，把日常会用到的小工具集中在一处，纯前端运行，数据不离开浏览器。

仓库地址：<https://github.com/Hollow288/fish-tools>

## 技术栈

- Next.js 16（App Router）
- React 19 + TypeScript
- 纯 CSS（`src/app/globals.css`），无 UI 框架依赖

## 启动

```bash
npm install
npm run dev
```

默认在 <http://localhost:3000> 启动。

## 生产构建

```bash
npm run build
npm run start
```

## 类型检查

```bash
npm run typecheck
```

## 当前工具

| 工具 | 说明 |
| --- | --- |
| 2FA 动态码 | 解析 `otpauth://totp` / `otpauth://hotp` 链接，或直接输入 Base32 密钥；TOTP 实时刷新并带倒计时 |
| 文本压一行 | 把多行文本压缩成单行，自动折叠多余空白 |
| 凯撒密码破解 | 暴力枚举 25 种位移，一次性列出全部候选明文 |
| Base64 / 图片互转 | Base64 字符串转图片预览并下载，或将本地图片转为 Base64 |
| 编码 / 解码 | URL 百分号编码解码、Unicode 转义互转 |
| 颜色转换 | HEX / RGB / HSL 互转，附颜色预览与拾色器 |
| 子邮箱批量生成 | 基于「+ 地址」别名技巧，按顺序或随机生成任意数量的子邮箱 |
| JS 在线运行 | 在沙箱 iframe 中执行 JavaScript 片段，支持 `await` 与 `fetch`，5 秒超时强制终止 |

工具列表定义在 `src/lib/tool-registry.ts`，新增工具时在此登记并在 `src/components/ToolWorkspace.tsx` 的 `renderTool` 中接入。

## 目录结构

```
src/
├── app/              # App Router 入口与全局样式
├── components/       # 通用组件（工具壳、主题切换等）
├── tools/            # 各工具实现，一文件一工具
└── lib/              # 工具注册表与共享逻辑
```

## 使用提示

- 顶部搜索框可按名称、关键词或工具 ID 过滤左侧工具列表
- 侧边栏底部可切换浅色 / 深色主题，主题选择保存在 `localStorage`
- 所有计算（含 2FA 动态码）均在浏览器本地完成，不会上传到任何服务器

## 已知限制

- 2FA 工具暂不支持 `otpauth-migration://` 批量迁移格式
- 子邮箱生成依赖邮箱服务商对「+ 别名」的支持，部分服务商可能不识别
- JS 在线运行 工具运行在 null-origin 沙箱中，无法携带登录 cookie，仅能请求开启 CORS 的接口

## License

MIT

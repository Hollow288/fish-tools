# Fish Tools - 工具网站前端

一个使用 React + Vite 的工具站前端。

## 启动

```bash
npm install
npm run dev
```

## 页面结构

- 首页：展示工具列表
- 工具页：点击进入具体工具

## 当前工具

- 2FA 动态码
  - 支持 `otpauth://totp` 与 `otpauth://hotp`
  - 支持直接输入纯 Base32 密钥（默认按 TOTP: SHA1 / 6 位 / 30 秒）
  - 实时生成动态码（TOTP 每秒倒计时，自动刷新）
  - 支持显示/隐藏 Secret、复制验证码

## 说明

- 当前不支持 `otpauth-migration://` 批量迁移格式。
- 动态码在浏览器本地计算，不上传到服务器。
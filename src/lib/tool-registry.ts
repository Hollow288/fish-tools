export interface ToolDefinition {
  id: "twofa" | "one-line" | "caesar" | "base64-image" | "encode" | "color" | "sub-email";
  name: string;
  summary: string;
  keywords: string[];
}

export const TOOLS: ToolDefinition[] = [
  {
    id: "twofa",
    name: "2FA 动态码",
    summary: "输入 otpauth 链接或密钥，生成实时验证码",
    keywords: ["otp", "totp", "hotp", "2fa", "验证码", "动态码"],
  },
  {
    id: "one-line",
    name: "文本压一行",
    summary: "将多行文本压缩成单行，自动折叠多余空白",
    keywords: ["text", "line", "oneline", "换行", "压缩", "空白", "文本"],
  },
  {
    id: "caesar",
    name: "凯撒密码破解",
    summary: "暴力枚举全部 25 种位移，快速还原凯撒密文",
    keywords: ["caesar", "凯撒", "密码", "位移", "rot", "brute", "破解", "加密"],
  },
  {
    id: "base64-image",
    name: "Base64 / 图片互转",
    summary: "将 Base64 字符串转为图片预览并下载，或将图片转为 Base64",
    keywords: ["base64", "image", "图片", "转换", "编码", "解码", "png", "jpg", "jpeg", "gif", "webp"],
  },
  {
    id: "encode",
    name: "编码 / 解码",
    summary: "URL 编码解码、Unicode 转义互转",
    keywords: ["url", "encode", "decode", "unicode", "编码", "解码", "转义", "encodeURIComponent", "percent"],
  },
  {
    id: "color",
    name: "颜色转换",
    summary: "HEX / RGB / HSL 互转，附带颜色预览与拾色器",
    keywords: ["color", "hex", "rgb", "hsl", "颜色", "转换", "拾色器", "色值"],
  },
  {
    id: "sub-email",
    name: "子邮箱批量生成",
    summary: "基于 + 地址技巧，按顺序或随机生成任意数量子邮箱",
    keywords: ["email", "邮箱", "子邮箱", "plus", "alias", "别名", "批量", "生成"],
  },
];

export type ToolId = ToolDefinition["id"];

export const ALL_TOOL_IDS: ToolId[] = TOOLS.map((tool) => tool.id);
export const DEFAULT_TOOL_ID: ToolId = TOOLS[0]?.id ?? "twofa";

export function getToolById(id: string): ToolDefinition | null {
  return TOOLS.find((tool) => tool.id === id) ?? null;
}

export function matchesToolQuery(query: string, tool: ToolDefinition): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [tool.name, tool.summary, tool.id, ...tool.keywords]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

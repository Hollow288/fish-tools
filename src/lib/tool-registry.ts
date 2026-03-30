export interface ToolDefinition {
  id: "twofa" | "one-line" | "caesar";
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

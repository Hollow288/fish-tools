const BASE32_PATTERN = /^[A-Z2-7]+=*$/;
const SUPPORTED_ALGORITHMS = new Set(["SHA1", "SHA256", "SHA512"]);

export type OtpAlgorithm = "SHA1" | "SHA256" | "SHA512";

interface CommonParsedData {
  raw: string;
  source: "otpauth" | "secret";
  inferred: boolean;
  label: string;
  issuer: string;
  accountName: string;
  secret: string;
  algorithm: OtpAlgorithm;
  digits: number;
}

export interface TotpParsedData extends CommonParsedData {
  type: "totp";
  period: number;
  counter: null;
}

export interface HotpParsedData extends CommonParsedData {
  type: "hotp";
  period: null;
  counter: number;
}

export type Parsed2FaData = TotpParsedData | HotpParsedData;

export type Parse2FaResult =
  | {
      ok: true;
      data: Parsed2FaData;
    }
  | {
      ok: false;
      error: string;
    };

type NormalizedSecretResult =
  | {
      valid: true;
      value: string;
    }
  | {
      valid: false;
      value: string;
      reason: string;
    };

function normalizeSecret(secret: string | null | undefined): NormalizedSecretResult {
  const clean = (secret || "").replace(/\s+/g, "").toUpperCase();

  if (!clean) {
    return { valid: false, value: "", reason: "缺少密钥" };
  }

  if (!BASE32_PATTERN.test(clean)) {
    return { valid: false, value: clean, reason: "密钥不是标准 Base32 字符" };
  }

  return { valid: true, value: clean };
}

function buildSecretModeResult(raw: string, normalizedSecret: string): Parse2FaResult {
  return {
    ok: true,
    data: {
      raw,
      source: "secret",
      inferred: true,
      type: "totp",
      label: "手动输入密钥",
      issuer: "未提供",
      accountName: "未提供",
      secret: normalizedSecret,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      counter: null,
    },
  };
}

export function parseOtpAuthUri(input: string): Parse2FaResult {
  const raw = (input || "").trim();

  if (!raw) {
    return { ok: false, error: "请输入 otpauth 链接" };
  }

  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "链接格式无效，请确认是完整的 otpauth:// 链接" };
  }

  if (url.protocol !== "otpauth:") {
    return { ok: false, error: "协议错误：必须以 otpauth:// 开头" };
  }

  const type = (url.hostname || "").toLowerCase();
  if (type !== "totp" && type !== "hotp") {
    return { ok: false, error: "仅支持 otpauth://totp 或 otpauth://hotp" };
  }

  const pathLabel = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  const [issuerFromLabelRaw, accountRaw] = pathLabel.includes(":")
    ? pathLabel.split(/:(.+)/)
    : ["", pathLabel];

  const issuerFromLabel = (issuerFromLabelRaw || "").trim();
  const accountName = (accountRaw || "").trim();

  const secretResult = normalizeSecret(url.searchParams.get("secret"));
  if (!secretResult.valid) {
    return { ok: false, error: `密钥无效：${secretResult.reason}` };
  }

  const issuerParam = (url.searchParams.get("issuer") || "").trim();
  const issuer = issuerParam || issuerFromLabel || "未提供";

  const algorithmRaw = (url.searchParams.get("algorithm") || "SHA1").toUpperCase();
  if (!SUPPORTED_ALGORITHMS.has(algorithmRaw)) {
    return { ok: false, error: "algorithm 仅支持 SHA1 / SHA256 / SHA512" };
  }

  const algorithm = algorithmRaw as OtpAlgorithm;
  const digits = Number(url.searchParams.get("digits") || 6);
  const period = Number(url.searchParams.get("period") || 30);
  const counter = Number(url.searchParams.get("counter") || 0);

  if (![6, 7, 8].includes(digits)) {
    return { ok: false, error: "digits 仅支持 6 / 7 / 8" };
  }

  if (type === "totp" && (!Number.isInteger(period) || period <= 0)) {
    return { ok: false, error: "period 必须是正整数" };
  }

  if (type === "hotp" && (!Number.isInteger(counter) || counter < 0)) {
    return { ok: false, error: "hotp 模式下 counter 必须是 >= 0 的整数" };
  }

  if (type === "totp") {
    return {
      ok: true,
      data: {
        raw,
        source: "otpauth",
        inferred: false,
        type: "totp",
        label: pathLabel || "未提供",
        issuer,
        accountName: accountName || "未提供",
        secret: secretResult.value,
        algorithm,
        digits,
        period,
        counter: null,
      },
    };
  }

  return {
    ok: true,
    data: {
      raw,
      source: "otpauth",
      inferred: false,
      type: "hotp",
      label: pathLabel || "未提供",
      issuer,
      accountName: accountName || "未提供",
      secret: secretResult.value,
      algorithm,
      digits,
      period: null,
      counter,
    },
  };
}

export function parse2faInput(input: string): Parse2FaResult {
  const raw = (input || "").trim();

  if (!raw) {
    return { ok: false, error: "请输入 otpauth 链接或 2FA 密钥" };
  }

  if (raw.startsWith("otpauth-migration://")) {
    return {
      ok: false,
      error: "检测到 otpauth-migration 链接。该功能暂不支持批量迁移格式。",
    };
  }

  const otpauthMatch = raw.match(/otpauth:\/\/[^\s]+/i);
  if (otpauthMatch) {
    return parseOtpAuthUri(otpauthMatch[0]);
  }

  const secretParamMatch = raw.match(/(?:^|[?&\s])secret=([^&\s]+)/i);
  if (secretParamMatch) {
    let secretDecoded = "";

    try {
      secretDecoded = decodeURIComponent(secretParamMatch[1]);
    } catch {
      return { ok: false, error: "secret 参数不是合法编码" };
    }

    const secret = normalizeSecret(secretDecoded);
    if (!secret.valid) {
      return { ok: false, error: `密钥无效：${secret.reason}` };
    }

    return buildSecretModeResult(raw, secret.value);
  }

  const secret = normalizeSecret(raw);
  if (!secret.valid) {
    return { ok: false, error: "输入不是 otpauth 链接，且密钥格式也不正确" };
  }

  return buildSecretModeResult(raw, secret.value);
}

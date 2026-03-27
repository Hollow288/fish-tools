const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";

export interface GenerateHotpCodeOptions {
  secret: string;
  algorithm?: string;
  digits?: number;
  counter: number;
}

export interface GenerateTotpCodeOptions {
  secret: string;
  algorithm?: string;
  digits?: number;
  period?: number;
  timestamp?: number;
}

function decodeBase32(secret: string): Uint8Array {
  const clean = (secret || "").replace(/\s+/g, "").toUpperCase().replace(/=+$/g, "");
  if (!clean) throw new Error("密钥为空");

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`密钥包含非法字符: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

function normalizeAlgorithm(algorithm: string = "SHA1"): HashAlgorithm {
  const upper = algorithm.toUpperCase().replace(/-/g, "");
  if (upper === "SHA1") return "SHA-1";
  if (upper === "SHA256") return "SHA-256";
  if (upper === "SHA512") return "SHA-512";
  throw new Error(`不支持的算法: ${algorithm}`);
}

function buildCounterBytes(counter: number): Uint8Array {
  if (!Number.isInteger(counter) || counter < 0) {
    throw new Error("counter 必须是非负整数");
  }

  const bytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i -= 1) {
    bytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function truncate(hmacResult: ArrayBuffer): number {
  const view = new Uint8Array(hmacResult);
  const offset = view[view.length - 1] & 0x0f;

  return (
    ((view[offset] & 0x7f) << 24) |
    ((view[offset + 1] & 0xff) << 16) |
    ((view[offset + 2] & 0xff) << 8) |
    (view[offset + 3] & 0xff)
  );
}

export async function generateHotpCode({
  secret,
  algorithm = "SHA1",
  digits = 6,
  counter,
}: GenerateHotpCodeOptions): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("当前环境不支持 Web Crypto，无法计算动态码");
  }

  if (!Number.isInteger(digits) || digits <= 0) {
    throw new Error("digits 必须是正整数");
  }

  const keyData = decodeBase32(secret);
  const hash = normalizeAlgorithm(algorithm);

  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(keyData),
    { name: "HMAC", hash: { name: hash } },
    false,
    ["sign"]
  );

  const counterBytes = buildCounterBytes(counter);
  const hmac = await crypto.subtle.sign("HMAC", key, toArrayBuffer(counterBytes));

  const binaryCode = truncate(hmac);
  const mod = 10 ** digits;

  return String(binaryCode % mod).padStart(digits, "0");
}

export async function generateTotpCode({
  secret,
  algorithm = "SHA1",
  digits = 6,
  period = 30,
  timestamp = Math.floor(Date.now() / 1000),
}: GenerateTotpCodeOptions): Promise<string> {
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("period 必须是正整数");
  }

  const counter = Math.floor(timestamp / period);
  return generateHotpCode({ secret, algorithm, digits, counter });
}

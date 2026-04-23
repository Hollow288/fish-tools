"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

type GenMode = "sequence" | "random";

const MAX_COUNT = 1000;
const RANDOM_CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";

function parseEmail(value: string): { local: string; domain: string } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!/^[A-Za-z0-9._%+\-]+$/.test(local)) return null;
  if (!/^[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(domain)) return null;
  return { local, domain };
}

function toSequenceLabel(index: number): string {
  let result = "";
  let num = index;
  while (num >= 0) {
    result = String.fromCharCode(97 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  }
  return result;
}

function randomLabel(length: number): string {
  const buffer = new Uint32Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buffer);
  } else {
    for (let i = 0; i < length; i += 1) {
      buffer[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += RANDOM_CHARSET[buffer[i] % RANDOM_CHARSET.length];
  }
  return result;
}

export default function SubEmailTool(): ReactElement {
  const [email, setEmail] = useState<string>("aaa@gmail.com");
  const [count, setCount] = useState<number>(10);
  const [mode, setMode] = useState<GenMode>("sequence");
  const [randomLength, setRandomLength] = useState<number>(6);
  const [seed, setSeed] = useState<number>(0);
  const [copyAllLabel, setCopyAllLabel] = useState<string>("复制全部");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const parsed = useMemo(() => parseEmail(email), [email]);
  const safeCount = Math.max(0, Math.min(MAX_COUNT, Math.floor(count || 0)));
  const safeRandomLength = Math.max(2, Math.min(16, Math.floor(randomLength || 0)));

  const generated = useMemo<string[]>(() => {
    if (!parsed || safeCount <= 0) return [];
    const { local, domain } = parsed;
    const list: string[] = [];
    const usedRandom = new Set<string>();
    for (let i = 0; i < safeCount; i += 1) {
      if (mode === "sequence") {
        list.push(`${local}+${toSequenceLabel(i)}@${domain}`);
      } else {
        let label = randomLabel(safeRandomLength);
        let attempt = 0;
        while (usedRandom.has(label) && attempt < 10) {
          label = randomLabel(safeRandomLength);
          attempt += 1;
        }
        usedRandom.add(label);
        list.push(`${local}+${label}@${domain}`);
      }
    }
    return list;
    // seed 仅用于强制随机模式重新生成
  }, [parsed, safeCount, mode, safeRandomLength, seed]);

  const handleCopyAll = async () => {
    if (generated.length === 0) return;
    try {
      await navigator.clipboard.writeText(generated.join("\n"));
      setCopyAllLabel("已复制");
      window.setTimeout(() => setCopyAllLabel("复制全部"), 1200);
    } catch {
      setCopyAllLabel("复制失败");
      window.setTimeout(() => setCopyAllLabel("复制全部"), 1200);
    }
  };

  const handleCopyOne = async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1000);
    } catch {
      setCopiedIndex(null);
    }
  };

  const errorTip = email.trim() && !parsed ? "邮箱格式不正确，示例：aaa@gmail.com" : null;

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h3>生成参数</h3>
          <div className="actions">
            {mode === "random" && (
              <button
                className="ghost-btn"
                type="button"
                onClick={() => setSeed((n) => n + 1)}
                disabled={!parsed || safeCount <= 0}
              >
                重新随机
              </button>
            )}
            <button
              className="ghost-btn"
              type="button"
              onClick={() => {
                setEmail("aaa@gmail.com");
                setCount(10);
                setMode("sequence");
                setRandomLength(6);
              }}
            >
              重置
            </button>
          </div>
        </div>

        <div className="sub-email-form">
          <label className="sub-email-field">
            <span className="field-label">邮箱</span>
            <input
              className="search-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="aaa@gmail.com"
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <label className="sub-email-field">
            <span className="field-label">数量（1 ~ {MAX_COUNT}）</span>
            <input
              className="search-input"
              type="number"
              min={1}
              max={MAX_COUNT}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </label>
          <div className="sub-email-field">
            <span className="field-label">生成方式</span>
            <div className="sub-email-modes" role="radiogroup" aria-label="生成方式">
              <button
                type="button"
                role="radio"
                aria-checked={mode === "sequence"}
                className={`mode-pill ${mode === "sequence" ? "is-active" : ""}`}
                onClick={() => setMode("sequence")}
              >
                顺序（a、b、c…）
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={mode === "random"}
                className={`mode-pill ${mode === "random" ? "is-active" : ""}`}
                onClick={() => setMode("random")}
              >
                随机（xxxx）
              </button>
            </div>
          </div>
          {mode === "random" && (
            <label className="sub-email-field">
              <span className="field-label">随机长度（2 ~ 16）</span>
              <input
                className="search-input"
                type="number"
                min={2}
                max={16}
                value={randomLength}
                onChange={(event) => setRandomLength(Number(event.target.value))}
              />
            </label>
          )}
        </div>

        {errorTip && <p className="error-box" style={{ marginTop: "0.65rem" }}>{errorTip}</p>}
      </section>

      {generated.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h3>生成结果</h3>
            <div className="actions">
              <span className="content-route">共 {generated.length} 个</span>
              <button className="ghost-btn" type="button" onClick={handleCopyAll}>
                {copyAllLabel}
              </button>
            </div>
          </div>
          <div className="sub-email-list">
            {generated.map((value, index) => (
              <button
                key={`${value}-${index}`}
                type="button"
                className={`sub-email-item ${copiedIndex === index ? "is-copied" : ""}`}
                title="点击复制"
                onClick={() => handleCopyOne(value, index)}
              >
                <span className="sub-email-index">{index + 1}</span>
                <span className="sub-email-value mono">{value}</span>
                {copiedIndex === index && <span className="sub-email-copied">已复制</span>}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

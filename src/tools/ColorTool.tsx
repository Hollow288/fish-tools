"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";

/* ── 类型 ── */
interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

/* ── 转换函数 ── */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): RGB | null {
  const m = hex.replace(/^#/, "").match(/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (!m) {
    const s = hex.replace(/^#/, "").match(/^([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
    if (!s) return null;
    return { r: parseInt(s[1] + s[1], 16), g: parseInt(s[2] + s[2], 16), b: parseInt(s[3] + s[3], 16) };
  }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
  else if (max === gg) h = ((bb - rr) / d + 2) / 6;
  else h = ((rr - gg) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const ss = s / 100, ll = l / 100;
  if (ss === 0) {
    const v = Math.round(ll * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const hh = h / 360;
  return {
    r: Math.round(hue2rgb(p, q, hh + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hh) * 255),
    b: Math.round(hue2rgb(p, q, hh - 1 / 3) * 255),
  };
}

/* ── 解析任意输入 ── */
function parseColorInput(raw: string): RGB | null {
  const s = raw.trim();
  // HEX
  if (/^#?[0-9a-fA-F]{3,6}$/.test(s)) return hexToRgb(s);
  // rgb(r, g, b)
  const rgbMatch = s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgbMatch) return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] };
  // hsl(h, s%, l%)
  const hslMatch = s.match(/^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?/);
  if (hslMatch) return hslToRgb({ h: +hslMatch[1], s: +hslMatch[2], l: +hslMatch[3] });
  return null;
}

function formatRgb({ r, g, b }: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}
function formatHsl({ h, s, l }: HSL): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/* ── 组件 ── */
export default function ColorTool(): ReactElement {
  const [input, setInput] = useState<string>("#3182ce");
  const [rgb, setRgb] = useState<RGB>({ r: 49, g: 130, b: 206 });
  const [copyLabel, setCopyLabel] = useState<Record<string, string>>({});

  const sync = useCallback((raw: string) => {
    setInput(raw);
    const parsed = parseColorInput(raw);
    if (parsed) setRgb(parsed);
  }, []);

  useEffect(() => {
    const parsed = parseColorInput(input);
    if (parsed) setRgb(parsed);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const rgbStr = formatRgb(rgb);
  const hslStr = formatHsl(hsl);

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyLabel((p) => ({ ...p, [key]: "已复制" }));
      window.setTimeout(() => setCopyLabel((p) => ({ ...p, [key]: "" })), 1200);
    } catch {
      setCopyLabel((p) => ({ ...p, [key]: "失败" }));
      window.setTimeout(() => setCopyLabel((p) => ({ ...p, [key]: "" })), 1200);
    }
  };

  const parsed = parseColorInput(input);
  const isValid = parsed !== null;

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h3>输入颜色</h3>
          <div className="actions">
            <button className="ghost-btn" type="button" onClick={() => sync("#3182ce")}>示例</button>
            <button className="ghost-btn" type="button" onClick={() => sync("")}>清空</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => sync(e.target.value)}
            spellCheck={false}
            placeholder="输入 HEX / RGB / HSL，如 #ff6600、rgb(255,102,0)、hsl(24,100%,50%)"
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--c-border, #cbd5e0)",
              background: "var(--c-bg-input, transparent)",
              color: "inherit",
              fontSize: "0.95rem",
              fontFamily: "var(--font-mono, monospace)",
            }}
          />
          <input
            type="color"
            value={isValid ? hex : "#000000"}
            onChange={(e) => sync(e.target.value)}
            style={{ width: "48px", height: "40px", border: "none", cursor: "pointer", borderRadius: "6px" }}
            title="拾色器"
          />
        </div>
        {input && !isValid && <p style={{ color: "var(--c-danger, #e53e3e)", fontSize: "0.85em", marginTop: "6px" }}>无法识别的颜色格式</p>}
      </section>

      {isValid && (
        <section className="panel">
          <div className="panel-head">
            <h3>转换结果</h3>
          </div>

          {/* 预览色块 */}
          <div style={{
            height: "80px",
            borderRadius: "8px",
            background: hex,
            marginBottom: "16px",
            border: "1px solid var(--c-border, #cbd5e0)",
          }} />

          {/* 各格式 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {([
              ["HEX", hex],
              ["RGB", rgbStr],
              ["HSL", hslStr],
            ] as const).map(([label, value]) => (
              <div key={label} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "8px 12px",
                borderRadius: "6px",
                background: "var(--c-bg-subtle, rgba(0,0,0,0.03))",
              }}>
                <span style={{ fontWeight: 600, minWidth: "40px" }}>{label}</span>
                <code style={{ flex: 1, fontFamily: "var(--font-mono, monospace)", fontSize: "0.95rem" }}>{value}</code>
                <button className="ghost-btn" type="button" onClick={() => handleCopy(label, value)}>
                  {copyLabel[label] || "复制"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

type SubMode = "url" | "unicode";
type Direction = "encode" | "decode";

/* ── URL ── */
function urlEncode(s: string): string {
  return encodeURIComponent(s);
}
function urlDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return "解码失败：输入不是合法的 URL 编码字符串";
  }
}

/* ── Unicode ── */
function unicodeEncode(s: string): string {
  return Array.from(s)
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      if (code > 0xffff) {
        return `\\u{${code.toString(16)}}`;
      }
      if (code > 0x7e || code < 0x20) {
        return `\\u${code.toString(16).padStart(4, "0")}`;
      }
      return ch;
    })
    .join("");
}
function unicodeDecode(s: string): string {
  try {
    return s.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, p1, p2) => {
      return String.fromCodePoint(parseInt(p1 ?? p2, 16));
    });
  } catch {
    return "解码失败：输入不是合法的 Unicode 转义字符串";
  }
}

const SAMPLES: Record<SubMode, Record<Direction, string>> = {
  url: {
    encode: "https://example.com/搜索?q=你好 世界&lang=zh",
    decode: "https%3A%2F%2Fexample.com%2F%E6%90%9C%E7%B4%A2%3Fq%3D%E4%BD%A0%E5%A5%BD%20%E4%B8%96%E7%95%8C%26lang%3Dzh",
  },
  unicode: {
    encode: "你好世界 Hello!",
    decode: "\\u4f60\\u597d\\u4e16\\u754c Hello!",
  },
};

export default function EncodeTool(): ReactElement {
  const [subMode, setSubMode] = useState<SubMode>("url");
  const [direction, setDirection] = useState<Direction>("encode");
  const [input, setInput] = useState<string>(SAMPLES.url.encode);
  const [copyLabel, setCopyLabel] = useState<string>("复制结果");

  const output = useMemo(() => {
    if (!input) return "";
    if (subMode === "url") {
      return direction === "encode" ? urlEncode(input) : urlDecode(input);
    }
    return direction === "encode" ? unicodeEncode(input) : unicodeDecode(input);
  }, [input, subMode, direction]);

  const handleSubModeChange = (m: SubMode) => {
    setSubMode(m);
    setInput(SAMPLES[m][direction]);
  };

  const handleDirectionChange = (d: Direction) => {
    setDirection(d);
    setInput(SAMPLES[subMode][d]);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyLabel("已复制");
      window.setTimeout(() => setCopyLabel("复制结果"), 1200);
    } catch {
      setCopyLabel("复制失败");
      window.setTimeout(() => setCopyLabel("复制结果"), 1200);
    }
  };

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h3>编码类型</h3>
        </div>
        <div style={{ display: "flex", gap: "8px", padding: "4px 0", flexWrap: "wrap" }}>
          <button type="button" className={`ghost-btn ${subMode === "url" ? "is-active" : ""}`} onClick={() => handleSubModeChange("url")}>
            URL
          </button>
          <button type="button" className={`ghost-btn ${subMode === "unicode" ? "is-active" : ""}`} onClick={() => handleSubModeChange("unicode")}>
            Unicode
          </button>
          <span style={{ width: "1px", background: "var(--c-border, #cbd5e0)", margin: "0 4px" }} />
          <button type="button" className={`ghost-btn ${direction === "encode" ? "is-active" : ""}`} onClick={() => handleDirectionChange("encode")}>
            编码
          </button>
          <button type="button" className={`ghost-btn ${direction === "decode" ? "is-active" : ""}`} onClick={() => handleDirectionChange("decode")}>
            解码
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>输入</h3>
          <div className="actions">
            <button className="ghost-btn" type="button" onClick={() => setInput(SAMPLES[subMode][direction])}>
              示例
            </button>
            <button className="ghost-btn" type="button" onClick={() => setInput("")}>
              清空
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder={direction === "encode" ? "输入要编码的文本" : "输入要解码的文本"}
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>结果</h3>
          <button className="ghost-btn" type="button" onClick={handleCopy} disabled={!output}>
            {copyLabel}
          </button>
        </div>
        <textarea value={output} readOnly spellCheck={false} placeholder="(空)" style={{ minHeight: "80px" }} />
      </section>
    </>
  );
}

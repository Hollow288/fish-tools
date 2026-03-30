"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { ReactElement } from "react";

const SAMPLE_TEXT = "Khoor Zruog! Wklv lv d vhfuhw phvvdjh.";

function caesarShift(text: string, shift: number): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char >= "a" ? 97 : 65;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
  });
}

async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export default function CaesarTool(): ReactElement {
  const [input, setInput] = useState<string>(SAMPLE_TEXT);
  const [copiedShift, setCopiedShift] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("");
  const deferredFilter = useDeferredValue(filter);

  const results = useMemo<{ shift: number; text: string }[]>(() => {
    if (!input.trim()) return [];
    return Array.from({ length: 25 }, (_, i) => ({
      shift: i + 1,
      text: caesarShift(input, i + 1),
    }));
  }, [input]);

  const filteredResults = useMemo(() => {
    const keyword = deferredFilter.trim().toLowerCase();
    if (!keyword) return results;
    return results.filter(({ text }) => text.toLowerCase().includes(keyword));
  }, [results, deferredFilter]);

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h3>输入密文</h3>
          <div className="actions">
            <button className="ghost-btn" type="button" onClick={() => setInput(SAMPLE_TEXT)}>
              示例
            </button>
            <button className="ghost-btn" type="button" onClick={() => setInput("")}>
              清空
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="在此粘贴凯撒密文，将自动枚举全部 25 种位移"
        />
      </section>

      {results.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h3>全部位移结果</h3>
            <span className="content-route">
              {filteredResults.length} / 25 种
            </span>
          </div>
          <div className="search-wrap">
            <input
              className="search-input"
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="过滤结果，如：hello"
              aria-label="过滤位移结果"
            />
          </div>
          {filteredResults.length > 0 ? (
            <div className="caesar-grid">
              {filteredResults.map(({ shift, text }) => (
                <button
                  key={shift}
                  type="button"
                  className={`caesar-card ${copiedShift === shift ? "is-copied" : ""}`}
                  title="点击复制"
                  onClick={() => {
                    copyText(text).then(() => {
                      setCopiedShift(shift);
                      window.setTimeout(() => setCopiedShift(null), 1200);
                    });
                  }}
                >
                  <p className="caesar-shift">
                    +{shift}
                    {copiedShift === shift && <span className="caesar-copied-label">已复制</span>}
                  </p>
                  <p className="caesar-text mono">{text}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-tip">没有匹配的结果，换个关键词试试。</p>
          )}
        </section>
      )}
    </>
  );
}

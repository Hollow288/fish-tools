"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

const SAMPLE_TEXT = `第一行示例文本。
第二行包含\t制表符和   多余空格。
第三行用于测试换行压缩。`;

function toOneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export default function OneLineTool(): ReactElement {
  const [input, setInput] = useState<string>(SAMPLE_TEXT);
  const [copyLabel, setCopyLabel] = useState<string>("复制结果");

  const output = useMemo(() => toOneLine(input), [input]);

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
          <h3>输入文本</h3>
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
          placeholder="粘贴任意多行文本，结果会压缩成一行"
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>压缩结果</h3>
          <button className="ghost-btn" type="button" onClick={handleCopy} disabled={!output}>
            {copyLabel}
          </button>
        </div>

        <div className="one-line-output mono" title={output || ""}>
          {output || "(空)"}
        </div>
      </section>
    </>
  );
}

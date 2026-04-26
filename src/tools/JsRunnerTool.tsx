"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { Compartment } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

type LogLevel = "log" | "info" | "warn" | "error";

interface LogEntry {
  id: number;
  level: LogLevel;
  text: string;
}

type TokenKind = "string" | "number" | "keyword" | "key" | "punct" | "plain";

interface Token {
  kind: TokenKind;
  text: string;
}

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  const n = text.length;
  let i = 0;

  while (i < n) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : "\n";

    if (ch === '"') {
      let j = i + 1;
      let closed = false;
      while (j < n) {
        if (text[j] === "\\" && j + 1 < n) {
          j += 2;
          continue;
        }
        if (text[j] === '"') {
          j += 1;
          closed = true;
          break;
        }
        if (text[j] === "\n") break;
        j += 1;
      }
      if (closed) {
        let k = j;
        while (k < n && (text[k] === " " || text[k] === "\t")) k += 1;
        const isKey = text[k] === ":";
        out.push({ kind: isKey ? "key" : "string", text: text.slice(i, j) });
        i = j;
        continue;
      }
    }

    if ((ch === "-" || (ch >= "0" && ch <= "9")) && /[\s,[{:]/.test(prev)) {
      const m = /^-?(?:\d+(?:\.\d+)?)(?:[eE][+-]?\d+)?/.exec(text.slice(i));
      if (m) {
        const next = text[i + m[0].length] ?? "\n";
        if (next === "" || /[\s,\]}]/.test(next)) {
          out.push({ kind: "number", text: m[0] });
          i += m[0].length;
          continue;
        }
      }
    }

    let matchedKeyword = false;
    for (const kw of ["true", "false", "null", "undefined"]) {
      if (text.startsWith(kw, i)) {
        const after = text[i + kw.length] ?? "\n";
        if (/[\s,[{:]/.test(prev) && (after === "" || /[\s,\]}]/.test(after))) {
          out.push({ kind: "keyword", text: kw });
          i += kw.length;
          matchedKeyword = true;
          break;
        }
      }
    }
    if (matchedKeyword) continue;

    if ("{}[]:,".includes(ch)) {
      out.push({ kind: "punct", text: ch });
      i += 1;
      continue;
    }

    out.push({ kind: "plain", text: ch });
    i += 1;
  }

  const merged: Token[] = [];
  for (const t of out) {
    const last = merged[merged.length - 1];
    if (last && last.kind === "plain" && t.kind === "plain") {
      last.text += t.text;
    } else {
      merged.push({ ...t });
    }
  }
  return merged;
}

const TIMEOUT_MS = 5000;

const DEFAULT_CODE = `// 在沙箱里运行，可用 await
// 不会携带登录 cookie，不能访问主页面 DOM 与存储

const res = await fetch("https://jsonplaceholder.typicode.com/todos/1");
const data = await res.json();
console.log(data);
`;


function buildSrcDoc(code: string, runId: string): string {
  const userCodeLiteral = JSON.stringify(code).replace(/<\/script/gi, "<\\/script");
  const runIdLiteral = JSON.stringify(runId);
  return `<!doctype html>
<html><head><meta charset="utf-8"></head><body><script>
(function(){
  var RUN_ID = ${runIdLiteral};
  var USER_CODE = ${userCodeLiteral};
  function fmt(a){
    if (a instanceof Error) return a.stack || (a.name + ': ' + a.message);
    if (typeof a === 'string') return a;
    if (typeof a === 'undefined') return 'undefined';
    if (typeof a === 'function') return '[Function ' + (a.name || 'anonymous') + ']';
    try {
      return JSON.stringify(a, function(k, v){
        if (typeof v === 'bigint') return v.toString() + 'n';
        if (typeof v === 'function') return '[Function ' + (v.name || 'anonymous') + ']';
        if (typeof v === 'undefined') return '[undefined]';
        return v;
      }, 2);
    } catch (e) {
      try { return String(a); } catch (_) { return '[Unserializable]'; }
    }
  }
  function send(level, args){
    try {
      var text = Array.prototype.map.call(args, fmt).join(' ');
      parent.postMessage({ source: 'js-runner', runId: RUN_ID, kind: 'log', level: level, text: text }, '*');
    } catch (e) {}
  }
  ['log','info','warn','error'].forEach(function(name){
    var original = console[name];
    console[name] = function(){
      send(name, arguments);
      try { original.apply(console, arguments); } catch (e) {}
    };
  });
  window.addEventListener('error', function(e){
    send('error', [e.error || e.message]);
  });
  window.addEventListener('unhandledrejection', function(e){
    send('error', ['未捕获的 Promise: ', e.reason]);
  });
  (async function(){
    try {
      var AsyncFn = Object.getPrototypeOf(async function(){}).constructor;
      var fn = new AsyncFn(USER_CODE);
      await fn();
    } catch (err) {
      send('error', [err]);
    } finally {
      try { parent.postMessage({ source: 'js-runner', runId: RUN_ID, kind: 'done' }, '*'); } catch (e) {}
    }
  })();
})();
<\/script></body></html>`;
}

export default function JsRunnerTool(): ReactElement {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState<boolean>(false);
  const [srcDoc, setSrcDoc] = useState<string>("");
  const [runId, setRunId] = useState<string>("");

  const runIdRef = useRef<string>("");
  const timeoutRef = useRef<number | null>(null);
  const logIdRef = useRef<number>(0);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartmentRef = useRef<Compartment>(new Compartment());
  const handleRunRef = useRef<() => void>(() => {});

  const appendLog = (level: LogLevel, text: string) => {
    logIdRef.current += 1;
    const id = logIdRef.current;
    setLogs((prev) => [...prev, { id, level, text }]);
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | { source?: string; runId?: string; kind?: string; level?: LogLevel; text?: string }
        | null;
      if (!data || data.source !== "js-runner") return;
      if (!runIdRef.current || data.runId !== runIdRef.current) return;
      if (data.kind === "log" && data.level && typeof data.text === "string") {
        appendLog(data.level, data.text);
      } else if (data.kind === "done") {
        setRunning(false);
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!editorContainerRef.current) return;
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";

    const view = new EditorView({
      doc: DEFAULT_CODE,
      extensions: [
        basicSetup,
        javascript(),
        themeCompartmentRef.current.of(isDark ? oneDark : []),
        keymap.of([
          {
            key: "Mod-Enter",
            preventDefault: true,
            run: () => {
              handleRunRef.current();
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setCode(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": { fontSize: "0.82rem" },
          ".cm-content": {
            fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
            padding: "0.5rem 0",
          },
          ".cm-gutters": {
            fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
          },
          ".cm-scroller": {
            minHeight: "280px",
            maxHeight: "520px",
          },
        }),
      ],
      parent: editorContainerRef.current,
    });
    viewRef.current = view;

    const observer = new MutationObserver(() => {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      view.dispatch({
        effects: themeCompartmentRef.current.reconfigure(dark ? oneDark : []),
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  const replaceEditorCode = (text: string) => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text },
    });
  };

  const handleRun = () => {
    if (!code.trim() || running) return;
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    runIdRef.current = id;
    setRunId(id);
    setLogs([]);
    setRunning(true);
    setSrcDoc(buildSrcDoc(code, id));

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      runIdRef.current = "";
      setRunning(false);
      setSrcDoc("");
      appendLog("error", `执行超时（>${TIMEOUT_MS}ms），已强制终止`);
      timeoutRef.current = null;
    }, TIMEOUT_MS);
  };

  useEffect(() => {
    handleRunRef.current = handleRun;
  });

  const handleStop = () => {
    runIdRef.current = "";
    setRunning(false);
    setSrcDoc("");
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    appendLog("warn", "已手动停止");
  };

  const handleClear = () => {
    setLogs([]);
  };

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h3>代码</h3>
          <div className="actions">
            <span className="content-route content-route-center">Ctrl / ⌘ + Enter 运行</span>
            <button
              className="ghost-btn"
              type="button"
              onClick={() => replaceEditorCode(DEFAULT_CODE)}
              disabled={running}
            >
              示例
            </button>
            <button
              className="ghost-btn"
              type="button"
              onClick={() => replaceEditorCode("")}
              disabled={running}
            >
              清空
            </button>
            {running ? (
              <button className="ghost-btn" type="button" onClick={handleStop}>
                停止
              </button>
            ) : (
              <button className="ghost-btn" type="button" onClick={handleRun} disabled={!code.trim()}>
                运行
              </button>
            )}
          </div>
        </div>
        <div className="js-runner-editor" ref={editorContainerRef} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>输出</h3>
          <div className="actions">
            {running && <span className="content-route content-route-center">运行中…</span>}
            <button className="ghost-btn" type="button" onClick={handleClear} disabled={logs.length === 0}>
              清空输出
            </button>
          </div>
        </div>
        <div className="js-runner-output">
          {logs.length === 0 ? (
            <p className="js-runner-empty">点击「运行」或按 Ctrl/⌘ + Enter 执行代码</p>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className={`js-runner-line is-${entry.level}`}>
                {tokenize(entry.text).map((tok, idx) =>
                  tok.kind === "plain" ? (
                    <span key={idx}>{tok.text}</span>
                  ) : (
                    <span key={idx} className={`jr-tok jr-tok-${tok.kind}`}>
                      {tok.text}
                    </span>
                  ),
                )}
              </div>
            ))
          )}
        </div>
        <p className="js-runner-tip">
          沙箱模式：null origin、无登录态 cookie，可请求开启 CORS 的接口。死循环会被 {TIMEOUT_MS / 1000} 秒超时强制终止。
        </p>
      </section>

      {srcDoc && (
        <iframe
          key={runId}
          title="js-runner-sandbox"
          sandbox="allow-scripts"
          srcDoc={srcDoc}
          style={{ display: "none" }}
          aria-hidden="true"
        />
      )}
    </>
  );
}

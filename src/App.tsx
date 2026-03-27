import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import TwoFaTool from "./tools/TwoFaTool";
import OneLineTool from "./tools/OneLineTool";

interface ToolDefinition {
  id: string;
  name: string;
  summary: string;
  keywords: string[];
  render: () => ReactElement;
}

const TOOLS: ToolDefinition[] = [
  {
    id: "twofa",
    name: "2FA 动态码",
    summary: "输入 otpauth 链接或密钥，生成实时验证码",
    keywords: ["otp", "totp", "hotp", "2fa", "验证码", "动态码"],
    render: () => <TwoFaTool />,
  },
  {
    id: "one-line",
    name: "文本压一行",
    summary: "将多行文本压缩成单行，自动折叠多余空白",
    keywords: ["text", "line", "oneline", "换行", "压缩", "空白", "文本"],
    render: () => <OneLineTool />,
  },
];

const DEFAULT_TOOL_ID = TOOLS[0]?.id ?? "";

function parseHash(hash: string): string | null {
  const value = (hash || "").trim();
  const match = value.match(/^#\/tools\/([a-z0-9-]+)$/i);
  return match ? match[1] : null;
}

function getToolById(id: string): ToolDefinition | null {
  return TOOLS.find((tool) => tool.id === id) ?? null;
}

function matchesKeyword(query: string, tool: ToolDefinition): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [tool.name, tool.summary, tool.id, ...tool.keywords]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export default function App(): ReactElement {
  const [active, setActive] = useState<string>(() => parseHash(window.location.hash) ?? DEFAULT_TOOL_ID);
  const [query, setQuery] = useState<string>("");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const onHashChange = () => {
      const id = parseHash(window.location.hash);
      if (id && getToolById(id)) {
        setActive(id);
        return;
      }

      setActive(DEFAULT_TOOL_ID);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!getToolById(active) && DEFAULT_TOOL_ID) {
      setActive(DEFAULT_TOOL_ID);
      window.location.hash = `#/tools/${DEFAULT_TOOL_ID}`;
    }
  }, [active]);

  useEffect(() => {
    const fromHash = parseHash(window.location.hash);
    if (!fromHash && DEFAULT_TOOL_ID) {
      window.location.hash = `#/tools/${DEFAULT_TOOL_ID}`;
    }
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 920) {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  const filteredTools = useMemo(
    () => TOOLS.filter((tool) => matchesKeyword(query, tool)),
    [query]
  );

  const currentTool = useMemo(() => getToolById(active), [active]);

  const showEmptyResult = filteredTools.length === 0;

  const openTool = (id: string) => {
    setActive(id);
    window.location.hash = `#/tools/${id}`;
    setIsDrawerOpen(false);
  };

  return (
    <main className="app-shell">
      <header className="mobile-header" aria-label="移动端顶部导航">
        <div className="mobile-header-brand">
          <p className="brand-eyebrow">Fish Tools</p>
          <p className="mobile-header-title">轻量工具箱</p>
        </div>
        <button
          type="button"
          className="mobile-nav-trigger icon-btn"
          aria-expanded={isDrawerOpen}
          aria-controls="tool-menu-drawer"
          aria-label={isDrawerOpen ? "收起工具菜单" : "打开工具菜单"}
          onClick={() => setIsDrawerOpen((previous) => !previous)}
        >
          <span aria-hidden="true">&equiv;</span>
          <span className="sr-only">{isDrawerOpen ? "收起菜单" : "打开菜单"}</span>
        </button>
      </header>

      {isDrawerOpen && (
        <button
          type="button"
          className="drawer-backdrop"
          aria-label="关闭工具菜单"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      <aside
        id="tool-menu-drawer"
        className={`nav-pane ${isDrawerOpen ? "is-open" : ""}`}
        aria-label="工具菜单"
      >
        <div className="nav-head">
          <p className="brand-eyebrow">Fish Tools</p>
          <h1>工具箱</h1>
          <p className="nav-subtitle">整体收紧为更轻的白色工作区，选中后直接使用。</p>
          <button
            type="button"
            className="mobile-nav-close icon-btn"
            aria-label="收起工具菜单"
            onClick={() => setIsDrawerOpen(false)}
          >
            <span aria-hidden="true">&times;</span>
            <span className="sr-only">收起菜单</span>
          </button>
        </div>

        <div className="search-wrap">
          <input
            className="search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索工具，如：2FA / OTP"
            aria-label="搜索工具"
          />
        </div>

        <div className="tool-list" role="listbox" aria-label="工具列表">
          {filteredTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={`tool-pill ${active === tool.id ? "is-active" : ""}`}
              onClick={() => openTool(tool.id)}
            >
              <span className="tool-pill-copy">
                <span className="tool-pill-name">{tool.name}</span>
                <span className="tool-pill-summary">{tool.summary}</span>
              </span>
            </button>
          ))}

          {showEmptyResult && <p className="empty-tip">没有匹配到工具，请换个关键词。</p>}
        </div>
      </aside>

      <section className="content-pane" aria-label="工具内容">
        {currentTool ? (
          <>
            <header className="content-head">
              <div className="content-head-top">
                <p className="brand-eyebrow">当前工具</p>
                <span className="content-route">#/tools/{currentTool.id}</span>
              </div>
              <div className="content-head-main">
                <div>
                  <h2>{currentTool.name}</h2>
                  <p>{currentTool.summary}</p>
                </div>
              </div>
            </header>

            <div className="content-body">{currentTool.render()}</div>
          </>
        ) : (
          <div className="content-head">
            <h2>未找到工具</h2>
            <p>当前工具不存在，请在左侧重新选择。</p>
          </div>
        )}
      </section>
    </main>
  );
}


"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { DEFAULT_TOOL_ID, TOOLS, getToolById, matchesToolQuery, type ToolId } from "../lib/tool-registry";
import CaesarTool from "../tools/CaesarTool";
import OneLineTool from "../tools/OneLineTool";
import SubEmailTool from "../tools/SubEmailTool";
import TwoFaTool from "../tools/TwoFaTool";
import Base64ImageTool from "../tools/Base64ImageTool";
import EncodeTool from "../tools/EncodeTool";
import ColorTool from "../tools/ColorTool";
import { ThemeToggle } from "./ThemeToggle";

interface ToolWorkspaceProps {
  activeToolId: ToolId;
  initialInput?: string;
}

function renderTool(toolId: ToolId, initialInput?: string): ReactElement {
  switch (toolId) {
    case "one-line":
      return <OneLineTool />;
    case "caesar":
      return <CaesarTool />;
    case "base64-image":
      return <Base64ImageTool />;
    case "encode":
      return <EncodeTool />;
    case "color":
      return <ColorTool />;
    case "sub-email":
      return <SubEmailTool />;
    case "twofa":
    default:
      return <TwoFaTool initialInput={initialInput} />;
  }
}

export default function ToolWorkspace({ activeToolId, initialInput }: ToolWorkspaceProps): ReactElement | null {
  const [query, setQuery] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const deferredQuery = useDeferredValue(query);

  const currentTool = useMemo(
    () => getToolById(activeToolId) ?? getToolById(DEFAULT_TOOL_ID),
    [activeToolId]
  );

  const filteredTools = useMemo(
    () => TOOLS.filter((tool) => matchesToolQuery(deferredQuery, tool)),
    [deferredQuery]
  );

  const showEmptyResult = filteredTools.length === 0;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [activeToolId]);

  useEffect(() => {
    let wasMobileViewport = window.innerWidth <= 920;

    const onResize = () => {
      const isMobileViewport = window.innerWidth <= 920;
      if (wasMobileViewport !== isMobileViewport) {
        setIsMenuOpen(false);
        wasMobileViewport = isMobileViewport;
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isMenuOpen]);

  if (!currentTool) {
    return null;
  }

  return (
    <main className={`app-shell ${isMenuOpen ? "is-menu-open" : ""}`}>
      <header className="mobile-header" aria-label="移动端顶部导航">
        <div className="mobile-header-brand">
          <p className="brand-eyebrow">Fish Tools</p>
          <p className="mobile-header-title">轻量工具箱</p>
        </div>
        <button
          type="button"
          className={`mobile-nav-trigger icon-btn menu-toggle-btn ${isMenuOpen ? "is-open" : ""}`}
          aria-expanded={isMenuOpen}
          aria-controls="tool-menu-drawer"
          aria-label={isMenuOpen ? "收起工具菜单" : "打开工具菜单"}
          title={isMenuOpen ? "收起工具菜单" : "打开工具菜单"}
          onClick={() => setIsMenuOpen((previous) => !previous)}
        >
          <span className="menu-toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="sr-only">{isMenuOpen ? "收起菜单" : "打开菜单"}</span>
        </button>
      </header>

      {isMenuOpen && (
        <button
          type="button"
          className="drawer-backdrop"
          aria-label="关闭工具菜单"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <aside
        id="tool-menu-drawer"
        className={`nav-pane ${isMenuOpen ? "is-open" : ""}`}
        aria-label="工具菜单"
      >
        <div className="nav-head">
          <div className="nav-head-top">
            <div className="nav-head-copy">
              <p className="brand-eyebrow">Fish Tools</p>
              <h1>工具箱</h1>
            </div>
            <button
              type="button"
              className={`desktop-nav-toggle icon-btn menu-toggle-btn ${isMenuOpen ? "is-open" : ""}`}
              aria-expanded={isMenuOpen}
              aria-controls="tool-menu-drawer"
              aria-label={isMenuOpen ? "收起工具菜单" : "展开工具菜单"}
              title={isMenuOpen ? "收起工具菜单" : "展开工具菜单"}
              data-tip={isMenuOpen ? "收起菜单" : "展开菜单"}
              onClick={() => setIsMenuOpen((previous) => !previous)}
            >
              <span className="menu-toggle-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className="sr-only">{isMenuOpen ? "收起菜单" : "展开菜单"}</span>
            </button>
          </div>
          <p className="nav-subtitle">基于 Next.js 的轻量工具工作区，选中后直接使用。</p>
          <button
            type="button"
            className="mobile-nav-close icon-btn menu-toggle-btn is-open"
            aria-label="收起工具菜单"
            title="收起工具菜单"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="menu-toggle-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
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
            <Link
              key={tool.id}
              href={`/tools/${tool.id}`}
              prefetch={true}
              className={`tool-pill ${activeToolId === tool.id ? "is-active" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="tool-pill-copy">
                <span className="tool-pill-name">{tool.name}</span>
                <span className="tool-pill-summary">{tool.summary}</span>
              </span>
            </Link>
          ))}

          {showEmptyResult && <p className="empty-tip">没有匹配到工具，请换个关键词。</p>}
        </div>

        <div className="nav-footer">
          <ThemeToggle />
        </div>
      </aside>

      <section className="content-pane" aria-label="工具内容">
        <header className="content-head">
          <div className="content-head-top">
            <p className="brand-eyebrow">当前工具</p>
            <span className="content-route">/tools/{currentTool.id}</span>
          </div>
          <div className="content-head-main">
            <div>
              <h2>{currentTool.name}</h2>
              <p>{currentTool.summary}</p>
            </div>
          </div>
        </header>

        <div className="content-body">{renderTool(currentTool.id, initialInput)}</div>
      </section>
    </main>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactElement } from "react";

type Mode = "base64-to-image" | "image-to-base64";

function stripDataUrlPrefix(raw: string): { mime: string; pure: string } {
  const match = raw.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  if (match) {
    return { mime: match[1], pure: raw.slice(match[0].length) };
  }
  return { mime: "image/png", pure: raw.trim() };
}

function buildDataUrl(mime: string, base64: string): string {
  return `data:${mime};base64,${base64}`;
}

export default function Base64ImageTool(): ReactElement {
  const [mode, setMode] = useState<Mode>("base64-to-image");

  /* ── Base64 → 图片 ── */
  const [base64Input, setBase64Input] = useState<string>("");
  const [previewSrc, setPreviewSrc] = useState<string>("");
  const [decodeError, setDecodeError] = useState<string>("");

  const handleDecode = () => {
    const trimmed = base64Input.trim();
    if (!trimmed) return;
    const { mime, pure } = stripDataUrlPrefix(trimmed);
    try {
      window.atob(pure); // validate
      setPreviewSrc(buildDataUrl(mime, pure));
      setDecodeError("");
    } catch {
      setPreviewSrc("");
      setDecodeError("无效的 Base64 字符串，请检查输入。");
    }
  };

  const handleDownload = () => {
    if (!previewSrc) return;
    const link = document.createElement("a");
    link.href = previewSrc;
    const ext = previewSrc.startsWith("data:image/png") ? "png" : previewSrc.startsWith("data:image/gif") ? "gif" : "png";
    link.download = `image.${ext}`;
    link.click();
  };

  /* ── 图片 → Base64 ── */
  const [base64Output, setBase64Output] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [imgPreview, setImgPreview] = useState<string>("");
  const [copyLabel, setCopyLabel] = useState<string>("复制");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setBase64Output("请选择图片文件。");
      setFileName("");
      setImgPreview("");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBase64Output(result);
      setImgPreview(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleCopy = async () => {
    if (!base64Output) return;
    try {
      await navigator.clipboard.writeText(base64Output);
      setCopyLabel("已复制");
      window.setTimeout(() => setCopyLabel("复制"), 1200);
    } catch {
      setCopyLabel("复制失败");
      window.setTimeout(() => setCopyLabel("复制"), 1200);
    }
  };

  return (
    <>
      {/* 模式切换 */}
      <section className="panel">
        <div className="panel-head">
          <h3>模式选择</h3>
        </div>
        <div style={{ display: "flex", gap: "8px", padding: "4px 0" }}>
          <button
            type="button"
            className={`ghost-btn ${mode === "base64-to-image" ? "is-active" : ""}`}
            onClick={() => setMode("base64-to-image")}
          >
            Base64 → 图片
          </button>
          <button
            type="button"
            className={`ghost-btn ${mode === "image-to-base64" ? "is-active" : ""}`}
            onClick={() => setMode("image-to-base64")}
          >
            图片 → Base64
          </button>
        </div>
      </section>

      {mode === "base64-to-image" ? (
        <>
          <section className="panel">
            <div className="panel-head">
              <h3>输入 Base64</h3>
              <div className="actions">
                <button className="ghost-btn" type="button" onClick={() => { setBase64Input(""); setPreviewSrc(""); setDecodeError(""); }}>
                  清空
                </button>
                <button className="ghost-btn" type="button" onClick={handleDecode} disabled={!base64Input.trim()}>
                  解码预览
                </button>
              </div>
            </div>
            <textarea
              value={base64Input}
              onChange={(e) => setBase64Input(e.target.value)}
              spellCheck={false}
              placeholder="粘贴 Base64 字符串（支持带 data:image/... 前缀或纯 Base64）"
              style={{ minHeight: "120px" }}
            />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>图片预览</h3>
              {previewSrc && (
                <button className="ghost-btn" type="button" onClick={handleDownload}>
                  下载图片
                </button>
              )}
            </div>
            <div style={{ padding: "12px", textAlign: "center", minHeight: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {decodeError && <p style={{ color: "var(--c-danger, #e53e3e)" }}>{decodeError}</p>}
              {previewSrc && !decodeError && (
                <img src={previewSrc} alt="decoded" style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "6px" }} />
              )}
              {!previewSrc && !decodeError && <p style={{ opacity: 0.5 }}>输入 Base64 后点击「解码预览」查看图片</p>}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="panel">
            <div className="panel-head">
              <h3>选择图片</h3>
              <div className="actions">
                <button className="ghost-btn" type="button" onClick={() => { setBase64Output(""); setFileName(""); setImgPreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                  清空
                </button>
              </div>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "var(--c-accent, #3182ce)" : "var(--c-border, #cbd5e0)"}`,
                borderRadius: "8px",
                padding: "32px",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.2s",
                background: isDragging ? "var(--c-bg-hover, rgba(49,130,206,0.05))" : "transparent",
              }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
              {imgPreview ? (
                <div>
                  <img src={imgPreview} alt="preview" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "6px", marginBottom: "8px" }} />
                  <p style={{ fontSize: "0.85em", opacity: 0.7 }}>{fileName}</p>
                </div>
              ) : (
                <p style={{ opacity: 0.6 }}>点击选择图片或将图片拖拽到此处</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>Base64 结果</h3>
              <button className="ghost-btn" type="button" onClick={handleCopy} disabled={!base64Output}>
                {copyLabel}
              </button>
            </div>
            <textarea
              value={base64Output}
              readOnly
              spellCheck={false}
              placeholder="选择图片后，Base64 编码会显示在这里"
              style={{ minHeight: "120px" }}
            />
          </section>
        </>
      )}
    </>
  );
}

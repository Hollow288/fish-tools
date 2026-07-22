"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactElement } from "react";

type Mode = "base64-to-image" | "image-to-base64" | "text-to-base64" | "base64-to-text";

const TEXT_SAMPLE = "你好 Fish Tools";
const TEXT_BASE64_SAMPLE = "5L2g5aW9IEZpc2ggVG9vbHM=";

function stripImageDataUrlPrefix(raw: string): { mime: string; pure: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^data:(image\/[-+.a-zA-Z0-9]+);base64,/i);
  if (match) {
    return { mime: match[1], pure: trimmed.slice(match[0].length).replace(/\s+/g, "") };
  }
  return { mime: "image/png", pure: trimmed.replace(/\s+/g, "") };
}

function stripBase64DataUrlPrefix(raw: string): string {
  const trimmed = raw.trim();
  const commaIndex = trimmed.indexOf(",");

  if (trimmed.toLowerCase().startsWith("data:") && commaIndex !== -1) {
    const meta = trimmed.slice(5, commaIndex).toLowerCase();
    if (meta.split(";").includes("base64")) {
      return trimmed.slice(commaIndex + 1).replace(/\s+/g, "");
    }
  }

  return trimmed.replace(/\s+/g, "");
}

function buildDataUrl(mime: string, base64: string): string {
  return `data:${mime};base64,${base64}`;
}

function bytesToBinary(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
  }

  return chunks.join("");
}

function binaryToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function encodeUtf8ToBase64(text: string): string {
  return window.btoa(bytesToBinary(new TextEncoder().encode(text)));
}

function decodeBase64ToUtf8(raw: string): string {
  const binary = window.atob(stripBase64DataUrlPrefix(raw));
  return new TextDecoder("utf-8", { fatal: true }).decode(binaryToBytes(binary));
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
    const { mime, pure } = stripImageDataUrlPrefix(trimmed);
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
  const [imageCopyLabel, setImageCopyLabel] = useState<string>("复制");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── 文字 ⇄ Base64 ── */
  const [textInput, setTextInput] = useState<string>("");
  const [textBase64Output, setTextBase64Output] = useState<string>("");
  const [textEncodeCopyLabel, setTextEncodeCopyLabel] = useState<string>("复制");
  const [textBase64Input, setTextBase64Input] = useState<string>("");
  const [textOutput, setTextOutput] = useState<string>("");
  const [textDecodeError, setTextDecodeError] = useState<string>("");
  const [textDecodeCopyLabel, setTextDecodeCopyLabel] = useState<string>("复制");

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

  const copyValue = async (value: string, setLabel: (label: string) => void) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setLabel("已复制");
      window.setTimeout(() => setLabel("复制"), 1200);
    } catch {
      setLabel("复制失败");
      window.setTimeout(() => setLabel("复制"), 1200);
    }
  };

  const handleEncodeText = () => {
    if (!textInput) return;
    setTextBase64Output(encodeUtf8ToBase64(textInput));
  };

  const handleDecodeText = () => {
    if (!textBase64Input.trim()) return;

    try {
      setTextOutput(decodeBase64ToUtf8(textBase64Input));
      setTextDecodeError("");
    } catch {
      setTextOutput("");
      setTextDecodeError("无效的 Base64 字符串，或解码结果不是 UTF-8 文本。");
    }
  };

  return (
    <>
      {/* 模式切换 */}
      <section className="panel">
        <div className="panel-head">
          <h3>模式选择</h3>
        </div>
        <div style={{ display: "flex", gap: "8px", padding: "4px 0", flexWrap: "wrap" }}>
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
          <button
            type="button"
            className={`ghost-btn ${mode === "text-to-base64" ? "is-active" : ""}`}
            onClick={() => setMode("text-to-base64")}
          >
            文字 → Base64
          </button>
          <button
            type="button"
            className={`ghost-btn ${mode === "base64-to-text" ? "is-active" : ""}`}
            onClick={() => setMode("base64-to-text")}
          >
            Base64 → 文字
          </button>
        </div>
      </section>

      {mode === "base64-to-image" && (
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
      )}

      {mode === "image-to-base64" && (
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
              <button className="ghost-btn" type="button" onClick={() => copyValue(base64Output, setImageCopyLabel)} disabled={!base64Output}>
                {imageCopyLabel}
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

      {mode === "text-to-base64" && (
        <>
          <section className="panel">
            <div className="panel-head">
              <h3>输入文字</h3>
              <div className="actions">
                <button className="ghost-btn" type="button" onClick={() => { setTextInput(TEXT_SAMPLE); setTextBase64Output(""); }}>
                  示例
                </button>
                <button className="ghost-btn" type="button" onClick={() => { setTextInput(""); setTextBase64Output(""); }}>
                  清空
                </button>
                <button className="ghost-btn" type="button" onClick={handleEncodeText} disabled={!textInput}>
                  编码
                </button>
              </div>
            </div>
            <textarea
              value={textInput}
              onChange={(e) => { setTextInput(e.target.value); setTextBase64Output(""); }}
              spellCheck={false}
              placeholder="输入要转成 Base64 的文字（按 UTF-8 编码）"
              style={{ minHeight: "120px" }}
            />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>Base64 结果</h3>
              <button className="ghost-btn" type="button" onClick={() => copyValue(textBase64Output, setTextEncodeCopyLabel)} disabled={!textBase64Output}>
                {textEncodeCopyLabel}
              </button>
            </div>
            <textarea
              value={textBase64Output}
              readOnly
              spellCheck={false}
              placeholder="文字编码后的 Base64 会显示在这里"
              style={{ minHeight: "120px" }}
            />
          </section>
        </>
      )}

      {mode === "base64-to-text" && (
        <>
          <section className="panel">
            <div className="panel-head">
              <h3>输入 Base64</h3>
              <div className="actions">
                <button className="ghost-btn" type="button" onClick={() => { setTextBase64Input(TEXT_BASE64_SAMPLE); setTextOutput(""); setTextDecodeError(""); }}>
                  示例
                </button>
                <button className="ghost-btn" type="button" onClick={() => { setTextBase64Input(""); setTextOutput(""); setTextDecodeError(""); }}>
                  清空
                </button>
                <button className="ghost-btn" type="button" onClick={handleDecodeText} disabled={!textBase64Input.trim()}>
                  解码
                </button>
              </div>
            </div>
            <textarea
              value={textBase64Input}
              onChange={(e) => { setTextBase64Input(e.target.value); setTextOutput(""); setTextDecodeError(""); }}
              spellCheck={false}
              placeholder="粘贴 Base64 字符串（支持 data:*;base64 前缀或纯 Base64）"
              style={{ minHeight: "120px" }}
            />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>文字结果</h3>
              <button className="ghost-btn" type="button" onClick={() => copyValue(textOutput, setTextDecodeCopyLabel)} disabled={!textOutput}>
                {textDecodeCopyLabel}
              </button>
            </div>
            {textDecodeError && <div className="error-box" style={{ marginBottom: "0.65rem" }}>{textDecodeError}</div>}
            <textarea
              value={textOutput}
              readOnly
              spellCheck={false}
              placeholder="Base64 解码后的文字会显示在这里"
              style={{ minHeight: "120px" }}
            />
          </section>
        </>
      )}
    </>
  );
}

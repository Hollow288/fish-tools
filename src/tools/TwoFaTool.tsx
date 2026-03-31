"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { generateHotpCode, generateTotpCode } from "../lib/otp";
import { parse2faInput } from "../lib/parse2fa";
import type { Parsed2FaData } from "../lib/parse2fa";

const SAMPLE_URI =
  "otpauth://totp/FishTools:demo@example.com?secret=JBSWY3DPEHPK3PXP&issuer=FishTools&algorithm=SHA1&digits=6&period=30";
const SAMPLE_SECRET = "N52OMYHX2GRTRVURAUYGIJ4D4ZUBNUSK";

interface FieldProps {
  label: string;
  value: string;
  mono?: boolean;
}

function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

function formatOtp(code: string): string {
  if (!code) return "------";
  if (code.length === 6) return `${code.slice(0, 3)} ${code.slice(3)}`;
  return code;
}

function Field({ label, value, mono = false }: FieldProps): ReactElement {
  return (
    <div className="field-card">
      <p className="field-label">{label}</p>
      <p className={mono ? "field-value mono" : "field-value"}>{value}</p>
    </div>
  );
}

interface TwoFaToolProps {
  initialInput?: string;
}

export default function TwoFaTool({ initialInput }: TwoFaToolProps): ReactElement {
  const [input, setInput] = useState<string>(initialInput ?? SAMPLE_URI);
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");
  const [copyLabel, setCopyLabel] = useState<string>("复制验证码");

  const parseResult = useMemo(() => parse2faInput(input), [input]);
  const data: Parsed2FaData | null = parseResult.ok ? parseResult.data : null;

  const maskedSecret = data?.secret ? "•".repeat(Math.max(data.secret.length, 12)) : "";

  useEffect(() => {
    setNowMs(Date.now());

    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const nowSec = nowMs === null ? null : Math.floor(nowMs / 1000);
  const period = data?.type === "totp" ? data.period : null;
  const remaining = period !== null && nowSec !== null ? period - (nowSec % period || 0) : null;

  const timeSlice =
    data?.type === "totp" && period && nowSec !== null
      ? Math.floor(nowSec / period)
      : data?.type === "hotp"
        ? data.counter
        : null;

  useEffect(() => {
    let canceled = false;

    const refreshCode = async () => {
      if (!data) {
        setOtpCode("");
        setOtpError("");
        return;
      }

      try {
        let code = "";

        if (data.type === "totp") {
          if (nowSec === null) {
            setOtpCode("");
            setOtpError("");
            return;
          }

          code = await generateTotpCode({
            secret: data.secret,
            algorithm: data.algorithm,
            digits: data.digits,
            period: data.period,
            timestamp: nowSec,
          });
        } else {
          code = await generateHotpCode({
            secret: data.secret,
            algorithm: data.algorithm,
            digits: data.digits,
            counter: data.counter,
          });
        }

        if (!canceled) {
          setOtpCode(code);
          setOtpError("");
        }
      } catch (error: unknown) {
        if (!canceled) {
          setOtpCode("");
          setOtpError(error instanceof Error ? error.message : "动态码生成失败");
        }
      }
    };

    void refreshCode();

    return () => {
      canceled = true;
    };
  }, [
    data?.type,
    data?.secret,
    data?.algorithm,
    data?.digits,
    data?.period,
    data?.counter,
    timeSlice,
    nowSec,
  ]);

  const handleCopyCode = async () => {
    if (!otpCode) return;

    try {
      await navigator.clipboard.writeText(otpCode);
      setCopyLabel("已复制");
      window.setTimeout(() => setCopyLabel("复制验证码"), 1200);
    } catch {
      setCopyLabel("复制失败");
      window.setTimeout(() => setCopyLabel("复制验证码"), 1200);
    }
  };

  const progress = period && remaining !== null ? ((period - remaining) / period) * 100 : 0;

  return (
    <>
      <section className="panel panel-input">
        <div className="panel-head">
          <h3>输入内容</h3>
          <div className="actions">
            <button className="ghost-btn" type="button" onClick={() => setInput(SAMPLE_URI)}>
              URI 示例
            </button>
            <button className="ghost-btn" type="button" onClick={() => setInput(SAMPLE_SECRET)}>
              密钥示例
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          placeholder="例如：otpauth://totp/... 或 N52OMYHX2GRTRVURAUYGIJ4D4ZUBNUSK"
        />
      </section>

      <section className="panel panel-result">
        <div className="panel-head">
          <h3>解析结果</h3>
          {data && <span className="type-pill">{data.type.toUpperCase()}</span>}
        </div>

        {!parseResult.ok && <div className="error-box">{parseResult.error}</div>}

        {data && (
          <>
            <div className="otp-card">
              <p className="otp-label">当前动态码</p>
              <p className="otp-code mono">{formatOtp(otpCode)}</p>
              <div className="otp-actions">
                <button className="ghost-btn" type="button" onClick={handleCopyCode}>
                  {copyLabel}
                </button>
                {data.type === "totp" && (
                  <p className="otp-meta">{remaining === null ? "--" : remaining}s 后刷新</p>
                )}
              </div>
              {data.type === "totp" && (
                <div className="progress-track" aria-hidden="true">
                  <span className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
              {data.type === "hotp" && <p className="otp-meta">HOTP 为计数器模式，不按时间刷新</p>}
              {otpError && <div className="error-box otp-error">{otpError}</div>}
            </div>

            {data.inferred && (
              <div className="info-box">
                检测到纯密钥输入，按默认 TOTP 参数解析：SHA1 / 6 位 / 30 秒。
              </div>
            )}

            <div className="field-grid">
              <Field label="Issuer" value={data.issuer} />
              <Field label="账号" value={data.accountName} />
              <Field label="标签" value={data.label} />
              <Field label="算法" value={data.algorithm} />
              <Field label="位数" value={String(data.digits)} />
              <Field
                label={data.type === "totp" ? "周期 (秒)" : "Counter"}
                value={String(data.type === "totp" ? data.period : data.counter)}
              />
            </div>

            <div className="secret-block">
              <div className="secret-head">
                <h4>Secret</h4>
                <button className="ghost-btn" type="button" onClick={() => setShowSecret((value) => !value)}>
                  {showSecret ? "隐藏" : "显示"}
                </button>
              </div>
              <p className="secret mono">{showSecret ? formatSecret(data.secret) : maskedSecret}</p>
            </div>
          </>
        )}
      </section>
    </>
  );
}

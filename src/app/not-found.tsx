import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="standalone-page">
      <section className="standalone-card">
        <p className="brand-eyebrow">Fish Tools</p>
        <h1>页面未找到</h1>
        <p>你访问的工具不存在，返回工具首页重新选择。</p>
        <Link className="primary-link" href="/tools/twofa">
          返回默认工具
        </Link>
      </section>
    </main>
  );
}

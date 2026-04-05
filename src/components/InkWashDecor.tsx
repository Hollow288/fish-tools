"use client";

/**
 * 水墨装饰 SVG 组件
 *
 * 利用 SVG feTurbulence / feDisplacementMap / feGaussianBlur
 * 程序化生成墨渍、远山、飞溅等水墨画元素。
 * 所有图形都是矢量 + 滤镜，无需外部图片。
 */

export function InkSplash({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* 墨渍晕染滤镜 */}
        <filter id="ink-bleed" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="25" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="2" result="blurred" />
          <feColorMatrix in="blurred" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="sharpened" />
          <feGaussianBlur in="sharpened" stdDeviation="1.5" />
        </filter>
      </defs>

      {/* 主墨团 */}
      <g filter="url(#ink-bleed)" opacity="0.6">
        <ellipse cx="100" cy="95" rx="55" ry="50" fill="currentColor" />
        <ellipse cx="75" cy="110" rx="35" ry="28" fill="currentColor" />
        <ellipse cx="130" cy="80" rx="25" ry="32" fill="currentColor" />
      </g>

      {/* 飞溅小墨点 */}
      <g filter="url(#ink-bleed)" opacity="0.4">
        <circle cx="45" cy="50" r="8" fill="currentColor" />
        <circle cx="160" cy="55" r="6" fill="currentColor" />
        <circle cx="155" cy="145" r="10" fill="currentColor" />
        <circle cx="35" cy="150" r="5" fill="currentColor" />
        <circle cx="60" cy="40" r="3" fill="currentColor" />
        <circle cx="170" cy="100" r="4" fill="currentColor" />
      </g>
    </svg>
  );
}

export function InkMountains({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 400 160"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        {/* 山体水墨渲染滤镜 */}
        <filter id="mountain-wash" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="5" seed="8" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="1.2" />
        </filter>

        {/* 淡墨渲染 —— 更模糊更轻 */}
        <filter id="mountain-wash-light" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="12" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="2.5" />
        </filter>

        {/* 云雾滤镜 */}
        <filter id="cloud-wash" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="20" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="4" />
        </filter>
      </defs>

      {/* 最远山 —— 最淡 */}
      <path
        d="M0,160 L0,80 Q30,40 70,65 Q100,30 140,55 Q170,20 210,48 Q250,25 290,50 Q320,18 355,45 Q380,30 400,50 L400,160 Z"
        fill="currentColor"
        opacity="0.12"
        filter="url(#mountain-wash-light)"
      />

      {/* 云雾层 */}
      <ellipse cx="120" cy="85" rx="100" ry="12" fill="currentColor" opacity="0.06" filter="url(#cloud-wash)" />
      <ellipse cx="300" cy="75" rx="80" ry="10" fill="currentColor" opacity="0.04" filter="url(#cloud-wash)" />

      {/* 中景山 */}
      <path
        d="M0,160 L0,105 Q40,70 75,88 Q110,55 150,78 Q185,48 220,72 Q255,42 290,68 Q325,50 360,75 Q385,60 400,72 L400,160 Z"
        fill="currentColor"
        opacity="0.22"
        filter="url(#mountain-wash)"
      />

      {/* 近景山 —— 最浓 */}
      <path
        d="M0,160 L0,125 Q35,100 65,112 Q95,88 130,105 Q160,82 200,100 Q235,78 270,98 Q305,80 340,102 Q370,90 400,105 L400,160 Z"
        fill="currentColor"
        opacity="0.35"
        filter="url(#mountain-wash)"
      />

      {/* 前景矮丘 */}
      <path
        d="M0,160 L0,140 Q50,125 100,135 Q150,120 200,132 Q250,118 300,130 Q350,122 400,138 L400,160 Z"
        fill="currentColor"
        opacity="0.18"
        filter="url(#mountain-wash)"
      />
    </svg>
  );
}

export function InkDrop({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 60 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="drop-bleed" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" seed="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="0.8" />
        </filter>
      </defs>

      <g filter="url(#drop-bleed)" opacity="0.5">
        {/* 墨滴主体 */}
        <ellipse cx="30" cy="30" rx="14" ry="16" fill="currentColor" />
        {/* 滴落拖尾 */}
        <ellipse cx="30" cy="52" rx="6" ry="8" fill="currentColor" />
        <ellipse cx="30" cy="66" rx="3" ry="4" fill="currentColor" />
        {/* 飞溅 */}
        <circle cx="15" cy="22" r="3" fill="currentColor" />
        <circle cx="46" cy="26" r="2.5" fill="currentColor" />
        <circle cx="42" cy="18" r="1.5" fill="currentColor" />
      </g>
    </svg>
  );
}

export function InkCorner({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="corner-wash" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="15" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="3" />
        </filter>
      </defs>

      <g filter="url(#corner-wash)" opacity="0.35">
        {/* 角落墨渍 —— 像泼墨在纸角 */}
        <path d="M200,200 Q200,130 170,100 Q150,80 130,90 Q100,60 80,80 Q50,50 30,70 Q10,80 0,100 L0,200 Z" fill="currentColor" />
        <ellipse cx="160" cy="170" rx="35" ry="25" fill="currentColor" />
      </g>
    </svg>
  );
}

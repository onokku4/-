import { useId } from "react";
import type { PotShape, ViewAngle } from "../types";
import { potGuide, type GuideShape } from "../lib/timelapse";

const draw = (g: GuideShape, key: number) => {
  switch (g.kind) {
    case "ellipse":
      return <ellipse key={key} cx={g.cx * 100} cy={g.cy * 100} rx={g.rx * 100} ry={g.ry * 100} />;
    case "rect":
      return <rect key={key} x={g.x * 100} y={g.y * 100} width={g.w * 100} height={g.h * 100} rx={g.radius * 100} />;
    case "poly": {
      const pts = g.points.map(([x, y]) => `${x * 100},${y * 100}`).join(" ");
      return g.closed ? <polygon key={key} points={pts} /> : <polyline key={key} points={pts} />;
    }
  }
};

/** 鉢の枠のオーバーレイ。真上は枠の外を暗く、見下ろしは株が伸びる上側を見せたいので輪郭だけ */
export function PotFrame({ shape, view, dim = 0.45 }: { shape: PotShape; view: ViewAngle; dim?: number }) {
  const maskId = useId();
  const g = potGuide(shape, view);
  const [ax, ay] = g.anchor;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} aria-hidden="true">
      {g.hole && (
        <>
          <defs>
            <mask id={maskId}>
              <rect x="0" y="0" width="100" height="100" fill="white" />
              <g fill="black">{g.hole.map(draw)}</g>
            </mask>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill={`rgba(0,0,0,${dim})`} mask={`url(#${maskId})`} />
        </>
      )}
      {/* 見下ろし：株が伸びる余白の目安（上3分の2） */}
      {!g.hole && <line x1="6" y1={ay * 100 - 0.5} x2="94" y2={ay * 100 - 0.5} stroke="rgba(255,255,255,.18)" strokeWidth="0.3" />}
      <g fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1.1">
        {g.outline.map(draw)}
      </g>
      <g fill="none" stroke="#fff" strokeWidth="0.55" strokeDasharray="2 1.5" strokeLinejoin="round">
        {g.outline.map(draw)}
      </g>
      <g stroke="rgba(255,255,255,.6)" strokeWidth="0.3">
        <line x1={ax * 100} y1={ay * 100 - 3} x2={ax * 100} y2={ay * 100 + 3} />
        <line x1={ax * 100 - 3} y1={ay * 100} x2={ax * 100 + 3} y2={ay * 100} />
      </g>
    </svg>
  );
}

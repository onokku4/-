import { useId } from "react";
import type { PotShape } from "../types";
import { potFrame } from "../lib/timelapse";

/** 鉢の枠のオーバーレイ。枠の外を暗くし、点線で輪郭を描く */
export function PotFrame({ shape, dim = 0.45 }: { shape: PotShape; dim?: number }) {
  const maskId = useId();
  const f = potFrame(shape);
  const hole =
    f.kind === "circle" ? (
      <circle cx={f.cx * 100} cy={f.cy * 100} r={f.r * 100} />
    ) : (
      <rect x={f.x * 100} y={f.y * 100} width={f.w * 100} height={f.h * 100} rx={f.radius * 100} />
    );
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <g fill="black">{hole}</g>
        </mask>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill={`rgba(0,0,0,${dim})`} mask={`url(#${maskId})`} />
      <g fill="none" stroke="#fff" strokeWidth="0.5" strokeDasharray="2 1.5">
        {hole}
      </g>
      <g stroke="rgba(255,255,255,.45)" strokeWidth="0.25">
        <line x1="50" y1="46" x2="50" y2="54" />
        <line x1="46" y1="50" x2="54" y2="50" />
      </g>
    </svg>
  );
}

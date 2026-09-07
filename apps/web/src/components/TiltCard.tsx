import { useRef, useState, type ReactNode, type CSSProperties } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glow?: string;
  intensity?: number;
}

export default function TiltCard({
  children,
  className = "",
  glow = "rgb(var(--c-signal) / calc(0.18 * var(--orb-strength)))",
  intensity = 10,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * intensity;
    const rotateX = (0.5 - py) * intensity;
    setStyle({
      transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`,
    });
    setSpot({ x: px * 100, y: py * 100, active: true });
  }

  function onLeave() {
    setStyle({ transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)" });
    setSpot((s) => ({ ...s, active: false }));
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onLeave}
      style={{ ...style, transition: "transform 300ms cubic-bezier(.2,.8,.2,1)" }}
      className={`group relative will-change-transform ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(280px circle at ${spot.x}% ${spot.y}%, ${glow}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}

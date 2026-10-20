// Luna creciente SVG con brillo animado — identidad visual de ALMA LIMPIA.
export function CrescentMoon({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`animate-moon-glow ${className}`}
      role="img"
      aria-label="Luna creciente"
    >
      <defs>
        <radialGradient id="moonGrad" cx="40%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#f7e3b8" />
          <stop offset="60%" stopColor="#e9bd79" />
          <stop offset="100%" stopColor="#b98548" />
        </radialGradient>
        <mask id="crescent">
          <rect width="100" height="100" fill="black" />
          <circle cx="50" cy="50" r="38" fill="white" />
          <circle cx="66" cy="42" r="34" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="38" fill="url(#moonGrad)" mask="url(#crescent)" />
      {/* estrellas decorativas */}
      <circle cx="72" cy="26" r="1.4" fill="#f3d9a7" opacity="0.9" />
      <circle cx="80" cy="44" r="1" fill="#f5efe7" opacity="0.7" />
      <circle cx="76" cy="64" r="1.2" fill="#d8b4fe" opacity="0.8" />
    </svg>
  );
}

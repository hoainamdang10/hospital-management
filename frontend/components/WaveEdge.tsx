export function WaveEdge({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-full ${className}`}
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0E9F6E" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#1E4DD8" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <path
        d="M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30 L1200,60 L0,60 Z"
        fill="url(#waveGradient)"
      />
      <path
        d="M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30"
        stroke="#0E9F6E"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
}

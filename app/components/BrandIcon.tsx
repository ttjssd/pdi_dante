export default function BrandIcon() {
  return (
    <span className="brand-icon-frame" aria-hidden="true">
      <svg className="brand-icon" viewBox="0 0 48 48" role="img">
        <defs>
          <linearGradient id="brand-orbit" x1="8" y1="8" x2="40" y2="40">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="0.52" stopColor="#818cf8" />
            <stop offset="1" stopColor="#d946ef" />
          </linearGradient>
          <radialGradient id="brand-core">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.28" stopColor="#a5f3fc" />
            <stop offset="0.62" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#4c1d95" />
          </radialGradient>
        </defs>

        <path className="brand-icon-circuit" d="M5 32h7l4-4M43 16h-7l-4 4" />
        <path className="brand-icon-orbit orbit-a" d="M9.5 24c0-6 6.5-10.8 14.5-10.8S38.5 18 38.5 24 32 34.8 24 34.8 9.5 30 9.5 24Z" />
        <path className="brand-icon-orbit orbit-b" d="M15 9.8c5.2-3 12.6 1.1 16.6 8s3 14.8-2.2 17.8-12.6-1.1-16.6-8S9.8 12.8 15 9.8Z" />
        <circle className="brand-icon-halo" cx="24" cy="24" r="9.2" />
        <circle className="brand-icon-core" cx="24" cy="24" r="5.8" />
        <path className="brand-icon-aperture" d="m24 17.6 3.1 5.3-3.1 7.5-3.1-7.5L24 17.6Z" />
        <circle className="brand-icon-node node-a" cx="10.2" cy="20.1" r="1.6" />
        <circle className="brand-icon-node node-b" cx="35" cy="31.9" r="1.4" />
        <circle className="brand-icon-node node-c" cx="33.9" cy="14.2" r="1.1" />
      </svg>
    </span>
  );
}

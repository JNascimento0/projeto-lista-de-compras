export default function ScannerIcon({ size = 28, className = '' }) {
  const height = (size * 24) / 28;

  return (
    <svg
      className={className}
      viewBox="0 0 28 24"
      width={size}
      height={height}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 3.5H5.5a2 2 0 0 0-2 2V8" />
      <path d="M19 3.5h3.5a2 2 0 0 1 2 2V8" />
      <path d="M24.5 16v2.5a2 2 0 0 1-2 2H19" />
      <path d="M9 20.5H5.5a2 2 0 0 1-2-2V16" />

      <rect
        x="10"
        y="8.5"
        width="8"
        height="7"
        rx="1.2"
      />
    </svg>
  );
}
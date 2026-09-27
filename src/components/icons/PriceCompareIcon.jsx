export default function PriceCompareIcon({ size = 28, className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 17V11" />
      <path d="M8 17V7" />
      <path d="M12 17v-3" />

      <circle cx="15.5" cy="9.5" r="4.5" />
      <path d="m19 13 3 3" />
    </svg>
  );
}
export default function ChevronIcon({ aberto, size = 20 }) {
  return (
    <svg
      className={`accordion-chevron ${
        aberto ? 'accordion-chevron--aberto' : ''
      }`}
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function ProductIcon({ size = 20, className = '' }) {
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
            <path d="M12 3 21 8l-9 5-9-5 9-5Z" />
            <path d="M3 8v9l9 5 9-5V8" />
            <path d="M12 13v9" />
            <path d="m7.5 5.5 9 5" />
        </svg>
    );
}

export default function TagIcon({ size = 20, className = '' }) {
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
            <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3.4 13.4a2 2 0 0 1 0-2.8l7.2-7.2A2 2 0 0 1 12 2.8h7a2 2 0 0 1 2 2v7a2 2 0 0 1-.4 1.6Z" />
            <circle cx="16.5" cy="7.5" r="1" />
        </svg>
    );
}
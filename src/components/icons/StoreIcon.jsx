export default function StoreIcon({ size = 20, className = '' }) {
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
            <path d="M3 9l2-5h14l2 5" />
            <path d="M5 13v7h14v-7" />
            <path d="M9 20v-6h6v6" />
            <path d="M3 9a2 2 0 0 0 4 0" />
            <path d="M7 9a2 2 0 0 0 4 0" />
            <path d="M11 9a2 2 0 0 0 4 0" />
            <path d="M15 9a2 2 0 0 0 4 0" />
            <path d="M19 9a2 2 0 0 0 2 0" />
        </svg>
    );
}
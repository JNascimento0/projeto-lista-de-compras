export default function LegendDotIcon({
  size = 10,
  color = 'currentColor',
  className = '',
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 10 10"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <circle
        cx="5"
        cy="5"
        r="5"
        fill={color}
      />
    </svg>
  );
}
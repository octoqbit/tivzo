export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="11" fill="currentColor" />
      <path d="M9 11h24l-4 7h-8l-7 12H6l11-19Z" fill="var(--logo-cut,white)" />
      <path d="m27 23 5 7h-9l4-7Z" fill="#f16b38" />
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <Mark />
      <span>
        tivzo<span className="brand-dot">.</span>
      </span>
    </span>
  );
}

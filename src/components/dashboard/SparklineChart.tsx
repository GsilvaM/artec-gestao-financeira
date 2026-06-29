const strokeColors = {
  green: "var(--text-success)",
  blue: "var(--text-accent)",
  red: "var(--text-danger)",
} as const;

export function SparklineChart({ data, color }: { data: number[]; color: keyof typeof strokeColors }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const width = 120;
  const height = 32;
  const range = Math.max(max - min, 1);
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="h-8 w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColors[color]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

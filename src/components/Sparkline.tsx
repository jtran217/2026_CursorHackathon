interface SparklineProps {
  data: { value: number }[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 400, height = 100 }: SparklineProps) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-text-tertiary"
        style={{
          width,
          height,
          fontSize: 'var(--text-xs)',
          letterSpacing: 'var(--tracking-wide)',
        }}
      >
        Waiting for data...
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const linePath = `M${points.join(' L')}`;
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ aspectRatio: `${width}/${height}` }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.10" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

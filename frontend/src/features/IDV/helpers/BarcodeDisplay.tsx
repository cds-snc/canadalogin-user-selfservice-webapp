type BarcodeBar = {
  x: number;
  width: number;
  key: string;
};

type BarcodeDisplayProps = {
  value: string;
  ariaLabel: string;
  height?: number;
  maxWidth?: string;
  widthScale?: number;
};

function scaleWidth(width: number, widthScale: number) {
  return Math.max(Math.round(width * widthScale), 1);
}

function buildBarcodeBars(
  value: string,
  widthScale: number,
): { bars: BarcodeBar[]; width: number } {
  let x = 0;
  const bars: BarcodeBar[] = [];

  value.split("").forEach((char, charIndex) => {
    const charCode = char.charCodeAt(0);
    const barCount = (charCode % 5) + 5;

    for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
      const baseWidth = ((charCode >> (barIndex % 6)) & 1) === 1 ? 3 : 1;
      const width = scaleWidth(baseWidth, widthScale);

      bars.push({
        x,
        width,
        key: `${charIndex}-${barIndex}`,
      });

      x += width + scaleWidth(1, widthScale);
    }

    x += scaleWidth(2, widthScale);
  });

  return {
    bars,
    width: Math.max(x, 160),
  };
}

export default function BarcodeDisplay({
  value,
  ariaLabel,
  height = 90,
  maxWidth = "560px",
  widthScale = 1,
}: BarcodeDisplayProps) {
  const barcode = buildBarcodeBars(value, widthScale);
  const barHeight = Math.max(height - 20, 10);

  return (
    <svg
      aria-label={ariaLabel}
      role="img"
      viewBox={`0 0 ${barcode.width} ${height}`}
      style={{ width: "100%", maxWidth, display: "block" }}
    >
      <rect width={barcode.width} height={height} fill="#ffffff" />
      {barcode.bars.map((bar) => (
        <rect
          key={bar.key}
          x={bar.x}
          y="6"
          width={bar.width}
          height={barHeight}
          fill="#000000"
        />
      ))}
    </svg>
  );
}

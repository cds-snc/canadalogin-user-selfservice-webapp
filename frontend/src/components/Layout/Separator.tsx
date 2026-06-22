import type { CSSProperties } from "react";

interface SeparatorProps {
  style?: CSSProperties;
}

export default function Separator({ style }: SeparatorProps) {
  return <div className="separator" style={style} />;
}
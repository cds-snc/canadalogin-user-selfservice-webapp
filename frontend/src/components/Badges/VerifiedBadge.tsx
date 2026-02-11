import { GcdsContainer, GcdsIcon } from "@cdssnc/gcds-components-react";

export default function VerifiedBadge({ text }) {
  return (
    <GcdsContainer>
      <div
        className="verifiedBadge"
        style={{
          display: "flex",
          height: "1.875rem",
          padding: "0 0.625rem",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.3125rem",
          borderRadius: "0.3125rem",
          background: "#E6F6EC",
          width: "fit-content",
        }}
      >
        <GcdsIcon
          name="checkmark-circle"
          className="verifiedIcon"
          size="text"
        />
        <span
          className="verifiedText"
          style={{
            color: "#03662A",
            lineHeight: "1.5rem",
            margin: 0,
            padding: 0,
            width: "fit-content",
          }}
        >
          {text}
        </span>
      </div>
    </GcdsContainer>
  );
}

import { GcdsContainer } from "@cdssnc/gcds-components-react";

export default function EnabledBadge({ text }) {
  return (
    <GcdsContainer>
      <div
        className="enabledBadge"
        style={{
          display: "flex",
          height: "1.875rem",
          padding: "0 0.625rem",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.3125rem",
          borderRadius: "0.3125rem",
          background: "#D7E5F5",
          width: "fit-content",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="17"
          viewBox="0 0 13 17"
          fill="none"
        >
          <path
            d="M5.28125 11.0472H7.71875L7.25156 8.42693C7.5224 8.29151 7.73568 8.09516 7.89141 7.83787C8.04714 7.58057 8.125 7.2962 8.125 6.98474C8.125 6.53787 7.96589 6.15531 7.64766 5.83708C7.32943 5.51886 6.94687 5.35974 6.5 5.35974C6.05312 5.35974 5.67057 5.51886 5.35234 5.83708C5.03411 6.15531 4.875 6.53787 4.875 6.98474C4.875 7.2962 4.95286 7.58057 5.10859 7.83787C5.26432 8.09516 5.4776 8.29151 5.74844 8.42693L5.28125 11.0472ZM6.5 16.7347C4.61771 16.2608 3.0638 15.1808 1.83828 13.4949C0.61276 11.809 0 9.93682 0 7.87849V2.92224L6.5 0.484741L13 2.92224V7.87849C13 9.93682 12.3872 11.809 11.1617 13.4949C9.9362 15.1808 8.38229 16.2608 6.5 16.7347Z"
            fill="#2B4380"
          />
        </svg>
        <span
          style={{
            color: "#2B4380",
          }}
        >
          {text}
        </span>
      </div>
    </GcdsContainer>
  );
}

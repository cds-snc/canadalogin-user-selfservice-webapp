import {
  GcdsButton,
  GcdsContainer,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface ErrorPageProps {
  title: string;
  text: string;
  primaryButtonName?: string;
  primaryButtonLink?: string;
  primaryButtonOnClick?: ComponentPropsWithoutRef<
    typeof GcdsButton
  >["onGcdsClick"];
  secondaryButtonName?: string;
  secondaryButtonLink?: string;
  secondaryText?: ReactNode;
}

export default function ErrorPage({
  title,
  text,
  primaryButtonName,
  primaryButtonLink,
  primaryButtonOnClick,
  secondaryButtonName,
  secondaryButtonLink,
  secondaryText,
}: ErrorPageProps) {
  const showPrimaryButton = Boolean(primaryButtonName && primaryButtonLink);
  const showSecondaryButton = Boolean(
    secondaryButtonName && secondaryButtonLink,
  );

  return (
    <GcdsContainer role="main" alignment="center">
      <GcdsHeading tag="h1">{title}</GcdsHeading>
      <GcdsText>{text}</GcdsText>
      {(showPrimaryButton || showSecondaryButton) && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--gcds-spacing-200)",
            marginBottom: "var(--gcds-spacing-300)",
          }}
        >
          {showPrimaryButton && (
            <GcdsButton
              type="link"
              buttonRole="primary"
              href={primaryButtonLink}
              onGcdsClick={primaryButtonOnClick}
            >
              {primaryButtonName}
            </GcdsButton>
          )}
          {showSecondaryButton && (
            <GcdsButton
              type="link"
              buttonRole="secondary"
              href={secondaryButtonLink}
            >
              {secondaryButtonName}
            </GcdsButton>
          )}
        </div>
      )}
      {secondaryText && <GcdsText>{secondaryText}</GcdsText>}
    </GcdsContainer>
  );
}

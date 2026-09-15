import { GcdsContainer } from "@gcds-core/components-react";
import type { ReactNode } from "react";
import ErrorSummaryWithFocus from "../ErrorSummaryWithFocus/ErrorSummaryWithFocus";

interface StepContentProps {
  StepComponent: ReactNode;
  language?: string;
  errorCode?: string | null;
  errorMessage?: string;
  errorLinks?: Record<string, string>;
}

export default function StepContent({
  StepComponent,
  language,
  errorCode,
  errorMessage,
  errorLinks,
}: StepContentProps) {
  return (
    <GcdsContainer>
      <ErrorSummaryWithFocus
        errorCode={errorCode}
        errorMessage={errorMessage}
        errorLinks={errorLinks}
        language={language}
      />

      {StepComponent}
    </GcdsContainer>
  );
}

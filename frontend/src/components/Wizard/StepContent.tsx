import { GcdsContainer } from "@gcds-core/components-react";
import type { ReactNode } from "react";
import ErrorSummaryWithFocus from "../ErrorSummaryWithFocus/ErrorSummaryWithFocus";

interface StepContentProps {
  StepComponent: ReactNode;
  language?: string;
  errorCode?: string | null;
  errorMessage?: string;
}

export default function StepContent({
  StepComponent,
  language,
  errorCode,
  errorMessage,
}: StepContentProps) {
  return (
    <GcdsContainer>
      <ErrorSummaryWithFocus
        errorCode={errorCode}
        errorMessage={errorMessage}
        language={language}
      />

      {StepComponent}
    </GcdsContainer>
  );
}

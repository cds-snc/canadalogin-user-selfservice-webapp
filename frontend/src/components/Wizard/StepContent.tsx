import { GcdsContainer } from "@gcds-core/components-react";
import type { ReactNode } from "react";
import ErrorSummaryWithFocus from "../ErrorSummaryWithFocus/ErrorSummaryWithFocus";

interface StepContentProps {
  StepComponent: ReactNode;
  language?: string;
  errorCode?: string | null;
}

export default function StepContent({
  StepComponent,
  language,
  errorCode,
}: StepContentProps) {
  return (
    <GcdsContainer>
      <ErrorSummaryWithFocus errorCode={errorCode} language={language} />

      {StepComponent}
    </GcdsContainer>
  );
}

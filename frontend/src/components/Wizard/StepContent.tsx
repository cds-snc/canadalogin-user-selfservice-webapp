import { GcdsContainer } from "@cdssnc/gcds-components-react";
import ErrorSummaryWithFocus from "../ErrorSummaryWithFocus/ErrorSummaryWithFocus";
import { ReactNode } from "react";

type StepContentProps = {
  StepComponent?: ReactNode;
  language?: string;
  errorCode?: string | null;
};

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

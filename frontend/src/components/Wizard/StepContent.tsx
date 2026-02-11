import { GcdsContainer } from "@cdssnc/gcds-components-react";
import ErrorSummaryWithFocus from "../ErrorSummaryWithFocus/ErrorSummaryWithFocus";

export default function StepContent({ StepComponent, language, errorCode }) {
  return (
    <GcdsContainer>
      <ErrorSummaryWithFocus errorCode={errorCode} language={language} />

      {StepComponent}
    </GcdsContainer>
  );
}

import { GcdsButton } from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions.jsx";

export default function SubmitButton({ currentLang, disabled }) {
  const { submit } = getPageContent(currentLang, "Button");
  if (disabled) {
    return (
      <GcdsButton type="submit" disabled>
        {submit}
      </GcdsButton>
    );
  } else {
    return <GcdsButton type="submit">{submit}</GcdsButton>;
  }
}

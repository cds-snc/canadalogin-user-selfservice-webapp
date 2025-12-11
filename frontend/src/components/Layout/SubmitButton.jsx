import { GcdsButton } from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions.jsx";

export default function SubmitButton({
  currentLang,
  disabled,
  onGcdsClick,
  style,
  children,
  onKeyDown,
  ...props
}) {
  const { submit } = getPageContent(currentLang, "Button");

  return (
    <GcdsButton
      type="submit"
      disabled={disabled}
      onGcdsClick={onGcdsClick}
      onKeyDown={onKeyDown}
      style={style}
      {...props}
    >
      {children || submit}
    </GcdsButton>
  );
}

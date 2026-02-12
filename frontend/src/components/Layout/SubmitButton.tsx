import { GcdsButton } from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { ReactNode, CSSProperties, KeyboardEventHandler } from "react";

type SubmitButtonProps = {
  currentLang?: string;
  disabled?: boolean;
  onGcdsClick?: (...args: any[]) => void;
  style?: CSSProperties;
  children?: ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
} & Record<string, unknown>;

export default function SubmitButton({
  currentLang,
  disabled,
  onGcdsClick,
  style,
  children,
  onKeyDown,
  ...props
}: SubmitButtonProps) {
  const { submit } = getPageContent(currentLang, "Button");

  return (
    <GcdsButton
      type="submit"
      disabled={disabled}
      onGcdsClick={onGcdsClick}
      onKeyDown={onKeyDown}
      style={style}
      {...(props as Record<string, any>)}
    >
      {children || submit}
    </GcdsButton>
  );
}

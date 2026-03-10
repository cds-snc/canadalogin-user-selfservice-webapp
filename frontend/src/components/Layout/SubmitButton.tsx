import { GcdsButton } from "@cdssnc/gcds-components-react";
import type {
  CSSProperties,
  ComponentPropsWithoutRef,
  KeyboardEventHandler,
  ReactNode,
} from "react";
import { getPageContent } from "../../utils/functions";

type BaseButtonProps = Omit<
  ComponentPropsWithoutRef<typeof GcdsButton>,
  "children" | "disabled" | "onKeyDown" | "style" | "type"
>;

interface SubmitButtonProps extends BaseButtonProps {
  currentLang: string;
  disabled?: boolean;
  onGcdsClick?: BaseButtonProps["onGcdsClick"];
  style?: CSSProperties;
  children?: ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
}

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
      {...props}
    >
      {children || submit}
    </GcdsButton>
  );
}

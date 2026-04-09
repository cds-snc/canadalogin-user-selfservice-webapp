import { GcdsButton } from "@gcds-core/components-react";
import type {
  CSSProperties,
  ComponentPropsWithoutRef,
  KeyboardEventHandler,
  ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

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
  currentLang: _currentLang,
  disabled,
  onGcdsClick,
  style,
  children,
  onKeyDown,
  ...props
}: SubmitButtonProps) {
  const { t } = useTranslation("common");

  return (
    <GcdsButton
      type="submit"
      disabled={disabled}
      onGcdsClick={onGcdsClick}
      onKeyDown={onKeyDown}
      style={style}
      {...props}
    >
      {children || t("Button.submit")}
    </GcdsButton>
  );
}

import { GcdsNotice } from "@gcds-core/components-react";
import { useEffect, useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type AccessibleNoticeProps = ComponentPropsWithoutRef<typeof GcdsNotice> & {
  children?: ReactNode;
  focusOnMount?: boolean;
};

export default function AccessibleNotice(props: AccessibleNoticeProps) {
  const { focusOnMount = false, ...restProps } = props;
  const generatedId = useId();

  const noticeProps = { ...restProps } as Record<string, unknown> & {
    noticeRole?: string;
    id?: string;
  };

  if (focusOnMount) {
    if (!noticeProps.id) {
      noticeProps.id = `accessible-notice-${generatedId}`;
    }

    if (!noticeProps.tabindex && !noticeProps.tabIndex) {
      noticeProps.tabIndex = -1;
    }

    if (!noticeProps["data-page-focus-target"]) {
      noticeProps["data-page-focus-target"] = "true";
    }
  }

  if (!noticeProps.role) {
    noticeProps.role = noticeProps.noticeRole === "danger" ? "alert" : "status";
  }

  if (!noticeProps["aria-live"]) {
    noticeProps["aria-live"] =
      noticeProps.noticeRole === "danger" ? "assertive" : "polite";
  }

  if (!noticeProps["aria-atomic"]) {
    noticeProps["aria-atomic"] = "true";
  }

  useEffect(() => {
    if (!focusOnMount || typeof noticeProps.id !== "string") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const noticeElement = document.getElementById(noticeProps.id as string);
      noticeElement?.focus();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [focusOnMount, noticeProps.id]);

  return <GcdsNotice {...(noticeProps as AccessibleNoticeProps)} />;
}

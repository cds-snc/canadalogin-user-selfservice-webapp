import { GcdsNotice } from "@gcds-core/components-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type AccessibleNoticeProps = ComponentPropsWithoutRef<typeof GcdsNotice> & {
  children?: ReactNode;
};

export default function AccessibleNotice(props: AccessibleNoticeProps) {
  const noticeProps = { ...props } as Record<string, unknown> & {
    noticeRole?: string;
  };

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

  return <GcdsNotice {...(noticeProps as AccessibleNoticeProps)} />;
}

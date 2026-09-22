import { GcdsNotice } from "@gcds-core/components-react";
import { useEffect, useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

const NOTICE_FOCUS_NO_RING_CLASS = "notice-focus-no-ring";

const normalizeNoticeText = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const buildAnnouncementText = (title: string, body: string) => {
  const normalizedTitle = normalizeNoticeText(title);
  const normalizedBody = normalizeNoticeText(body);

  if (normalizedTitle && normalizedBody) {
    return normalizedBody.startsWith(normalizedTitle)
      ? normalizedBody
      : `${normalizedTitle}. ${normalizedBody}`;
  }

  return normalizedTitle || normalizedBody;
};

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
    className?: string;
    noticeTitle?: unknown;
  };

  const noticeTitleForAnnouncement =
    typeof noticeProps.noticeTitle === "string" ? noticeProps.noticeTitle : "";
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

    if (typeof noticeProps.className === "string") {
      noticeProps.className = `${noticeProps.className} ${NOTICE_FOCUS_NO_RING_CLASS}`;
    } else {
      noticeProps.className = NOTICE_FOCUS_NO_RING_CLASS;
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

      if (
        noticeElement &&
        !noticeElement.getAttribute("aria-label") &&
        !noticeElement.getAttribute("aria-labelledby")
      ) {
        const announcementText = normalizeNoticeText(
          buildAnnouncementText(
            noticeTitleForAnnouncement,
            noticeElement.textContent || "",
          ),
        );

        if (announcementText) {
          noticeElement.setAttribute("aria-label", announcementText);
        }
      }
      noticeElement?.focus();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [focusOnMount, noticeProps.id, noticeTitleForAnnouncement]);

  return <GcdsNotice {...(noticeProps as AccessibleNoticeProps)} />;
}

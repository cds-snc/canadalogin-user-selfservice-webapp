import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsNotice,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { type ComponentPropsWithoutRef, useEffect, useState } from "react";
import { useParams } from "react-router";

import { PAGES } from "../../../utils/constants";
import { getPageContent } from "../../../utils/functions";

type ButtonClickEvent = Parameters<
  NonNullable<ComponentPropsWithoutRef<typeof GcdsButton>["onGcdsClick"]>
>[0];

interface PasswordChangedConfirmationProps {
  onNext: () => void | Promise<void>;
}

const initialTime = 20;

export default function PasswordChangedConfirmation({
  onNext,
}: PasswordChangedConfirmationProps) {
  const { language } = useParams();
  const resolvedLanguage = language ?? "en";
  const [time, setTime] = useState(initialTime);

  const pageContentJson =
    getPageContent(resolvedLanguage, PAGES.passwordChangedConfirmation) ?? {};

  useEffect(() => {
    if (time <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [time]);

  useEffect(() => {
    if (time <= 0) {
      void onNext();
    }
  }, [onNext, time]);

  return (
    <GcdsContainer>
      <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=" ">
        <GcdsText>{pageContentJson["1"]}</GcdsText>
      </GcdsNotice>
      <br />
      &nbsp;
      <GcdsHeading tag="h1">{pageContentJson["2"]}</GcdsHeading>
      <GcdsText>
        {pageContentJson["3"]} {time} {pageContentJson["4"]}
      </GcdsText>
      <GcdsText>{pageContentJson["5"]}</GcdsText>
      <GcdsGrid columns="auto auto" gap="300" align-items="center">
        <GcdsButton
          style={{ width: "fit-content" }}
          onGcdsClick={(event: ButtonClickEvent) => {
            event.preventDefault();
            void onNext();
          }}
        >
          {pageContentJson["6"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

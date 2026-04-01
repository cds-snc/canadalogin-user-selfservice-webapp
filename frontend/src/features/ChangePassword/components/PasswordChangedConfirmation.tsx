import { useState, useEffect } from "react";
import { useParams } from "react-router";

import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
} from "@gcds-core/components-react";
import { getPageContent } from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";

const initialTime = 20;

interface PasswordChangedConfirmationProps {
  onNext: () => void | Promise<void>;
}

export default function PasswordChangedConfirmation({
  onNext,
}: PasswordChangedConfirmationProps) {
  const { language } = useParams<{ language: string }>();
  const [time, setTime] = useState(initialTime);

  const pageContentJson =
    getPageContent(language, PAGES.passwordChangedConfirmation) ?? {};

  useEffect(() => {
    if (time <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  useEffect(() => {
    if (time <= 0) {
      onNext();
      return;
    }
  }, [onNext, time]);

  return (
    <GcdsContainer>
      <GcdsNotice noticeRole="success" noticeTitleTag="h2" noticeTitle=" ">
        <GcdsText>{pageContentJson["1"]}</GcdsText>
      </GcdsNotice>
      <br />
      &nbsp;
      <GcdsHeading tag="h1">{pageContentJson["2"]}</GcdsHeading>
      <GcdsText>
        {pageContentJson["3"]} {time} {pageContentJson["4"]}
      </GcdsText>
      <GcdsText>{pageContentJson["5"]}</GcdsText>
      <GcdsGrid columns="auto auto" gap="200" align-items="center">
        <GcdsButton
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            onNext();
          }}
        >
          {pageContentJson["6"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

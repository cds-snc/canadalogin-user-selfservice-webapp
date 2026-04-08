import { useState, useEffect } from "react";

import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";

const initialTime = 20;

interface PasswordChangedConfirmationProps {
  onNext: () => void | Promise<void>;
}

export default function PasswordChangedConfirmation({
  onNext,
}: PasswordChangedConfirmationProps) {
  const { t } = useTranslation("password");
  const [time, setTime] = useState(initialTime);

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
        <GcdsText>{t("PasswordChangedConfirmation.title")}</GcdsText>
      </GcdsNotice>
      <br />
      &nbsp;
      <GcdsHeading tag="h1">
        {t("PasswordChangedConfirmation.signInNewPassword")}
      </GcdsHeading>
      <GcdsText>
        {t("PasswordChangedConfirmation.redirectCountdown")} {time}{" "}
        {t("PasswordChangedConfirmation.seconds")}
      </GcdsText>
      <GcdsText>{t("PasswordChangedConfirmation.notRedirected")}</GcdsText>
      <GcdsGrid columns="auto auto" gap="200" align-items="center">
        <GcdsButton
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            onNext();
          }}
        >
          {t("PasswordChangedConfirmation.signIn")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

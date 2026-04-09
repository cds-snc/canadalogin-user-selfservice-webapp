import { useLocation, useParams } from "react-router";
import { useTranslation } from "react-i18next";

import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";
import NoticeFactory from "../../../../components/InfoBlocks/NoticeFactory";

interface DeleteFIDO2PasskeySuccessProps {
  onNext: () => void;
}

export default function DeleteFIDO2PasskeySuccess({
  onNext,
}: DeleteFIDO2PasskeySuccessProps) {
  const location = useLocation();
  const { language } = useParams();
  const { passkeyNickname } = (location.state ?? {}) as {
    passkeyNickname?: string;
  };
  const { t } = useTranslation("fido2");

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="400">
        <NoticeFactory
          noticeType={"passkeyDeleted"}
          passkeyName={passkeyNickname}
        />
        <GcdsContainer>
          <GcdsHeading tag="h1" lang={language}>
            {t("DeleteFIDO2PasskeySuccess.title")}
          </GcdsHeading>
          <GcdsText>
            {t("DeleteFIDO2PasskeySuccess.recommendAlso")}{" "}
            <strong>
              {t("DeleteFIDO2PasskeySuccess.removeFromManager")}
            </strong>{" "}
          </GcdsText>
          <GcdsText>{t("DeleteFIDO2PasskeySuccess.moreInformation")}</GcdsText>
        </GcdsContainer>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          buttonRole="primary"
          style={{ width: "fit-content" }}
          onGcdsClick={onNext}
        >
          {t("DeleteFIDO2PasskeySuccess.continueButton")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

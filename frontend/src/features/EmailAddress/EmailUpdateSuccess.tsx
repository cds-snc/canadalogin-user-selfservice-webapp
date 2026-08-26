import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { EXTERNAL_NAVIGATION_LINKS } from "../../utils/constants";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsButton,
  GcdsGrid,
  GcdsLink,
  GcdsNotice,
} from "@gcds-core/components-react";
import SubmitButton from "../../components/Layout/SubmitButton";

interface EmailUpdateSuccessProps {
  newEmailAddress: string;
  onBackToProfile: () => void | Promise<void>;
  onSignOut: (e: React.MouseEvent) => Promise<void>;
}

export default function EmailUpdateSuccess({
  newEmailAddress,
  onBackToProfile,
  onSignOut,
}: EmailUpdateSuccessProps) {
  const { language = "en" } = useParams<{ language?: string }>();
  const { t } = useTranslation("email");

  return (
    <GcdsContainer role="main">
      <GcdsNotice
        noticeRole="success"
        noticeTitleTag="h2"
        noticeTitle={t("EmailUpdateSuccess.successTitle")}
        lang={language}
      >
        <GcdsText>
          {t("EmailUpdateSuccess.emailUpdatedTo")}{" "}
          <strong>{newEmailAddress}</strong>.
        </GcdsText>
      </GcdsNotice>

      <GcdsHeading tag="h1" lang={language} marginBottom="300" marginTop="400">
        {t("EmailUpdateSuccess.updateOtherPlaces")}
      </GcdsHeading>

      <GcdsText marginBottom="300" lang={language}>
        {t("EmailUpdateSuccess.onlyConnectedServices")}
      </GcdsText>

      <GcdsText marginBottom="300" lang={language}>
        {t("EmailUpdateSuccess.notConnectedNotice")}
      </GcdsText>

      <GcdsText marginBottom="300" lang={language}>
        {t("EmailUpdateSuccess.searchOtherAccounts")}{" "}
        <GcdsLink href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}>
          {t("EmailUpdateSuccess.gcAccountDirectory")}
        </GcdsLink>
        {t("EmailUpdateSuccess.period")}
      </GcdsText>

      <GcdsNotice
        noticeRole="warning"
        noticeTitleTag="h2"
        noticeTitle={t("EmailUpdateSuccess.syncNoticeTitle")}
        lang={language}
      >
        <GcdsText>{t("EmailUpdateSuccess.syncNoticeDescription")}</GcdsText>
        <GcdsText>
          <GcdsLink href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}>
            {t("EmailUpdateSuccess.servicesLinkText")}
          </GcdsLink>
        </GcdsText>
      </GcdsNotice>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          currentLang={language}
          style={{ width: "fit-content" }}
          onClick={onBackToProfile}
        >
          {t("EmailUpdateSuccess.backToProfile")}
        </SubmitButton>
        <GcdsButton
          buttonRole="secondary"
          onClick={onSignOut}
          style={{ width: "fit-content" }}
        >
          {t("EmailUpdateSuccess.signOut")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

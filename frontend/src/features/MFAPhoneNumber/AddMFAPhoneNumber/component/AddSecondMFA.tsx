import {
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";
import { useParams } from "react-router";
import { FLOW_TYPES } from "../../../../utils/constants";
import { useTranslation } from "react-i18next";
import SubmitButton from "../../../../components/Layout/SubmitButton";

interface PhoneFormData {
  phoneNumber: string;
  otp: string;
  mfaId: string;
  trxnId: string;
  otpType: string;
  formattedPhoneNumber: string;
}

interface AddSecondMFAProps {
  phoneFormData: PhoneFormData;
  onSkipForNow: () => Promise<void>;
  onAddSecondMFA: () => Promise<void>;
}

export default function AddSecondMFA({
  phoneFormData,
  onSkipForNow,
  onAddSecondMFA,
}: AddSecondMFAProps) {
  const { language } = useParams();
  const { t } = useTranslation(["mfa", "otp"]);
  const pageName =
    phoneFormData.otpType === FLOW_TYPES.voice
      ? "AddSecondMFATextMessage"
      : "AddSecondMFAVoiceCall";

  const onSubmitHandler = async (ev: Event) => {
    ev.preventDefault();
    await onAddSecondMFA();
  };

  return (
    <GcdsContainer role="main">
      <section>
        <GcdsNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={t("NoticeFactory.notice_title_success", { ns: "otp" })}
        >
          <GcdsText>
            {t(`${pageName}.youHaveAdded`)}{" "}
            <strong>{phoneFormData.formattedPhoneNumber} </strong>
            {t(`${pageName}.asVerificationNumber`)}
          </GcdsText>
        </GcdsNotice>
      </section>

      <section>
        <GcdsHeading tag="h1" lang={language}>
          {t(`${pageName}.title`)}
        </GcdsHeading>

        <GcdsText>
          {t(`${pageName}.settingUpAllows`)}{" "}
          <strong>{t(`${pageName}.methodName`)}</strong>{" "}
          {t(`${pageName}.whenSigningIn`)}
        </GcdsText>

        <GcdsText>{t(`${pageName}.recommendation`)}</GcdsText>
      </section>

      <section>
        <GcdsHeading tag="h2">{t(`${pageName}.wouldYouLike`)}</GcdsHeading>

        <GcdsGrid columns="1" gap="300">
          <SubmitButton
            style={{ width: "fit-content" }}
            onGcdsClick={onSubmitHandler}
            currentLang={language ?? "en"}
          >
            {t(`${pageName}.yesSetUp`)}
          </SubmitButton>

          <GcdsLink
            onGcdsClick={async (ev) => {
              ev.preventDefault();
              await onSkipForNow();
            }}
          >
            {t(`${pageName}.noSkip`)}
          </GcdsLink>
        </GcdsGrid>
      </section>
    </GcdsContainer>
  );
}

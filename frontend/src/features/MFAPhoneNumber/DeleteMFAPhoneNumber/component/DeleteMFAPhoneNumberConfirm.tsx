import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";
import { useParams } from "react-router";
import { PAGES } from "../../../../utils/constants";
import { useTranslation } from "react-i18next";
import { path } from "../../../../utils/routeHelpers";

interface PhoneFormData {
  formattedPhoneNumber?: string;
}

interface DeleteMFAPhoneNumberConfirmProps {
  onNext: () => Promise<void>;
  onCancel: () => Promise<void>;
  phoneFormData: PhoneFormData;
}

export default function DeleteMFAPhoneNumberConfirm({
  onNext,
  onCancel,
  phoneFormData,
}: DeleteMFAPhoneNumberConfirmProps) {
  const { language } = useParams();
  const backtoProfilePage = path(PAGES.ProfileHome, { language: language });
  const { t } = useTranslation("mfa");

  const onSubmitHandler = async (ev: Event) => {
    ev.preventDefault();
    await onNext();
  };

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        <GcdsContainer>
          <GcdsGrid columns="1" gap="200">
            <GcdsHeading tag="h1" lang={language}>
              {t("DeleteMFAPhoneNumberConfirm.title")}
            </GcdsHeading>

            <GcdsText>
              {t("DeleteMFAPhoneNumberConfirm.noLongerUse")}{" "}
              <strong>{phoneFormData?.formattedPhoneNumber}</strong>{" "}
              {t("DeleteMFAPhoneNumberConfirm.toSignIn")}
            </GcdsText>

            <GcdsText>
              {t("DeleteMFAPhoneNumberConfirm.thisText")}{" "}
              <strong>{t("DeleteMFAPhoneNumberConfirm.willNot")}</strong>{" "}
              {t("DeleteMFAPhoneNumberConfirm.deleteFromContact")}{" "}
              <GcdsLink href={backtoProfilePage}>
                {t("DeleteMFAPhoneNumberConfirm.personalInformation")}
              </GcdsLink>
              {t("DeleteMFAPhoneNumberConfirm.period")}
            </GcdsText>
          </GcdsGrid>
        </GcdsContainer>

        <GcdsNotice
          noticeRole="info"
          noticeTitleTag="h2"
          noticeTitle={t("DeleteMFAPhoneNumberConfirm.infoTitle")}
        >
          <GcdsText>
            {t("DeleteMFAPhoneNumberConfirm.infoDescription")}
          </GcdsText>
        </GcdsNotice>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton buttonRole="danger" onGcdsClick={onSubmitHandler}>
            {t("DeleteMFAPhoneNumberConfirm.confirmButton")}
          </GcdsButton>

          <GcdsButton
            buttonRole="secondary"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onCancel();
            }}
          >
            {t("DeleteMFAPhoneNumberConfirm.cancelButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}

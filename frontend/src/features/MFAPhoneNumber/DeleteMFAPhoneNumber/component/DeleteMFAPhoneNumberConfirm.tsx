import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
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
      <GcdsGrid columns="1" gap="500">
        <GcdsContainer>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "32px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <GcdsHeading tag="h1" lang={language}>
                {t("DeleteMFAPhoneNumberConfirm.title")}
              </GcdsHeading>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              <GcdsText>
                {t("DeleteMFAPhoneNumberConfirm.noLongerUse")}{" "}
                <strong>{phoneFormData?.formattedPhoneNumber}</strong>{" "}
                {t("DeleteMFAPhoneNumberConfirm.toSignIn")}
              </GcdsText>
              <GcdsText>
                {t("DeleteMFAPhoneNumberConfirm.thisText")}{" "}
                {t("DeleteMFAPhoneNumberConfirm.willNot")}{" "}
                {t("DeleteMFAPhoneNumberConfirm.deleteFromContact")}{" "}
                <GcdsLink href={backtoProfilePage}>
                  {t("DeleteMFAPhoneNumberConfirm.personalInformation")}
                </GcdsLink>
                {t("DeleteMFAPhoneNumberConfirm.period")}
              </GcdsText>
            </div>
          </div>
        </GcdsContainer>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          buttonRole="danger"
          style={{ width: "fit-content" }}
          onGcdsClick={onSubmitHandler}
        >
          {t("DeleteMFAPhoneNumberConfirm.confirmButton")}
        </GcdsButton>

        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            onCancel();
          }}
        >
          {t("DeleteMFAPhoneNumberConfirm.cancelButton")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

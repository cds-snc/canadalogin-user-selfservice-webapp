import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsText,
} from "@gcds-core/components-react";

interface AddFIDO2PasskeyNicknameProps {
  setErrorCode: (code: string) => void;
  errorMessage: string;
  onSubmit: (deviceName: string) => Promise<void>;
  onCancel: () => void;
  registrationLoading: boolean;
  initialNickname?: string;
}

export default function AddFIDO2PasskeyNickname({
  setErrorCode,
  errorMessage,
  onSubmit,
  onCancel,
  registrationLoading,
  initialNickname = "",
}: AddFIDO2PasskeyNicknameProps) {
  const { language } = useParams();
  const { t } = useTranslation("fido2");
  const [newDeviceName, setNewDeviceName] = useState(initialNickname);

  const handleSubmit = async () => {
    if (!newDeviceName || newDeviceName.trim() === "") {
      setErrorCode("error_passkey_name_required");
      return;
    }
    await onSubmit(newDeviceName);
  };

  const onSubmitHandler: React.FormEventHandler<HTMLFormElement> = (ev) => {
    ev.preventDefault();
    void handleSubmit();
  };

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1" lang={language}>
          {t("AddFIDO2PasskeyNickname.title")}
        </GcdsHeading>
        <GcdsText marginBottom="0">
          {t("AddFIDO2PasskeyNickname.description")}
        </GcdsText>
        <form onSubmit={onSubmitHandler}>
          <GcdsInput
            errorMessage={errorMessage}
            inputId="passkey-name"
            label={t("AddFIDO2PasskeyNickname.label")}
            value={newDeviceName}
            onGcdsInput={(e: CustomEvent<string>) =>
              setNewDeviceName((e.target as HTMLInputElement).value)
            }
            hint={t("AddFIDO2PasskeyNickname.placeholder")}
          />
        </form>
        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            onClick={async (e) => {
              e.preventDefault();
              await handleSubmit();
            }}
            disabled={registrationLoading}
          >
            {t("AddFIDO2PasskeyNickname.continueButton")}
          </GcdsButton>
          <GcdsButton
            buttonRole="secondary"
            onClick={onCancel}
            disabled={registrationLoading}
          >
            {t("AddFIDO2PasskeyNickname.cancelButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}

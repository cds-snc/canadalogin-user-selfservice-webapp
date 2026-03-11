import { useParams } from "react-router";
import { getPageContent } from "../../../../utils/functions";
import { PAGES } from "../../../../utils/constants";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@cdssnc/gcds-components-react";

interface DeleteFIDO2PasskeyConfirmProps {
  passkeyNickname?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteFIDO2PasskeyConfirm({
  passkeyNickname,
  onConfirm,
  onCancel,
}: DeleteFIDO2PasskeyConfirmProps) {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    PAGES.deleteFIDO2PasskeyConfirm,
  )!;

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="500">
        <GcdsContainer>
          <GcdsHeading tag="h1" lang={language}>
            {pageContentJson["1"]}
          </GcdsHeading>
          <GcdsText>
            {pageContentJson["2"]} <strong>{passkeyNickname}</strong>{" "}
            {pageContentJson["3"]}
          </GcdsText>
        </GcdsContainer>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          buttonRole="danger"
          style={{ width: "fit-content" }}
          onGcdsClick={async (ev) => {
            ev.preventDefault();
            await onConfirm();
          }}
        >
          {pageContentJson["9"]}
        </GcdsButton>

        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            onCancel();
          }}
        >
          {pageContentJson["10"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

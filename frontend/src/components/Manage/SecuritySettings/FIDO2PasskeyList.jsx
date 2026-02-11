import {
  GcdsButton,
  GcdsContainer,
  GcdsText,
  GcdsGrid,
} from "@cdssnc/gcds-components-react";
import { useNavigate, useParams } from "react-router";
import { PAGES } from "../../../utils/constants.jsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";

export default function FIDO2PasskeyList({ userFIDO2CredentialsData }) {
  const { language } = useParams();
  const navigate = useNavigate();
  const pageContent = getPageContent(language, PAGES.manage2FAVerifications);

  const deletePasskeyPage = path(PAGES.deleteFIDO2PasskeyPage, {
    language: language,
  });
  const renamePasskeyPage = path(PAGES.renameFIDO2PasskeyPage, {
    language: language,
  });

  return userFIDO2CredentialsData.map(({ id, attributes, created }) => {
    return (
      <GcdsContainer key={id}>
        <GcdsText>
          <strong>{`${attributes.nickname}`}</strong>
        </GcdsText>
        <GcdsText>
          <strong>{pageContent["16"]}</strong>
          {new Date(created).toLocaleString()}
        </GcdsText>
        <GcdsGrid columns="max-content max-content max-content" gap="200">
          <GcdsButton
            id="rename-fido2-button"
            buttonRole="secondary"
            onGcdsClick={() => {
              navigate(`${renamePasskeyPage}`, {
                state: { passkeyId: id, passkeyNickname: attributes.nickname },
              });
            }}
          >
            {pageContent["14"]}
          </GcdsButton>
          <GcdsButton
            id="delete-fido2-button"
            buttonRole="secondary"
            onClick={() => {
              navigate(`${deletePasskeyPage}`, {
                state: { passkeyId: id, passkeyNickname: attributes.nickname },
              });
            }}
          >
            {pageContent["13"]}
          </GcdsButton>
        </GcdsGrid>
        <div className="separator" />
      </GcdsContainer>
    );
  });
}

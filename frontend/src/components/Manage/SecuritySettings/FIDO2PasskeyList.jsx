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

  return userFIDO2CredentialsData.map(({ id, nickname, created }) => {
    return (
      <GcdsContainer key={id}>
        <GcdsText>
          <strong>{`${nickname}`}</strong>
        </GcdsText>
        <GcdsText>
          <strong>{pageContent["16"]}</strong>
          {new Date(created).toLocaleString()}
        </GcdsText>
        {userFIDO2CredentialsData.length > 1 && (
          <GcdsGrid columns="max-content max-content" gap="200">
            <GcdsButton
              id="delete-fido2-button"
              buttonRole="secondary"
              onClick={() => {
                navigate(`${deletePasskeyPage}/${id}`);
              }}
            >
              {pageContent["13"]}
            </GcdsButton>
            <GcdsButton
              id="rename-fido2-button"
              buttonRole="secondary"
              onGcdsClick={() => {}}
            >
              {pageContent["14"]}
            </GcdsButton>
          </GcdsGrid>
        )}
        <div className="separator" />
      </GcdsContainer>
    );
  });
}

import { useLocation, useNavigate, useParams } from "react-router";
import { path } from "../../../../utils/routeHelpers";
import { getPageContent } from "../../../../utils/functions";
import { NOTICE_TYPES, PAGES } from "../../../../utils/constants";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useState } from "react";
import { fido2Api } from "../../api/fido2Api";
import Loader from "../../../../components/Layout/Loading";

export default function DeleteFIDO2PasskeyConfirm({
  setErrorCode,
  assertionResult,
}) {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    PAGES.deleteFIDO2PasskeyConfirm,
  );
  const location = useLocation();
  const { passkeyId, passkeyNickname } = location.state ?? {};
  const errorPageContent = getPageContent(language, PAGES.error);
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();

  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  /**
   * Handle deleting FIDO2 credential with pre-verified assertion result
   */
  const handleDeleteFIDO2 = async () => {
    if (!passkeyId || !assertionResult) {
      setErrorCode(errorPageContent["error_delete_credential"]);
      return;
    }

    setErrorCode("");
    setLocalLoading(true);

    try {
      // Delete the passkey with assertion proof from previous step
      const response = await fido2Api.deleteRegistration(
        passkeyId,
        assertionResult,
      );

      if (response && response.success) {
        navigate(backToManage2FAVerificationsPage, {
          state: {
            noticeType: NOTICE_TYPES.passkeyDeleted,
            passkeyName: passkeyNickname,
          },
        });
      } else {
        throw new Error(errorPageContent["error_delete_credential"]);
      }
    } catch (err) {
      console.error(errorPageContent["error_delete_credential"], err);
      setErrorCode(errorPageContent["error_delete_credential"]);
    }
  };

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await handleDeleteFIDO2();
  };

  return localLoading ? (
    <Loader text={pageContentJson["11"]} />
  ) : (
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
          onGcdsClick={onSubmitHandler}
        >
          {pageContentJson["9"]}
        </GcdsButton>

        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigate(backToManage2FAVerificationsPage);
          }}
        >
          {pageContentJson["10"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

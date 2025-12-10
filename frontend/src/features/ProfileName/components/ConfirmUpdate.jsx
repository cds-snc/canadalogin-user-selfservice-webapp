import React from "react";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
  GcdsErrorMessage,
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";

import { getPageContent } from "../../../utils/functions.jsx";
import { PAGES } from "../../../utils/constants.jsx";
import Loader from "../../../components/Layout/Loading";
import RPNameDisplay from "../../../components/RPInfo/RPNameDisplay.jsx";

const ErrorMessage = ({ errorMessage }) => {
  return (
    <>
      {errorMessage && (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      )}
    </>
  );
};

export default function ConfirmUpdate({
  nameFormData,
  onConfirm,
  onCancel,
  errorMessage,
  localLoading,
}) {
  const { language } = useParams();

  const pageContentJson = getPageContent(
    language,
    PAGES.profileUpdateNameConfirmUpdate,
  );
  const loaderPageContentJson = getPageContent(language, PAGES.otpSelection);

  const formattedName = nameFormData?.formatted;

  if (!nameFormData?.formatted) return null;

  return localLoading ? (
    <Loader text={loaderPageContentJson["11"]} />
  ) : (
    <>
      <ErrorMessage errorMessage={errorMessage} />
      <GcdsContainer role="main">
        <GcdsGrid columns="1" gap="300">
          <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
          <div>
            <GcdsText marginBottom="400">
              {pageContentJson["2"]} <strong>{formattedName}</strong>.
            </GcdsText>
            <GcdsText marginBottom="0">{pageContentJson["4"]}</GcdsText>
            <ul>
              <li>
                <RPNameDisplay rpName={pageContentJson["5"]} />
              </li>
            </ul>
          </div>

          <GcdsNotice type="info" noticeTitleTag="h2" noticeTitle=" ">
            <GcdsText>
              {pageContentJson["7"]} <strong>{pageContentJson["11"]}</strong>{" "}
              {pageContentJson["12"]}
            </GcdsText>
          </GcdsNotice>
          <GcdsGrid columns="max-content max-content" gap="200">
            <GcdsButton
              onGcdsClick={async (ev) => {
                ev.preventDefault();
                await onConfirm();
              }}
            >
              {pageContentJson["8"]}
            </GcdsButton>
            <GcdsButton
              buttonRole="secondary"
              onGcdsClick={(ev) => {
                ev.preventDefault();
                onCancel();
              }}
            >
              {pageContentJson["9"]}
            </GcdsButton>
          </GcdsGrid>
        </GcdsGrid>
      </GcdsContainer>
    </>
  );
}

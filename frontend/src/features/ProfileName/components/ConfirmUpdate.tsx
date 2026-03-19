import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";

import { getPageContent } from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";
import Loader from "../../../components/Layout/Loading";
import RPNameDisplay from "../../../components/RPInfo/RPNameDisplay";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type {
  ProfileNameConfirmProps,
  ProfileNamePageContent,
} from "../../../types/profileName";

function ErrorMessage({ errorMessage }: { errorMessage?: string }) {
  return errorMessage ? (
    <GcdsErrorMessage messageId="message-props">
      {errorMessage}
    </GcdsErrorMessage>
  ) : null;
}

export default function ConfirmUpdate({
  nameFormData,
  onConfirm,
  onCancel,
  errorMessage,
  localLoading,
}: ProfileNameConfirmProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";

  const pageContentJson =
    (getPageContent(routeLanguage, PAGES.profileUpdateNameConfirmUpdate) as
      | ProfileNamePageContent
      | undefined) ?? {};
  const loaderPageContentJson =
    (getPageContent(routeLanguage, PAGES.otpSelection) as
      | ProfileNamePageContent
      | undefined) ?? {};

  const formattedName = nameFormData?.formatted;

  const onSubmitHandler = (event: Event | CustomEvent<string | void>) => {
    event.preventDefault();
    void onConfirm();
  };

  if (!formattedName) {
    return null;
  }

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
            <SubmitButton
              onGcdsClick={onSubmitHandler}
              currentLang={routeLanguage}
            >
              {pageContentJson["8"]}
            </SubmitButton>
            <GcdsButton
              buttonRole="secondary"
              onGcdsClick={(event: Event) => {
                event.preventDefault();
                void onCancel();
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

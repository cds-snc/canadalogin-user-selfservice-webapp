import { useParams } from "react-router";
import { getPageContent } from "../../utils/functions";
import { PAGES, EXTERNAL_NAVIGATION_LINKS } from "../../utils/constants";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsButton,
  GcdsGrid,
  GcdsLink,
  GcdsNotice,
} from "@gcds-core/components-react";
import SubmitButton from "../../components/Layout/SubmitButton";

interface EmailUpdateSuccessProps {
  newEmailAddress: string;
  onBackToProfile: () => void | Promise<void>;
  onSignOut: (e: React.MouseEvent) => Promise<void>;
}

export default function EmailUpdateSuccess({
  newEmailAddress,
  onBackToProfile,
  onSignOut,
}: EmailUpdateSuccessProps) {
  const { language } = useParams();
  const pageContentJson =
    getPageContent(language, PAGES.emailUpdateSuccess) ?? {};

  return (
    <GcdsContainer role="main">
      <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=" ">
        <GcdsText>
          {pageContentJson["1"]} <strong>{newEmailAddress}</strong>
        </GcdsText>
      </GcdsNotice>

      <GcdsHeading tag="h1" lang={language} marginBottom="300" marginTop="400">
        {pageContentJson["2"]}
      </GcdsHeading>

      <GcdsText marginBottom="300" lang={language}>
        <strong>{pageContentJson["3"]}</strong>
      </GcdsText>

      <GcdsText marginBottom="300" lang={language}>
        {pageContentJson["4"]}
      </GcdsText>

      <GcdsText marginBottom="300" lang={language}>
        {pageContentJson["5"]}{" "}
        <GcdsLink href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}>
          {pageContentJson["6"]}
        </GcdsLink>
        {pageContentJson["7"]}
      </GcdsText>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          currentLang={language ?? "en"}
          style={{ width: "fit-content" }}
          onClick={onBackToProfile}
        >
          {pageContentJson["8"]}
        </SubmitButton>
        <GcdsButton
          buttonRole="secondary"
          onClick={onSignOut}
          style={{ width: "fit-content" }}
        >
          {pageContentJson["9"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

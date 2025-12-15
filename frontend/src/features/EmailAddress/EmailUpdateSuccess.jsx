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
  GcdsIcon,
} from "@cdssnc/gcds-components-react";

export default function EmailUpdateSuccess({
  newEmailAddress,
  onBackToProfile,
  onSignOut,
}) {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    "YouMayUpdateEmailAtOtherPlaces",
  );

  return (
    <GcdsContainer role="main">
      <GcdsIcon
        name="check-circle"
        size="5rem"
        color="#00703c"
        marginBottom="300"
      />

      <GcdsHeading tag="h1" lang={language} marginBottom="300">
        {pageContentJson["1"]} {newEmailAddress}
      </GcdsHeading>

      <GcdsHeading tag="h2" lang={language} marginBottom="200">
        {pageContentJson["2"]}
      </GcdsHeading>

      <GcdsText marginBottom="200" lang={language}>
        {pageContentJson["3"]}
      </GcdsText>

      <GcdsText marginBottom="200" lang={language}>
        {pageContentJson["4"]}
      </GcdsText>

      <GcdsText marginBottom="200" lang={language}>
        {pageContentJson["5"]}{" "}
        <GcdsLink
          href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}
          target="_blank"
          external={true}
        >
          {pageContentJson["6"]}
        </GcdsLink>
      </GcdsText>

      <GcdsGrid columns="max-content max-content" gap="200" marginTop="400">
        <GcdsButton onClick={onBackToProfile} style={{ width: "fit-content" }}>
          {pageContentJson["7"]}
        </GcdsButton>
        <GcdsButton
          buttonRole="secondary"
          onClick={onSignOut}
          style={{ width: "fit-content" }}
        >
          {pageContentJson["8"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

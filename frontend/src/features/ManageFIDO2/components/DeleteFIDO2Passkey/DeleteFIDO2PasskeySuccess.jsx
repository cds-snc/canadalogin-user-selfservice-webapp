import { useLocation, useParams } from "react-router";
import { getPageContent } from "../../../../utils/functions";
import { PAGES } from "../../../../utils/constants";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import NoticeFactory from "../../../../components/InfoBlocks/NoticeFactory";

export default function DeleteFIDO2PasskeySuccess({ onNext }) {
  const location = useLocation();
  const { language } = useParams();
  const { passkeyNickname } = location.state ?? {};
  const pageContentJson = getPageContent(
    language,
    PAGES.deleteFIDO2PasskeySuccess,
  );

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="400">
        <NoticeFactory
          noticeType={"passkeyDeleted"}
          passkeyName={passkeyNickname}
        />
        <GcdsContainer>
          <GcdsHeading tag="h1" lang={language}>
            {pageContentJson["1"]}
          </GcdsHeading>
          <GcdsText>
            {pageContentJson["2"]} <strong>{pageContentJson["3"]}</strong>{" "}
          </GcdsText>
          <GcdsText>{pageContentJson["4"]}</GcdsText>
        </GcdsContainer>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          buttonRole="primary"
          style={{ width: "fit-content" }}
          onGcdsClick={onNext}
        >
          {pageContentJson["5"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

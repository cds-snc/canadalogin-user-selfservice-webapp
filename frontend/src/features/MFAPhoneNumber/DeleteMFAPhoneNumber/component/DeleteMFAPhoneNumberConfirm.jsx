import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";
import { PAGES } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
import { path } from "../../../../utils/routeHelpers";
import { useEnterKeySubmit } from "../../../../utils/enterKeyHandler";

export default function DeleteMFAPhoneNumberConfirm({
  onNext,
  onCancel,
  phoneFormData,
}) {
  const { language } = useParams();
  const backtoProfilePage = path(PAGES.ProfileHome, { language: language });
  const pageContentJson = getPageContent(
    language,
    PAGES.deleteMFAPhoneNumberConfirm,
  );

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await onNext();
  };

  const handleKeyDown = useEnterKeySubmit(onSubmitHandler);
  return (
    <GcdsContainer role="main" onKeyDown={handleKeyDown}>
      <GcdsGrid columns="1" gap="500">
        <GcdsContainer>
          <GcdsHeading tag="h1" lang={language}>
            {pageContentJson["1"]}
          </GcdsHeading>
          <GcdsText>
            {pageContentJson["2"]}{" "}
            <strong>{phoneFormData?.formattedPhoneNumber}</strong>{" "}
            {pageContentJson["3"]}
          </GcdsText>
          <GcdsText>
            {pageContentJson["4"]} {pageContentJson["5"]} {pageContentJson["6"]}{" "}
            <GcdsLink href={backtoProfilePage}>{pageContentJson["7"]}</GcdsLink>
            {pageContentJson["8"]}
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
            onCancel();
          }}
        >
          {pageContentJson["10"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@cdssnc/gcds-components-react";

import { getPageContent } from "../../../utils/functions";
import { EXTERNAL_NAVIGATION_LINKS, PAGES } from "../../../utils/constants";
import { useUser } from "../../../components/Providers/useUser";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type {
  ProfileNamePageContent,
  ProfileNameSuccessProps,
} from "../../../types/profileName";
import type {
  AuthServiceResponse,
  LogoutResponseData,
} from "../../../types/services";

export default function SuccessfullyUpdated({
  nameFormData,
  onBackToProfile,
}: ProfileNameSuccessProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";

  const { dispatch } = useUser();
  const pageContentJson =
    (getPageContent(routeLanguage, PAGES.profileUpdateNameSuccess) as
      | ProfileNamePageContent
      | undefined) ?? {};

  const { setLoading } = userProfileDispatch(dispatch);
  const username = nameFormData?.formatted || "";

  const handleSignout = async (event: Event) => {
    event.preventDefault();
    setLoading(true, pageContentJson["12"]);

    try {
      const response = (await authService.logout()) as
        | AuthServiceResponse<LogoutResponseData>
        | undefined;
      const redirectUrl = response?.data?.redirect_url || null;

      if (redirectUrl) {
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(true, pageContentJson["13"]);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const onSubmitHandler = (event: Event | CustomEvent<string | void>) => {
    event.preventDefault();
    void onBackToProfile();
  };

  return (
    <GcdsContainer role="main">
      <GcdsText>
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            <strong>
              {pageContentJson["1"]} {username}
            </strong>
          </GcdsText>
        </GcdsNotice>
      </GcdsText>
      <GcdsHeading tag="h1">{pageContentJson["2"]}</GcdsHeading>
      <GcdsHeading tag="h4">{pageContentJson["3"]}</GcdsHeading>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <GcdsText>
        {pageContentJson["5"]}{" "}
        <GcdsLink href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}>
          {pageContentJson["8"]}
        </GcdsLink>
      </GcdsText>
      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          currentLang={routeLanguage}
          style={{ width: "fit-content" }}
          onGcdsClick={onSubmitHandler}
        >
          {pageContentJson["6"]}
        </SubmitButton>
        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={handleSignout}
        >
          {pageContentJson["7"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

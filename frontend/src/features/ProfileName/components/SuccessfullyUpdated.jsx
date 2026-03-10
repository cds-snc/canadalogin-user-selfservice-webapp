import React from "react";
import { useParams } from "react-router";

import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
  GcdsLink,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions";
import { EXTERNAL_NAVIGATION_LINKS, PAGES } from "../../../utils/constants";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { authService } from "../../../services/authService";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";

export default function SuccessfullyUpdated({ nameFormData, onBackToProfile }) {
  const { language } = useParams();

  const { dispatch } = useUser();
  const pageContentJson = getPageContent(
    language,
    PAGES.profileUpdateNameSuccess,
  );

  const { setLoading } = userProfileDispatch(dispatch);

  const username = nameFormData?.formatted || "";

  const handleSignout = async (e) => {
    e.preventDefault();
    setLoading(true, pageContentJson["12"]);

    try {
      const response = await authService.logout();
      const redirectUrl = response?.data?.redirect_url || null;

      // Check if response has redirect_url
      if (redirectUrl) {
        // form been submitted in authService.logout
        return;
      } else {
        // Fallback redirect if no redirect_url provided
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Update loading text to show error
      setLoading(true, pageContentJson["13"]);
      // Redirect after error
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await onBackToProfile();
  };

  return (
    <GcdsContainer role="main">
      <GcdsText>
        {" "}
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
          style={{ width: "fit-content" }}
          onGcdsClick={onSubmitHandler}
        >
          {pageContentJson["6"]}
        </SubmitButton>
        &nbsp;
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

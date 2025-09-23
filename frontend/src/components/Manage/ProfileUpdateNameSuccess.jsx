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
import { getPageContent } from "../../utils/functions";
import { path } from "../../utils/routeHelpers.js";
import { PAGES } from "../../utils/constants";
import { useUser } from "../Providers/useUser";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";
import { authService } from "../../services/authService.jsx";
import { userProfileDispatch } from "../../utils/userProfileDispatch.jsx";

export default function ProfileUpdateNameSuccess() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const pageContentJson = getPageContent(
    language,
    PAGES.profileUpdateNameSuccess,
  );
  const navigateHelper = useNavigateHelper();
  const backToProfile = path(PAGES.ProfileHome, { language: language });
  const { setLoading } = userProfileDispatch(dispatch);

  const username = state?.userProfile?.name.formatted || "";

  const handleLogout = async (e) => {
    e.preventDefault();
    setLoading(true, pageContentJson["12"]);

    try {
      const response = await authService.logout();

      // Check if response has redirect_url and redirect
      if (response && response.data && response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      } else {
        // Fallback redirect if no redirect_url provided
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Update loading text to show error
      setLoading(true, "Sign out failed. Redirecting...");
      // Redirect after error
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };
  console.log("state", state);
  return (
    <GcdsContainer>
      <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=" ">
        <GcdsText>
          <strong>
            {pageContentJson["1"]} {username}
          </strong>
        </GcdsText>
      </GcdsNotice>
      <GcdsHeading tag="h1">{pageContentJson["2"]}</GcdsHeading>
      <GcdsHeading tag="h4">{pageContentJson["3"]}</GcdsHeading>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <GcdsText>
        {pageContentJson["5"]}{" "}
        <GcdsLink href="#">{pageContentJson["8"]}</GcdsLink>
      </GcdsText>
      <GcdsText>
        {pageContentJson["9"]}{" "}
        <GcdsLink href="#">{pageContentJson["10"]}</GcdsLink>
        {pageContentJson["11"]}
      </GcdsText>

      <GcdsGrid columns="auto auto" gap="1rem" align-items="center">
        <GcdsButton
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigateHelper(backToProfile);
          }}
        >
          {pageContentJson["6"]}
        </GcdsButton>
        &nbsp;
        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={handleLogout}
        >
          {pageContentJson["7"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

import { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";

import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
  GcdsLink,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { PAGES } from "../../../utils/constants.jsx";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { authService } from "../../../services/authService.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";

export default function SuccessfullyUpdatedName() {
  const { language } = useParams();
  const location = useLocation();

  const { state, dispatch } = useUser();
  const pageContentJson = getPageContent(
    language,
    PAGES.profileUpdateNameSuccess,
  );
  const navigate = useNavigate();

  const backToProfile = path(PAGES.ProfileHome, { language: language });
  const { setLoading } = userProfileDispatch(dispatch);

  const username = state?.userProfile?.name.formatted || "";
  const editProfile = path(PAGES.profileUpdateName, { language: language });

  // state comes from the navigate call in UpdateProfileName.jsx
  // If user directly navigates directly to this page, there will be no state and will redirected back to edit page
  const { name } = location.state ?? {};

  useEffect(() => {
    // If no name data, redirect to edit page
    if (!name) navigate(editProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignout = async (e) => {
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
      setLoading(true, pageContentJson["13"]);
      // Redirect after error
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };
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
      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigate(backToProfile);
          }}
        >
          {pageContentJson["6"]}
        </GcdsButton>
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

import { useParams } from "react-router";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
  GcdsLink,
  GcdsStepper,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions.jsx";

import { PAGES, NAVIGATION_LINKS, FLOW_TYPES } from "../../../utils/constants";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { authService } from "../../../services/authService.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";

export default function ConfirmContactPhoneNumberUpdate({
  step,
  totalSteps,
  onNext,
  onCancel,
  onChangePhoneForm,
  phoneFormData,
  userProfile,
}) {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { clearEditProfile, updateProfileSuccess } =
    userProfileDispatch(dispatch);
  const pageContentJson = getPageContent(
    language,
    PAGES.confirmContactPhoneNumberUpdate,
  );
  const navigateHelper = useNavigateHelper();
  const successPage = `/${language}${NAVIGATION_LINKS.profileYouMayUpdateName}`;
  const backtoProfile = `/${language}${NAVIGATION_LINKS.profileHome}`;

  const username = state?.editProfile?.name.formatted || "";

  const saveUpdatedProfileData = async () => {
    try {
      const response = await authService.update_my_user_profile(
        state.editProfile,
      );
      if (response) {
        clearEditProfile();
        updateProfileSuccess(response.data);
        return true;
      } else {
        // Todo: handle errors
      }
    } catch (err) {
      // Todo: handle errors
      console.log(err);
    }
  };

  console.log("state", state);
  const userMfaType = phoneFormData.otpType;

  return (
    <GcdsContainer>
      <GcdsGrid columns="1" gap="300">
        <GcdsStepper
          currentStep={step}
          totalSteps={totalSteps}
          tag="h1"
          lang={language}
        >
          {userMfaType === FLOW_TYPES.email
            ? pageContentJson["22"]
            : pageContentJson["1"]}
        </GcdsStepper>

        <GcdsText marginBottom="0">
          {pageContentJson["2"]}{" "}
          <strong>{phoneFormData.formattedPhoneNumber}</strong>.
        </GcdsText>
        <GcdsText>
          {pageContentJson["4"]}
          <ul>
            <li>{pageContentJson["5"]}</li>
          </ul>
        </GcdsText>

        <GcdsNotice type="info" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            {pageContentJson["6"]} <strong>{pageContentJson["7"]}</strong>
            <GcdsText>
              {pageContentJson["8"]}{" "}
              <GcdsLink href="https://accounts.gc.ca/directory">
                {pageContentJson["9"]}
              </GcdsLink>
            </GcdsText>
          </GcdsText>
        </GcdsNotice>
        <GcdsGrid columns="repeat(auto-fit, minmax(200px, 200px))">
          <GcdsButton
            onGcdsClick={async (ev) => {
              ev.preventDefault();
              // const success = await saveUpdatedProfileData();
              // if (success) { onNext(successPage) }
              onNext();
            }}
          >
            {pageContentJson["10"]}
          </GcdsButton>
          <GcdsButton
            buttonRole="secondary"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              clearEditProfile();
              navigateHelper(backtoProfile);
            }}
          >
            {pageContentJson["11"]}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}

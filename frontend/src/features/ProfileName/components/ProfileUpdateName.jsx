import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { PAGES } from "../../../utils/constants.jsx";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection.jsx";

export default function ProfileUpdateName() {
  const { language } = useParams();
  const pageNameEditJson = getPageContent(language, PAGES.profileUpdateName);
  const navigate = useNavigate();
  const [editProfile, setEditProfile] = useState({
    givenName: "",
    familyName: "",
    formatted: "",
  });

  const confirmation = path(PAGES.profileUpdateNameConfirmUpdate, {
    language: language,
  });
  const backToProfile = path(PAGES.ProfileHome, { language: language });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setEditProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const useSubmitHandler = (event) => {
    event.preventDefault();
    const updatedName = {
      givenName: editProfile.givenName,
      familyName: editProfile.familyName,
      formatted: `${editProfile.givenName} ${editProfile.familyName}`,
    };
    navigate(confirmation, { state: { name: updatedName } });
  };

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageNameEditJson["5"]}</GcdsHeading>

      <GcdsText>
        {pageNameEditJson["6"]} <strong>{pageNameEditJson["7"]}</strong>
      </GcdsText>

      <ServicesWithAccessInfoSection currentLang={language} />

      <form id="form" style={{ marginTop: "38px" }} onSubmit={useSubmitHandler}>
        <GcdsContainer marginTop="100" marginBottom="0">
          <GcdsInput
            inputId="givenName"
            label={pageNameEditJson["2"]}
            name="givenName"
            type="text"
            validateOn="other"
            data-testid="givenName"
            lang={language}
            onChange={handleProfileChange}
          />
          <GcdsInput
            inputId="familyName"
            label={pageNameEditJson["3"]}
            name="familyName"
            type="text"
            validateOn="other"
            data-testid="familyName"
            lang={language}
            required
            onChange={handleProfileChange}
          />
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            currentLang={language}
            disabled={false}
            onGcdsClick={useSubmitHandler}
          />
          <GcdsButton
            buttonRole="secondary"
            onGcdsClick={(ev) => {
              console.log(ev);
              ev.preventDefault();
              navigate(backToProfile);
            }}
          >
            {pageNameEditJson["4"]}
          </GcdsButton>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}

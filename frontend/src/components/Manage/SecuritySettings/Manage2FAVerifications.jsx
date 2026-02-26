import {
  GcdsButton,
  GcdsContainer,
  GcdsHeading,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  MAP_TYPES,
  useOtpOperations,
} from "../../../hooks/useOtpOperations.js";
import { NON_PROD_FEATURE, PAGES } from "../../../utils/constants.jsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import Loader from "../../Layout/Loading.jsx";
import { useUser } from "../../Providers/useUser.js";
import NoticeFactory from "../../InfoBlocks/NoticeFactory.jsx";
import PhoneFactorsList from "./PhoneFactorsList.jsx";
import FIDO2PasskeyList from "./FIDO2PasskeyList.jsx";
import { fido2Api } from "../../../features/ManageFIDO2/api/fido2Api.jsx";

export default function Manage2FAVerifications() {
  const { language } = useParams();
  const location = useLocation();
  const pageContent = getPageContent(language, PAGES.manage2FAVerifications);
  const navigate = useNavigate();
  const { state, _dispatch } = useUser();
  const [userFIDO2CredentialsData, setUserFIDO2CredentialsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });

  // Check if we came from another page and need to render success notice
  const { noticeType, phoneNumber, otpType, passkeyName } =
    location.state || {};
  const addFido2PagePath = path(PAGES.addFIDO2PasskeyPage, { language });

  // Use the OTP operations hook for fetching phone factors
  const { phoneFactorsMap: userPhoneFactorsMap } = useOtpOperations(
    state.userProfile.id,
    state.userProfile.userName,
    () => {}, // No error code setter needed
    backToSecuritySettingsPage, // No fallback navigation
    MAP_TYPES.fullPhoneNumber,
  );

  useEffect(() => {
    /**
     * Fetch user's FIDO2 credentials
     */
    const fetchUserFIDO2Credentials = async () => {
      setLoading(true);

      try {
        const response = await fido2Api.getUserFIDO2Credentials();
        if (response && response?.success) {
          setUserFIDO2CredentialsData(response?.data?.fido2 || []);
        }
      } catch (err) {
        if (err && err?.data && err?.data?.message) {
          console.error("err", err);
        }
      } finally {
        setLoading(false);
      }
    };

    if (NON_PROD_FEATURE) {
      fetchUserFIDO2Credentials();
    }
  }, []);

  return loading ? (
    <Loader text={pageContent["11"]} />
  ) : (
    <GcdsContainer>
      {noticeType && (
        <NoticeFactory
          noticeType={noticeType}
          phoneNumber={phoneNumber}
          otpType={otpType}
          passkeyName={passkeyName}
        />
      )}

      <GcdsHeading tag="h1">{pageContent["1"]}</GcdsHeading>
      <GcdsText>{pageContent["2"]}</GcdsText>

      <GcdsHeading tag="h2">{pageContent["3"]}</GcdsHeading>
      <GcdsText>{pageContent["4"]}</GcdsText>
      <GcdsContainer className="sectionCard">
        <GcdsHeading
          tag="h3"
          marginTop="300"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <div
            style={{
              display: "flex",
              height: "1.875rem",
              padding: "0 0.625rem",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.3125rem",
              borderRadius: "0.3125rem",
              width: "fit-content",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="25"
              viewBox="0 0 16 25"
              fill="none"
            >
              <path
                d="M2.18182 24.5464C1.58182 24.5464 1.06818 24.3328 0.640909 23.9055C0.213636 23.4782 0 22.9646 0 22.3646V2.7282C0 2.1282 0.213636 1.61457 0.640909 1.1873C1.06818 0.760023 1.58182 0.546387 2.18182 0.546387H13.0909C13.6909 0.546387 14.2045 0.760023 14.6318 1.1873C15.0591 1.61457 15.2727 2.1282 15.2727 2.7282V22.3646C15.2727 22.9646 15.0591 23.4782 14.6318 23.9055C14.2045 24.3328 13.6909 24.5464 13.0909 24.5464H2.18182ZM2.18182 21.2737V22.3646H13.0909V21.2737H2.18182ZM2.18182 19.0918H13.0909V6.00093H2.18182V19.0918ZM2.18182 3.81911H13.0909V2.7282H2.18182V3.81911Z"
                fill="#333333"
              />
            </svg>
            {pageContent["5"]}
          </div>
        </GcdsHeading>
        <PhoneFactorsList userPhoneFactorsMap={userPhoneFactorsMap} />
        <GcdsButton
          id="add-mfa-button"
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigate(path(PAGES.addMFAPage, { language }));
          }}
        >
          {pageContent["10"]}
        </GcdsButton>
      </GcdsContainer>

      {NON_PROD_FEATURE && (
        <GcdsContainer className="sectionCard">
          <GcdsHeading
            tag="h3"
            marginTop="300"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <div
              style={{
                display: "flex",
                height: "1.875rem",
                padding: "0 0.625rem",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.3125rem",
                borderRadius: "0.3125rem",
                width: "fit-content",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="25"
                viewBox="0 0 16 25"
                fill="none"
              >
                <path
                  d="M2.18182 24.5464C1.58182 24.5464 1.06818 24.3328 0.640909 23.9055C0.213636 23.4782 0 22.9646 0 22.3646V2.7282C0 2.1282 0.213636 1.61457 0.640909 1.1873C1.06818 0.760023 1.58182 0.546387 2.18182 0.546387H13.0909C13.6909 0.546387 14.2045 0.760023 14.6318 1.1873C15.0591 1.61457 15.2727 2.1282 15.2727 2.7282V22.3646C15.2727 22.9646 15.0591 23.4782 14.6318 23.9055C14.2045 24.3328 13.6909 24.5464 13.0909 24.5464H2.18182ZM2.18182 21.2737V22.3646H13.0909V21.2737H2.18182ZM2.18182 19.0918H13.0909V6.00093H2.18182V19.0918ZM2.18182 3.81911H13.0909V2.7282H2.18182V3.81911Z"
                  fill="#333333"
                />
              </svg>
              {pageContent["15"]}
            </div>
          </GcdsHeading>
          <FIDO2PasskeyList
            userFIDO2CredentialsData={userFIDO2CredentialsData}
          />

          <GcdsButton
            id="add-fido2-button"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              navigate(addFido2PagePath);
            }}
          >
            {pageContent["12"]}
          </GcdsButton>
        </GcdsContainer>
      )}
    </GcdsContainer>
  );
}

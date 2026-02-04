import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { otpFactors } from "../../../features/TransientOtp/api/otpFactors.jsx";
import { PAGES, VITE_ENVIRONMENTS } from "../../../utils/constants.jsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import Loader from "../../Layout/Loading.jsx";
import { useUser } from "../../Providers/useUser.js";
import NoticeFactory from "../../InfoBlocks/NoticeFactory.jsx";
import config from "../../../config.jsx";
import PhoneFactorsList from "./PhoneFactorsList.jsx";
import FIDO2PasskeyList from "./FIDO2PasskeyList.jsx";
import { fido2Api } from "../../../features/ManageFIDO2/api/fido2Api.jsx";

export default function Manage2FAVerifications() {
  const { language } = useParams();
  const location = useLocation();
  const pageContent = getPageContent(language, PAGES.manage2FAVerifications);
  const navigate = useNavigate();
  const { state, _dispatch } = useUser();
  const [userPhoneFactorsMap, setUserPhoneFactorsMap] = useState({});
  const [userFIDO2CredentialsData, setUserFIDO2CredentialsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Only show add passkey link in dev and test environments
  const showAddPasskeyLink =
    config.environment === VITE_ENVIRONMENTS.dev ||
    config.environment === VITE_ENVIRONMENTS.test;

  // Check if we came from another page and need to render success notice
  const { noticeType, phoneNumber, otpType, passkeyName } =
    location.state || {};
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });
  const addFido2PagePath = path(PAGES.addFIDO2PasskeyPage, { language });

  useEffect(() => {
    const fetchUserOtpPhoneFactors = async () => {
      setLoading(true);
      try {
        const response = await otpFactors.getUserOtpPhoneFactors(
          state.userProfile.id,
        );
        if (
          response &&
          response.success &&
          response.data.length > 0 &&
          response.data[0].type
        ) {
          const userPhoneFactors = response.data;
          const userPhoneFactorsMap = userPhoneFactors.reduce((acc, factor) => {
            acc[factor.phoneNumber] = acc[factor.phoneNumber]
              ? [
                  ...acc[factor.phoneNumber],
                  { type: factor.type, id: factor.id },
                ]
              : [{ type: factor.type, id: factor.id }];
            return acc;
          }, {});
          setUserPhoneFactorsMap(userPhoneFactorsMap);
        } else {
          navigate(backToSecuritySettingsPage);
        }
      } catch (err) {
        console.error("err", err);
      } finally {
        setLoading(false);
      }
    };

    /**
     * Fetch user's FIDO2 credentials
     */
    const fetchUserFIDO2Credentials = async () => {
      // setLocalLoading(true);
      // setErrorCode("");

      try {
        const response = await fido2Api.getUserFIDO2Credentials();
        if (response && response?.data?.authenticated) {
          setUserFIDO2CredentialsData(response?.data?.credentials || []);
        }
      } catch (error) {
        if (error && error.data && error.data.message) {
          setErrorCode(error.data.message);
        }
      } finally {
        setLocalLoading(false);
      }
    };

    fetchUserOtpPhoneFactors();
    fetchUserFIDO2Credentials();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log(userPhoneFactorsMap);

  console.log("userFIDO2CredentialsData:", userFIDO2CredentialsData);
  console.log("isArray:", Array.isArray(userFIDO2CredentialsData));

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
              gap: "0.31235rem",
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

      {showAddPasskeyLink && (
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
          {/* <GcdsGrid
            tag="article"
            columns-desktop="1fr 1fr 1fr"
            columns-tablet="1fr 1fr"
            columns="1fr"
          >
            <GcdsButton id="delete-fido2-button" onGcdsClick={(ev) => {}}>
              {pageContent["13"]}
            </GcdsButton>
            <GcdsButton id="rename-fido2-button" onGcdsClick={(ev) => {}}>
              {pageContent["14"]}
            </GcdsButton> */}
          <GcdsButton
            id="add-fido2-button"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              navigate(addFido2PagePath);
            }}
          >
            {pageContent["12"]}
          </GcdsButton>
          {/* </GcdsGrid> */}
        </GcdsContainer>
      )}
    </GcdsContainer>
  );
}

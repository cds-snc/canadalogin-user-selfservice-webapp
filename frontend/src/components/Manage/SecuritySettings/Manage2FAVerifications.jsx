import {
  GcdsButton,
  GcdsContainer,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { otpFactors } from "../../../features/TransientOtp/api/otpFactors.jsx";
import { useNavigateHelper } from "../../../hooks/useNavigate.js";
import { PAGES } from "../../../utils/constants.jsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import Loader from "../../Layout/Loading.jsx";
import { useUser } from "../../Providers/useUser.js";
import NoticeFactory from "../../InfoBlocks/NoticeFactory.jsx";

export default function Manage2FAVerifications() {
  const { language } = useParams();
  const location = useLocation();
  const pageContent = getPageContent(language, PAGES.manage2FAVerifications);
  const navigateHelper = useNavigateHelper();
  const { state, _dispatch } = useUser();
  const [userPhoneFactorsMap, setUserPhoneFactorsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Check if we came from another page and need to render success notice
  const { noticeType, phoneNumber, otpType } = location.state || {};
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });

  const availableFactorsUIContentMap = {
    smsotp: pageContent["7"],
    voiceotp: pageContent["8"],
  };
  const availableFactorsUIContent = (factor) =>
    availableFactorsUIContentMap[factor] || factor;

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
          navigateHelper(backToSecuritySettingsPage);
        }
      } catch (err) {
        console.error("err", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOtpPhoneFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const phoneFactorsComponent = Object.entries(userPhoneFactorsMap).map(
    ([phoneNumber, factors], index) => {
      const availableFactorsComponent = factors?.map((factor, idx) => {
        return (
          <li key={idx}>
            <GcdsText>{availableFactorsUIContent(factor.type)}</GcdsText>
          </li>
        );
      });
      return (
        <GcdsContainer key={index}>
          <GcdsText>
            <strong>{`${phoneNumber}`}</strong>
          </GcdsText>
          <GcdsText>{pageContent["6"]}</GcdsText>
          <ul>{availableFactorsComponent}</ul>
          {Object.keys(userPhoneFactorsMap).length > 1 && (
            <GcdsLink
              href={path(PAGES.deleteMFAPage, { language })}
              size="regular"
              onGcdsClick={(ev) => {
                ev.preventDefault();
                navigateHelper(path(PAGES.deleteMFAPage, { language }), false, {
                  phoneNumber: phoneNumber,
                  factorIds: factors.map((factor) => factor.id),
                  formattedPhoneNumber: `+1 ${phoneNumber}`,
                });
              }}
            >
              {pageContent["9"]}
            </GcdsLink>
          )}
          <div className="separator" />
        </GcdsContainer>
      );
    },
  );

  return loading ? (
    <Loader text={pageContent["11"]} />
  ) : (
    <GcdsContainer>
      {noticeType && (
        <NoticeFactory
          noticeType={noticeType}
          phoneNumber={phoneNumber}
          otpType={otpType}
        />
      )}

      <GcdsHeading tag="h1">{pageContent["1"]}</GcdsHeading>
      <GcdsText>{pageContent["2"]}</GcdsText>

      <GcdsHeading tag="h2">{pageContent["3"]}</GcdsHeading>
      <GcdsText>{pageContent["4"]}</GcdsText>
      <GcdsContainer className="sectionCard">
        <GcdsHeading
          tag="h6"
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
        {phoneFactorsComponent}
        <GcdsButton
          id="add-mfa-button"
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigateHelper(path(PAGES.addMFAPage, { language }));
          }}
        >
          {pageContent["10"]}
        </GcdsButton>
      </GcdsContainer>
    </GcdsContainer>
  );
}

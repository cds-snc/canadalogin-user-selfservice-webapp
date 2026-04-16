import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";
import { useLocation, useNavigate, useParams } from "react-router";
import { MAP_TYPES, useOtpOperations } from "../../../hooks/useOtpOperations";
import { usePasskeyOperations } from "../../../hooks/usePasskeyOperations";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { useTranslation } from "react-i18next";
import { path } from "../../../utils/routeHelpers";
import Loader from "../../Layout/Loading";
import { useUser } from "../../Providers/useUser";
import NoticeFactory from "../../InfoBlocks/NoticeFactory";
import PhoneFactorsList from "./PhoneFactorsList";
import FIDO2PasskeyList from "./FIDO2PasskeyList";
import FIDOPasskeyIcon from "../../../assets/icons/FIDO_Passkey_mark_A_black.svg?react";
import FIDOPasskeyCollage from "../../../assets/icons/passkey_collage.svg?react";
import type { NoticeType } from "../../InfoBlocks/NoticeFactory";
import type { OtpFactorReference } from "../../../types/hooks";
import { useState } from "react";
import { getErrorMessage } from "../../../utils/errorUtils";
import ErrorSummaryWithFocus from "../../ErrorSummaryWithFocus/ErrorSummaryWithFocus";

const sectionCardProps = {
  columns: "1fr",
  gap: "300",
  className: "sectionCard",
  style: { padding: "1.5rem 1.25rem" },
} as const;

const headerGridProps = {
  columns: "max-content 1fr",
  gap: "150",
  "align-items": "center",
  style: { alignItems: "center" },
} as const;

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

interface Manage2FANoticeState {
  noticeType?: NoticeType;
  phoneNumber?: string;
  otpType?: string;
  passkeyName?: string;
}

function SectionHeader({ icon, title }: SectionHeaderProps) {
  return (
    <GcdsGrid {...headerGridProps}>
      {icon}
      <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
        {title}
      </GcdsHeading>
    </GcdsGrid>
  );
}

export default function Manage2FAVerifications() {
  const { language } = useParams();
  const location = useLocation();
  const { t } = useTranslation("mfa");
  const navigate = useNavigate();
  const { state } = useUser();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language,
  });
  const [errorCode, setErrorCode] = useState("");

  const errorMessage = getErrorMessage(language, errorCode);

  const { noticeType, phoneNumber, otpType, passkeyName } =
    (location.state as Manage2FANoticeState | null) || {};
  const addFido2PagePath = path(PAGES.addFIDO2PasskeyPage, { language });

  const { phoneFactorsMap: userPhoneFactorsMap, otpLoading: localLoading } =
    useOtpOperations({
      userId: state.userProfile?.id,
      userName: state.userProfile?.userName,
      setErrorCode: () => {},
      fallbackNavigationPath: backToSecuritySettingsPage,
      mapType: MAP_TYPES.fullPhoneNumber,
    });

  const {
    fido2Data: userFIDO2CredentialsData,
    loading: passkeyLoading,
    refetch: refetchPasskeys,
  } = usePasskeyOperations({
    enabled: DEV_ONLY_FEATURE,
    setErrorCode: () => {},
  });

  const fullPhoneFactorsMap = userPhoneFactorsMap as Record<
    string,
    OtpFactorReference[]
  >;

  return localLoading || passkeyLoading ? (
    <Loader text={t("Manage2FAVerifications.loading")} />
  ) : (
    <GcdsContainer>
      <ErrorSummaryWithFocus errorCode={errorCode} language={language} />
      {noticeType && (
        <NoticeFactory
          noticeType={noticeType}
          phoneNumber={phoneNumber}
          otpType={otpType}
          passkeyName={passkeyName}
        />
      )}

      <GcdsHeading tag="h1">{t("Manage2FAVerifications.title")}</GcdsHeading>
      <GcdsText>{t("Manage2FAVerifications.description")}</GcdsText>

      <GcdsHeading tag="h2">
        {t("Manage2FAVerifications.availableSteps")}
      </GcdsHeading>
      <GcdsText>{t("Manage2FAVerifications.phoneCodesDescription")}</GcdsText>
      <GcdsGrid {...sectionCardProps}>
        <SectionHeader
          icon={
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
          }
          title={t("Manage2FAVerifications.phonesHeading")}
        />
        <PhoneFactorsList userPhoneFactorsMap={fullPhoneFactorsMap} />
        <GcdsButton
          id="add-mfa-button"
          onGcdsClick={(event) => {
            event.preventDefault();
            navigate(path(PAGES.addMFAPage, { language }));
          }}
        >
          {t("Manage2FAVerifications.addPhoneNumber")}
        </GcdsButton>
      </GcdsGrid>

      {DEV_ONLY_FEATURE && (
        <GcdsGrid {...sectionCardProps}>
          <SectionHeader
            icon={<FIDOPasskeyIcon width="34" height="34" />}
            title={t("Manage2FAVerifications.passkeysHeading")}
          />
          {userFIDO2CredentialsData.length < 1 && (
            <>
              <FIDOPasskeyCollage />
              <GcdsContainer>
                <GcdsText marginBottom="0">
                  {
                    <strong>
                      {t("Manage2FAVerifications.passkeysSimplerSignIn")}
                    </strong>
                  }
                </GcdsText>
                <ul>
                  <li>
                    <GcdsText marginBottom="0">
                      {
                        <strong>
                          {t("Manage2FAVerifications.whatArePasskeys")}
                        </strong>
                      }
                    </GcdsText>
                    <GcdsText marginBottom="0">
                      {t("Manage2FAVerifications.passkeysDescription")}
                    </GcdsText>
                  </li>
                  <li>
                    <GcdsText marginBottom="0">
                      {
                        <strong>
                          {t("Manage2FAVerifications.whereSaved")}
                        </strong>
                      }
                    </GcdsText>
                    <GcdsText marginBottom="0">
                      {t("Manage2FAVerifications.savedDescription")}
                    </GcdsText>
                  </li>
                </ul>
              </GcdsContainer>
            </>
          )}
          <FIDO2PasskeyList
            userFIDO2CredentialsData={userFIDO2CredentialsData}
            onRenameSuccess={refetchPasskeys}
            setErrorCode={setErrorCode}
            errorMessage={errorMessage}
          />
          <GcdsButton
            id="add-fido2-button"
            onGcdsClick={(event) => {
              event.preventDefault();
              navigate(addFido2PagePath);
            }}
          >
            {t("Manage2FAVerifications.addPasskey")}
          </GcdsButton>
        </GcdsGrid>
      )}
    </GcdsContainer>
  );
}

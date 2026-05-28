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
import { NON_PROD_ENVIRONMENT, PAGES } from "../../../utils/constants";
import { useTranslation } from "react-i18next";
import { path } from "../../../utils/routeHelpers";
import Loader from "../../Layout/Loading";
import { useUser } from "../../Providers/useUser";
import NoticeFactory from "../../InfoBlocks/NoticeFactory";
import PhoneFactorsList from "./components/PhoneFactorsList";
import FIDO2PasskeyList from "./components/FIDO2PasskeyList";
import PasskeyInfoPanel from "./components/PasskeyInfoPanel";
import FIDOPasskeyIcon from "../../../assets/icons/FIDO_Passkey_mark_A_black.svg?react";
import PhoneMfaIcon from "../../../assets/icons/phone_mfa_icon.svg?react";
import FIDOPasskeyCollage from "../../../assets/icons/passkey_collage.svg?react";
import type { NoticeType } from "../../InfoBlocks/NoticeFactory";
import type { OtpFactorReference } from "../../../types/hooks";
import { useEffect, useState } from "react";
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
  const manage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language,
  });
  const [errorCode, setErrorCode] = useState("");

  const errorMessage = getErrorMessage(language, errorCode);

  const { noticeType, phoneNumber, otpType, passkeyName } =
    (location.state as Manage2FANoticeState | null) || {};
  const activeNotice = {
    noticeType,
    phoneNumber,
    otpType,
    passkeyName,
  };
  const addFido2PagePath = path(PAGES.addFIDO2PasskeyPage, { language });

  useEffect(() => {
    if (!noticeType) {
      return;
    }

    navigate(location.pathname ?? manage2FAVerificationsPage, {
      replace: true,
      state: null,
    });
  }, [location.pathname, manage2FAVerificationsPage, navigate, noticeType]);

  const { phoneFactorsMap: userPhoneFactorsMap, otpLoading: localLoading } =
    useOtpOperations({
      userId: state.userProfile?.id,
      userName: state.userProfile?.userName,
      setErrorCode: () => {},
      fallbackNavigationPath: backToSecuritySettingsPage,
      allowEmptyFactors: true,
      mapType: MAP_TYPES.fullPhoneNumber,
    });

  const { fido2Data: userFIDO2CredentialsData, loading: passkeyLoading } =
    usePasskeyOperations({
      enabled: NON_PROD_ENVIRONMENT,
      setErrorCode: () => {},
    });

  const fullPhoneFactorsMap = userPhoneFactorsMap as Record<
    string,
    OtpFactorReference[]
  >;
  const totalPhoneFactorCount = Object.values(fullPhoneFactorsMap).reduce(
    (count, factors) => count + factors.length,
    0,
  );
  const totalPasskeyCount = userFIDO2CredentialsData.length;
  const totalFactorCount = totalPhoneFactorCount + totalPasskeyCount;

  return localLoading || passkeyLoading ? (
    <Loader text={t("Manage2FAVerifications.loading")} />
  ) : (
    <GcdsContainer role="main">
      <ErrorSummaryWithFocus errorCode={errorCode} language={language} />
      {activeNotice.noticeType && (
        <NoticeFactory
          noticeType={activeNotice.noticeType}
          phoneNumber={activeNotice.phoneNumber}
          otpType={activeNotice.otpType}
          passkeyName={activeNotice.passkeyName}
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
            <PhoneMfaIcon
              width="16"
              height="24"
              aria-hidden="true"
              focusable="false"
            />
          }
          title={t("Manage2FAVerifications.phonesHeading")}
        />
        <PhoneFactorsList
          userPhoneFactorsMap={fullPhoneFactorsMap}
          totalFactorCount={totalFactorCount}
        />
        {totalPhoneFactorCount < 1 && (
          <>
            <GcdsText textRole="secondary" marginBottom="0">
              {t("Manage2FAVerifications.phoneEmptyState")}
            </GcdsText>
            <div className="separator" />
          </>
        )}
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

      {NON_PROD_ENVIRONMENT && (
        <GcdsGrid {...sectionCardProps}>
          <SectionHeader
            icon={
              <FIDOPasskeyIcon
                width="34"
                height="34"
                aria-hidden="true"
                focusable="false"
              />
            }
            title={t("Manage2FAVerifications.passkeysHeading")}
          />
          {userFIDO2CredentialsData.length < 1 && (
            <>
              <FIDOPasskeyCollage aria-hidden="true" focusable="false" />
              <PasskeyInfoPanel />
            </>
          )}
          <FIDO2PasskeyList
            userFIDO2CredentialsData={userFIDO2CredentialsData}
            totalFactorCount={totalFactorCount}
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

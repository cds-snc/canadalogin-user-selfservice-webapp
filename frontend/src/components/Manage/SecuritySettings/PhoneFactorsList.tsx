import { GcdsContainer, GcdsLink, GcdsText } from "@gcds-core/components-react";
import { useNavigate, useParams } from "react-router";
import { PAGES } from "../../../utils/constants";
import { useTranslation } from "react-i18next";
import { path } from "../../../utils/routeHelpers";
import type { OtpFactorReference } from "../../../types/hooks";

interface PhoneFactorsListProps {
  userPhoneFactorsMap: Record<string, OtpFactorReference[]>;
}

type GcdsNavigationEvent = CustomEvent<string> & {
  preventDefault: () => void;
};

export default function PhoneFactorsList({
  userPhoneFactorsMap,
}: PhoneFactorsListProps) {
  const { language } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("mfa");

  const availableFactorsUIContentMap: Record<string, string> = {
    smsotp: t("Manage2FAVerifications.textMessage"),
    voiceotp: t("Manage2FAVerifications.voiceCall"),
  };

  const availableFactorsUIContent = (factor: string) =>
    availableFactorsUIContentMap[factor] || factor;

  return Object.entries(userPhoneFactorsMap).map(([phoneNumber, factors]) => {
    const availableFactorsComponent = factors.map((factor, index) => {
      return (
        <li key={`${factor.id}-${index}`}>
          <GcdsText>{availableFactorsUIContent(factor.type)}</GcdsText>
        </li>
      );
    });

    return (
      <GcdsContainer key={phoneNumber}>
        <GcdsText>
          <strong>{`${phoneNumber}`}</strong>
        </GcdsText>
        <GcdsText>{t("Manage2FAVerifications.codesSentBy")}</GcdsText>
        <ul>{availableFactorsComponent}</ul>
        {Object.keys(userPhoneFactorsMap).length > 1 && (
          <GcdsLink
            href={path(PAGES.deleteMFAPage, { language })}
            size="regular"
            onGcdsClick={(event: GcdsNavigationEvent) => {
              event.preventDefault();
              navigate(path(PAGES.deleteMFAPage, { language }), {
                state: {
                  phoneNumber,
                  factorIds: factors.map((factor) => factor.id),
                  formattedPhoneNumber: `${phoneNumber}`,
                },
              });
            }}
          >
            {t("Manage2FAVerifications.deleteButton")}
          </GcdsLink>
        )}
        <div className="separator" />
      </GcdsContainer>
    );
  });
}

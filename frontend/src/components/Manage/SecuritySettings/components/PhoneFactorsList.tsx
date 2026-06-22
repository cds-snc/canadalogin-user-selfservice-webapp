import {
  GcdsButton,
  GcdsContainer,
  GcdsSrOnly,
  GcdsText,
} from "@gcds-core/components-react";
import { useNavigate, useParams } from "react-router";
import { PAGES } from "../../../../utils/constants";
import { useTranslation } from "react-i18next";
import { path } from "../../../../utils/routeHelpers";
import type { OtpFactorReference } from "../../../../types/hooks";
import Separator from "../../../Layout/Separator";

interface PhoneFactorsListProps {
  userPhoneFactorsMap: Record<string, OtpFactorReference[]>;
  totalFactorCount?: number;
}

export default function PhoneFactorsList({
  userPhoneFactorsMap,
  totalFactorCount,
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

  const filteredPhoneFactorsMap = Object.entries(userPhoneFactorsMap).reduce<
    Record<string, OtpFactorReference[]>
  >((acc, [contact, factors]) => {
    const nonEmailFactors = factors.filter(
      (factor) => factor.type !== "emailotp",
    );
    if (nonEmailFactors.length > 0) {
      acc[contact] = nonEmailFactors;
    }

    return acc;
  }, {});

  return Object.entries(filteredPhoneFactorsMap).map(
    ([phoneNumber, factors]) => {
      const canDeletePhoneNumber =
        totalFactorCount === undefined
          ? Object.keys(filteredPhoneFactorsMap).length > 1
          : totalFactorCount - factors.length >= 1;

      const availableFactorsComponent = factors.map((factor, index) => {
        return (
          <li key={`${factor.id}-${index}`}>
            <GcdsText textRole="secondary">
              {availableFactorsUIContent(factor.type)}
            </GcdsText>
          </li>
        );
      });

      return (
        <GcdsContainer key={phoneNumber}>
          <GcdsText>
            <strong>{`${phoneNumber}`}</strong>
          </GcdsText>
          <GcdsText marginBottom="0" textRole="secondary">
            {t("Manage2FAVerifications.codesSentBy")}
          </GcdsText>
          <ul>{availableFactorsComponent}</ul>
          {canDeletePhoneNumber && (
            <GcdsButton
              buttonRole="secondary"
              onGcdsClick={() => {
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
              <GcdsSrOnly tag="span"> {phoneNumber}</GcdsSrOnly>
            </GcdsButton>
          )}
          <Separator />
        </GcdsContainer>
      );
    },
  );
}

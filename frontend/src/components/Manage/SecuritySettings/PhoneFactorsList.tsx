import {
  GcdsContainer,
  GcdsLink,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useNavigate, useParams } from "react-router";
import { PAGES } from "../../../utils/constants";
import { getPageContent } from "../../../utils/functions";
import { path } from "../../../utils/routeHelpers";
import { ReactNode } from "react";

type PhoneFactor = { id?: string; type?: string };

type PhoneFactorsMap = Record<string, PhoneFactor[]>;

type PhoneFactorsListProps = {
  userPhoneFactorsMap?: PhoneFactorsMap;
};

export default function PhoneFactorsList({
  userPhoneFactorsMap = {},
}: PhoneFactorsListProps) {
  const { language } = useParams();
  const navigate = useNavigate();
  const pageContent = getPageContent(language, PAGES.manage2FAVerifications);

  const availableFactorsUIContentMap: Record<string, ReactNode> = {
    smsotp: pageContent["7"],
    voiceotp: pageContent["8"],
  };

  const availableFactorsUIContent = (factor?: string) =>
    (factor && availableFactorsUIContentMap[factor]) || factor;

  return Object.entries(userPhoneFactorsMap || {}).map(
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
          {Object.keys(userPhoneFactorsMap || {}).length > 1 && (
            <GcdsLink
              href={path(PAGES.deleteMFAPage, { language })}
              size="regular"
              onGcdsClick={(ev: Event) => {
                ev.preventDefault();
                navigate(path(PAGES.deleteMFAPage, { language }), {
                  state: {
                    phoneNumber: phoneNumber,
                    factorIds: factors.map((factor) => factor.id),
                    formattedPhoneNumber: `${phoneNumber}`,
                  },
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
}

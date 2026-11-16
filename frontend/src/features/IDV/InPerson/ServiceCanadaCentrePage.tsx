import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsRadios,
  GcdsText,
} from "@gcds-core/components-react";

import AccessibleNotice from "../../../components/InfoBlocks/AccessibleNotice";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import ErrorSummaryWithFocus from "../../../components/ErrorSummaryWithFocus/ErrorSummaryWithFocus";
import {
  AVAILABLE_LANGUAGES,
  DEV_ONLY_FEATURE,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { useRelyingPartyInfo } from "../../../hooks/useRelyingPartyInfo";
import {
  APPROVED_DOCUMENT_VALUES_WITHOUT_NO_IDS,
  type ApprovedDocumentValue,
} from "../data/approvedDocuments";
import {
  getIdTypeRequiredMessage,
  getValidationSummaryHeading,
} from "./validation/ErrorsDefinition";

const ERROR_SUMMARY_ID = "service-canada-centre-error-summary";
const NON_EXPIRED_ID_RADIOS_ID = "non-expired-id-radios";
const ID_RADIOS_ID = "select-id-radios";

export default function ServiceCanadaCentrePage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const [selectedIdType, setSelectedIdType] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [summaryFocusTrigger, setSummaryFocusTrigger] = useState(0);
  const [nonExpiredIdAnswer, setNonExpiredIdAnswer] = useState("");
  const { t } = useTranslation("idv");
  const { relyingPartyName: rpName } = useRelyingPartyInfo();

  const completeIdentityProofingPage = path(
    PAGES.idvCompleteIdentityProofingPage,
    {
      language: language,
      journeyType: journeyType,
    },
  );

  const serviceCanadaDetailsPage = path(
    PAGES.idvServiceCanadaCentreIdDetailsPage,
    { language, journeyType },
  );
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;

  const idOptions = [
    ...APPROVED_DOCUMENT_VALUES_WITHOUT_NO_IDS.map((idType) => ({
      id: `radio-${idType}`,
      value: idType,
      label: t(`ApprovedDocuments.${idType}`),
      checked: selectedIdType === idType,
    })),
    {
      id: "radio-no-ids",
      value: "noIds",
      label: t("ServiceCanadaCentre.noIds"),
      checked: selectedIdType === "noIds",
    },
  ];
  const nonExpiredIdRadioOptions = [
    {
      id: "radio-non-expired-id-yes",
      value: "yes",
      label: t("ServiceCanadaCentre.yesOption"),
      checked: nonExpiredIdAnswer === "yes",
    },
    {
      id: "radio-non-expired-id-no",
      value: "no",
      label: t("ServiceCanadaCentre.noOption"),
      checked: nonExpiredIdAnswer === "no",
    },
  ];
  const nonExpiredIdError =
    hasSubmitted && !nonExpiredIdAnswer
      ? t("ErrorsDefinition.selectOptionRequired")
      : "";
  const idTypeError =
    hasSubmitted && nonExpiredIdAnswer === "yes" && !selectedIdType
      ? getIdTypeRequiredMessage(t)
      : "";

  const onNonExpiredIdChange = (event: CustomEvent<string>) => {
    setNonExpiredIdAnswer(
      (event.target as HTMLInputElement | null)?.value ?? "",
    );
  };

  const onContinue = () => {
    setHasSubmitted(true);

    if (!nonExpiredIdAnswer) {
      setSummaryFocusTrigger((previous) => previous + 1);
      return;
    }

    if (nonExpiredIdAnswer === "no") {
      navigate(completeIdentityProofingPage);
      return;
    }

    if (!selectedIdType) {
      setSummaryFocusTrigger((previous) => previous + 1);
      return;
    }

    if (selectedIdType === "noIds") {
      navigate(
        path(PAGES.idvProveIdentityInPersonPage, { language, journeyType }),
      );
      return;
    }

    navigate(serviceCanadaDetailsPage, {
      state: { idType: selectedIdType as ApprovedDocumentValue },
    });
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <form>
        <GcdsGrid columns="1" gap="450">
          <GcdsHeading tag="h1">{t("ServiceCanadaCentre.heading")}</GcdsHeading>

          {nonExpiredIdError || idTypeError ? (
            <ErrorSummaryWithFocus
              key={summaryFocusTrigger}
              id={ERROR_SUMMARY_ID}
              errorMessage={getValidationSummaryHeading(t)}
              errorLinks={Object.fromEntries(
                [
                  nonExpiredIdError
                    ? [`#${NON_EXPIRED_ID_RADIOS_ID}`, nonExpiredIdError]
                    : null,
                  idTypeError ? [`#${ID_RADIOS_ID}`, idTypeError] : null,
                ].filter((entry): entry is [string, string] => entry !== null),
              )}
              language={currentLanguage}
            />
          ) : null}

          <GcdsContainer>
            <GcdsText>
              <strong>{t("ServiceCanadaCentre.followSteps")}</strong>
            </GcdsText>
            <GcdsText>
              <ol>
                <li>{t("ServiceCanadaCentre.step1")}</li>
                <li>{t("ServiceCanadaCentre.step2")}</li>
                <li>{t("ServiceCanadaCentre.step3")}</li>
                <li>{t("ServiceCanadaCentre.step4", { rpName })}</li>
              </ol>
            </GcdsText>
          </GcdsContainer>

          <GcdsRadios
            id={ID_RADIOS_ID}
            name="select-id"
            legend={t("ServiceCanadaCentre.selectIdLabel")}
            hint={t("ServiceCanadaCentre.idHint")}
            lang={currentLanguage}
            options={idOptions}
            value={selectedIdType}
            required
            errorMessage={idTypeError}
            onGcdsChange={(event: CustomEvent<string>) => {
              setSelectedIdType(
                (event.target as HTMLInputElement | null)?.value ?? "",
              );
            }}
          />

          <GcdsRadios
            id={NON_EXPIRED_ID_RADIOS_ID}
            name="non-expired-id-radios"
            legend={t("ServiceCanadaCentre.nonExpiredIdTitle")}
            hint={t("ServiceCanadaCentre.nonExpiredIdHint")}
            options={nonExpiredIdRadioOptions}
            required
            errorMessage={nonExpiredIdError}
            onGcdsChange={onNonExpiredIdChange}
          />

          <GcdsGrid
            columns="1"
            columnsDesktop="max-content max-content"
            gap="200"
          >
            <GcdsButton type="button" onClick={onContinue}>
              {t("ServiceCanadaCentre.continueButton")}
            </GcdsButton>
            <GcdsButton
              type="button"
              buttonRole="secondary"
              onClick={() => {
                navigate(-1);
              }}
            >
              {t("ServiceCanadaCentre.chooseDifferentMethodButton")}
            </GcdsButton>
          </GcdsGrid>

          <AccessibleNotice
            noticeRole="info"
            noticeTitleTag="h2"
            noticeTitle={t("ServiceCanadaCentre.moreInfoTitle")}
          >
            {
              //TODO: populate with real URL once available
            }
            <GcdsLink
              href={"#"}
              external={true}
              style={{ textDecoration: "underline" }}
            >
              {t("ServiceCanadaCentre.learnMoreLink")}
            </GcdsLink>
          </AccessibleNotice>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}

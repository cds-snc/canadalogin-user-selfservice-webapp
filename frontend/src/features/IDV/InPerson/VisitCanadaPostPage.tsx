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
import Loader from "../../../components/Layout/Loading";
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
  identityDocumentsApi,
  type IdentityDocumentType,
} from "../api/identityDocumentsApi";
import {
  getDocumentHintKey,
  getDocumentLabelKey,
  NO_IDS_VALUE,
  SELECTABLE_DOCUMENT_TYPES,
} from "../data/identityDocuments";
import {
  getIdTypeRequiredMessage,
  getValidationSummaryHeading,
} from "./validation/ErrorsDefinition";

const ERROR_SUMMARY_ID = "visit-canada-post-error-summary";
const RADIOS_ID = "select-id-radios";

export default function VisitCanadaPost() {
  const { t } = useTranslation("idv");
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;

  const { relyingPartyName: rpName } = useRelyingPartyInfo();
  const [selectedValue, setSelectedValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [summaryFocusTrigger, setSummaryFocusTrigger] = useState(0);

  const radioOptions = [
    ...SELECTABLE_DOCUMENT_TYPES.map((documentType) => {
      const hintKey = getDocumentHintKey(documentType);
      return {
        id: `radio-${documentType}`,
        value: documentType,
        label: t(getDocumentLabelKey(documentType)),
        ...(hintKey ? { hint: t(hintKey) } : {}),
        checked: selectedValue === documentType,
      };
    }),
    {
      id: `radio-${NO_IDS_VALUE}`,
      value: NO_IDS_VALUE,
      label: t("CanadaPostSelectId.noIds"),
      checked: selectedValue === NO_IDS_VALUE,
    },
  ];

  const showError = hasSubmitted && !selectedValue;
  const idTypeErrorMessage = showError ? getIdTypeRequiredMessage(t) : "";

  const onContinue = async () => {
    setHasSubmitted(true);

    if (!selectedValue) {
      // Re-trigger focus/scroll if user submits invalid data multiple times.
      setSummaryFocusTrigger((previous) => previous + 1);
      return;
    }

    if (selectedValue === NO_IDS_VALUE) {
      navigate(
        path(PAGES.idvProveIdentityInPersonPage, { language, journeyType }),
      );
      return;
    }

    const documentType = selectedValue as IdentityDocumentType;
    setHasError(false);
    setIsLoading(true);

    try {
      const documents = await identityDocumentsApi.getIdentityDocuments([
        documentType,
      ]);
      const selectedDocument = documents.find(
        (document) => document.key === documentType,
      );

      if (!selectedDocument || selectedDocument.options.length === 0) {
        setHasError(true);
        return;
      }

      const nextPage = selectedDocument.options.every(
        (option) => option.requires_proof,
      )
        ? PAGES.idvCanadaPostProofOfAddressPage
        : PAGES.idvCanadaPostIdDetailsPage;

      navigate(path(nextPage, { language, journeyType }), {
        state: { document: selectedDocument },
      });
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  if (isLoading) {
    return <Loader text={t("CanadaPostSelectId.loading")} />;
  }

  return (
    <GcdsContainer role="main">
      <form>
        <GcdsGrid columns="1" gap="450">
          <GcdsContainer>
            <GcdsHeading tag="h1">{t("VisitCanadaPost.heading")}</GcdsHeading>

            {showError ? (
              <ErrorSummaryWithFocus
                key={summaryFocusTrigger}
                id={ERROR_SUMMARY_ID}
                errorMessage={getValidationSummaryHeading(t)}
                errorLinks={{ [`#${RADIOS_ID}`]: getIdTypeRequiredMessage(t) }}
                language={currentLanguage}
              />
            ) : null}

            <GcdsText>
              <strong>{t("VisitCanadaPost.followSteps")}</strong>
            </GcdsText>

            <GcdsText>
              <ol>
                <li>{t("VisitCanadaPost.step1")}</li>
                <li>{t("VisitCanadaPost.step2")}</li>
                <li>{t("VisitCanadaPost.step3")}</li>
                <li>{t("VisitCanadaPost.step4", { rpName })}</li>
              </ol>
            </GcdsText>
            <GcdsText>
              <GcdsLink href="#" external={true}>
                {t("VisitCanadaPost.learnMoreLink")}
              </GcdsLink>
            </GcdsText>
          </GcdsContainer>

          <GcdsContainer>
            {hasError ? (
              <AccessibleNotice
                noticeRole="danger"
                noticeTitleTag="h2"
                noticeTitle={t("CanadaPostSelectId.loadErrorTitle")}
                focusOnMount
              >
                <GcdsText>{t("CanadaPostSelectId.loadErrorMessage")}</GcdsText>
              </AccessibleNotice>
            ) : null}
            <GcdsRadios
              id={RADIOS_ID}
              name="select-id"
              legend={t("CanadaPostSelectId.legend")}
              hint={t("VisitCanadaPost.idHint")}
              lang={currentLanguage}
              options={radioOptions}
              value={selectedValue}
              required
              errorMessage={idTypeErrorMessage}
              onGcdsChange={(event: CustomEvent<string>) => {
                setSelectedValue(
                  (event.target as HTMLInputElement | null)?.value ?? "",
                );
              }}
            />
          </GcdsContainer>

          <GcdsGrid
            columns="1"
            columnsDesktop="max-content max-content"
            gap="200"
          >
            <GcdsButton
              type="button"
              onGcdsClick={(event: Event) => {
                event.preventDefault();
                void onContinue();
              }}
            >
              {t("VisitCanadaPost.continueButton")}
            </GcdsButton>
            <GcdsButton
              type="button"
              buttonRole="secondary"
              onGcdsClick={(event: Event) => {
                event.preventDefault();
                navigate(-1);
              }}
            >
              {t("VisitCanadaPost.differentMethodButton")}
            </GcdsButton>
          </GcdsGrid>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}

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
  manageDashboardLinks,
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
  SELECTABLE_DOCUMENT_TYPES,
} from "../data/identityDocuments";
import {
  getIdTypeRequiredMessage,
  getSelectOptionRequiredMessage,
  getValidationSummaryHeading,
} from "./validation/ErrorsDefinition";


const ERROR_SUMMARY_ID = "visit-canada-post-error-summary";
const RADIOS_ID = "select-id-radios";
const NON_EXPIRED_ID_RADIOS_ID = "non-expired-id-radios";

export default function VisitCanadaPost() {
  const { t } = useTranslation("idv");
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;
  const completeIdentityProofingPage = path(
    PAGES.idvCompleteIdentityProofingPage,
    { language, journeyType },
  );
  const helpAndSupportLink =
    language === "fr"
      ? manageDashboardLinks.helpAndSupport.fr
      : manageDashboardLinks.helpAndSupport.en;

  const { relyingPartyName: rpName } = useRelyingPartyInfo();
  const [selectedValue, setSelectedValue] = useState<
    Exclude<IdentityDocumentType, "noIds"> | ""
  >("");
  const [nonExpiredIdAnswer, setNonExpiredIdAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [summaryFocusTrigger, setSummaryFocusTrigger] = useState(0);

  const idTypeRadioOptions = [
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
  ];

  const nonExpiredIdRadioOptions = [
    {
      id: "radio-non-expired-id-yes",
      value: "yes",
      label: t("VisitCanadaPost.yesOption"),
      checked: nonExpiredIdAnswer === "yes",
    },
    {
      id: "radio-non-expired-id-no",
      value: "no",
      label: t("VisitCanadaPost.noOption"),
      checked: nonExpiredIdAnswer === "no",
    },
  ];

  const idTypeErrorMessage =
    hasSubmitted && !selectedValue ? getIdTypeRequiredMessage(t) : "";

  const nonExpiredIdError =
    hasSubmitted && !nonExpiredIdAnswer
      ? getSelectOptionRequiredMessage(t)
      : "";

  const onNonExpiredIdChange = (event: CustomEvent<string>) => {
    setNonExpiredIdAnswer(
      (event.target as HTMLInputElement | null)?.value ?? "",
    );
  };

  const onContinue = async () => {
    setHasSubmitted(true);

    if (!selectedValue || !nonExpiredIdAnswer) {
      setSummaryFocusTrigger((previous) => previous + 1);
      return;
    }

    if (nonExpiredIdAnswer === "no") {
      navigate(completeIdentityProofingPage);
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
          <GcdsHeading tag="h1">{t("VisitCanadaPost.heading")}</GcdsHeading>

          {nonExpiredIdError || idTypeErrorMessage ? (
            <ErrorSummaryWithFocus
              key={summaryFocusTrigger}
              id={ERROR_SUMMARY_ID}
              errorMessage={getValidationSummaryHeading(t)}
              errorLinks={{
                ...(nonExpiredIdError && {
                  [`#${NON_EXPIRED_ID_RADIOS_ID}`]: nonExpiredIdError,
                }),
                ...(idTypeErrorMessage && {
                  [`#${RADIOS_ID}`]: idTypeErrorMessage,
                }),
              }}
              language={currentLanguage}
            />
          ) : null}

          <GcdsContainer>
            <GcdsText>
              {t("VisitCanadaPost.verificationBarcodeInstructions")}
            </GcdsText>
            <GcdsText>
              {t("VisitCanadaPost.canadaPostVisitInstruction")}
            </GcdsText>
            <GcdsText>
              {t("VisitCanadaPost.returnToServiceInstructions", { rpName })}
            </GcdsText>
            <GcdsText>
              <GcdsLink
                href={helpAndSupportLink}
                external={true}
                style={{ textDecoration: "underline" }}
              >
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
              options={idTypeRadioOptions}
              value={selectedValue}
              required
              errorMessage={idTypeErrorMessage}
              onGcdsChange={(event: CustomEvent<string>) => {
                setSelectedValue(
                  ((event.target as HTMLInputElement | null)?.value ?? "") as
                  Exclude<IdentityDocumentType, "noIds"> | "",
                );
              }}
            />
            <GcdsText>
              <GcdsLink
                href={path(PAGES.idvProveIdentityInPersonPage, {
                  language,
                  journeyType,
                })}
                onGcdsClick={(event: Event) => {
                  event.preventDefault();
                  navigate(
                    path(PAGES.idvProveIdentityInPersonPage, {
                      language,
                      journeyType,
                    }),
                  );
                }}
              >
                {t("CanadaPostSelectId.noIds")}
              </GcdsLink>
            </GcdsText>
            <GcdsRadios
              id={NON_EXPIRED_ID_RADIOS_ID}
              name="non-expired-id"
              legend={t("VisitCanadaPost.nonExpiredIdTitle")}
              hint={t("VisitCanadaPost.nonExpiredIdHint")}
              options={nonExpiredIdRadioOptions}
              required
              errorMessage={nonExpiredIdError}
              value={nonExpiredIdAnswer}
              onGcdsChange={onNonExpiredIdChange}
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
        </GcdsGrid >
      </form >
    </GcdsContainer >
  );
}

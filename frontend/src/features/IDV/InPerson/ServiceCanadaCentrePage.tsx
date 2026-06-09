import {
  GcdsButton,
  GcdsDetails,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
  GcdsContainer,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useUser } from "../../../components/Providers/useUser";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

export default function ServiceCanadaCentrePage() {
  const { state } = useUser();
  const navigate = useNavigate();
  const { language } = useParams();

  const { t } = useTranslation("idv");

  const email = state?.userProfile?.userName ?? "";

  const serviceCanadaCodePage = path(PAGES.idvServiceCanadaCentreCodePage, {
    language: language,
  });

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          {" "}
          <GcdsText marginBottom="0" size="small">
            {t("ServiceCanadaCentre.pageTitle")}
          </GcdsText>
          <GcdsHeading tag="h1">{t("ServiceCanadaCentre.heading")}</GcdsHeading>
        </GcdsContainer>

        <GcdsContainer>
          {" "}
          <GcdsText>
            <strong>{t("ServiceCanadaCentre.followSteps")}</strong>
          </GcdsText>
          <ol>
            <li>
              <GcdsText marginBottom="0">
                {t("ServiceCanadaCentre.step1")}
              </GcdsText>
            </li>
            <li>
              <GcdsText marginBottom="0">
                {t("ServiceCanadaCentre.step2")}
              </GcdsText>

              <GcdsDetails detailsTitle={t("ServiceCanadaCentre.listOfIds")}>
                {t("ServiceCanadaCentre.listOfIds")}
              </GcdsDetails>
            </li>
            <li>
              <GcdsText marginBottom="0">
                {t("ServiceCanadaCentre.step3")}
              </GcdsText>
            </li>
          </ol>
        </GcdsContainer>

        <GcdsHeading tag="h2" marginTop="0">
          {t("ServiceCanadaCentre.receiveCodeHeading")}
        </GcdsHeading>

        <GcdsContainer>
          {" "}
          <GcdsText>{t("ServiceCanadaCentre.receiveCodeDescription")}</GcdsText>
          <GcdsText>
            {t("ServiceCanadaCentre.emailInstructions")}{" "}
            <strong>{email}</strong>
          </GcdsText>
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            type="button"
            onClick={() => {
              navigate(serviceCanadaCodePage);
            }}
          >
            {t("ServiceCanadaCentre.continueButton")}
          </GcdsButton>
          <GcdsButton
            type="button"
            buttonRole="secondary"
            onClick={() => {
              navigate(-1);
            }}
          >
            {t("ServiceCanadaCentre.backButton")}
          </GcdsButton>
        </GcdsGrid>
        <GcdsNotice
          noticeRole="info"
          noticeTitleTag="h2"
          noticeTitle={t("ServiceCanadaCentre.moreInfoTitle")}
        >
          {
            //TODO: populate with real URL once available
          }
          <GcdsLink href={"#"} external={true}>
            {t("ServiceCanadaCentre.learnMoreLink")}
          </GcdsLink>
        </GcdsNotice>
      </GcdsGrid>
    </GcdsContainer>
  );
}

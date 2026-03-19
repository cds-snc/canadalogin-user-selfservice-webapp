import {
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";
import { useParams } from "react-router";
import { FLOW_TYPES, PAGES } from "../../../../utils/constants";
import { getPageContent } from "../../../../utils/functions";
import SubmitButton from "../../../../components/Layout/SubmitButton";

interface PhoneFormData {
  phoneNumber: string;
  otp: string;
  mfaId: string;
  trxnId: string;
  otpType: string;
  formattedPhoneNumber: string;
}

interface AddSecondMFAProps {
  phoneFormData: PhoneFormData;
  onSkipForNow: () => Promise<void>;
  onAddSecondMFA: () => Promise<void>;
}

export default function AddSecondMFA({
  phoneFormData,
  onSkipForNow,
  onAddSecondMFA,
}: AddSecondMFAProps) {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    phoneFormData.otpType === FLOW_TYPES.voice
      ? PAGES.addSecondMFATextMessage
      : PAGES.addSecondMFAVoiceCall,
  )!;

  const onSubmitHandler = async (ev: Event) => {
    ev.preventDefault();
    await onAddSecondMFA();
  };

  return (
    <GcdsContainer role="main">
      <GcdsText>
        {" "}
        <GcdsNotice noticeRole="success" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            {pageContentJson["1"]}{" "}
            <strong>{phoneFormData.formattedPhoneNumber} </strong>
            {pageContentJson["2"]}
          </GcdsText>
        </GcdsNotice>
      </GcdsText>

      <GcdsHeading tag="h1">{pageContentJson["3"]}</GcdsHeading>

      <GcdsText>
        {pageContentJson["4"]} <strong>{pageContentJson["5"]}</strong>{" "}
        {pageContentJson["6"]}
      </GcdsText>

      <GcdsText>{pageContentJson["7"]}</GcdsText>

      <GcdsHeading tag="h2">{pageContentJson["8"]}</GcdsHeading>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsText>
          {" "}
          <SubmitButton
            style={{ width: "fit-content" }}
            onGcdsClick={onSubmitHandler}
            currentLang={language ?? "en"}
          >
            {pageContentJson["9"]}
          </SubmitButton>
        </GcdsText>
        &nbsp;
        <GcdsLink
          onGcdsClick={async (ev) => {
            ev.preventDefault();
            await onSkipForNow();
          }}
        >
          {pageContentJson["10"]}
        </GcdsLink>
      </GcdsGrid>
    </GcdsContainer>
  );
}

import React from 'react';
import { useParams } from 'react-router';
import { getPageContent } from '../../utils/functions.jsx';
import { PAGES } from '../../utils/constants.jsx';
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsInput, GcdsButton
} from '@cdssnc/gcds-components-react';

export default function FirstVerifyItsYou() {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.FirstVerifyItsYou);

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContent['1']}</GcdsHeading>
      <GcdsText>{pageContent['2']} </GcdsText>
      <GcdsInput
        inputId="input-password"
        label={pageContent['3']}
        name="password"

      ></GcdsInput>
      <GcdsGrid columns="auto auto" gap="10px" align-items="center">
        <GcdsButton>
          {pageContent["4"]}
        </GcdsButton>
        <GcdsButton buttonRole="secondary">
          {pageContent["5"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}

import React from 'react';
import { useParams } from 'react-router';
import { getPageContent } from '../../utils/functions.jsx';
import { PAGES } from '../../utils/constants.jsx';
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsLink
} from '@cdssnc/gcds-components-react';

export default function CheckYourEmail() {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.CheckYourEmail);

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContent['1']}</GcdsHeading>
    </GcdsContainer>
  );
}

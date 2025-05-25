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

export default function ProfileHome() {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.ProfileHome);

  return (
    <GcdsContainer>
      <GcdsHeading tag="h1">{pageContent['1']}</GcdsHeading>
      <GcdsHeading tag="h2">{pageContent['2']}</GcdsHeading>

      <gcds-container className="sectionCard">
        <GcdsHeading tag="h6">{pageContent['3']}</GcdsHeading>
        <GcdsGrid columns="1fr auto" className="gridInline">
          <GcdsText>{pageContent['4']}</GcdsText>
          <GcdsLink href="#" size="regular">
            {pageContent['5']}
          </GcdsLink>
        </GcdsGrid>
      </gcds-container>

      <GcdsHeading tag="h2">{pageContent['6']}</GcdsHeading>
      <gcds-container className="sectionCard">
        <GcdsHeading tag="h3">{pageContent['7']}</GcdsHeading>
        <GcdsText>{pageContent['8']}</GcdsText>

        <GcdsGrid columns="1fr auto" className="gridInline">
          <GcdsText>Ex****@gmail.com</GcdsText>
          <GcdsLink href="#" size="regular">
            {pageContent['5']}
          </GcdsLink>
        </GcdsGrid>

        <gcds-grid columns="auto auto" className="verifiedBadge">
          <gcds-icon name="check" className="verifiedIcon" size="sm" />
          <gcds-text className="verifiedText">
            {pageContent['9']}
          </gcds-text>
        </gcds-grid>

        <div className="separator" />

        <GcdsHeading tag="h3">{pageContent['10']}</GcdsHeading>
        <GcdsText>{pageContent['11']}</GcdsText>

        <GcdsGrid columns="1fr auto" className="gridInline">
          <GcdsText>+1 (***) ***-2839</GcdsText>
          <GcdsLink href="#" size="regular">
            {pageContent['5']}
          </GcdsLink>
        </GcdsGrid>

        <gcds-grid columns="auto auto" className="verifiedBadge">
          <gcds-icon name="check" className="verifiedIcon" size="sm" />
          <gcds-text className="verifiedText">
            {pageContent['9']}
          </gcds-text>
        </gcds-grid>
      </gcds-container>

      <GcdsHeading tag="h2">{pageContent['12']}</GcdsHeading>
      <gcds-container className="sectionCard">
        <GcdsHeading tag="h3">{pageContent['13']}</GcdsHeading>
        <GcdsGrid columns="1fr auto" className="gridInline">
          <GcdsText>{pageContent['14']}</GcdsText>
          <GcdsLink href="#" size="regular">
            {pageContent['5']}
          </GcdsLink>
        </GcdsGrid>

        <div className="separator" />

        <GcdsHeading tag="h3">{pageContent['15']}</GcdsHeading>
        <GcdsText>{pageContent['16']}</GcdsText>
        <GcdsText>{pageContent['17']}</GcdsText>
      </gcds-container>
    </GcdsContainer>
  );
}

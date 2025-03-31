import {
    GcdsContainer, GcdsDetails, GcdsFieldset, GcdsHeader, GcdsHeading, GcdsInput,
    GcdsLink, GcdsRadioGroup,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {getPageContent} from '../../../utils/functions';
import AlreadyGc from "../../Layout/AlreadyGc.jsx";
import {countryMapping, NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import VerificationSetUpInfo from "./VerificationSetUpInfo.jsx";
import {useUser} from "../../Providers/UserContext.jsx";
import {useParams} from "react-router";

export default function Verification({currentLang}) {
    const {type} = useParams();
    const pageContentJson = getPageContent(currentLang, "Verification");

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer className="gcds-gap" >
                <GcdsStepper currentStep="3" totalSteps="5"
                             tag="h1"
                             lang={currentLang}>
                    {pageContentJson['1']}
                </GcdsStepper>
            </GcdsContainer>
            <GcdsContainer>
                <GcdsText>
                    {pageContentJson['2']}&nbsp;<strong>+1 (123) 456-7890</strong>
                </GcdsText>
                <GcdsText>
                    {type==='voice'?pageContentJson['4']:pageContentJson['3']}
                </GcdsText>
                <GcdsText>
                    {pageContentJson['5']} <strong>{pageContentJson['6']}</strong>
                </GcdsText>
                <GcdsHeading tag='h2'>
                    {pageContentJson['7']}
                </GcdsHeading>
                <GcdsInput
                    inputId="verificationCode"
                    label={pageContentJson['8']}
                    name="verificationCode"
                    type="text"
                    required ></GcdsInput>
            </GcdsContainer>
            <GcdsHeading tag='h2'>
                {pageContentJson['9']}
            </GcdsHeading>
            <GcdsText>
                <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
                    {type==='voice'?pageContentJson['11']:pageContentJson['10']}
                </GcdsLink>
            </GcdsText>
            <GcdsText>
                <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
                    {pageContentJson['12']}
                </GcdsLink>
            </GcdsText>
            <GcdsText>
                {pageContentJson['13']}&nbsp;<strong>10&nbsp;{pageContentJson['14']}</strong>
            </GcdsText>
            <AlreadyGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}
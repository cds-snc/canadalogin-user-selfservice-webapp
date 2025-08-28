
import Modal from 'react-modal';
import { GcdsButton, GcdsText } from '@cdssnc/gcds-components-react';
import {getPageContent} from "../../utils/functions.jsx";
import { formatTime } from "../../utils/cookieUtils.js";

const SessionTimeoutModal = ({ 
    isOpen, 
    expirationTime, 
    onKeepSession, 
    onLogout, 
    isLoading = false,
    currentLang
}) => {
    const pageContentJson = getPageContent(currentLang, "SessionTimeout");

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
            ariaHideApp={false}
            contentLabel={pageContentJson['1']}
            className="session-timeout-modal"
            overlayClassName="session-timeout-modal-overlay"
        >
            <div className="modal-header">
                <h2>{pageContentJson['1']}</h2>
            </div>
            
            <div className="session-timeout-content">
                <GcdsText size="body">
                    {pageContentJson['2'].replace('{{time}}', formatTime(expirationTime))}
                </GcdsText>

                <GcdsText size="body" className="mt-3">
                    {pageContentJson['3']}
                </GcdsText>

                <div className="d-flex gap-3 mt-4">
                    <GcdsButton
                        buttonId="keep-session-btn"
                        size="default"
                        type="button"
                        onClick={onKeepSession}
                        disabled={isLoading}
                    >
                        {isLoading ? 
                            pageContentJson['6'] : 
                            pageContentJson['4']
                        }
                    </GcdsButton>
                    
                    <GcdsButton
                        buttonId="logout-btn"
                        size="default"
                        type="button"
                        buttonRole="secondary"
                        onClick={onLogout}
                        disabled={isLoading}
                    >
                        {pageContentJson['5']}
                    </GcdsButton>
                </div>
            </div>
        </Modal>
    );
};

export default SessionTimeoutModal;

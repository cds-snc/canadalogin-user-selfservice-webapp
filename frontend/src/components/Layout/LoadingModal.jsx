import Modal from 'react-modal';
import { GcdsText } from '@cdssnc/gcds-components-react';

const LoadingModal = ({ 
    isOpen, 
    message = "Loading..."
}) => {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
            ariaHideApp={false}
            contentLabel={message}
            className="loading-modal"
            overlayClassName="loading-modal-overlay"
        >
            <div className="loading-content">
                <div className="loading-spinner"></div>
                <GcdsText size="body" className="mt-3">
                    {message}
                </GcdsText>
            </div>
        </Modal>
    );
};

export default LoadingModal;

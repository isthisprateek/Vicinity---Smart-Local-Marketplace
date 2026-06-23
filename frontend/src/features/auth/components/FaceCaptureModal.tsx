import React, { useRef, useEffect, useState } from 'react';
import { getFaceDescriptor } from '../services/faceAuth.service';
import './FaceCaptureModal.css';

interface FaceCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (descriptor: number[]) => void;
    title?: string;
    description?: string;
    buttonText?: string;
}

export const FaceCaptureModal: React.FC<FaceCaptureModalProps> = ({
    isOpen,
    onClose,
    onCapture,
    title = 'Face Authentication',
    description = 'Please align your face in the center of the camera.',
    buttonText = 'Capture Face'
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    const [statusText, setStatusText] = useState('Loading camera and AI models...');
    const [error, setError] = useState<string | null>(null);

    // Stop camera stream safely
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
    };

    // Initialize camera and models when modal opens
    useEffect(() => {
        let isMounted = true;

        if (isOpen) {
            setError(null);
            setIsLoadingModels(true);
            setStatusText('Loading camera and AI models...');

            // Pre-load the models via a test call or just starting the camera first
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
                .then(stream => {
                    if (isMounted && videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().then(() => {
                            if (isMounted) {
                                setIsStreaming(true);
                                setIsLoadingModels(false);
                                setStatusText(description);
                            }
                        });
                    }
                })
                .catch(err => {
                    console.error('Camera access error:', err);
                    if (isMounted) {
                        setError('Could not access the camera. Please allow camera permissions.');
                        setIsLoadingModels(false);
                    }
                });
        }

        return () => {
            isMounted = false;
            stopCamera();
        };
    }, [isOpen, description]);

    const handleCapture = async () => {
        if (!videoRef.current || !isStreaming) return;

        setIsLoadingModels(true);
        setStatusText('Scanning face parameters...');
        setError(null);

        try {
            const descriptorFloat32 = await getFaceDescriptor(videoRef.current);

            if (descriptorFloat32) {
                const descriptorArray = Array.from(descriptorFloat32);
                setStatusText('Face successfully scanned!');
                setTimeout(() => {
                    stopCamera();
                    onCapture(descriptorArray);
                }, 800);
            } else {
                setError('No face detected. Please ensure your face is well-lit and centered.');
                setIsLoadingModels(false);
                setStatusText(description);
            }
        } catch (err) {
            console.error('Capture error:', err);
            setError('An error occurred while processing the image.');
            setIsLoadingModels(false);
            setStatusText(description);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="face-modal-overlay">
            <div className="face-modal-container">
                <div className="face-modal-header">
                    <h2>{title}</h2>
                    <button className="face-modal-close" onClick={() => { stopCamera(); onClose(); }}>&times;</button>
                </div>

                <div className="face-modal-body">
                    <p className="face-modal-description">{statusText}</p>

                    <div className="video-container">
                        {error && <div className="face-error-banner">{error}</div>}

                        <video
                            ref={videoRef}
                            className={`webcam-video ${isLoadingModels ? 'loading' : 'ready'}`}
                            playsInline
                            muted
                        />

                        {/* Scanning overlay effect */}
                        {isStreaming && !error && (
                            <div className={`scan-overlay ${isLoadingModels ? 'scanning' : ''}`}>
                                <div className="scan-line"></div>
                            </div>
                        )}

                        {/* Placeholder loader */}
                        {(!isStreaming || isLoadingModels) && !error && (
                            <div className="webcam-loader">
                                <div className="spinner"></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="face-modal-actions">
                    <button
                        className="face-btn face-btn-secondary"
                        onClick={() => { stopCamera(); onClose(); }}
                    >
                        Cancel
                    </button>
                    <button
                        className="face-btn face-btn-primary"
                        onClick={handleCapture}
                        disabled={!isStreaming || isLoadingModels}
                    >
                        {isLoadingModels ? 'Processing...' : buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

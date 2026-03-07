import { CloseCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';
import React, { useState, useRef, useEffect } from 'react';
import { gLang } from '@common/language';

interface VideoPlayerProps {
    src: string;
    width: number;
    height: number;
}

const VideoPlayerComponent: React.FC<VideoPlayerProps> = ({ src, width, height }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const handlePreviewClick = () => {
        setIsModalOpen(true);
        setVideoError(false);
        setErrorMessage('');
        if (videoRef.current) {
            videoRef.current.load(); // 重新加载视频
            videoRef.current.play().catch(() => {
                setVideoError(true);
                setErrorMessage(gLang('videoPlayer.playFailedHint'));
            });
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setVideoError(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0; // Reset video to the start
        }
        triggerRef.current?.focus();
    };

    const handleVideoError = () => {
        setVideoError(true);
        setErrorMessage(gLang('videoPlayer.formatHint'));
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = src.split('/').pop() || 'video';
        link.click();
    };

    useEffect(() => {
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                setIsModalOpen(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseModal();
            }
        };

        if (isModalOpen) {
            document.addEventListener('keydown', handleKeyDown);
            closeButtonRef.current?.focus();
        } else {
            document.removeEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen]);

    return (
        <div>
            <div
                ref={triggerRef}
                tabIndex={-1}
                style={{
                    width,
                    height,
                    cursor: 'pointer',
                    background: '#f0f0f0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onClick={handlePreviewClick}
            >
                <VideoCameraOutlined />
            </div>

            {isModalOpen && (
                <div
                    style={modalStyles.overlay}
                    onClick={handleCloseModal}
                    role="dialog"
                    aria-modal="true"
                >
                    <div style={modalStyles.content} onClick={e => e.stopPropagation()}>
                        <button
                            ref={closeButtonRef}
                            style={modalStyles.closeButton}
                            onClick={handleCloseModal}
                        >
                            <CloseCircleOutlined />
                        </button>
                        {videoError ? (
                            <div style={modalStyles.errorContainer}>
                                <div style={modalStyles.errorIcon}>⚠️</div>
                                <div style={modalStyles.errorText}>{errorMessage}</div>
                                <button style={modalStyles.downloadButton} onClick={handleDownload}>
                                    {gLang('videoPlayer.downloadVideo')}
                                </button>
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                width="100%"
                                height="100%"
                                controls
                                autoPlay
                                playsInline
                                preload="metadata"
                                controlsList="nodownload"
                                onError={handleVideoError}
                                onClick={e => e.stopPropagation()}
                            >
                                <source src={src} type="video/mp4" />
                                <source src={src} type="video/webm" />
                                <source src={src} type="video/quicktime" />
                                {gLang('videoPlayer.unsupportedBrowser')}
                            </video>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const modalStyles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000, // 确保模态窗口位于顶层
    },
    content: {
        position: 'relative' as const,
        width: '80%',
        height: '80%',
        backgroundColor: '#fff',
    },
    closeButton: {
        position: 'absolute' as const,
        top: '10px',
        right: '10px',
        background: 'none',
        border: 'none',
        color: '#EC5B56',
        fontSize: '24px',
        cursor: 'pointer',
        zIndex: 10,
    },
    errorContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        padding: '20px',
    },
    errorIcon: {
        fontSize: '48px',
        marginBottom: '20px',
    },
    errorText: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '30px',
        textAlign: 'center' as const,
    },
    downloadButton: {
        padding: '10px 30px',
        fontSize: '16px',
        backgroundColor: '#1890ff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};

export default VideoPlayerComponent;

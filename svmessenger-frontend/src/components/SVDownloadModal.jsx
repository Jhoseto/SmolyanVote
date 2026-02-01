import React, { useState } from 'react';
import { useSVMessenger } from '../context/SVMessengerContext';

/**
 * SVDownloadModal - Premium compact modal with psychological messaging and tabs
 */
const SVDownloadModal = () => {
    const { isDownloadModalOpen, closeDownloadModal } = useSVMessenger();
    const [activeTab, setActiveTab] = useState('mission'); // 'mission', 'features', 'download'
    const [isQREnlarged, setIsQREnlarged] = useState(false);

    if (!isDownloadModalOpen) return null;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'mission':
                return (
                    <div className="svm-tab-pane">
                        <p className="svm-sincere-text">
                            <strong>SVMessenger не е просто поредното приложение.</strong> То е нашият отговор на все по-голямата зависимост от технологичните гиганти.
                        </p>
                        <p className="svm-sincere-text">
                            Създадохме това място за теб – напълно независимо от алгоритми и корпоративен натиск. Тук ти не си "продукт", а свободен човек. Това е проект от хора за хора, където честността и тишината от реклами са наш приоритет.
                        </p>
                        <div className="svm-independence-badge">100% Независимост</div>
                    </div>
                );
            case 'features':
                return (
                    <div className="svm-tab-pane">
                        <p className="svm-sincere-text">
                            Вярваме в качеството пред количеството. Затова се фокусираме върху безупречната текстова комуникация.
                        </p>
                        <div className="svm-warning-box">
                            <strong>Важно уточнение:</strong>
                            <p>Аудио и видео разговорите са привилегия, достъпна само за потребители с висок рейтинг. Това гарантира, че средата ни остава защитена от злоупотреби и запазваме ресурсите си за онези, които наистина ценят общността ни.</p>
                        </div>
                    </div>
                );
            case 'download':
                return (
                    <div className="svm-tab-pane">
                        {window.innerWidth <= 768 ? (
                            <div className="svm-download-actions">
                                <a href="/svmessenger.apk" className="svm-btn-primary" download>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '10px' }}>
                                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                    </svg>
                                    Изтегли Android App
                                </a>
                                <p className="svm-hint">Версия 1.0.0 | ~25MB</p>
                            </div>
                        ) : (
                            <div className="svm-qr-section-compact">
                                <div className="svm-qr-container" onClick={() => setIsQREnlarged(true)} style={{ cursor: 'pointer' }} title="Кликни за да увеличиш">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://smolyanvote.com/svmessenger.apk')}`}
                                        alt="QR Code"
                                        className="svm-qr-code"
                                    />
                                </div>
                                <div className="svm-qr-text-compact">
                                    <strong>Сканирай с камерата</strong>
                                    <p>Кликни на QR кода за увеличение.</p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="svm-modal-overlay" onClick={closeDownloadModal}>
            <div className="svm-download-modal-compact" onClick={e => e.stopPropagation()}>
                <button className="svm-modal-close-small" onClick={closeDownloadModal}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className="svm-modal-layout">
                    <div className="svm-modal-visuals">
                        <img src="/svmessenger/img/svapp_promo_premium.jpg" alt="SVMessenger" className="svm-mockup-mini" />
                    </div>

                    <div className="svm-modal-main">
                        <header className="svm-modal-header">
                            <span className="svm-brand-tag">SV Messenger</span>
                            <h2 className="svm-compact-title">Свободата да общуваш</h2>
                        </header>

                        <nav className="svm-tabs-nav">
                            <button
                                className={`svm-tab-btn ${activeTab === 'mission' ? 'active' : ''}`}
                                onClick={() => setActiveTab('mission')}
                            >
                                Кауза
                            </button>
                            <button
                                className={`svm-tab-btn ${activeTab === 'features' ? 'active' : ''}`}
                                onClick={() => setActiveTab('features')}
                            >
                                Възможности
                            </button>
                            <button
                                className={`svm-tab-btn ${activeTab === 'download' ? 'active' : ''}`}
                                onClick={() => setActiveTab('download')}
                            >
                                Изтегляне
                            </button>
                        </nav>

                        <main className="svm-tabs-content">
                            {renderTabContent()}
                        </main>

                        <footer className="svm-modal-footer">
                            {activeTab !== 'download' && (
                                <button className="svm-btn-next" onClick={() => setActiveTab(activeTab === 'mission' ? 'features' : 'download')}>
                                    Продължи напред →
                                </button>
                            )}
                        </footer>
                    </div>
                </div>
            </div>

            {/* Enlarged QR Code Overlay */}
            {/* Premium Enlarged QR Code Overlay */}
            {isQREnlarged && (
                <div className="svm-qr-overlay" onClick={() => setIsQREnlarged(false)}>
                    <div className="svm-qr-enlarged-container" onClick={e => e.stopPropagation()}>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent('https://smolyanvote.com/svmessenger.apk')}`}
                            alt="Scan to Download"
                            className="svm-qr-enlarged"
                        />
                        <div className="svm-qr-enlarged-footer">
                            <span className="svm-qr-pulse"></span>
                            <p>Сканирай, за да инсталираш</p>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .svm-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(2, 44, 34, 0.7);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    z-index: 1000000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    animation: svmFadeIn 0.3s ease-out;
                    cursor: zoom-out;
                }

                @keyframes svmZoomInSpring {
                    0% { opacity: 0; transform: scale(0.6) translateY(40px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }

                @keyframes svmPulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 0; }
                }

                .svm-qr-enlarged-container {
                     background: white;
                     padding: 32px;
                     border-radius: 32px;
                     box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.2) inset;
                     animation: svmZoomInSpring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                     display: flex;
                     flex-direction: column;
                     align-items: center;
                     max-width: 400px;
                     width: 100%;
                }

                .svm-qr-enlarged {
                    width: 100%;
                    height: auto;
                    border-radius: 12px;
                    margin-bottom: 24px;
                }

                .svm-qr-enlarged-footer {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #022c22;
                    font-weight: 600;
                }

                .svm-qr-pulse {
                    width: 8px;
                    height: 8px;
                    background: #16a34a;
                    border-radius: 50%;
                    position: relative;
                }

                .svm-qr-pulse::after {
                     content: '';
                     position: absolute;
                     top: 0; left: 0; right: 0; bottom: 0;
                     background: #16a34a;
                     border-radius: 50%;
                     animation: svmPulse 1.5s infinite;
                }

                .svm-download-modal-compact {
                    background: #ffffff;
                    width: 100%;
                    max-width: 820px;
                    border-radius: 28px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.6);
                    animation: svmPopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15);
                }

                .svm-modal-close-small {
                    position: absolute;
                    top: 16px; right: 16px;
                    background: rgba(0,0,0,0.05);
                    border: none;
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center; justify-content: center;
                    cursor: pointer;
                    color: #022c22;
                    z-index: 100;
                    transition: 0.2s;
                }

                .svm-modal-layout {
                    display: flex;
                }

                .svm-modal-visuals {
                    flex: 0 0 320px;
                    background: #022c22;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .svm-mockup-mini {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .svm-modal-main {
                    flex: 1;
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    min-height: 480px;
                }

                .svm-brand-tag {
                    font-size: 12px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: #16a34a;
                    margin-bottom: 8px;
                    display: block;
                }

                .svm-compact-title {
                    font-size: 32px;
                    font-weight: 800;
                    color: #022c22;
                    margin-bottom: 24px;
                    letter-spacing: -0.5px;
                }

                .svm-tabs-nav {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 24px;
                    background: #f3f4f6;
                    padding: 4px;
                    border-radius: 12px;
                }

                .svm-tab-btn {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    background: transparent;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #6b7280;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .svm-tab-btn.active {
                    background: #ffffff;
                    color: #022c22;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }

                .svm-tabs-content {
                    flex: 1;
                    animation: svmFadeIn 0.3s ease;
                }

                .svm-sincere-text {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #4b5563;
                    margin-bottom: 16px;
                }

                .svm-independence-badge {
                    display: inline-block;
                    padding: 6px 14px;
                    background: #022c22;
                    color: #fbbf24;
                    border-radius: 100px;
                    font-size: 13px;
                    font-weight: 700;
                }

                .svm-warning-box {
                    background: #fff8e1;
                    border-left: 4px solid #fbbf24;
                    padding: 16px;
                    border-radius: 8px;
                    margin-top: 20px;
                }

                .svm-warning-box strong {
                    color: #92400e;
                    display: block;
                    margin-bottom: 4px;
                }

                .svm-warning-box p {
                    font-size: 14px;
                    color: #92400e;
                    margin: 0;
                    line-height: 1.4;
                }

                .svm-qr-section-compact {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: #f9fafb;
                    padding: 16px;
                    border-radius: 16px;
                    border: 1px solid #e5e7eb;
                }

                .svm-qr-container {
                    background: white;
                    padding: 6px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }

                .svm-qr-text-compact strong {
                    display: block;
                    font-size: 14px;
                    color: #022c22;
                }

                .svm-qr-text-compact p {
                    font-size: 13px;
                    color: #6b7280;
                    margin: 0;
                }

                .svm-btn-next {
                    background: #16a34a;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: 0.2s;
                    margin-top: 20px;
                }

                .svm-btn-next:hover {
                    background: #15803d;
                    transform: translateX(4px);
                }

                .svm-btn-primary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #16a34a;
                    color: white;
                    padding: 16px;
                    border-radius: 14px;
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 16px;
                }

                @media (max-width: 768px) {
                    .svm-modal-layout {
                        flex-direction: column;
                    }
                    .svm-modal-visuals {
                        flex: 0 0 200px;
                    }
                    .svm-modal-main {
                        padding: 24px;
                        min-height: auto;
                    }
                    .svm-compact-title {
                        font-size: 26px;
                    }
                }

                @keyframes svmFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes svmPopIn {
                    from { transform: scale(0.9) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            ` }} />
        </div>
    );
};

export default SVDownloadModal;

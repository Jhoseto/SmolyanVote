/**
 * Entry point за call-window popup прозорец
 * Независим React app за audio обаждания
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import CallWindowApp from './CallWindowApp';
import './call-window.css';

// Зареди данни от URL params
console.log('🚀 Call window popup opened');
const urlParams = new URLSearchParams(window.location.search);

const callData = {
    token: urlParams.get('token'),
    roomName: urlParams.get('roomName'),
    conversationId: urlParams.get('conversationId'),
    otherUserId: urlParams.get('otherUserId'),
    otherUserName: urlParams.get('otherUserName'),
    otherUserAvatar: urlParams.get('otherUserAvatar'),
    currentUserId: urlParams.get('currentUserId'),
    currentUserName: urlParams.get('currentUserName'),
    currentUserAvatar: urlParams.get('currentUserAvatar'),
    callType: urlParams.get('callType') || 'voice',
    callState: urlParams.get('callState') || 'outgoing' // 'outgoing', 'incoming', 'connected'
};

console.log('📞 Call window data:', {
    hasToken: !!callData.token,
    tokenLength: callData.token?.length || 0,
    roomName: callData.roomName,
    conversationId: callData.conversationId,
    callState: callData.callState,
    otherUserId: callData.otherUserId,
    currentUserId: callData.currentUserId
});

// Проверка за задължителни параметри
if (!callData.token || !callData.roomName || !callData.conversationId) {
    console.error('❌ Missing required call data:', {
        hasToken: !!callData.token,
        hasRoomName: !!callData.roomName,
        hasConversationId: !!callData.conversationId
    });
    document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 20px;">
            <h2>Грешка</h2>
            <p>Липсват необходими данни за разговора.</p>
            <button onclick="window.close()" style="padding: 10px 20px; cursor: pointer;">Затвори</button>
        </div>
    `;
} else {
    console.log('✅ All required data present, mounting React app');
    // Mount React app
    const container = document.getElementById('call-window-root');
    if (!container) {
        console.error('❌ Container element not found!');
    } else {
        const root = createRoot(container);
        root.render(<CallWindowApp callData={callData} />);
        console.log('✅ React app mounted');
    }
}


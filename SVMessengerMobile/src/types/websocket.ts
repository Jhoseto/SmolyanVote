/**
 * WebSocket Types
 * Type definitions for WebSocket messages and signals
 */

export interface CallSignal {
  eventType: 'CALL_REQUEST' | 'CALL_ACCEPT' | 'CALL_ACCEPTED' | 'CALL_REJECT' | 'CALL_REJECTED' | 'CALL_END' | 'CALL_ENDED';
  conversationId: number;
  callerId: number;
  receiverId?: number;
  roomName?: string;
  callerName?: string;
  callerAvatar?: string;
  // Call history fields
  startTime?: string; // ISO string format for call start time
  endTime?: string;   // ISO string format for call end time
  isVideoCall?: boolean; // Whether this is a video call
  wasConnected?: boolean;
}

export interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error | unknown) => void;
  onNewMessage?: (data: unknown) => void;
  onTypingStatus?: (data: unknown) => void;
  onReadReceipt?: (data: unknown) => void;
  onDeliveryReceipt?: (data: unknown) => void;
  onOnlineStatus?: (data: unknown) => void;
  onCallSignal?: (data: CallSignal) => void;
}

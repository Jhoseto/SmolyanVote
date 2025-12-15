/**
 * Call Types
 */

export interface CallTokenResponse {
  token: string;
  roomName: string;
  serverUrl: string;
  conversationId: number;
}

export interface CallTokenRequest {
  conversationId: number;
}

export enum CallState {
  IDLE = 'idle',
  OUTGOING = 'outgoing',
  INCOMING = 'incoming',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

export interface Call {
  id: string;
  conversationId: number;
  participantId: number;
  participantName: string;
  participantImageUrl?: string;
  state: CallState;
  startTime?: Date;
  endTime?: Date;
  isVideoEnabled?: boolean;
}


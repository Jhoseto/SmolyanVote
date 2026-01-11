/**
 * Call History Types
 */

export interface CallHistory {
  id: number;
  conversationId: number;
  callerId: number;
  callerName: string;
  callerImageUrl?: string;
  receiverId: number;
  receiverName: string;
  receiverImageUrl?: string;
  startTime: string;
  endTime?: string;
  durationSeconds?: number; // Duration in seconds (null if call was rejected/missed)
  status: 'ACCEPTED' | 'REJECTED' | 'MISSED' | 'CANCELLED';
  isVideoCall: boolean;
}

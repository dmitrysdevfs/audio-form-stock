/**
 * Audio module types
 * Type definitions for real-time audio conversation
 */

export interface AudioMessage {
  type: 'audio' | 'text' | 'start' | 'stop' | 'error';
  data?: string; // Base64 encoded audio or text content
  timestamp: string;
  sessionId?: string;
}

export interface AudioResponse {
  type: 'response' | 'error' | 'status';
  message: string;
  timestamp: string;
  sessionId?: string;
}

export interface ConversationSession {
  id: string;
  isActive: boolean;
  startTime: string;
  endTime?: string;
  messages: AudioMessage[];
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardBody, Chip } from '@nextui-org/react';
import MicButton from '../components/MicButton';

export default function AudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // WebSocket connection management
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        setConnectionStatus('connecting');
        const ws = new WebSocket('ws://localhost:3001/audio');

        ws.onopen = () => {
          setConnectionStatus('connected');
          setError(null);
        };

        ws.onclose = () => {
          setConnectionStatus('disconnected');
        };

        ws.onerror = () => {
          setError('WebSocket connection failed');
          setConnectionStatus('disconnected');
        };

        wsRef.current = ws;
      } catch {
        setError('Failed to create WebSocket connection');
        setConnectionStatus('disconnected');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Audio recording setup
  const setupAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        audioChunksRef.current = [];

        // Send audio data via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(audioBlob);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
    } catch {
      setError('Failed to access microphone');
    }
  };

  const handleStartStop = async () => {
    if (!isRecording) {
      // Start recording
      try {
        await setupAudioRecording();
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.start();
          setIsRecording(true);
        }
      } catch {
        setError('Failed to start recording');
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'disconnected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-default-50">
        <CardBody className="space-y-8 flex flex-col items-center justify-center">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <Chip
              color={getStatusColor() as 'success' | 'warning' | 'danger' | 'default'}
              size="sm"
              variant="flat"
            >
              {getStatusText()}
            </Chip>
            {error && (
              <Chip color="danger" size="sm" variant="flat">
                Error
              </Chip>
            )}
          </div>

          {/* Main instruction text */}
          <p className="text-xl font-semibold text-default-700 text-center">
            Start a conversation with assistants
          </p>

          {/* Microphone Button */}
          <div className="flex justify-center">
            <MicButton
              isRecording={isRecording}
              onToggle={handleStartStop}
              size="lg"
              disabled={connectionStatus !== 'connected'}
            />
          </div>

          {/* Status indicators */}
          <div className="text-center space-y-2">
            <p className="text-sm text-default-500">
              {isRecording ? 'Recording...' : 'Ready to record'}
            </p>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

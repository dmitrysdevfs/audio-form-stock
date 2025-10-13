'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardBody, Chip } from '@nextui-org/react';
import MicButton from '../components/MicButton';

// Convert audio to PCM16 mono 24kHz for OpenAI
const convertToPCM16 = async (audioBlob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async () => {
      try {
        const arrayBuffer = fileReader.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Convert to mono and 24kHz
        const sourceData = audioBuffer.getChannelData(0);
        const targetSampleRate = 24000;
        const ratio = audioBuffer.sampleRate / targetSampleRate;
        const targetLength = Math.floor(sourceData.length / ratio);
        const targetData = new Float32Array(targetLength);

        // Simple downsampling
        for (let i = 0; i < targetLength; i++) {
          const sourceIndex = Math.floor(i * ratio);
          targetData[i] = sourceData[sourceIndex];
        }

        // Convert Float32Array to PCM16
        const pcm16Buffer = new ArrayBuffer(targetData.length * 2);
        const pcm16View = new DataView(pcm16Buffer);

        for (let i = 0; i < targetData.length; i++) {
          const sample = Math.max(-1, Math.min(1, targetData[i]));
          const pcm16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
          pcm16View.setInt16(i * 2, pcm16, true);
        }

        resolve(pcm16Buffer);
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = () => reject(new Error('Failed to read audio file'));
    fileReader.readAsArrayBuffer(audioBlob);
  });
};

export default function AudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [conversationText, setConversationText] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // WebSocket connection management
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        setConnectionStatus('connecting');

        // Connect to backend WebSocket (backend handles OpenAI connection)
        const ws = new WebSocket('ws://localhost:3001/api/conversation');

        ws.onopen = () => {
          setConnectionStatus('connected');
          setError(null);
          console.log('WebSocket connected successfully');

          // Send ping to keep connection alive
          ws.send(JSON.stringify({ type: 'ping' }));

          // Keep WebSocket alive with ping
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            } else {
              clearInterval(pingInterval);
            }
          }, 30000); // Ping every 30 seconds
        };

        ws.onmessage = event => {
          // Handle WebSocket messages from backend
          try {
            const data = JSON.parse(event.data);

            // Handle different message types
            switch (data.type) {
              case 'session.created':
                console.log('Session created successfully');
                break;
              case 'session.updated':
                console.log('Session updated successfully');
                break;
              case 'response.output_text.delta':
                // Handle text response delta
                setConversationText(prev => prev + data.text);
                break;
              case 'response.output_text.done':
                // Handle text response done
                setConversationText(prev => prev + '\n\n');
                break;
              case 'conversation.item.input_audio_buffer.transcript':
                // Handle audio transcript
                console.log('Audio transcript:', data.transcript);
                setConversationText(prev => prev + `You: ${data.transcript}\n`);
                break;
              case 'transcription_response':
                // Handle transcription response from backend
                console.log('Transcription Response:', data.data);

                if (data.data?.type) {
                  switch (data.data.type) {
                    case 'transcription_delta':
                      console.log('Transcription delta:', data.data.text);
                      // You can show live transcription here if needed
                      break;
                    case 'transcription_completed':
                      console.log('Transcription completed:', data.data.transcript);
                      setConversationText(prev => prev + `You: ${data.data.transcript}\n`);
                      break;
                    default:
                      console.log('Transcription message type:', data.data.type);
                  }
                } else {
                  console.log('Transcription response missing type:', data.data);
                }
                break;
              case 'openai_response':
                // Handle OpenAI response from backend
                console.log('OpenAI Response:', data.data);

                if (data.data?.type) {
                  // Process the actual OpenAI message type
                  switch (data.data.type) {
                    case 'conversation.item.response.output_text.delta':
                      setConversationText(prev => prev + data.data.text);
                      break;
                    case 'conversation.item.response.output_text.done':
                      setConversationText(prev => prev + '\n\n');
                      break;
                    case 'conversation.item.input_audio_buffer.transcript':
                      setConversationText(prev => prev + `You: ${data.data.transcript}\n`);
                      break;
                    case 'conversation.item.response.output_audio.delta':
                      console.log('Audio response delta received:', data.data.audio);
                      // Here you can play the audio chunk if needed
                      break;
                    case 'conversation.item.response.output_audio.done':
                      console.log('Audio response completed');
                      break;
                    case 'conversation.item.response.output_audio_transcript.delta':
                      console.log('Audio transcript delta:', data.data.text);
                      setConversationText(prev => prev + data.data.text);
                      break;
                    case 'conversation.item.response.output_audio_transcript.done':
                      console.log('Audio transcript completed:', data.data.transcript);
                      setConversationText(prev => prev + `\nAI: ${data.data.transcript}\n\n`);
                      break;
                    case 'session.created':
                      console.log('OpenAI session created');
                      break;
                    case 'session.updated':
                      console.log('OpenAI session updated');
                      break;
                    case 'input_audio_buffer.committed':
                      console.log('Audio buffer committed to OpenAI');
                      break;
                    default:
                      console.log('OpenAI inner message type:', data.data.type);
                  }
                } else {
                  console.log('OpenAI response missing type:', data.data);
                }
                break;
              case 'response':
                // Handle backend response
                console.log('Backend Response:', data.message);
                break;
              case 'pong':
                // Handle pong response (keep-alive)
                console.log('Pong received - connection alive');
                break;
              case 'error':
                // Handle errors
                const errorMessage = data.message || data.error?.message || 'Unknown error';
                console.error('Error:', errorMessage);
                setError(errorMessage);
                break;
              default:
                console.log('Unknown message type:', data);
            }
          } catch {
            // Handle non-JSON messages
            console.log('Non-JSON message:', event.data);
          }
        };

        ws.onclose = event => {
          setConnectionStatus('disconnected');
          console.log('WebSocket connection closed', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
        };

        ws.onerror = error => {
          console.error('WebSocket error:', error);
          setError('WebSocket connection failed');
          setConnectionStatus('disconnected');
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setError(error instanceof Error ? error.message : 'Failed to create WebSocket connection');
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
      // Try different audio formats for OpenAI compatibility
      let mimeType = 'audio/wav';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm;codecs=opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      console.log('Using audio format:', mimeType);

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        // Send audio to OpenAI Realtime API
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            // Convert to PCM16 mono 24kHz for OpenAI
            const pcm16Buffer = await convertToPCM16(audioBlob);

            // Check minimum audio length (100ms = 4800 bytes for PCM16 mono 24kHz)
            const minAudioLength = 4800;
            if (pcm16Buffer.byteLength < minAudioLength) {
              console.warn(
                `Audio too short: ${pcm16Buffer.byteLength} bytes (minimum ${minAudioLength} bytes for 100ms)`
              );
              setError('Audio too short. Please speak for at least 1 second.');
              return;
            }

            console.log('Sending PCM16 audio to OpenAI...', {
              originalSize: audioBlob.size,
              pcm16Size: pcm16Buffer.byteLength,
              duration: `${((pcm16Buffer.byteLength / 48000) * 1000).toFixed(1)}ms`,
              minRequired: minAudioLength,
            });

            // Send audio metadata first
            wsRef.current?.send(
              JSON.stringify({
                type: 'audio_metadata',
                encoding: 'audio/pcm',
                rate: 24000,
                size: pcm16Buffer.byteLength,
              })
            );

            // Then send PCM16 audio data
            wsRef.current?.send(pcm16Buffer);
          } catch (error) {
            console.error('Error converting audio:', error);
            setError('Failed to process audio');
          }
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
          // Start recording with longer chunks for better audio quality
          mediaRecorderRef.current.start(1000); // Record in 1-second chunks
          setIsRecording(true);

          // Auto-stop recording after 5 seconds to ensure enough audio (minimum 100ms)
          setTimeout(() => {
            if (mediaRecorderRef.current && isRecording) {
              mediaRecorderRef.current.stop();
              setIsRecording(false);
            }
          }, 5000);
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

  const startConversation = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'conversation',
          action: 'start',
        })
      );
      setIsConversationActive(true);
      setConversationText('');
    }
  };

  const stopConversation = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'conversation',
          action: 'stop',
        })
      );
      setIsConversationActive(false);
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
          <p className="text-lg font-medium text-default-700 text-center">
            Start a conversation with assistant
          </p>

          {/* Conversation Controls */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={startConversation}
              disabled={connectionStatus !== 'connected' || isConversationActive}
              className="px-4 py-2 text-sm bg-success text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Conversation
            </button>
            <button
              onClick={stopConversation}
              disabled={connectionStatus !== 'connected' || !isConversationActive}
              className="px-4 py-2 text-sm bg-danger text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stop Conversation
            </button>
          </div>

          {/* Microphone Button */}
          <div className="flex justify-center">
            <MicButton
              isRecording={isRecording}
              onToggle={handleStartStop}
              size="lg"
              disabled={connectionStatus !== 'connected' || !isConversationActive}
            />
          </div>

          {/* Conversation Text Display */}
          {conversationText && (
            <div className="w-full max-h-60 overflow-y-auto bg-default-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-default-700 mb-2">Conversation:</h3>
              <p className="text-sm text-default-600 whitespace-pre-wrap">{conversationText}</p>
            </div>
          )}

          {/* Status indicators */}
          <div className="text-center space-y-2">
            <p className="text-sm text-default-500">
              {isConversationActive
                ? isRecording
                  ? 'Recording...'
                  : 'Conversation active - ready to record'
                : 'Start conversation to begin'}
            </p>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

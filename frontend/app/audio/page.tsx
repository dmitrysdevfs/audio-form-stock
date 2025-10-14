'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardBody, Chip, Textarea } from '@nextui-org/react';
import MicButton from '../components/MicButton';

const convertToPCM16 = async (audioBlob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async () => {
      try {
        const arrayBuffer = fileReader.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const sourceData = audioBuffer.getChannelData(0);
        const targetSampleRate = 24000;
        const ratio = audioBuffer.sampleRate / targetSampleRate;
        const targetLength = Math.floor(sourceData.length / ratio);
        const targetData = new Float32Array(targetLength);

        for (let i = 0; i < targetLength; i++) {
          const sourceIndex = Math.floor(i * ratio);
          targetData[i] = sourceData[sourceIndex];
        }

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTo({
            top: textareaRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 100);
    }
  }, [conversationText]);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        setConnectionStatus('connecting');

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:3001';
        const wsUrl = `${backendUrl}/api/conversation`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setConnectionStatus('connected');
          setError(null);

          ws.send(JSON.stringify({ type: 'ping' }));

          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            } else {
              clearInterval(pingInterval);
            }
          }, 30000);
        };

        ws.onmessage = event => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'session.created':
                break;
              case 'session.updated':
                break;
              case 'response.output_text.delta':
                break;
              case 'response.output_text.done':
                break;
              case 'conversation.item.input_audio_buffer.transcript':
                setConversationText(prev => prev + `You: ${data.transcript}\n`);
                break;
              case 'transcription_response':
                if (data.data?.type) {
                  switch (data.data.type) {
                    case 'transcription_delta':
                      break;
                    case 'transcription_completed':
                      setConversationText(prev => prev + `You: ${data.data.transcript}\n`);
                      break;
                  }
                }
                break;
              case 'openai_response':
                const responseData = data.data?.data || data.data;

                if (responseData?.type) {
                  switch (responseData.type) {
                    case 'response.output_text.delta':
                      setConversationText(prev => prev + responseData.delta);
                      break;
                    case 'response.output_text.done':
                      setConversationText(prev => prev + '\n\n');
                      break;
                    case 'conversation.item.input_audio_buffer.transcript':
                      setConversationText(prev => prev + `You: ${responseData.transcript}\n`);
                      break;
                    case 'conversation.item.response.output_audio.delta':
                      break;
                    case 'conversation.item.response.output_audio.done':
                      break;
                    case 'conversation.item.response.output_audio_transcript.delta':
                      setConversationText(prev => prev + responseData.text);
                      break;
                    case 'conversation.item.response.output_audio_transcript.done':
                      setConversationText(prev => prev + `\nAI: ${responseData.transcript}\n\n`);
                      break;
                    case 'session.created':
                      break;
                    case 'session.updated':
                      break;
                    case 'input_audio_buffer.committed':
                      break;
                  }
                }
                break;
              case 'response':
                break;
              case 'pong':
                break;
              case 'error':
                const errorMessage = data.message || data.error?.message || 'Unknown error';
                setError(errorMessage);
                break;
            }
          } catch {}
        };

        ws.onclose = () => {
          setConnectionStatus('disconnected');
        };

        ws.onerror = () => {
          setError('WebSocket connection failed');
          setConnectionStatus('disconnected');
        };

        wsRef.current = ws;
      } catch (error) {
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

  const setupAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            const pcm16Buffer = await convertToPCM16(audioBlob);

            const minAudioLength = 4800;
            if (pcm16Buffer.byteLength < minAudioLength) {
              setError('Audio too short. Please speak for at least 1 second.');
              return;
            }

            wsRef.current?.send(pcm16Buffer);
          } catch {
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
      try {
        await setupAudioRecording();
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.start(1000);
          setIsRecording(true);

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
        <CardBody className="space-y-6 flex flex-col items-center justify-center">
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
          <div className="flex justify-center my-2">
            <MicButton
              isRecording={isRecording}
              onToggle={handleStartStop}
              size="lg"
              disabled={connectionStatus !== 'connected' || !isConversationActive}
            />
          </div>

          <Textarea
            ref={textareaRef}
            isReadOnly
            className="w-full"
            value={conversationText}
            label="AI Assistant Response"
            labelPlacement="outside"
            placeholder="AI responses will appear here..."
            variant="bordered"
            minRows={4}
            maxRows={8}
            classNames={{
              base: 'w-full',
              input: 'resize-none',
            }}
          />

          {error && (
            <div className="text-center">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

'use client';

import { Card, CardBody, CardHeader } from '@nextui-org/react';

export default function AudioPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md">Audio Recording</p>
            <p className="text-small text-default-500">Coming Soon</p>
          </div>
        </CardHeader>
        <CardBody>
          <h1 className="text-2xl font-bold mb-4">Audio Conversation</h1>
          <p className="text-default-500 mb-4">
            This page will implement microphone access with real-time audio processing
          </p>
          <div className="text-center">
            <span className="text-6xl">🎤</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

'use client';

import { Button, Card, CardBody, CardHeader } from '@nextui-org/react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md">NextUI + Tailwind CSS v3</p>
            <p className="text-small text-default-500">Working!</p>
          </div>
        </CardHeader>
        <CardBody>
          <h1 className="text-2xl font-bold mb-4">Welcome to NextJS Audio Form Stock</h1>
          <p className="text-default-500 mb-4">
            NextUI components are working perfectly with Tailwind CSS v3!
          </p>
          <div className="flex gap-2">
            <Button color="primary" as="a" href="/form">
              View Form
            </Button>
            <Button color="secondary" variant="bordered">
              Learn More
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

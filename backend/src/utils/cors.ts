export const getAllowedOrigins = (): string[] => {
  const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const frontendUrl = process.env.FRONTEND_URL;

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  const allOrigins = [
    ...defaultOrigins,
    ...(frontendUrl ? [frontendUrl] : []),
    ...corsOrigins,
  ];

  return [...new Set(allOrigins)].filter(Boolean);
};

export const logAllowedOrigins = (origins: string[]): void => {
  console.log('Allowed CORS origins:');
  origins.forEach((origin) => {
    console.log(`  ${origin}`);
  });
};

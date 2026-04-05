import "dotenv/config";

export const config = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,
  },
  cerebras: {
    apiKey: process.env.CEREBRAS_API_KEY,
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
};

export const validateConfig = () => {
  const missingKeys: string[] = [];

  if (!config.groq.apiKey) missingKeys.push("GROQ_API_KEY");
  if (!config.cerebras.apiKey) missingKeys.push("CEREBRAS_API_KEY");
  if (!config.openrouter.apiKey) missingKeys.push("OPENROUTER_API_KEY");
  if (!config.google.apiKey) missingKeys.push("GOOGLE_API_KEY");

  if (missingKeys.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missingKeys.join(", ")}`
    );
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
};

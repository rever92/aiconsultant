declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GROQ_API_KEY: string;
      ASSEMBLYAI_API_KEY: string;
    }
  }
}

export {}; 
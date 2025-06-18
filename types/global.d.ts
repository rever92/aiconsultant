declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GROQ_API_KEY: string;
      ASSEMBLYAI_API_KEY: string;
      GEMINI_API_KEY: string;
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
    }
  }
}

export {}; 
# Documentación de Base de Datos - Supabase

## Estado Actual del Proyecto

**NOTA:** Este proyecto actualmente **NO utiliza Supabase** ni ninguna base de datos. Toda la funcionalidad se maneja con archivos temporales y APIs de procesamiento.

## Funcionalidades Implementadas

### 1. Sistema de Transcripción con Recuperación Parcial
- **Descripción:** Sistema robusto de transcripción de audio que maneja fallos de conexión
- **Implementación:** Archivos temporales en el sistema de archivos del servidor
- **Proveedores de IA:** Groq y AssemblyAI
- **APIs Involucradas:**
  - `/api/convert-audio` - Conversión de video a audio
  - `/api/transcribe` - Transcripción simple con Groq
  - `/api/transcribe-assemblyai` - Transcripción simple con AssemblyAI  
  - `/api/split-transcribe` - Transcripción dividida con Groq
  - `/api/split-transcribe-assemblyai` - Transcripción dividida con AssemblyAI
  - `/api/retry-segments` - Reintento de segmentos fallidos con Groq
  - `/api/retry-segments-assemblyai` - Reintento de segmentos fallidos con AssemblyAI

### 2. Manejo de Segmentos de Audio
- **Archivos temporales:** Se crean en el directorio temporal del sistema
- **Limpieza automática:** Los segmentos exitosos se eliminan automáticamente
- **Persistencia temporal:** Los segmentos fallidos se mantienen para permitir reintentos

## Proveedores de IA Implementados

### Groq
- **Modelo**: whisper-large-v3-turbo
- **Ventajas**: Muy rápido (segundos), gratuito
- **Limitaciones**: 25MB por archivo, problemas ocasionales de conexión
- **Ideal para**: Videos cortos, pruebas rápidas

### AssemblyAI  
- **Modelo**: universal
- **Ventajas**: Muy preciso, archivos grandes (200MB+), conexiones estables
- **Limitaciones**: Más lento (1-2 minutos), servicio de pago
- **Ideal para**: Videos largos, transcripciones profesionales

### Variables de Entorno Actuales
```env
GROQ_API_KEY=tu_clave_api_de_groq
ASSEMBLYAI_API_KEY=0621f2f79bba4bcc87e871f3108380d2
```

## Posibles Integraciones Futuras con Supabase

### Tabla: `transcription_sessions`
```sql
-- ESTA TABLA NO EXISTE AÚN, ES UNA PROPUESTA PARA EL FUTURO
CREATE TABLE transcription_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  video_filename TEXT NOT NULL,
  video_size_mb DECIMAL,
  audio_size_mb DECIMAL,
  duration_minutes DECIMAL,
  total_segments INTEGER,
  successful_segments INTEGER,
  failed_segments INTEGER,
  status TEXT CHECK (status IN ('processing', 'completed', 'partial', 'error')),
  provider TEXT CHECK (provider IN ('groq', 'assemblyai')) NOT NULL DEFAULT 'groq',
  transcription_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla: `transcription_segments`
```sql
-- ESTA TABLA NO EXISTE AÚN, ES UNA PROPUESTA PARA EL FUTURO
CREATE TABLE transcription_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES transcription_sessions(id) ON DELETE CASCADE,
  segment_number INTEGER NOT NULL,
  duration_minutes DECIMAL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transcription_text TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  file_path TEXT, -- Para segmentos que necesitan reintento
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, segment_number)
);
```

### Políticas RLS (Row Level Security)
```sql
-- ESTAS POLÍTICAS NO EXISTEN AÚN
-- Usuarios pueden ver solo sus propias sesiones
ALTER TABLE transcription_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON transcription_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON transcription_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON transcription_sessions
  FOR UPDATE USING (auth.uid() = user_id);
```

## Funciones de Base de Datos Propuestas

### 1. Función para calcular estadísticas de sesión
```sql
-- ESTA FUNCIÓN NO EXISTE AÚN
CREATE OR REPLACE FUNCTION calculate_session_stats(session_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_segments', COUNT(*),
    'successful_segments', COUNT(*) FILTER (WHERE status = 'completed'),
    'failed_segments', COUNT(*) FILTER (WHERE status = 'failed'),
    'success_rate', ROUND((COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100, 2)
  ) INTO stats
  FROM transcription_segments
  WHERE session_id = session_uuid;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Función para limpiar sesiones antiguas
```sql
-- ESTA FUNCIÓN NO EXISTE AÚN
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM transcription_sessions
  WHERE created_at < NOW() - INTERVAL '7 days'
  AND status IN ('completed', 'error');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Triggers Propuestos

### 1. Actualizar timestamp automáticamente
```sql
-- ESTE TRIGGER NO EXISTE AÚN
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transcription_sessions_updated_at
  BEFORE UPDATE ON transcription_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcription_segments_updated_at
  BEFORE UPDATE ON transcription_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Índices Recomendados

```sql
-- ESTOS ÍNDICES NO EXISTEN AÚN
CREATE INDEX idx_transcription_sessions_user_id ON transcription_sessions(user_id);
CREATE INDEX idx_transcription_sessions_status ON transcription_sessions(status);
CREATE INDEX idx_transcription_sessions_provider ON transcription_sessions(provider);
CREATE INDEX idx_transcription_sessions_created_at ON transcription_sessions(created_at);
CREATE INDEX idx_transcription_segments_session_id ON transcription_segments(session_id);
CREATE INDEX idx_transcription_segments_status ON transcription_segments(status);
```

## Configuración de Storage (para archivos de audio)

```sql
-- ESTE BUCKET NO EXISTE AÚN
-- Crear bucket para archivos de audio temporales
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-segments', 'audio-segments', false);

-- Política para que usuarios accedan solo a sus archivos
CREATE POLICY "Users can upload audio segments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'audio-segments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own audio segments" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio-segments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own audio segments" ON storage.objects
  FOR DELETE USING (bucket_id = 'audio-segments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Variables de Entorno Requeridas para Supabase

```env
# ESTAS VARIABLES NO ESTÁN CONFIGURADAS AÚN
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Última Actualización

**Fecha:** Diciembre 2024
**Cambios:** 
- Integración de AssemblyAI como proveedor alternativo de transcripción
- APIs separadas para Groq y AssemblyAI 
- Sistema de selección de proveedor en el frontend
- Actualización de propuestas de base de datos para incluir campo de proveedor
**Estado:** Sin implementar - Solo propuestas para desarrollo futuro

---

**IMPORTANTE:** Este documento refleja el estado actual (sin base de datos) y propuestas para futuras implementaciones. Cualquier cambio real en la base de datos será documentado aquí. 
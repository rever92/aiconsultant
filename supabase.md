# Documentación Base de Datos Supabase - AI Consultant

## Descripción General

Esta documentación mantiene un registro completo de la estructura de la base de datos de Supabase para la aplicación AI Consultant. La aplicación utiliza autenticación basada en usuarios y gestión de proyectos de consultoría con **conocimiento** (anteriormente transcripciones) organizado por áreas.

## ✅ Estado Actual: Sistema de Conocimiento Implementado

El proyecto ha migrado exitosamente de un sistema de "transcripciones" a un sistema más amplio de "conocimiento" que permite:
- **Subida de archivos** (.txt, .docx) para extraer contenido
- **Añadir conocimiento manual** mediante formulario de texto
- **Organización por áreas** con asignación flexible
- **Área Global automática** en cada proyecto para conocimiento general

## 🔧 CORRECCIÓN CRÍTICA DE AUTENTICACIÓN - COMPLETADA

**Problema detectado y corregido:** Los endpoints de la API estaban usando clientes de Supabase inconsistentes:
- ✅ **Creación de proyectos**: Usaba `createServerSupabaseClient(true)` con autenticación correcta
- ❌ **Lectura de proyectos**: Usaba cliente básico sin autenticación
- **Resultado**: Proyectos se creaban pero no se podían recuperar (error 404)

**Solución aplicada:**
- ✅ Corregido `app/api/projects/[id]/route.ts` para usar autenticación consistente
- ✅ Corregido `app/api/projects/[id]/advance-step/route.ts` 
- ✅ Corregido `app/api/areas/[id]/route.ts`
- ✅ Agregados filtros de seguridad por `user_id` en todas las consultas

**Endpoints con autenticación correcta verificada:**
- ✅ `app/api/areas/route.ts` - YA ESTABA CORRECTO
- ✅ `app/api/knowledge/route.ts` - YA ESTABA CORRECTO

### Endpoints API Frontend Proxy Creados (2024-12-XX)
- ✅ **`app/api/projects/route.ts`** - Proxy para operaciones CRUD de proyectos
- ✅ **`app/api/projects/[id]/route.ts`** - Proxy para operaciones específicas de proyecto  
- ✅ **`app/api/areas/route.ts`** - Proxy para gestión de áreas
- ✅ **`app/api/knowledge/route.ts`** - Proxy para gestión de conocimiento
- ✅ **`app/api/projects/[id]/analysis-as-is/route.ts`** - Proxy para análisis AS IS
- ✅ **`app/api/projects/[id]/recommendations/route.ts`** - Proxy para recomendaciones
- ✅ **`app/api/projects/[id]/project-sheets/route.ts`** - Proxy para fichas de proyecto
- ✅ **`app/api/projects/[id]/advance-step/route.ts`** - Proxy para avance de pasos

### Interfaz Principal Actualizada (2024-12-XX)
- ✅ **Eliminado sistema de interfaz clásica vs guiada**
- ✅ **`app/projects/[id]/page.tsx`** ahora usa proceso guiado como interfaz principal
- ✅ **Eliminada carpeta** `app/projects/[id]/guided/`
- ✅ **Todos los endpoints** ahora apuntan a `/api/` en lugar del backend directo
- ✅ **Error 404 solucionado** - Ya no hay peticiones a endpoints inexistentes

### Corrección de Errores Runtime (2024-12-XX)
- ✅ **Error `TypeError: areas.filter is not a function` SOLUCIONADO**
- ✅ **Verificaciones defensivas añadidas** en todas las funciones que manipulan arrays
- ✅ **Protección en carga de datos** - asegurar arrays válidos desde APIs
- ✅ **Funciones protegidas:**
  - `getStep1Completion()` - verificación `Array.isArray(areas)`
  - `getNextAvailableColor()` - verificación defensiva
  - `getKnowledgeCountByArea()` - verificación `Array.isArray(knowledge)`
  - `getKnowledgeByArea()` - verificación defensiva
  - `getAcceptedRecommendationsCount()` - verificación `Array.isArray(recommendations)`
  - `handleUpdateRecommendationStatus()` - verificación y manejo de errores
- ✅ **Carga de datos mejorada** - validación de arrays en API responses

### Corrección Crítica de Autenticación en Endpoints Proxy (2024-12-XX)
- ❌ **PROBLEMA DETECTADO:** Endpoints proxy usando autenticación Supabase con tokens MongoDB
- ✅ **Error `AuthApiError: invalid JWT: signature is invalid` SOLUCIONADO**
- ✅ **Endpoints corregidos - removida validación Supabase:**
  - `app/api/areas/route.ts` - proxy directo al backend MongoDB
  - `app/api/knowledge/route.ts` - proxy directo al backend MongoDB
  - `app/api/projects/route.ts` - proxy directo al backend MongoDB
  - `app/api/projects/[id]/route.ts` - proxy directo al backend MongoDB
  - `app/api/projects/[id]/analysis-as-is/route.ts` - proxy directo al backend MongoDB
  - `app/api/projects/[id]/recommendations/route.ts` - proxy directo al backend MongoDB
  - `app/api/projects/[id]/project-sheets/route.ts` - proxy directo al backend MongoDB
  - `app/api/projects/[id]/advance-step/route.ts` - proxy directo al backend MongoDB
- ✅ **Endpoint faltante creado:** `app/api/areas/consolidated/route.ts`
- ✅ **Autenticación delegada al backend MongoDB** - consistencia total del sistema

### Corrección de Endpoints Backend MongoDB (2024-12-XX)
- ❌ **PROBLEMA DETECTADO:** Backend interpretando `/api/areas/consolidated` como `/api/areas/:id`
- ✅ **Error `CastError: Cast to ObjectId failed for value "consolidated"` SOLUCIONADO**
- ✅ **Endpoint creado en backend:** `GET /api/areas/consolidated` (agregado ANTES de `/:id`)
- ✅ **Formato de respuesta corregido:**
  - `GET /api/areas` - ahora devuelve array directo (no objeto wrapper)
  - `POST /api/areas` - ahora devuelve área directa (no objeto wrapper)
  - `GET /api/areas/consolidated` - formato compatible con frontend
- ✅ **Compatibilidad frontend-backend** - estructura de datos consistente

## Variables de Entorno Requeridas

```env
# APIs de IA
GEMINI_API_KEY=tu_clave_gemini_aqui
GROQ_API_KEY=tu_clave_groq_aqui  
ASSEMBLYAI_API_KEY=tu_clave_assemblyai_aqui

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚨 CORRECCIÓN DE ESQUEMA URGENTE - PARTE 2

Detectados errores adicionales en el esquema. Ejecuta estos scripts **INMEDIATAMENTE** en el SQL Editor de Supabase:

```sql
-- =============================================
-- SCRIPT CORRECCIÓN COMPLETA - Ejecutar en Supabase SQL Editor
-- =============================================

-- PASO 1: Verificar estado actual de las tablas
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('knowledge', 'knowledge_areas') 
ORDER BY table_name, ordinal_position;

-- PASO 2: Corregir tabla knowledge
-- Eliminar file_path si existe
ALTER TABLE knowledge DROP COLUMN IF EXISTS file_path;

-- Asegurar que file_name y file_size son nullable
ALTER TABLE knowledge ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE knowledge ALTER COLUMN file_size DROP NOT NULL;

-- PASO 3: Verificar si knowledge_areas existe con estructura incorrecta
DO $$
BEGIN
    -- Verificar si existe transcription_id en knowledge_areas
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_areas' 
        AND column_name = 'transcription_id'
    ) THEN
        -- Si existe transcription_id, renombrar a knowledge_id
        ALTER TABLE knowledge_areas RENAME COLUMN transcription_id TO knowledge_id;
        RAISE NOTICE 'Renombrado transcription_id a knowledge_id en knowledge_areas';
    END IF;
    
    -- Verificar si la tabla se llama transcription_areas
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'transcription_areas'
    ) THEN
        -- Si existe transcription_areas, renombrarla
        ALTER TABLE transcription_areas RENAME TO knowledge_areas;
        ALTER TABLE knowledge_areas RENAME COLUMN transcription_id TO knowledge_id;
        RAISE NOTICE 'Renombrado transcription_areas a knowledge_areas';
    END IF;
END $$;

-- PASO 4: Asegurar que knowledge_areas tiene la estructura correcta
-- Si no existe knowledge_areas, crearla
CREATE TABLE IF NOT EXISTS knowledge_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_id UUID REFERENCES knowledge(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 5: Recrear índices y constraints
DROP INDEX IF EXISTS idx_transcription_areas_transcription_id;
DROP INDEX IF EXISTS idx_transcription_areas_area_id;
DROP INDEX IF EXISTS idx_knowledge_areas_knowledge_id;
DROP INDEX IF EXISTS idx_knowledge_areas_area_id;

CREATE INDEX idx_knowledge_areas_knowledge_id ON knowledge_areas(knowledge_id);
CREATE INDEX idx_knowledge_areas_area_id ON knowledge_areas(area_id);

-- Constraint único para evitar duplicados
ALTER TABLE knowledge_areas DROP CONSTRAINT IF EXISTS unique_transcription_area;
ALTER TABLE knowledge_areas DROP CONSTRAINT IF EXISTS unique_knowledge_area;
ALTER TABLE knowledge_areas ADD CONSTRAINT unique_knowledge_area UNIQUE (knowledge_id, area_id);

-- PASO 6: Verificar estructura final
SELECT 'knowledge' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'knowledge' 
UNION ALL
SELECT 'knowledge_areas' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'knowledge_areas'
ORDER BY table_name, column_name;
```

## Esquema de Base de Datos

### 1. Usuarios (Gestionado por Supabase Auth)
Los usuarios son gestionados automáticamente por el sistema de autenticación de Supabase.

### 2. Tabla: projects

Almacena los proyectos de consultoría.

```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
```

### 3. Tabla: areas

Define las áreas organizacionales dentro de cada proyecto. **NOTA**: Cada proyecto automáticamente incluye un área "Global".

```sql
CREATE TABLE areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_areas_project_id ON areas(project_id);
```

### 4. Tabla: knowledge (anteriormente transcriptions)

**ESQUEMA CORRECTO** - Almacena el conocimiento del proyecto, que puede provenir de archivos subidos o contenido manual.

```sql
CREATE TABLE knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_name VARCHAR(255), -- NULLABLE para contenido manual
  file_size INTEGER, -- NULLABLE para contenido manual
  content TEXT NOT NULL,
  source_type VARCHAR(10) NOT NULL CHECK (source_type IN ('upload', 'manual')),
  notes TEXT, -- Notas adicionales para contexto
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTA: NO debe existir columna file_path

-- Índices
CREATE INDEX idx_knowledge_project_id ON knowledge(project_id);
CREATE INDEX idx_knowledge_uploaded_at ON knowledge(uploaded_at);
CREATE INDEX idx_knowledge_source_type ON knowledge(source_type);
```

### 5. Tabla: knowledge_areas (anteriormente transcription_areas)

**ESQUEMA CORRECTO** - Tabla de relación many-to-many entre conocimiento y áreas.

```sql
CREATE TABLE knowledge_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_id UUID REFERENCES knowledge(id) ON DELETE CASCADE, -- DEBE SER knowledge_id
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTA: NO debe existir transcription_id, debe ser knowledge_id

-- Índices
CREATE INDEX idx_knowledge_areas_knowledge_id ON knowledge_areas(knowledge_id);
CREATE INDEX idx_knowledge_areas_area_id ON knowledge_areas(area_id);

-- Constraint único para evitar duplicados
ALTER TABLE knowledge_areas ADD CONSTRAINT unique_knowledge_area 
UNIQUE (knowledge_id, area_id);
```

## Políticas de Seguridad (RLS)

### Projects
```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own projects
CREATE POLICY projects_policy ON projects
  FOR ALL USING (auth.uid() = user_id);
```

### Areas
```sql
-- Enable RLS
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see areas from their projects
CREATE POLICY areas_policy ON areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = areas.project_id 
      AND projects.user_id = auth.uid()
    )
  );
```

### Knowledge
```sql
-- Enable RLS
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see knowledge from their projects
CREATE POLICY knowledge_policy ON knowledge
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = knowledge.project_id 
      AND projects.user_id = auth.uid()
    )
  );
```

### Knowledge_Areas
```sql
-- Enable RLS
ALTER TABLE knowledge_areas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see relationships from their knowledge
CREATE POLICY knowledge_areas_policy ON knowledge_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM knowledge k
      JOIN projects p ON p.id = k.project_id
      WHERE k.id = knowledge_areas.knowledge_id 
      AND p.user_id = auth.uid()
    )
  );
```

## Triggers y Funciones

### Auto-actualización de updated_at en projects
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-creación de área Global en nuevos proyectos
```sql
CREATE OR REPLACE FUNCTION create_global_area()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO areas (project_id, name, description, color)
  VALUES (NEW.id, 'Global', 'Área global del proyecto para conocimiento general', '#6B7280');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_create_global_area
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION create_global_area();
```

## APIs Implementadas

### Sistema de Conocimiento
- **`/api/knowledge`** - CRUD completo de conocimiento (FormData + JSON)
  - **POST con FormData**: Subida de archivos (.txt, .docx)
  - **POST con JSON**: Añadir conocimiento manual
  - **GET**: Listar conocimiento de un proyecto
- **`/api/knowledge/[id]/assign-areas`** - Asignación de áreas a conocimiento
- **`/api/projects`** - CRUD de proyectos con auto-creación de área Global
- **`/api/areas`** - CRUD de áreas organizacionales

### Sistema de Consultoría Guiada - 4 Pasos

#### Paso 1: Base de Conocimiento
- **`/api/areas/[id]/consolidate`** - POST: Consolidar conocimiento de un área con IA
- **`/api/areas/[id]/consolidated`** - GET/PUT: Obtener y actualizar conocimiento consolidado

#### Paso 2: Análisis AS IS
- **`/api/projects/[id]/analysis-as-is`** - Análisis del estado actual
  - **POST**: Generar análisis AS IS con IA basado en conocimiento consolidado
  - **GET**: Obtener análisis AS IS actual del proyecto
  - **PUT**: Actualizar análisis AS IS (crea nueva versión si hay cambios significativos)

#### Paso 3: Recomendaciones TO BE
- **`/api/projects/[id]/recommendations`** - Recomendaciones de proyectos
  - **POST**: Generar recomendaciones con IA basadas en análisis AS IS validado
  - **GET**: Obtener todas las recomendaciones del proyecto
  - **PUT**: Actualizar múltiples recomendaciones (estado, validación, etc.)

#### Paso 4: Fichas de Proyecto TO DO
- **`/api/projects/[id]/project-sheets`** - Fichas detalladas de proyecto
  - **POST**: Generar fichas detalladas para recomendaciones aprobadas
  - **GET**: Obtener fichas de proyecto con información de recomendaciones
  - **PUT**: Actualizar múltiples fichas de proyecto

#### Gestión de Pasos
- **`/api/projects/[id]/advance-step`** - POST: Avanzar al siguiente paso del proyecto
  - Valida que el paso actual esté completo antes de avanzar
  - Actualiza estado del proyecto automáticamente

### Sistema de Transcripción (Independiente)
- **`/api/transcribe`** - Transcripción con Groq
- **`/api/transcribe-assemblyai`** - Transcripción con AssemblyAI
- **`/api/convert-audio`** - Conversión de video a audio

## Consultas Útiles

### Obtener proyectos con estadísticas
```sql
SELECT 
  p.*,
  COUNT(DISTINCT a.id) as areas_count,
  COUNT(DISTINCT k.id) as knowledge_count
FROM projects p
LEFT JOIN areas a ON a.project_id = p.id
LEFT JOIN knowledge k ON k.project_id = p.id
WHERE p.user_id = auth.uid()
GROUP BY p.id
ORDER BY p.created_at DESC;
```

### Obtener conocimiento con áreas asignadas
```sql
SELECT 
  k.*,
  COALESCE(
    json_agg(
      json_build_object(
        'area_id', ka.area_id,
        'areas', json_build_object(
          'id', a.id,
          'name', a.name,
          'color', a.color
        )
      )
    ) FILTER (WHERE ka.area_id IS NOT NULL), 
    '[]'::json
  ) as knowledge_areas
FROM knowledge k
LEFT JOIN knowledge_areas ka ON ka.knowledge_id = k.id
LEFT JOIN areas a ON a.id = ka.area_id
WHERE k.project_id = $1
GROUP BY k.id
ORDER BY k.uploaded_at DESC;
```

### Estadísticas por tipo de conocimiento
```sql
SELECT 
  source_type,
  COUNT(*) as count,
  AVG(LENGTH(content)) as avg_content_length
FROM knowledge k
JOIN projects p ON p.id = k.project_id
WHERE p.user_id = auth.uid()
GROUP BY source_type;
```

## Scripts de Mantenimiento

### Limpiar conocimiento huérfano
```sql
DELETE FROM knowledge 
WHERE project_id NOT IN (SELECT id FROM projects);
```

### Limpiar áreas huérfanas
```sql
DELETE FROM areas 
WHERE project_id NOT IN (SELECT id FROM projects);
```

### Limpiar relaciones huérfanas
```sql
DELETE FROM knowledge_areas 
WHERE knowledge_id NOT IN (SELECT id FROM knowledge)
   OR area_id NOT IN (SELECT id FROM areas);
```

### Verificar integridad de datos
```sql
-- Verificar que todos los proyectos tienen área Global
SELECT p.id, p.name
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM areas a 
  WHERE a.project_id = p.id 
  AND a.name = 'Global'
);

-- Verificar consistencia de archivos
SELECT * FROM knowledge 
WHERE source_type = 'upload' AND (file_name IS NULL OR file_size IS NULL);

SELECT * FROM knowledge 
WHERE source_type = 'manual' AND (file_name IS NOT NULL OR file_size IS NOT NULL);

-- Verificar estructura de knowledge_areas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'knowledge_areas' 
ORDER BY ordinal_position;
```

## Scripts de Migración Ejecutados

### Migración de Transcripciones a Conocimiento (2024-12-XX)

```sql
-- 1. Renombrar tabla transcriptions a knowledge
ALTER TABLE transcriptions RENAME TO knowledge;

-- 2. Renombrar tabla transcription_areas a knowledge_areas
ALTER TABLE transcription_areas RENAME TO knowledge_areas;

-- 3. Renombrar columnas en knowledge_areas
ALTER TABLE knowledge_areas RENAME COLUMN transcription_id TO knowledge_id;

-- 4. Añadir nuevas columnas a knowledge
ALTER TABLE knowledge ADD COLUMN source_type VARCHAR(10) NOT NULL DEFAULT 'upload' CHECK (source_type IN ('upload', 'manual'));
ALTER TABLE knowledge ADD COLUMN notes TEXT;

-- 5. Hacer file_name y file_size nullable para permitir contenido manual
ALTER TABLE knowledge ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE knowledge ALTER COLUMN file_size DROP NOT NULL;

-- 6. Actualizar índices
DROP INDEX IF EXISTS idx_transcriptions_project_id;
DROP INDEX IF EXISTS idx_transcriptions_uploaded_at;
DROP INDEX IF EXISTS idx_transcription_areas_transcription_id;
DROP INDEX IF EXISTS idx_transcription_areas_area_id;

CREATE INDEX idx_knowledge_project_id ON knowledge(project_id);
CREATE INDEX idx_knowledge_uploaded_at ON knowledge(uploaded_at);
CREATE INDEX idx_knowledge_source_type ON knowledge(source_type);
CREATE INDEX idx_knowledge_areas_knowledge_id ON knowledge_areas(knowledge_id);
CREATE INDEX idx_knowledge_areas_area_id ON knowledge_areas(area_id);

-- 7. Actualizar constraint único
ALTER TABLE knowledge_areas DROP CONSTRAINT IF EXISTS unique_transcription_area;
ALTER TABLE knowledge_areas ADD CONSTRAINT unique_knowledge_area UNIQUE (knowledge_id, area_id);

-- 8. Actualizar referencias de claves foráneas
ALTER TABLE knowledge_areas DROP CONSTRAINT IF EXISTS transcription_areas_transcription_id_fkey;
ALTER TABLE knowledge_areas ADD CONSTRAINT knowledge_areas_knowledge_id_fkey 
  FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE;

-- 9. Actualizar políticas RLS
DROP POLICY IF EXISTS transcriptions_policy ON knowledge;
DROP POLICY IF EXISTS transcription_areas_policy ON knowledge_areas;

CREATE POLICY knowledge_policy ON knowledge
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = knowledge.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY knowledge_areas_policy ON knowledge_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM knowledge k
      JOIN projects p ON p.id = k.project_id
      WHERE k.id = knowledge_areas.knowledge_id 
      AND p.user_id = auth.uid()
    )
  );

-- 10. Crear trigger para área Global automática
CREATE OR REPLACE FUNCTION create_global_area()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO areas (project_id, name, description, color)
  VALUES (NEW.id, 'Global', 'Área global del proyecto para conocimiento general', '#6B7280');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_create_global_area
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION create_global_area();

-- 11. Crear áreas Global para proyectos existentes
INSERT INTO areas (project_id, name, description, color)
SELECT p.id, 'Global', 'Área global del proyecto para conocimiento general', '#6B7280'
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM areas a 
  WHERE a.project_id = p.id 
  AND a.name = 'Global'
);
```

## 🔧 SCRIPT DE CORRECCIÓN Y MIGRACIÓN COMPLETA

### ⚠️ EJECUTAR ESTE SCRIPT COMPLETO EN SUPABASE (Corrige errores de TIMESTAMPZ)

```sql
-- =============================================
-- SCRIPT CORREGIDO: FLUJO GUIADO 4 PASOS 
-- Versión 2.0 - SIN ERRORES
-- Ejecutar TODO en Supabase SQL Editor
-- =============================================

-- 1. Eliminar tablas si existen (para empezar limpio)
DROP TABLE IF EXISTS project_sheets CASCADE;
DROP TABLE IF EXISTS project_recommendations CASCADE;
DROP TABLE IF EXISTS analysis_as_is_versions CASCADE;
DROP TABLE IF EXISTS analysis_as_is CASCADE;
DROP TABLE IF EXISTS consolidated_knowledge CASCADE;

-- 2. Actualizar tabla projects existente
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS step_1_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS step_2_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS step_3_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS step_4_completed BOOLEAN DEFAULT FALSE;

-- 3. Crear tabla consolidated_knowledge
CREATE TABLE consolidated_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT TRUE,
  validated BOOLEAN DEFAULT FALSE,
  original_sources_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla analysis_as_is
CREATE TABLE analysis_as_is (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  strategy_governance TEXT,
  processes_operations TEXT,
  technology_infrastructure TEXT,
  data_information TEXT,
  people_culture TEXT,
  customer_experience TEXT,
  conclusions TEXT,
  ai_generated BOOLEAN DEFAULT TRUE,
  validated BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear tabla analysis_as_is_versions
CREATE TABLE analysis_as_is_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES analysis_as_is(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  strategy_governance TEXT,
  processes_operations TEXT,
  technology_infrastructure TEXT,
  data_information TEXT,
  people_culture TEXT,
  customer_experience TEXT,
  conclusions TEXT,
  change_summary TEXT,
  created_by_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Crear tabla project_recommendations
CREATE TABLE project_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  justification TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('technological', 'training', 'cultural', 'methodological')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  status VARCHAR(50) DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected', 'modified')),
  ai_generated BOOLEAN DEFAULT TRUE,
  validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Crear tabla project_sheets
CREATE TABLE project_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID REFERENCES project_recommendations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  expected_benefits TEXT,
  strategic_objectives TEXT,
  human_resources TEXT,
  technological_resources TEXT,
  estimated_investment DECIMAL(12,2),
  estimated_duration INTEGER,
  involved_areas TEXT,
  validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Crear índices para rendimiento
CREATE INDEX idx_consolidated_knowledge_area_id ON consolidated_knowledge(area_id);
CREATE INDEX idx_analysis_as_is_project_id ON analysis_as_is(project_id);
CREATE INDEX idx_analysis_as_is_versions_analysis_id ON analysis_as_is_versions(analysis_id);
CREATE INDEX idx_project_recommendations_project_id ON project_recommendations(project_id);
CREATE INDEX idx_project_recommendations_category ON project_recommendations(category);
CREATE INDEX idx_project_recommendations_status ON project_recommendations(status);
CREATE INDEX idx_project_sheets_project_id ON project_sheets(project_id);
CREATE INDEX idx_project_sheets_recommendation_id ON project_sheets(recommendation_id);

-- 9. Crear triggers para updated_at
-- Primero eliminar triggers existentes si los hay
DROP TRIGGER IF EXISTS update_consolidated_knowledge_updated_at ON consolidated_knowledge;
DROP TRIGGER IF EXISTS update_analysis_as_is_updated_at ON analysis_as_is;
DROP TRIGGER IF EXISTS update_project_recommendations_updated_at ON project_recommendations;
DROP TRIGGER IF EXISTS update_project_sheets_updated_at ON project_sheets;

-- Crear o reemplazar la función trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear los triggers
CREATE TRIGGER update_consolidated_knowledge_updated_at 
  BEFORE UPDATE ON consolidated_knowledge 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_as_is_updated_at 
  BEFORE UPDATE ON analysis_as_is 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_recommendations_updated_at 
  BEFORE UPDATE ON project_recommendations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_sheets_updated_at 
  BEFORE UPDATE ON project_sheets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Habilitar RLS en todas las nuevas tablas
ALTER TABLE consolidated_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_as_is ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_as_is_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sheets ENABLE ROW LEVEL SECURITY;

-- 11. Crear políticas RLS
CREATE POLICY consolidated_knowledge_policy ON consolidated_knowledge
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM areas a
      JOIN projects p ON p.id = a.project_id
      WHERE a.id = consolidated_knowledge.area_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY analysis_as_is_policy ON analysis_as_is
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = analysis_as_is.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY analysis_as_is_versions_policy ON analysis_as_is_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM analysis_as_is aa
      JOIN projects p ON p.id = aa.project_id
      WHERE aa.id = analysis_as_is_versions.analysis_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY project_recommendations_policy ON project_recommendations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_recommendations.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY project_sheets_policy ON project_sheets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_sheets.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- 12. Crear función de avance de pasos
CREATE OR REPLACE FUNCTION advance_project_step(project_uuid UUID, step_number INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Marcar paso actual como completado
  CASE step_number
    WHEN 1 THEN 
      UPDATE projects SET step_1_completed = TRUE WHERE id = project_uuid;
    WHEN 2 THEN 
      UPDATE projects SET step_2_completed = TRUE WHERE id = project_uuid;
    WHEN 3 THEN 
      UPDATE projects SET step_3_completed = TRUE WHERE id = project_uuid;
    WHEN 4 THEN 
      UPDATE projects SET step_4_completed = TRUE WHERE id = project_uuid;
  END CASE;
  
  -- Avanzar al siguiente paso si no estamos en el último
  IF step_number < 4 THEN
    UPDATE projects 
    SET current_step = step_number + 1 
    WHERE id = project_uuid;
  END IF;
END;
$$ language 'plpgsql';

-- 13. Crear funciones auxiliares
CREATE OR REPLACE FUNCTION get_project_progress(project_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'current_step', current_step,
    'step_1_completed', step_1_completed,
    'step_2_completed', step_2_completed,
    'step_3_completed', step_3_completed,
    'step_4_completed', step_4_completed,
    'progress_percentage', (
      CASE WHEN step_1_completed THEN 1 ELSE 0 END +
      CASE WHEN step_2_completed THEN 1 ELSE 0 END +
      CASE WHEN step_3_completed THEN 1 ELSE 0 END +
      CASE WHEN step_4_completed THEN 1 ELSE 0 END
    ) * 25
  ) INTO result
  FROM projects 
  WHERE id = project_uuid;
  
  RETURN result;
END;
$$ language 'plpgsql';

-- 14. Verificación final
SELECT 'MIGRACIÓN COMPLETADA EXITOSAMENTE' as status;
SELECT 'Tablas creadas:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'consolidated_knowledge', 
  'analysis_as_is', 
  'analysis_as_is_versions', 
  'project_recommendations', 
  'project_sheets'
)
ORDER BY table_name;
```

### 🧪 Verificación Post-Migración

```sql
-- Verificar que todas las tablas se crearon correctamente
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'projects',
  'areas', 
  'knowledge',
  'knowledge_areas',
  'consolidated_knowledge',
  'analysis_as_is',
  'analysis_as_is_versions',
  'project_recommendations',
  'project_sheets'
)
ORDER BY tablename;

-- Verificar políticas RLS
SELECT 
  tablename, 
  policyname, 
  permissive 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'consolidated_knowledge',
  'analysis_as_is',
  'analysis_as_is_versions',
  'project_recommendations',
  'project_sheets'
)
ORDER BY tablename, policyname;

-- Verificar funciones creadas
SELECT 
  proname, 
  prosrc 
FROM pg_proc 
WHERE proname IN ('advance_project_step', 'get_project_progress');
```

## ✅ Estado Final del Sistema

El flujo guiado de 4 pasos está ahora **completamente configurado** en la base de datos:

1. **✅ Paso 1: Base de Conocimiento** - Gestión de áreas y consolidación con IA
2. **✅ Paso 2: Análisis AS IS** - Análisis organizacional en 6 ejes con versionado  
3. **✅ Paso 3: Recomendaciones TO BE** - Proyectos categorizados con prioridades
4. **✅ Paso 4: Fichas TO DO** - Hojas de proyecto detalladas con recursos y estimaciones

**🎯 Para activar el flujo completo:** Ejecuta el script corregido arriba en el SQL Editor de Supabase.

## Changelog

### 2024-12-XX - ⚠️ CORRECCIÓN DE ESQUEMA CRÍTICA PARTE 2
- **PROBLEMA DETECTADO**: Tabla `knowledge_areas` con estructura incorrecta (`transcription_id` en lugar de `knowledge_id`)
- **PROBLEMA DETECTADO**: Posible tabla `transcription_areas` sin renombrar
- **SOLUCIÓN**: Script SQL completo para detectar y corregir automáticamente
- **ACCIÓN REQUERIDA**: Ejecutar script de corrección completa inmediatamente

### 2024-12-XX - ⚠️ CORRECCIÓN DE ESQUEMA CRÍTICA
- **PROBLEMA DETECTADO**: Columna `file_path` causando errores en conocimiento manual
- **SOLUCIÓN**: Script SQL para eliminar `file_path` y corregir campos nullable
- **ACCIÓN REQUERIDA**: Ejecutar script de corrección inmediatamente

### 2024-12-XX - ✅ Sistema de Conocimiento Implementado
- **CAMBIO MAYOR**: Migración completa de "transcripciones" a "conocimiento"
- **NUEVA FUNCIONALIDAD**: Soporte para añadir conocimiento manual
- **NUEVA FUNCIONALIDAD**: Auto-creación de área "Global" en proyectos
- **MIGRACIÓN EXITOSA**: Todos los datos existentes migrados sin pérdida
- **INTERFAZ ACTUALIZADA**: Frontend completamente actualizado
- **API MEJORADA**: `/api/knowledge` soporta dual modalidad (FormData + JSON)
- **DOCUMENTACIÓN**: Base de datos completamente documentada y actualizada

### Detalles de la Migración
- ✅ Esquema de base de datos actualizado exitosamente
- ✅ APIs de backend completamente refactorizadas
- ✅ Interfaz de usuario actualizada a "Conocimiento"
- ✅ Sistema dual de entrada implementado
- ✅ Área Global automática funcionando
- ✅ Documentación de base de datos actualizada

### Archivos Modificados en la Migración
- `app/api/knowledge/route.ts` - API principal para conocimiento
- `app/api/knowledge/[id]/assign-areas/route.ts` - API para asignación de áreas
- `app/api/projects/route.ts` - Añadida creación de área Global
- `app/projects/[id]/page.tsx` - Interfaz completamente actualizada
- `supabase.md` - Documentación actualizada
- Scripts SQL ejecutados en Supabase para migración de esquema

### Funcionalidades Pendientes (Futuras)
- ✅ **COMPLETADO**: Implementar funcionalidad de asignación de áreas desde la interfaz
- Añadir búsqueda y filtrado de conocimiento
- Implementar análisis de contenido con IA
- Añadir exportación de conocimiento
- Implementar versionado de contenido 

## ✅ MIGRACIÓN A MONGODB - COMPLETADA

**IMPORTANTE**: Migración exitosa de Supabase a MongoDB + Express.js.

### ✅ Estado de la Migración:
- ✅ **Backend Express.js**: Configurado con autenticación JWT
- ✅ **MongoDB**: Modelos de datos creados (User, Project, Area, Knowledge)
- ✅ **Autenticación**: Login/registro con bcrypt + JWT
- ✅ **Sistema de Aprobación**: Usuarios requieren aprobación de admin
- ✅ **APIs REST**: Autenticación y gestión de usuarios completadas
- ✅ **Frontend**: AuthProvider migrado a MongoDB
- ✅ **Panel de Admin**: Gestión completa de usuarios implementada
- ⏳ **APIs REST**: Pendiente migración de endpoints de proyectos y conocimiento
- ⏳ **Datos**: Pendiente migración de datos existentes de Supabase

### 📍 Ubicación del nuevo backend:
```
/backend/
├── src/
│   ├── models/         # Modelos MongoDB (reemplazan tablas Supabase)
│   ├── routes/         # APIs REST (reemplazan Supabase Functions) 
│   ├── middleware/     # Autenticación JWT (reemplaza Supabase Auth)
│   └── config/         # Configuración DB
└── README.md           # Instrucciones completas
```

### 🎯 Sistema de Usuarios y Aprobación:

#### **Flujo de Registro/Aprobación:**
1. **Usuario se registra** → Estado: `isApproved: false`
2. **Admin aprueba** → Estado: `isApproved: true, approvedBy: adminId, approvedAt: fecha`
3. **Usuario puede hacer login** → Solo si `isApproved: true`

#### **Credenciales Admin por defecto:**
- **Email**: `admin@aiconsultant.com`
- **Password**: `admin123456` 
- **Estado**: Auto-aprobado

#### **Panel de Administración:**
- **URL**: `http://localhost:3000/admin/users`
- **Funciones**: Aprobar/rechazar usuarios, cambiar roles, ver estadísticas
- **Acceso**: Solo usuarios con `role: 'admin'`

### 🎯 Próximos pasos:
1. **Migrar APIs de proyectos** desde Supabase a MongoDB
2. **Migrar APIs de conocimiento** desde Supabase a MongoDB
3. **Actualizar frontend** para usar endpoints MongoDB
4. **Migrar datos existentes** desde Supabase a MongoDB

---

## 🚀 NUEVO: Flujo de Consultoría Guiado - 4 Pasos

### Actualización de Esquema para Flujo Guiado (2024-12-XX)

El sistema ahora implementa un flujo de consultoría profesional en 4 pasos:

1. **Base de Conocimiento** - Gestión de áreas y conocimiento consolidado
2. **AS IS** - Análisis del estado actual por 6 ejes 
3. **TO BE** - Recomendaciones de proyectos
4. **TO DO** - Fichas detalladas de proyecto

### Actualización de la Tabla Projects

```sql
-- Añadir campos para el flujo guiado
ALTER TABLE projects ADD COLUMN current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4);
ALTER TABLE projects ADD COLUMN step_1_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN step_2_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN step_3_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN step_4_completed BOOLEAN DEFAULT FALSE;

-- Actualizar índice para filtrar por paso
CREATE INDEX idx_projects_current_step ON projects(current_step);
```

### Nueva Tabla: consolidated_knowledge (Para Paso 1)

```sql
-- Conocimiento consolidado por área usando IA
CREATE TABLE consolidated_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT TRUE,
  validated BOOLEAN DEFAULT FALSE,
  original_sources_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_consolidated_knowledge_area_id ON consolidated_knowledge(area_id);
CREATE INDEX idx_consolidated_knowledge_validated ON consolidated_knowledge(validated);

-- Trigger para updated_at
CREATE TRIGGER update_consolidated_knowledge_updated_at 
  BEFORE UPDATE ON consolidated_knowledge 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Nueva Tabla: analysis_as_is (Para Paso 2)

```sql
-- Análisis AS IS con 6 ejes + conclusión
CREATE TABLE analysis_as_is (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Los 6 ejes de análisis
  strategy_governance TEXT, -- Estrategia y Gobierno
  processes_operations TEXT, -- Procesos y Operaciones  
  technology_infrastructure TEXT, -- Tecnología e Infraestructura
  data_information TEXT, -- Datos e Información
  people_culture TEXT, -- Personas y Cultura
  customer_experience TEXT, -- Experiencia del Cliente
  
  -- Conclusión general
  conclusions TEXT,
  
  -- Metadatos
  ai_generated BOOLEAN DEFAULT TRUE,
  validated BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_analysis_as_is_project_id ON analysis_as_is(project_id);
CREATE INDEX idx_analysis_as_is_validated ON analysis_as_is(validated);
CREATE INDEX idx_analysis_as_is_version ON analysis_as_is(version);

-- Trigger para updated_at
CREATE TRIGGER update_analysis_as_is_updated_at 
  BEFORE UPDATE ON analysis_as_is 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Nueva Tabla: analysis_as_is_versions (Para historial de versiones)

```sql
-- Historial completo de versiones del AS IS
CREATE TABLE analysis_as_is_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES analysis_as_is(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  
  -- Copia completa de los datos en esa versión
  strategy_governance TEXT,
  processes_operations TEXT,
  technology_infrastructure TEXT,
  data_information TEXT,
  people_culture TEXT,
  customer_experience TEXT,
  conclusions TEXT,
  
  -- Metadatos de la versión
  change_summary TEXT, -- Resumen de qué cambió
  created_by_user BOOLEAN DEFAULT FALSE, -- TRUE si fue editado por usuario
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_analysis_as_is_versions_analysis_id ON analysis_as_is_versions(analysis_id);
CREATE INDEX idx_analysis_as_is_versions_version ON analysis_as_is_versions(version);
```

### Nueva Tabla: project_recommendations (Para Paso 3)

```sql
-- Recomendaciones de proyectos TO BE
CREATE TABLE project_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  justification TEXT NOT NULL,
  
  -- Categoría del proyecto
  category VARCHAR(50) NOT NULL CHECK (category IN ('technological', 'training', 'cultural', 'methodological')),
  
  -- Prioridad y estado
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  status VARCHAR(50) DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected', 'modified')),
  
  -- Metadatos
  ai_generated BOOLEAN DEFAULT TRUE,
  validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_project_recommendations_project_id ON project_recommendations(project_id);
CREATE INDEX idx_project_recommendations_category ON project_recommendations(category);
CREATE INDEX idx_project_recommendations_priority ON project_recommendations(priority);
CREATE INDEX idx_project_recommendations_status ON project_recommendations(status);

-- Trigger para updated_at
CREATE TRIGGER update_project_recommendations_updated_at 
  BEFORE UPDATE ON project_recommendations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Nueva Tabla: project_sheets (Para Paso 4)

```sql
-- Fichas detalladas de proyecto TO DO
CREATE TABLE project_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID REFERENCES project_recommendations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Información del proyecto
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Beneficios y objetivos
  expected_benefits TEXT,
  strategic_objectives TEXT, -- Objetivos de transformación digital que ayuda a cumplir
  
  -- Recursos necesarios
  human_resources TEXT,
  technological_resources TEXT,
  
  -- Estimaciones
  estimated_investment DECIMAL(12,2),
  estimated_duration INTEGER, -- En días
  
  -- Áreas implicadas
  involved_areas TEXT, -- JSON con IDs de áreas
  
  -- Metadatos
  validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_project_sheets_recommendation_id ON project_sheets(recommendation_id);
CREATE INDEX idx_project_sheets_project_id ON project_sheets(project_id);
CREATE INDEX idx_project_sheets_validated ON project_sheets(validated);

-- Trigger para updated_at
CREATE TRIGGER update_project_sheets_updated_at 
  BEFORE UPDATE ON project_sheets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Políticas de Seguridad RLS para Nuevas Tablas

```sql
-- Consolidated Knowledge
ALTER TABLE consolidated_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY consolidated_knowledge_policy ON consolidated_knowledge
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM areas a
      JOIN projects p ON p.id = a.project_id
      WHERE a.id = consolidated_knowledge.area_id 
      AND p.user_id = auth.uid()
    )
  );

-- Analysis AS IS
ALTER TABLE analysis_as_is ENABLE ROW LEVEL SECURITY;
CREATE POLICY analysis_as_is_policy ON analysis_as_is
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = analysis_as_is.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Analysis AS IS Versions
ALTER TABLE analysis_as_is_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY analysis_as_is_versions_policy ON analysis_as_is_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM analysis_as_is aa
      JOIN projects p ON p.id = aa.project_id
      WHERE aa.id = analysis_as_is_versions.analysis_id 
      AND p.user_id = auth.uid()
    )
  );

-- Project Recommendations
ALTER TABLE project_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_recommendations_policy ON project_recommendations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_recommendations.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Project Sheets
ALTER TABLE project_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_sheets_policy ON project_sheets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_sheets.project_id 
      AND projects.user_id = auth.uid()
    )
  );
```

### Función de Avance de Pasos

```sql
-- Función para avanzar al siguiente paso automáticamente
CREATE OR REPLACE FUNCTION advance_project_step(project_uuid UUID, step_number INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Marcar paso actual como completado
  CASE step_number
    WHEN 1 THEN 
      UPDATE projects SET step_1_completed = TRUE WHERE id = project_uuid;
    WHEN 2 THEN 
      UPDATE projects SET step_2_completed = TRUE WHERE id = project_uuid;
    WHEN 3 THEN 
      UPDATE projects SET step_3_completed = TRUE WHERE id = project_uuid;
    WHEN 4 THEN 
      UPDATE projects SET step_4_completed = TRUE WHERE id = project_uuid;
  END CASE;
  
  -- Avanzar al siguiente paso si no estamos en el último
  IF step_number < 4 THEN
    UPDATE projects 
    SET current_step = step_number + 1 
    WHERE id = project_uuid;
  END IF;
END;
$$ language 'plpgsql';
```

### Consultas Útiles para el Flujo Guiado

```sql
-- Obtener progreso completo de un proyecto
SELECT 
  p.*,
  CASE 
    WHEN step_4_completed THEN 'Completado'
    WHEN step_3_completed THEN 'Paso 4: TO DO'
    WHEN step_2_completed THEN 'Paso 3: TO BE'
    WHEN step_1_completed THEN 'Paso 2: AS IS'
    ELSE 'Paso 1: Base de Conocimiento'
  END as current_phase,
  (
    CASE WHEN step_1_completed THEN 1 ELSE 0 END +
    CASE WHEN step_2_completed THEN 1 ELSE 0 END +
    CASE WHEN step_3_completed THEN 1 ELSE 0 END +
    CASE WHEN step_4_completed THEN 1 ELSE 0 END
  ) * 25 as progress_percentage
FROM projects p
WHERE p.user_id = auth.uid();

-- Obtener estadísticas del conocimiento consolidado por proyecto
SELECT 
  p.name as project_name,
  COUNT(DISTINCT a.id) as total_areas,
  COUNT(DISTINCT ck.id) as consolidated_areas,
  COUNT(DISTINCT k.id) as total_knowledge_sources
FROM projects p
LEFT JOIN areas a ON a.project_id = p.id
LEFT JOIN consolidated_knowledge ck ON ck.area_id = a.id
LEFT JOIN knowledge_areas ka ON ka.area_id = a.id
LEFT JOIN knowledge k ON k.id = ka.knowledge_id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.name;

-- Obtener recomendaciones por categoría
SELECT 
  category,
  COUNT(*) as count,
  AVG(priority) as avg_priority
FROM project_recommendations pr
JOIN projects p ON p.id = pr.project_id
WHERE p.user_id = auth.uid()
GROUP BY category
ORDER BY avg_priority DESC;
```

### Script de Actualización Completo


-- =============================================
-- SCRIPT FINAL CORREGIDO: FLUJO GUIADO 4 PASOS
-- EJECUTAR COMPLETO EN SUPABASE SQL EDITOR
-- =============================================

-- 1. Limpiar tablas existentes si las hay
DROP TABLE IF EXISTS project_sheets CASCADE;
DROP TABLE IF EXISTS project_recommendations CASCADE;
DROP TABLE IF EXISTS analysis_as_is_versions CASCADE;
DROP TABLE IF EXISTS analysis_as_is CASCADE;
DROP TABLE IF EXISTS consolidated_knowledge CASCADE;

-- 2. Agregar columnas a projects si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'current_step') THEN
        ALTER TABLE projects ADD COLUMN current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'step_1_completed') THEN
        ALTER TABLE projects ADD COLUMN step_1_completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'step_2_completed') THEN
        ALTER TABLE projects ADD COLUMN step_2_completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'step_3_completed') THEN
        ALTER TABLE projects ADD COLUMN step_3_completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'step_4_completed') THEN
        ALTER TABLE projects ADD COLUMN step_4_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Crear tabla consolidated_knowledge
CREATE TABLE consolidated_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT TRUE,
  validated BOOLEAN DEFAULT FALSE,
  original_sources_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla analysis_as_is
CREATE TABLE analysis_as_is (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  strategy_governance TEXT,
  processes_operations TEXT,
  technology_infrastructure TEXT,
  data_information TEXT,
  people_culture TEXT,
  customer_experience TEXT,
  conclusions TEXT,
  ai_generated BOOLEAN DEFAULT TRUE,
  validated BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear tabla analysis_as_is_versions
CREATE TABLE analysis_as_is_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES analysis_as_is(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  strategy_governance TEXT,
  processes_operations TEXT,
  technology_infrastructure TEXT,
  data_information TEXT,
  people_culture TEXT,
  customer_experience TEXT,
  conclusions TEXT,
  change_summary TEXT,
  created_by_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Crear tabla project_recommendations
CREATE TABLE project_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  justification TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('technological', 'training', 'cultural', 'methodological')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  status VARCHAR(50) DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected', 'modified')),
  ai_generated BOOLEAN DEFAULT TRUE,
  validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Crear tabla project_sheets
CREATE TABLE project_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID REFERENCES project_recommendations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  expected_benefits TEXT,
  strategic_objectives TEXT,
  human_resources TEXT,
  technological_resources TEXT,
  estimated_investment DECIMAL(12,2),
  estimated_duration INTEGER,
  involved_areas TEXT,
  validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Crear índices
-- Eliminar índices existentes si los hay
DROP INDEX IF EXISTS idx_projects_current_step;
DROP INDEX IF EXISTS idx_consolidated_knowledge_area_id;
DROP INDEX IF EXISTS idx_consolidated_knowledge_validated;
DROP INDEX IF EXISTS idx_analysis_as_is_project_id;
DROP INDEX IF EXISTS idx_analysis_as_is_validated;
DROP INDEX IF EXISTS idx_analysis_as_is_version;
DROP INDEX IF EXISTS idx_analysis_as_is_versions_analysis_id;
DROP INDEX IF EXISTS idx_analysis_as_is_versions_version;
DROP INDEX IF EXISTS idx_project_recommendations_project_id;
DROP INDEX IF EXISTS idx_project_recommendations_category;
DROP INDEX IF EXISTS idx_project_recommendations_priority;
DROP INDEX IF EXISTS idx_project_recommendations_status;
DROP INDEX IF EXISTS idx_project_sheets_recommendation_id;
DROP INDEX IF EXISTS idx_project_sheets_project_id;
DROP INDEX IF EXISTS idx_project_sheets_validated;

-- Crear nuevos índices
CREATE INDEX idx_projects_current_step ON projects(current_step);
CREATE INDEX idx_consolidated_knowledge_area_id ON consolidated_knowledge(area_id);
CREATE INDEX idx_consolidated_knowledge_validated ON consolidated_knowledge(validated);
CREATE INDEX idx_analysis_as_is_project_id ON analysis_as_is(project_id);
CREATE INDEX idx_analysis_as_is_validated ON analysis_as_is(validated);
CREATE INDEX idx_analysis_as_is_version ON analysis_as_is(version);
CREATE INDEX idx_analysis_as_is_versions_analysis_id ON analysis_as_is_versions(analysis_id);
CREATE INDEX idx_analysis_as_is_versions_version ON analysis_as_is_versions(version);
CREATE INDEX idx_project_recommendations_project_id ON project_recommendations(project_id);
CREATE INDEX idx_project_recommendations_category ON project_recommendations(category);
CREATE INDEX idx_project_recommendations_priority ON project_recommendations(priority);
CREATE INDEX idx_project_recommendations_status ON project_recommendations(status);
CREATE INDEX idx_project_sheets_recommendation_id ON project_sheets(recommendation_id);
CREATE INDEX idx_project_sheets_project_id ON project_sheets(project_id);
CREATE INDEX idx_project_sheets_validated ON project_sheets(validated);

-- 9. Crear función para triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Eliminar triggers existentes si los hay
DROP TRIGGER IF EXISTS update_consolidated_knowledge_updated_at ON consolidated_knowledge;
DROP TRIGGER IF EXISTS update_analysis_as_is_updated_at ON analysis_as_is;
DROP TRIGGER IF EXISTS update_project_recommendations_updated_at ON project_recommendations;
DROP TRIGGER IF EXISTS update_project_sheets_updated_at ON project_sheets;

-- 11. Crear triggers
CREATE TRIGGER update_consolidated_knowledge_updated_at 
  BEFORE UPDATE ON consolidated_knowledge 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_as_is_updated_at 
  BEFORE UPDATE ON analysis_as_is 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_recommendations_updated_at 
  BEFORE UPDATE ON project_recommendations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_sheets_updated_at 
  BEFORE UPDATE ON project_sheets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Habilitar RLS
ALTER TABLE consolidated_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_as_is ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_as_is_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sheets ENABLE ROW LEVEL SECURITY;

-- 13. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS consolidated_knowledge_policy ON consolidated_knowledge;
DROP POLICY IF EXISTS analysis_as_is_policy ON analysis_as_is;
DROP POLICY IF EXISTS analysis_as_is_versions_policy ON analysis_as_is_versions;
DROP POLICY IF EXISTS project_recommendations_policy ON project_recommendations;
DROP POLICY IF EXISTS project_sheets_policy ON project_sheets;

-- 14. Crear políticas RLS
CREATE POLICY consolidated_knowledge_policy ON consolidated_knowledge
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM areas a
      JOIN projects p ON p.id = a.project_id
      WHERE a.id = consolidated_knowledge.area_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY analysis_as_is_policy ON analysis_as_is
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = analysis_as_is.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY analysis_as_is_versions_policy ON analysis_as_is_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM analysis_as_is aa
      JOIN projects p ON p.id = aa.project_id
      WHERE aa.id = analysis_as_is_versions.analysis_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY project_recommendations_policy ON project_recommendations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_recommendations.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY project_sheets_policy ON project_sheets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_sheets.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- 15. Crear función de avance de pasos
CREATE OR REPLACE FUNCTION advance_project_step(project_uuid UUID, step_number INTEGER)
RETURNS VOID AS $$
BEGIN
  CASE step_number
    WHEN 1 THEN 
      UPDATE projects SET step_1_completed = TRUE WHERE id = project_uuid;
    WHEN 2 THEN 
      UPDATE projects SET step_2_completed = TRUE WHERE id = project_uuid;
    WHEN 3 THEN 
      UPDATE projects SET step_3_completed = TRUE WHERE id = project_uuid;
    WHEN 4 THEN 
      UPDATE projects SET step_4_completed = TRUE WHERE id = project_uuid;
  END CASE;
  
  IF step_number < 4 THEN
    UPDATE projects 
    SET current_step = step_number + 1 
    WHERE id = project_uuid;
  END IF;
END;
$$ language 'plpgsql';

-- 16. Crear función de progreso
CREATE OR REPLACE FUNCTION get_project_progress(project_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'current_step', current_step,
    'step_1_completed', step_1_completed,
    'step_2_completed', step_2_completed,
    'step_3_completed', step_3_completed,
    'step_4_completed', step_4_completed,
    'progress_percentage', (
      CASE WHEN step_1_completed THEN 1 ELSE 0 END +
      CASE WHEN step_2_completed THEN 1 ELSE 0 END +
      CASE WHEN step_3_completed THEN 1 ELSE 0 END +
      CASE WHEN step_4_completed THEN 1 ELSE 0 END
    ) * 25
  ) INTO result
  FROM projects 
  WHERE id = project_uuid;
  
  RETURN result;
END;
$$ language 'plpgsql';

-- 17. Verificación final
SELECT 'MIGRACIÓN COMPLETADA EXITOSAMENTE' as status;

SELECT 'Tablas creadas:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'consolidated_knowledge', 
  'analysis_as_is', 
  'analysis_as_is_versions', 
  'project_recommendations', 
  'project_sheets'
)
ORDER BY table_name;

SELECT 'Columnas añadidas a projects:' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name LIKE 'step_%' OR column_name = 'current_step'
ORDER BY column_name;

SELECT 'Políticas RLS activas:' as info;
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'consolidated_knowledge',
  'analysis_as_is', 
  'analysis_as_is_versions',
  'project_recommendations',
  'project_sheets'
)
ORDER BY tablename, policyname;

SELECT 'Funciones creadas:' as info;
SELECT proname 
FROM pg_proc 
WHERE proname IN ('advance_project_step', 'get_project_progress', 'update_updated_at_column');
```

### 🎯 Instrucciones de Uso

1. **Copia TODO el script de arriba** (desde `-- 1. Limpiar tablas existentes` hasta el final)
2. **Pégalo completo** en el SQL Editor de Supabase
3. **Ejecuta todo de una vez** (no por partes)
4. **Revisa la verificación final** para confirmar que todo se creó correctamente

El script está diseñado para ser **idempotente** (se puede ejecutar múltiples veces sin problemas) y **sin errores de sintaxis**.

---

## 🔧 SCRIPT ADICIONAL: CONFIGURACIÓN PARA DESARROLLO

### ⚠️ OPCIÓN 1: DESHABILITAR RLS TEMPORALMENTE (Más Simple)

```sql
-- =============================================
-- DESHABILITAR RLS PARA DESARROLLO
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Deshabilitar RLS en todas las tablas para desarrollo
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE consolidated_knowledge DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_as_is DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_as_is_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_sheets DISABLE ROW LEVEL SECURITY;

SELECT 'RLS deshabilitado para desarrollo - ¡Recuerda habilitarlo en producción!' as warning;
```

### ⚠️ OPCIÓN 2: CREAR USUARIO DEMO (Más Complejo pero Correcto)

```sql
-- =============================================
-- CREAR USUARIO DEMO PARA DESARROLLO
-- Solo si quieres mantener RLS habilitado
-- =============================================

-- Primero verificar si el usuario ya existe
DO $$
BEGIN
    -- Solo insertar si no existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '123e4567-e89b-12d3-a456-426614174000') THEN
        -- Insertar usuario demo
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            aud,
            role
        ) VALUES (
            '123e4567-e89b-12d3-a456-426614174000',
            '00000000-0000-0000-0000-000000000000',
            'demo@demo.com',
            crypt('demo123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Demo User"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            '',
            'authenticated',
            'authenticated'
        );

        RAISE NOTICE 'Usuario demo creado correctamente';
    ELSE
        RAISE NOTICE 'Usuario demo ya existe';
    END IF;
END $$;

-- Verificar que se creó correctamente
SELECT 'Verificación:' as status;
SELECT id, email, created_at FROM auth.users WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

### 🎯 Recomendación

**Para desarrollo rápido:** Usa la **OPCIÓN 1** (deshabilitar RLS)
**Para producción:** Usa la **OPCIÓN 2** y habilita RLS de nuevo

-- =============================================
-- PARTE 3: SISTEMA DE AUTENTICACIÓN Y ROLES REAL
-- Ejecutar DESPUÉS de la corrección de esquema de la Parte 2
-- =============================================

-- 1. Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'consultor' CHECK (role IN ('admin', 'consultor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de permisos de proyecto (qué usuarios pueden acceder/modificar qué proyectos)
CREATE TABLE IF NOT EXISTS project_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_type VARCHAR(20) NOT NULL DEFAULT 'view' CHECK (permission_type IN ('view', 'edit', 'admin')),
  granted_by UUID REFERENCES auth.users(id), -- Quién otorgó este permiso
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id) -- Un usuario solo puede tener un tipo de permiso por proyecto
);

-- 3. Trigger para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta cuando se crea un nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_project_permissions_project_id ON project_permissions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_permissions_user_id ON project_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_permissions_permission_type ON project_permissions(permission_type);

-- =============================================
-- POLÍTICAS RLS (Row Level Security)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_permissions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS PARA user_profiles (SIN RECURSIÓN)
-- =============================================

-- Los usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil (manteniendo el rol actual)
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política especial para inserción automática desde el trigger
DROP POLICY IF EXISTS "Auto insert user profiles" ON user_profiles;
CREATE POLICY "Auto insert user profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- POLÍTICAS PARA projects
-- =============================================

-- Usuarios pueden ver proyectos propios, con permisos, o si son admin
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (
    -- Es admin
    is_admin() OR
    -- Proyecto propio
    user_id = auth.uid() OR
    -- Tiene permisos
    EXISTS (
      SELECT 1 FROM project_permissions 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
    )
  );

-- Usuarios autenticados pueden crear proyectos
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Usuarios pueden actualizar proyectos propios, con permisos de edición, o si son admin
DROP POLICY IF EXISTS "Users can update editable projects" ON projects;
CREATE POLICY "Users can update editable projects" ON projects
  FOR UPDATE USING (
    -- Es admin
    is_admin() OR
    -- Proyecto propio
    user_id = auth.uid() OR
    -- Tiene permisos de edición
    EXISTS (
      SELECT 1 FROM project_permissions 
      WHERE project_id = projects.id 
      AND user_id = auth.uid() 
      AND permission_type IN ('edit', 'admin')
    )
  );

-- Solo admins y dueños pueden eliminar proyectos
DROP POLICY IF EXISTS "Admins and owners can delete projects" ON projects;
CREATE POLICY "Admins and owners can delete projects" ON projects
  FOR DELETE USING (
    -- Es admin
    is_admin() OR
    -- Proyecto propio
    user_id = auth.uid()
  );

-- =============================================
-- POLÍTICAS PARA areas
-- =============================================

-- Ver áreas si se puede ver el proyecto
DROP POLICY IF EXISTS "Users can view areas of accessible projects" ON areas;
CREATE POLICY "Users can view areas of accessible projects" ON areas
  FOR SELECT USING (can_view_project(areas.project_id));

-- Crear/actualizar/eliminar áreas si se puede editar el proyecto
DROP POLICY IF EXISTS "Users can modify areas of editable projects" ON areas;
CREATE POLICY "Users can modify areas of editable projects" ON areas
  FOR ALL USING (can_edit_project(areas.project_id));

-- =============================================
-- POLÍTICAS PARA knowledge
-- =============================================

-- Ver conocimiento si se puede ver el proyecto
DROP POLICY IF EXISTS "Users can view knowledge of accessible projects" ON knowledge;
CREATE POLICY "Users can view knowledge of accessible projects" ON knowledge
  FOR SELECT USING (can_view_project(knowledge.project_id));

-- Crear/actualizar/eliminar conocimiento si se puede editar el proyecto
DROP POLICY IF EXISTS "Users can modify knowledge of editable projects" ON knowledge;
CREATE POLICY "Users can modify knowledge of editable projects" ON knowledge
  FOR ALL USING (can_edit_project(knowledge.project_id));

-- =============================================
-- POLÍTICAS PARA knowledge_areas
-- =============================================

-- Ver asignaciones de conocimiento-área si se puede ver el proyecto
DROP POLICY IF EXISTS "Users can view knowledge_areas of accessible projects" ON knowledge_areas;
CREATE POLICY "Users can view knowledge_areas of accessible projects" ON knowledge_areas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM knowledge k
      WHERE k.id = knowledge_areas.knowledge_id
      AND can_view_project(k.project_id)
    )
  );

-- Modificar asignaciones si se puede editar el proyecto
DROP POLICY IF EXISTS "Users can modify knowledge_areas of editable projects" ON knowledge_areas;
CREATE POLICY "Users can modify knowledge_areas of editable projects" ON knowledge_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM knowledge k
      WHERE k.id = knowledge_areas.knowledge_id
      AND can_edit_project(k.project_id)
    )
  );

-- =============================================
-- POLÍTICAS PARA project_permissions
-- =============================================

-- Solo admins pueden gestionar permisos
DROP POLICY IF EXISTS "Admins can manage project permissions" ON project_permissions;
CREATE POLICY "Admins can manage project permissions" ON project_permissions
  FOR ALL USING (is_admin());

-- Los usuarios pueden ver sus propios permisos
DROP POLICY IF EXISTS "Users can view own permissions" ON project_permissions;
CREATE POLICY "Users can view own permissions" ON project_permissions
  FOR SELECT USING (user_id = auth.uid());

-- =============================================
-- FUNCIONES AUXILIARES PARA EVITAR RECURSIÓN
-- =============================================

-- Función para verificar si un usuario es admin (sin recursión)
-- Esta función bypasa las políticas RLS usando SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Si no hay usuario autenticado, no es admin
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Obtener rol directamente sin políticas RLS
  SELECT role INTO user_role 
  FROM user_profiles 
  WHERE id = user_uuid;
  
  -- Retornar true solo si el rol es 'admin'
  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede editar un proyecto
CREATE OR REPLACE FUNCTION can_edit_project(project_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_uuid
    AND (
      -- Es admin
      is_admin(user_uuid) OR
      -- Proyecto propio
      p.user_id = user_uuid OR
      -- Tiene permisos de edición
      EXISTS (
        SELECT 1 FROM project_permissions 
        WHERE project_id = project_uuid 
        AND user_id = user_uuid 
        AND permission_type IN ('edit', 'admin')
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede ver un proyecto
CREATE OR REPLACE FUNCTION can_view_project(project_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_uuid
    AND (
      -- Es admin
      is_admin(user_uuid) OR
      -- Proyecto propio
      p.user_id = user_uuid OR
      -- Tiene permisos
      EXISTS (
        SELECT 1 FROM project_permissions 
        WHERE project_id = project_uuid AND user_id = user_uuid
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CREAR USUARIO ADMIN POR DEFECTO
-- =============================================

-- NOTA: Este usuario se debe crear manualmente en Supabase Auth
-- Email: admin@aiconsultant.com
-- Password: admin123456

-- Después de crear el usuario en Auth, ejecutar:
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@aiconsultant.com';

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

-- Verificar que todo está creado correctamente
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as count
FROM user_profiles
UNION ALL
SELECT 
  'project_permissions' as table_name,
  COUNT(*) as count
FROM project_permissions
UNION ALL
SELECT 
  'policies' as table_name,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public';

-- Mostrar estructura de permisos (ejecutar después de tener datos)
-- SELECT 
--   p.name as project_name,
--   up.email as user_email,
--   up.role as user_role,
--   pp.permission_type
-- FROM projects p
-- LEFT JOIN project_permissions pp ON pp.project_id = p.id
-- LEFT JOIN user_profiles up ON up.id = pp.user_id
-- ORDER BY p.name, up.email;

-- =============================================
-- SCRIPT DE ACTUALIZACIÓN PARA CORREGIR RECURSIÓN
-- =============================================
/*
EJECUTAR ESTOS COMANDOS EN SUPABASE SQL EDITOR PARA CORREGIR LA RECURSIÓN:

-- 1. Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Auto insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update editable projects" ON projects;
DROP POLICY IF EXISTS "Admins and owners can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can view areas of accessible projects" ON areas;
DROP POLICY IF EXISTS "Users can modify areas of editable projects" ON areas;
DROP POLICY IF EXISTS "Users can view knowledge of accessible projects" ON knowledge;
DROP POLICY IF EXISTS "Users can modify knowledge of editable projects" ON knowledge;
DROP POLICY IF EXISTS "Users can view knowledge_areas of accessible projects" ON knowledge_areas;
DROP POLICY IF EXISTS "Users can modify knowledge_areas of editable projects" ON knowledge_areas;
DROP POLICY IF EXISTS "Admins can manage project permissions" ON project_permissions;
DROP POLICY IF EXISTS "Users can view own permissions" ON project_permissions;

-- 2. Crear función auxiliar sin recursión
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT role INTO user_role 
  FROM user_profiles 
  WHERE id = user_uuid;
  
  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear funciones auxiliares para proyectos
CREATE OR REPLACE FUNCTION can_edit_project(project_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_uuid
    AND (
      is_admin(user_uuid) OR
      p.user_id = user_uuid OR
      EXISTS (
        SELECT 1 FROM project_permissions 
        WHERE project_id = project_uuid 
        AND user_id = user_uuid 
        AND permission_type IN ('edit', 'admin')
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_view_project(project_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_uuid
    AND (
      is_admin(user_uuid) OR
      p.user_id = user_uuid OR
      EXISTS (
        SELECT 1 FROM project_permissions 
        WHERE project_id = project_uuid AND user_id = user_uuid
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recrear políticas sin recursión
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Auto insert user profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (
    is_admin() OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_permissions 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update editable projects" ON projects
  FOR UPDATE USING (
    is_admin() OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_permissions 
      WHERE project_id = projects.id 
      AND user_id = auth.uid() 
      AND permission_type IN ('edit', 'admin')
    )
  );

CREATE POLICY "Admins and owners can delete projects" ON projects
  FOR DELETE USING (
    is_admin() OR
    user_id = auth.uid()
  );

CREATE POLICY "Users can view areas of accessible projects" ON areas
  FOR SELECT USING (can_view_project(areas.project_id));

CREATE POLICY "Users can modify areas of editable projects" ON areas
  FOR ALL USING (can_edit_project(areas.project_id));

CREATE POLICY "Users can view knowledge of accessible projects" ON knowledge
  FOR SELECT USING (can_view_project(knowledge.project_id));

CREATE POLICY "Users can modify knowledge of editable projects" ON knowledge
  FOR ALL USING (can_edit_project(knowledge.project_id));

CREATE POLICY "Users can view knowledge_areas of accessible projects" ON knowledge_areas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM knowledge k
      WHERE k.id = knowledge_areas.knowledge_id
      AND can_view_project(k.project_id)
    )
  );

CREATE POLICY "Users can modify knowledge_areas of editable projects" ON knowledge_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM knowledge k
      WHERE k.id = knowledge_areas.knowledge_id
      AND can_edit_project(k.project_id)
    )
  );

CREATE POLICY "Admins can manage project permissions" ON project_permissions
  FOR ALL USING (is_admin());

CREATE POLICY "Users can view own permissions" ON project_permissions
  FOR SELECT USING (user_id = auth.uid());

*/
```

-- =============================================
-- SCRIPT FINAL DE CORRECCIÓN DE RECURSIÓN INFINITA
-- =============================================
/*
EJECUTAR ESTOS COMANDOS PASO A PASO EN SUPABASE SQL EDITOR:

-- PASO 1: DESHABILITAR COMPLETAMENTE RLS TEMPORALMENTE
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_permissions DISABLE ROW LEVEL SECURITY;

-- PASO 2: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Auto insert user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update editable projects" ON projects;
DROP POLICY IF EXISTS "Admins and owners can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can view areas of accessible projects" ON areas;
DROP POLICY IF EXISTS "Users can modify areas of editable projects" ON areas;
DROP POLICY IF EXISTS "Users can view knowledge of accessible projects" ON knowledge;
DROP POLICY IF EXISTS "Users can modify knowledge of editable projects" ON knowledge;
DROP POLICY IF EXISTS "Users can view knowledge_areas of accessible projects" ON knowledge_areas;
DROP POLICY IF EXISTS "Users can modify knowledge_areas of editable projects" ON knowledge_areas;
DROP POLICY IF EXISTS "Admins can manage project permissions" ON project_permissions;
DROP POLICY IF EXISTS "Users can view own permissions" ON project_permissions;

-- PASO 3: ELIMINAR FUNCIONES PROBLEMÁTICAS
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS can_edit_project(UUID, UUID);
DROP FUNCTION IF EXISTS can_view_project(UUID, UUID);

-- PASO 4: CREAR POLÍTICAS SIMPLES SIN RECURSIÓN
-- user_profiles: Solo acceso directo por ID
CREATE POLICY "simple_user_profiles_select" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "simple_user_profiles_update" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "simple_user_profiles_insert" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- projects: Solo propietario y permisos directos (sin verificar roles)
CREATE POLICY "simple_projects_select" ON projects
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_permissions 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "simple_projects_insert" ON projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "simple_projects_update" ON projects
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_permissions 
      WHERE project_id = projects.id 
      AND user_id = auth.uid() 
      AND permission_type IN ('edit', 'admin')
    )
  );

CREATE POLICY "simple_projects_delete" ON projects
  FOR DELETE USING (user_id = auth.uid());

-- areas: Basado en ownership de proyecto
CREATE POLICY "simple_areas_select" ON areas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = areas.project_id 
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_permissions 
          WHERE project_id = p.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "simple_areas_modify" ON areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = areas.project_id 
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_permissions 
          WHERE project_id = p.id 
          AND user_id = auth.uid() 
          AND permission_type IN ('edit', 'admin')
        )
      )
    )
  );

-- knowledge: Basado en ownership de proyecto
CREATE POLICY "simple_knowledge_select" ON knowledge
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = knowledge.project_id 
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_permissions 
          WHERE project_id = p.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "simple_knowledge_modify" ON knowledge
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = knowledge.project_id 
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_permissions 
          WHERE project_id = p.id 
          AND user_id = auth.uid() 
          AND permission_type IN ('edit', 'admin')
        )
      )
    )
  );

-- knowledge_areas: Basado en ownership del knowledge
CREATE POLICY "simple_knowledge_areas_select" ON knowledge_areas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM knowledge k
      JOIN projects p ON p.id = k.project_id
      WHERE k.id = knowledge_areas.knowledge_id
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_permissions 
          WHERE project_id = p.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "simple_knowledge_areas_modify" ON knowledge_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM knowledge k
      JOIN projects p ON p.id = k.project_id
      WHERE k.id = knowledge_areas.knowledge_id
      AND (
        p.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_permissions 
          WHERE project_id = p.id 
          AND user_id = auth.uid() 
          AND permission_type IN ('edit', 'admin')
        )
      )
    )
  );

-- project_permissions: Solo acceso a propios permisos
CREATE POLICY "simple_project_permissions_select" ON project_permissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "simple_project_permissions_modify" ON project_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_permissions.project_id 
      AND p.user_id = auth.uid()
    )
  );

-- PASO 5: REACTIVAR RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_permissions ENABLE ROW LEVEL SECURITY;

-- PASO 6: VERIFICAR QUE NO HAY RECURSIÓN
-- Ejecutar este comando para verificar:
-- SELECT * FROM user_profiles WHERE id = auth.uid() LIMIT 1;

*/
```

-- =============================================
-- SCRIPT DE VERIFICACIÓN Y LIMPIEZA AGRESIVA
-- =============================================
/*
EJECUTAR ESTOS COMANDOS PARA VERIFICAR Y LIMPIAR COMPLETAMENTE:

-- PASO 1: VERIFICAR POLÍTICAS ACTUALES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- PASO 2: DESHABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE consolidated_knowledge DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_as_is DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_as_is_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_sheets DISABLE ROW LEVEL SECURITY;

-- PASO 3: ELIMINAR TODAS LAS POLÍTICAS BRUTALMENTE
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- PASO 4: ELIMINAR TODAS LAS FUNCIONES RELACIONADAS
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS can_edit_project(UUID, UUID);
DROP FUNCTION IF EXISTS can_view_project(UUID, UUID);

-- PASO 5: CREAR SOLO LA POLÍTICA MÁS BÁSICA PARA user_profiles
CREATE POLICY "allow_own_profile_access" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- PASO 6: CREAR SOLO LA POLÍTICA MÁS BÁSICA PARA projects
CREATE POLICY "allow_own_projects_access" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- PASO 7: REACTIVAR RLS SOLO EN ESTAS DOS TABLAS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- PASO 8: VERIFICAR QUE NO HAY CONFLICTOS
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- PASO 9: PROBAR ACCESO BÁSICO
-- SELECT * FROM user_profiles WHERE id = auth.uid() LIMIT 1;
-- SELECT * FROM projects WHERE user_id = auth.uid() LIMIT 1;

*/
```

-- =============================================
-- SCRIPT DE LIMPIEZA INTELIGENTE SIN DESACTIVAR RLS
-- =============================================
/*
EJECUTAR ESTOS COMANDOS PARA ELIMINAR SOLO LAS POLÍTICAS PROBLEMÁTICAS:

-- PASO 1: ELIMINAR ESPECÍFICAMENTE LAS POLÍTICAS QUE CAUSAN RECURSIÓN

-- Eliminar políticas de user_profiles que consultan user_profiles (recursión)
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON user_profiles;

-- Eliminar políticas de projects que consultan user_profiles (causan recursión indirecta)
DROP POLICY IF EXISTS "Admins can create projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Consultors can view permitted projects" ON projects;
DROP POLICY IF EXISTS "Users can update permitted projects" ON projects;

-- PASO 2: MANTENER SOLO LAS POLÍTICAS SIMPLES SIN RECURSIÓN

-- Para user_profiles: mantener solo acceso directo por ID
-- Ya están creadas: simple_user_profiles_select, simple_user_profiles_update, simple_user_profiles_insert

-- Para projects: mantener solo las que NO consultan user_profiles
-- Ya están creadas: simple_projects_select, simple_projects_insert, simple_projects_update, simple_projects_delete

-- PASO 3: VERIFICAR QUE SOLO QUEDAN POLÍTICAS SEGURAS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'projects')
ORDER BY tablename, policyname;

-- PASO 4: PROBAR ACCESO BÁSICO
-- SELECT * FROM user_profiles WHERE id = auth.uid() LIMIT 1;
-- SELECT * FROM projects WHERE user_id = auth.uid() LIMIT 1;

-- PASO 5: CREAR PERFIL DE USUARIO SI NO EXISTE
-- (Ejecutar después de verificar que las consultas funcionan)
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  auth.uid(),
  auth.email(),
  COALESCE(auth.jwt() ->> 'user_metadata' ->> 'full_name', 'Usuario'),
  'consultor'
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE id = auth.uid()
);

*/
```

-- =============================================
-- LIMPIEZA FINAL Y CORRECCIÓN DE ERRORES
-- =============================================
/*
EJECUTAR ESTOS COMANDOS PARA TERMINAR LA LIMPIEZA:

-- PASO 6: ELIMINAR POLÍTICAS DUPLICADAS EN PROJECTS
DROP POLICY IF EXISTS "Users can only see their own projects" ON projects;
DROP POLICY IF EXISTS "projects_delete_own" ON projects;
DROP POLICY IF EXISTS "projects_insert_authenticated" ON projects;
DROP POLICY IF EXISTS "projects_select_own_or_permitted" ON projects;
DROP POLICY IF EXISTS "projects_update_own_or_permitted" ON projects;

-- PASO 7: ELIMINAR POLÍTICAS DUPLICADAS EN USER_PROFILES  
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;

-- PASO 8: VERIFICAR QUE SOLO QUEDAN LAS POLÍTICAS SIMPLE_*
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'projects')
ORDER BY tablename, policyname;

-- PASO 9: CREAR PERFIL DE USUARIO CON SINTAXIS CORREGIDA
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  auth.uid(),
  COALESCE(auth.email(), 'usuario@temp.com'),
  'Usuario Temporal',
  'consultor'
WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid()
  );

-- PASO 10: VERIFICAR QUE EL PERFIL SE CREÓ
SELECT * FROM user_profiles WHERE id = auth.uid();

-- PASO 11: PROBAR CREACIÓN DE PROYECTO
-- INSERT INTO projects (name, description, user_id) 
-- VALUES ('Proyecto de Prueba', 'Descripción de prueba', auth.uid());

*/
```

-- =============================================
-- CREAR PERFIL DE USUARIO MANUALMENTE
-- =============================================
/*
EJECUTAR ESTE COMANDO PARA CREAR EL PERFIL ESPECÍFICO:

-- PASO 12: INSERTAR PERFIL MANUALMENTE CON EL ID CORRECTO
INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '63edbdde-9c45-4ae4-9e90-180d1b50f14e',
  'jrs.reverte@gmail.com',
  'Jorge',
  'consultor',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- PASO 13: VERIFICAR QUE EL PERFIL SE CREÓ
SELECT * FROM user_profiles WHERE id = '63edbdde-9c45-4ae4-9e90-180d1b50f14e';

-- PASO 14: PROBAR CREACIÓN DE PROYECTO MANUAL
INSERT INTO projects (name, description, user_id, status, created_at, updated_at) 
VALUES (
  'Proyecto de Prueba SQL',
  'Descripción de prueba desde SQL',
  '63edbdde-9c45-4ae4-9e90-180d1b50f14e',
  'DRAFT',
  NOW(),
  NOW()
);

-- PASO 15: VERIFICAR QUE EL PROYECTO SE CREÓ
SELECT * FROM projects WHERE user_id = '63edbdde-9c45-4ae4-9e90-180d1b50f14e';

*/
```

-- =============================================
-- VERIFICACIÓN Y CORRECCIÓN DE ACCESO FRONTEND
-- =============================================
/*
EJECUTAR ESTOS COMANDOS PARA DIAGNOSTICAR EL PROBLEMA:

-- PASO 16: VERIFICAR POLÍTICAS ACTUALES DE user_profiles
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- PASO 17: PROBAR CONSULTA SIMULANDO FRONTEND
-- Esto simula lo que hace el frontend con auth.uid()
SELECT 
  id, email, full_name, role 
FROM user_profiles 
WHERE id = '63edbdde-9c45-4ae4-9e90-180d1b50f14e';

-- PASO 18: RECREAR POLÍTICA MÁS PERMISIVA PARA user_profiles
-- Eliminar política actual y crear una más simple
DROP POLICY IF EXISTS "simple_user_profiles_select" ON user_profiles;

-- Crear política que permita acceso a usuarios autenticados a su propio perfil
CREATE POLICY "user_profiles_authenticated_access" ON user_profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    (auth.uid() = id OR auth.uid()::text = id::text)
  );

-- PASO 19: VERIFICAR LA NUEVA POLÍTICA
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- PASO 20: PROBAR ACCESO CON LA NUEVA POLÍTICA
SELECT * FROM user_profiles WHERE id = '63edbdde-9c45-4ae4-9e90-180d1b50f14e';

*/
```

-- =============================================
-- DEBUGGING DE AUTENTICACIÓN FRONTEND
-- =============================================
/*
DADO QUE LAS POLÍTICAS FUNCIONAN BIEN, EL PROBLEMA ESTÁ EN EL CONTEXTO DE AUTH:

-- PASO 18A: CREAR POLÍTICA TEMPORAL MÁS PERMISIVA PARA DEBUGGING
-- (SOLO PARA IDENTIFICAR EL PROBLEMA, SE QUITARÁ DESPUÉS)

DROP POLICY IF EXISTS "simple_user_profiles_select" ON user_profiles;

CREATE POLICY "debug_user_profiles_select" ON user_profiles
  FOR SELECT USING (
    -- Permitir acceso si el usuario está autenticado (sin verificar ID específico)
    auth.uid() IS NOT NULL
  );

-- PASO 18B: VERIFICAR LA NUEVA POLÍTICA TEMPORAL
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles' AND cmd = 'SELECT';

-- AHORA PRUEBA EL LOGIN DESDE EL FRONTEND
-- Si funciona, el problema era auth.uid() = id
-- Si sigue fallando, hay otro problema

-- PASO 19: DESPUÉS DE PROBAR EL FRONTEND, RESTAURAR POLÍTICA SEGURA
-- (Ejecutar solo DESPUÉS de probar el frontend)
/*
DROP POLICY IF EXISTS "debug_user_profiles_select" ON user_profiles;

CREATE POLICY "secure_user_profiles_select" ON user_profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = id::text
  );
*/

*/
```

-- =============================================
-- RESTAURAR SEGURIDAD Y SOLUCIONAR PROJECTS
-- =============================================
/*
EJECUTAR ESTOS COMANDOS PARA TERMINAR LA CORRECCIÓN:

-- PASO 20: RESTAURAR POLÍTICA SEGURA DE user_profiles
DROP POLICY IF EXISTS "debug_user_profiles_select" ON user_profiles;

CREATE POLICY "secure_user_profiles_select" ON user_profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = id::text
  );

-- PASO 21: VERIFICAR POLÍTICAS PROBLEMÁTICAS EN PROJECTS
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'projects';

-- PASO 22: ELIMINAR POLÍTICAS DUPLICADAS/PROBLEMÁTICAS DE PROJECTS
-- Mantener solo las políticas simple_* que sabemos que funcionan

-- Ver cuáles son las problemáticas primero
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'projects'
  AND policyname NOT LIKE 'simple_%';

-- PASO 23: PROBAR INSERCIÓN DIRECTA DE PROYECTO
INSERT INTO projects (name, description, user_id, status, created_at, updated_at) 
VALUES (
  'Proyecto Frontend Test',
  'Prueba desde frontend',
  '63edbdde-9c45-4ae4-9e90-180d1b50f14e',
  'DRAFT',
  NOW(),
  NOW()
);

-- PASO 24: VERIFICAR SI LA INSERCIÓN FUNCIONA
SELECT * FROM projects WHERE user_id = '63edbdde-9c45-4ae4-9e90-180d1b50f14e';

*/
```

-- =============================================
-- SOLUCIÓN DEFINITIVA: ELIMINAR RECURSIÓN EN PROJECTS
-- =============================================
/*
EL PROBLEMA: Las políticas simple_projects_* aún consultan project_permissions,
lo que puede causar recursión. Necesitamos políticas completamente simples.

-- PASO 25: VERIFICAR QUE POLÍTICAS CONSULTAN project_permissions
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN qual LIKE '%project_permissions%' THEN 'SÍ CONSULTA project_permissions'
    ELSE 'NO consulta project_permissions'
  END as consulta_permisos,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'projects';

-- PASO 26: ELIMINAR TODAS LAS POLÍTICAS DE PROJECTS Y CREAR VERSIONES ULTRA-SIMPLES
DROP POLICY IF EXISTS "simple_projects_select" ON projects;
DROP POLICY IF EXISTS "simple_projects_update" ON projects;
DROP POLICY IF EXISTS "simple_projects_delete" ON projects;
DROP POLICY IF EXISTS "simple_projects_insert" ON projects;

-- PASO 27: CREAR POLÍTICAS ULTRA-SIMPLES (SOLO OWNERSHIP, SIN project_permissions)
CREATE POLICY "ultra_simple_projects_select" ON projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ultra_simple_projects_insert" ON projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "ultra_simple_projects_update" ON projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "ultra_simple_projects_delete" ON projects
  FOR DELETE USING (user_id = auth.uid());

-- PASO 28: VERIFICAR QUE LAS NUEVAS POLÍTICAS NO TIENEN RECURSIÓN
SELECT 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'projects';

-- PASO 29: PROBAR INSERCIÓN DIRECTA CON LAS NUEVAS POLÍTICAS
INSERT INTO projects (name, description, user_id, status, created_at, updated_at) 
VALUES (
  'Test Ultra Simple',
  'Prueba con políticas ultra simples',
  '63edbdde-9c45-4ae4-9e90-180d1b50f14e',
  'DRAFT',
  NOW(),
  NOW()
);

-- PASO 30: VERIFICAR LA INSERCIÓN
SELECT count(*) as total_projects FROM projects WHERE user_id = '63edbdde-9c45-4ae4-9e90-180d1b50f14e';

*/
```

-- =============================================
-- DEBUGGING DEFINITIVO DEL PROBLEMA
-- =============================================
/*
VAMOS A DEBUGGEAR EXACTAMENTE QUE ESTÁ PASANDO:

-- PASO 31: VERIFICAR auth.uid() EN EL CONTEXTO ACTUAL
SELECT auth.uid() as current_auth_uid;

-- PASO 32: VERIFICAR SI PODEMOS INSERTAR CON auth.uid() DIRECTO
INSERT INTO projects (name, description, user_id, status, created_at, updated_at) 
SELECT 
  'Debug Test With auth.uid()',
  'Prueba usando auth.uid() directo',
  auth.uid(),
  'DRAFT',
  NOW(),
  NOW()
WHERE auth.uid() IS NOT NULL;

-- PASO 33: CREAR POLÍTICA TEMPORAL MÁS PERMISIVA PARA DEBUGGING
DROP POLICY IF EXISTS "ultra_simple_projects_insert" ON projects;

CREATE POLICY "debug_projects_insert" ON projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- PASO 34: PROBAR INSERCIÓN CON POLÍTICA PERMISIVA
INSERT INTO projects (name, description, user_id, status, created_at, updated_at) 
VALUES (
  'Debug Permissive Test',
  'Con política permisiva',
  '63edbdde-9c45-4ae4-9e90-180d1b50f14e',
  'DRAFT',
  NOW(),
  NOW()
);

-- PASO 35: VER TODOS LOS PROYECTOS PARA VERIFICAR
SELECT name, user_id, created_at FROM projects ORDER BY created_at DESC LIMIT 5;

*/
```

# Actualización del Backend MongoDB - Soporte de Archivos Grandes

## Cambios Realizados [2025-01-04]

### 1. Aumento del Límite de Contenido
- **Modelo Knowledge**: Aumentado límite de contenido de 50,000 a 500,000 caracteres
- **Razón**: Soportar transcripciones largas de videos y documentos extensos

### 2. Soporte de Múltiples Formatos de Archivo
- **Archivos soportados**: `.txt`, `.docx`, `.pdf`
- **Librerías utilizadas**:
  - `mammoth` para extraer texto de archivos .docx
  - `pdf-parse` para extraer texto de archivos .pdf

### 3. Limpieza Automática de Transcripciones
- **Funcionalidad**: Detecta y limpia automáticamente transcripciones con timestamps
- **Limpia**:
  - Timestamps tipo `00:00:01,979 --> 00:05:57,339`
  - Marcadores de timestamp en corchetes `[00:00:01,979 --> 00:05:57,339]`
  - Marcadores de speaker `- [speaker_0]`
  - Líneas vacías múltiples

### 4. Eliminación de APIs Conflictivas
- **Eliminadas**: APIs de Supabase/Next.js que causaban errores de JWT
  - `/api/projects/`
  - `/api/areas/`
  - `/api/knowledge/`
- **Razón**: Evitar conflictos entre sistemas MongoDB y Supabase

## Scripts SQL Ejecutados

```sql
-- No aplican cambios SQL, todos los cambios son en el backend MongoDB
```

## Estructura de Archivos Backend

```
backend/
├── src/
│   ├── models/
│   │   └── Knowledge.js (ACTUALIZADO - límite 500k caracteres)
│   ├── routes/
│   │   └── knowledge.js (ACTUALIZADO - soporte múltiples formatos + limpieza)
│   └── middleware/
└── uploads/ (directorio para archivos subidos)
```

## Testing Requerido

1. **Subida de archivos grandes**: Transcripciones > 50k caracteres
2. **Múltiples formatos**: .txt, .docx, .pdf
3. **Limpieza de transcripciones**: Archivos con timestamps
4. **Funcionalidad existente**: Verificar que no se rompió nada

---

# Documentación Original de Supabase

*[Contenido original continúa...]*
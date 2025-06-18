# Documentación Base de Datos Supabase - AI Consultant

## Descripción General

Esta documentación mantiene un registro completo de la estructura de la base de datos de Supabase para la aplicación AI Consultant. La aplicación utiliza autenticación basada en usuarios y gestión de proyectos de consultoría con **conocimiento** (anteriormente transcripciones) organizado por áreas.

## ✅ Estado Actual: Sistema de Conocimiento Implementado

El proyecto ha migrado exitosamente de un sistema de "transcripciones" a un sistema más amplio de "conocimiento" que permite:
- **Subida de archivos** (.txt, .docx) para extraer contenido
- **Añadir conocimiento manual** mediante formulario de texto
- **Organización por áreas** con asignación flexible
- **Área Global automática** en cada proyecto para conocimiento general

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

### ⚠️ CORRECCIÓN DE ESQUEMA CRÍTICA - Ejecutar AHORA (2024-12-XX)

```sql
-- =============================================
-- CORRECCIÓN URGENTE: Problemas detectados en knowledge_areas
-- Ejecutar en Supabase SQL Editor - PARTE 2
-- =============================================

-- PROBLEMA 1: file_path en knowledge
ALTER TABLE knowledge DROP COLUMN IF EXISTS file_path;
ALTER TABLE knowledge ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE knowledge ALTER COLUMN file_size DROP NOT NULL;

-- PROBLEMA 2: knowledge_areas con transcription_id en lugar de knowledge_id
-- Verificar y corregir estructura de knowledge_areas
DO $$
BEGIN
    -- Si existe transcription_id, renombrar a knowledge_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_areas' 
        AND column_name = 'transcription_id'
    ) THEN
        ALTER TABLE knowledge_areas RENAME COLUMN transcription_id TO knowledge_id;
        RAISE NOTICE 'Renombrado transcription_id a knowledge_id en knowledge_areas';
    END IF;
    
    -- Si la tabla se llama transcription_areas, renombrarla
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'transcription_areas'
    ) THEN
        ALTER TABLE transcription_areas RENAME TO knowledge_areas;
        ALTER TABLE knowledge_areas RENAME COLUMN transcription_id TO knowledge_id;
        RAISE NOTICE 'Renombrado transcription_areas a knowledge_areas';
    END IF;
END $$;

-- Asegurar que knowledge_areas existe con estructura correcta
CREATE TABLE IF NOT EXISTS knowledge_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_id UUID REFERENCES knowledge(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recrear índices y constraints
DROP INDEX IF EXISTS idx_transcription_areas_transcription_id;
DROP INDEX IF EXISTS idx_transcription_areas_area_id;
DROP INDEX IF EXISTS idx_knowledge_areas_knowledge_id;
DROP INDEX IF EXISTS idx_knowledge_areas_area_id;

CREATE INDEX idx_knowledge_areas_knowledge_id ON knowledge_areas(knowledge_id);
CREATE INDEX idx_knowledge_areas_area_id ON knowledge_areas(area_id);

ALTER TABLE knowledge_areas DROP CONSTRAINT IF EXISTS unique_transcription_area;
ALTER TABLE knowledge_areas DROP CONSTRAINT IF EXISTS unique_knowledge_area;
ALTER TABLE knowledge_areas ADD CONSTRAINT unique_knowledge_area UNIQUE (knowledge_id, area_id);

-- Verificar estructura final
SELECT 'Final verification:' as status;
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('knowledge', 'knowledge_areas') 
ORDER BY table_name, ordinal_position;
```

## ✅ Funcionalidades del Sistema de Conocimiento

### 1. Doble Modalidad de Entrada
- **Subida de Archivos**: Soporta .txt y .docx con extracción automática de contenido
- **Entrada Manual**: Formulario para añadir conocimiento manualmente con notas opcionales
- **API Unificada**: `/api/knowledge` maneja ambos tipos mediante detección automática de FormData vs JSON

### 2. Organización por Áreas
- **Área Global Automática**: Se crea automáticamente en cada proyecto
- **Áreas Personalizadas**: Los usuarios pueden crear áreas organizacionales específicas
- **Asignación Flexible**: El conocimiento puede asignarse a múltiples áreas
- **Colores Distintivos**: Cada área tiene un color para facilitar la visualización

### 3. Gestión de Metadatos
- **Información de Archivo**: nombre, tamaño para contenido subido
- **Notas Contextuales**: Campo opcional para añadir contexto adicional
- **Tipo de Fuente**: Diferenciación entre contenido subido vs manual
- **Timestamps**: Registro de cuándo se añadió cada conocimiento

### 4. Interfaz de Usuario Completa
- **Pestañas Organizadas**: Separación clara entre áreas y conocimiento
- **Modales Especializados**: Formularios diferentes para cada tipo de entrada
- **Vista de Contenido**: Modal para visualizar el contenido completo
- **Gestión de Asignaciones**: Interfaz para asignar conocimiento a áreas
- **Indicadores Visuales**: Iconos y colores para distinguir tipos de contenido

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
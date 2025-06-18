# Aplicación de Consultoría con IA - Documentación Técnica

Pass de la bbdd: ContraseñaSeguraparalabbdd2
Conversación sobre el prompt de consultoría: https://claude.ai/chat/a3048d1b-61a0-4d37-8e31-08f6ea13eeb5
Prompt de transcripción a notas: https://claude.ai/chat/8ba303db-a005-4ea4-bc7c-4ee7a646e6c2


## 1. Visión General del Proyecto

### Objetivo
Desarrollar una aplicación web que automatice el proceso de análisis de transcripciones de reuniones para generar diagnósticos, mapas de aplicaciones y propuestas de proyectos utilizando IA (Gemini).

### Stack Tecnológico
- **Frontend/Backend**: Next.js 14+ (App Router)
- **Base de Datos**: Supabase (PostgreSQL)
- **IA**: Google Gemini API
- **Autenticación**: Supabase Auth
- **UI**: Tailwind CSS + shadcn/ui
- **Diagramas**: Mermaid.js
- **Almacenamiento**: Sistema de archivos local (uploads/)

## 2. Arquitectura del Sistema

### Estructura de Carpetas
```
src/
├── app/
│   ├── api/
│   │   ├── transcriptions/
│   │   ├── areas/
│   │   ├── notes/
│   │   ├── projects/
│   │   ├── gemini/
│   │   └── upload/
│   ├── dashboard/
│   ├── projects/
│   └── areas/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── editors/
│   └── diagrams/
├── lib/
│   ├── supabase/
│   ├── gemini/
│   ├── prompts/
│   ├── file-utils/
│   └── utils/
├── types/
└── uploads/
    └── transcriptions/
```

## 3. Modelo de Base de Datos (Supabase)

## 7. Integración con Gemini de Supabase
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente del servidor
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### Esquema SQL de Supabase
```sql
-- Extensión para UUID
create extension if not exists "uuid-ossp";

-- Tabla de proyectos
create table projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  status text default 'DRAFT' check (status in (
    'DRAFT',
    'TRANSCRIPTIONS_UPLOADED',
    'AREAS_MAPPED',
    'NOTES_GENERATED',
    'NOTES_VALIDATED',
    'DIAGNOSIS_GENERATED',
    'DIAGNOSIS_VALIDATED',
    'IDEAS_GENERATED',
    'IDEAS_VALIDATED',
    'COMPLETED'
  )),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de áreas
create table areas (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  color text,
  project_id uuid references projects(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de transcripciones
create table transcriptions (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  file_path text not null, -- Ruta al archivo en el sistema local
  file_name text not null,
  file_size bigint,
  content text, -- Contenido extraído del archivo
  project_id uuid references projects(id) on delete cascade,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de relación transcripción-área (muchos a muchos)
create table transcription_areas (
  transcription_id uuid references transcriptions(id) on delete cascade,
  area_id uuid references areas(id) on delete cascade,
  primary key (transcription_id, area_id)
);

-- Tabla de notas
create table notes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  ai_generated boolean default true,
  validated boolean default false,
  area_id uuid references areas(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de diagnósticos
create table diagnosis (
  id uuid default uuid_generate_v4() primary key,
  current_situation text not null,
  conclusions text not null,
  application_inventory text not null,
  application_map text not null, -- Diagrama Mermaid
  validated boolean default false,
  project_id uuid references projects(id) on delete cascade unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de ideas de proyectos
create table project_ideas (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  justification text not null,
  status text default 'PROPOSED' check (status in ('PROPOSED', 'ACCEPTED', 'REJECTED', 'MODIFIED')),
  priority integer,
  project_id uuid references projects(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas RLS (Row Level Security)
alter table projects enable row level security;
alter table areas enable row level security;
alter table transcriptions enable row level security;
alter table transcription_areas enable row level security;
alter table notes enable row level security;
alter table diagnosis enable row level security;
alter table project_ideas enable row level security;

-- Políticas para proyectos
create policy "Users can only see their own projects" on projects
  for all using (auth.uid() = user_id);

-- Políticas para áreas (a través del proyecto)
create policy "Users can only see areas of their projects" on areas
  for all using (
    exists (
      select 1 from projects 
      where projects.id = areas.project_id 
      and projects.user_id = auth.uid()
    )
  );

-- Políticas similares para el resto de tablas...
create policy "Users can only see transcriptions of their projects" on transcriptions
  for all using (
    exists (
      select 1 from projects 
      where projects.id = transcriptions.project_id 
      and projects.user_id = auth.uid()
    )
  );

-- Función para actualizar updated_at
create or replace function update_updated_at_column()
returns trigger as $
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$ language plpgsql;

-- Triggers para updated_at
create trigger update_projects_updated_at before update on projects
  for each row execute procedure update_updated_at_column();

create trigger update_notes_updated_at before update on notes
  for each row execute procedure update_updated_at_column();

create trigger update_diagnosis_updated_at before update on diagnosis
  for each row execute procedure update_updated_at_column();

create trigger update_project_ideas_updated_at before update on project_ideas
  for each row execute procedure update_updated_at_column();
```

## 4. Flujo de Trabajo Detallado

### Fase 1: Subida y Mapeo de Transcripciones
1. **Upload de transcripciones**
   - Interfaz de drag & drop
   - Validación de formato (txt, docx, pdf)
   - Almacenamiento en `/uploads/transcriptions/`
   - Extracción de contenido y guardado en base de datos

2. **Creación y asignación de áreas**
   - CRUD de áreas del proyecto
   - Interfaz para asignar transcripciones a áreas
   - Una transcripción puede pertenecer a múltiples áreas

### Fase 2: Generación de Notas Estructuradas
1. **Procesamiento con IA**
   - Por cada área, enviar transcripciones asignadas a Gemini
   - Usar prompt específico para generar notas estructuradas
   - Guardar notas generadas en la base de datos

2. **Validación de notas**
   - Editor rich text para revisar/modificar notas
   - Marcar notas como validadas
   - Control de estado del proyecto

### Fase 3: Generación de Diagnóstico
1. **Creación de diagnóstico**
   - Recopilar todas las notas validadas
   - Enviar a Gemini con megaprompt del sistema
   - Generar: situación actual, conclusiones, inventario de aplicaciones, mapa mermaid

2. **Validación de diagnóstico**
   - Interfaz para revisar cada sección
   - Preview del diagrama Mermaid
   - Posibilidad de regenerar secciones específicas

### Fase 4: Generación de Ideas de Proyectos
1. **Primera propuesta**
   - Usar diagnóstico validado como input
   - Generar lista inicial de proyectos con IA

2. **Revisión y refinamiento**
   - Interfaz para aceptar/rechazar/modificar proyectos
   - Agregar proyectos manualmente
   - Regenerar propuesta final

## 5. Especificaciones de API

### Endpoints Principales

#### Transcripciones
```typescript
POST /api/transcriptions/upload    // Upload de archivo
GET /api/transcriptions?projectId={id}
PUT /api/transcriptions/{id}
DELETE /api/transcriptions/{id}
POST /api/transcriptions/{id}/assign-areas
GET /api/transcriptions/{id}/content  // Obtener contenido del archivo
```

#### Áreas
```typescript
POST /api/areas
GET /api/areas?projectId={id}
PUT /api/areas/{id}
DELETE /api/areas/{id}
```

#### Notas
```typescript
POST /api/notes/generate    // Generar con IA
GET /api/notes?areaId={id}
PUT /api/notes/{id}
POST /api/notes/{id}/validate
```

#### Diagnóstico
```typescript
POST /api/diagnosis/generate
GET /api/diagnosis?projectId={id}
PUT /api/diagnosis/{id}
POST /api/diagnosis/{id}/validate
```

#### Ideas de Proyectos
```typescript
POST /api/project-ideas/generate
GET /api/project-ideas?projectId={id}
PUT /api/project-ideas/{id}
DELETE /api/project-ideas/{id}
POST /api/project-ideas/finalize
```

## 6. Gestión de Archivos y Supabase

### Sistema de Archivos Local
```typescript
// lib/file-utils/storage.ts
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'transcriptions');

export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function saveTranscriptionFile(
  file: File, 
  projectId: string
): Promise<{ filePath: string; fileName: string }> {
  await ensureUploadDir();
  
  const fileId = uuidv4();
  const extension = file.name.split('.').pop();
  const fileName = `${fileId}.${extension}`;
  const filePath = path.join(UPLOAD_DIR, `${projectId}_${fileName}`);
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await fs.writeFile(filePath, buffer);
  
  return {
    filePath: `uploads/transcriptions/${projectId}_${fileName}`,
    fileName: file.name
  };
}

export async function readTranscriptionFile(filePath: string): Promise<string> {
  const fullPath = path.join(process.cwd(), filePath);
  const content = await fs.readFile(fullPath, 'utf-8');
  return content;
}

export async function deleteTranscriptionFile(filePath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    await fs.unlink(fullPath);
  } catch (error) {
    console.warn('File not found for deletion:', filePath);
  }
}
```

### Extracción de Contenido por Tipo
```typescript
// lib/file-utils/extractors.ts
import mammoth from 'mammoth';
import * as pdfParse from 'pdf-parse';

export async function extractTextContent(
  buffer: Buffer, 
  fileName: string
): Promise<string> {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'txt':
      return buffer.toString('utf-8');
      
    case 'docx':
      const docxResult = await mammoth.extractRawText({ buffer });
      return docxResult.value;
      
    case 'pdf':
      const pdfResult = await pdfParse(buffer);
      return pdfResult.text;
      
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}
```

### Cliente Supabase con Tipos
```typescript
// lib/supabase/types.ts
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: ProjectStatus;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string;
          status?: ProjectStatus;
          user_id: string;
        };
        Update: {
          name?: string;
          description?: string;
          status?: ProjectStatus;
        };
      };
      transcriptions: {
        Row: {
          id: string;
          title: string;
          file_path: string;
          file_name: string;
          file_size: number | null;
          content: string | null;
          project_id: string;
          uploaded_at: string;
        };
        Insert: {
          title: string;
          file_path: string;
          file_name: string;
          file_size?: number;
          content?: string;
          project_id: string;
        };
        Update: {
          title?: string;
          content?: string;
        };
      };
      // ... más tablas
    };
  };
}

export type ProjectStatus = 
  | 'DRAFT'
  | 'TRANSCRIPTIONS_UPLOADED'
  | 'AREAS_MAPPED'
  | 'NOTES_GENERATED'
  | 'NOTES_VALIDATED'
  | 'DIAGNOSIS_GENERATED'
  | 'DIAGNOSIS_VALIDATED'
  | 'IDEAS_GENERATED'
  | 'IDEAS_VALIDATED'
  | 'COMPLETED';

// Cliente tipado
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### API de Upload
```typescript
// app/api/transcriptions/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { saveTranscriptionFile, extractTextContent } from '@/lib/file-utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const title = formData.get('title') as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'File and projectId are required' }, 
        { status: 400 }
      );
    }

    // Verificar que el proyecto pertenece al usuario
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' }, 
        { status: 404 }
      );
    }

    // Guardar archivo
    const { filePath, fileName } = await saveTranscriptionFile(file, projectId);
    
    // Extraer contenido
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await extractTextContent(buffer, file.name);

    // Guardar en base de datos
    const { data: transcription, error: dbError } = await supabase
      .from('transcriptions')
      .insert({
        title: title || file.name,
        file_path: filePath,
        file_name: fileName,
        file_size: file.size,
        content,
        project_id: projectId,
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json(transcription);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload transcription' }, 
      { status: 500 }
    );
  }
}
```

### Configuración
```typescript
// lib/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function generateContent(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### Sistema de Prompts
```typescript
// lib/prompts/index.ts
export const PROMPTS = {
  GENERATE_NOTES: `
    Analiza las siguientes transcripciones de reuniones del área "{areaName}" y genera notas estructuradas que incluyan:
    
    1. Puntos clave discutidos
    2. Decisiones tomadas
    3. Problemas identificados
    4. Oportunidades detectadas
    5. Próximos pasos mencionados
    
    Formato de respuesta en markdown con secciones claras.
    
    Transcripciones:
    {transcriptions}
  `,
  
  GENERATE_DIAGNOSIS: `
    Basándote en las siguientes notas estructuradas de diferentes áreas de la organización, genera un diagnóstico completo que incluya:
    
    1. **Situación Actual**: Resumen del estado actual de la organización
    2. **Conclusiones**: Principales hallazgos y insights
    3. **Inventario de Aplicaciones**: Lista de aplicaciones/sistemas mencionados
    4. **Mapa de Aplicaciones**: Diagrama Mermaid mostrando relaciones entre aplicaciones
    
    Notas por área:
    {notesByArea}
  `,
  
  GENERATE_PROJECT_IDEAS: `
    Basándote en el siguiente diagnóstico, genera una lista de 5-8 ideas de proyectos que incluyan:
    
    Para cada proyecto:
    - **Título**: Nombre descriptivo del proyecto
    - **Descripción**: Explicación detallada del alcance y objetivos
    - **Justificación**: Por qué es necesario este proyecto
    
    Diagnóstico:
    {diagnosis}
  `
};
```

## 8. Componentes de UI Principales

### Layout y Navegación
- Dashboard principal con progreso del proyecto
- Sidebar con navegación por fases
- Breadcrumbs para ubicación actual

### Componentes Específicos
1. **TranscriptionUploader**: Drag & drop para archivos
2. **AreaManager**: CRUD de áreas con asignación
3. **NotesEditor**: Editor rich text con validación
4. **DiagnosisViewer**: Visualización con tabs por sección
5. **MermaidRenderer**: Renderizado de diagramas
6. **ProjectIdeaCard**: Tarjetas para ideas con acciones
7. **ProgressStepper**: Indicador de progreso por fases

## 9. Consideraciones de UX/UI

### Principios de Diseño
- **Progresivo**: Guiar al usuario paso a paso
- **Transparente**: Mostrar siempre el estado del proceso
- **Flexible**: Permitir edición en cada fase
- **Eficiente**: Minimizar clicks y tiempo de carga

### Estados de Carga
- Skeletons durante generación con IA
- Progress bars para procesos largos
- Indicadores de estado por elemento

### Manejo de Errores
- Retry automático para fallos de IA
- Mensajes descriptivos de error
- Fallbacks para contenido no generado

## 10. Configuración del Proyecto

### Variables de Entorno
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Gemini
GEMINI_API_KEY="your-gemini-api-key"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Dependencies Package.json
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/ssr": "^0.0.10",
    "@google/generative-ai": "^0.2.0",
    "tailwindcss": "^3.3.0",
    "@tailwindcss/typography": "^0.5.10",
    "lucide-react": "^0.292.0",
    "mammoth": "^1.6.0",
    "pdf-parse": "^1.1.1",
    "mermaid": "^10.6.0",
    "uuid": "^9.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/uuid": "^9.0.0",
    "@types/pdf-parse": "^1.1.1",
    "typescript": "^5.0.0"
  }
}

### Scripts de Package.json
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

## 11. Plan de Implementación

### Fase 1 (Semana 1-2)
- Setup del proyecto Next.js
- Configuración de Supabase y esquema de base de datos
- Sistema de autenticación con Supabase Auth
- CRUD básico de proyectos

### Fase 2 (Semana 3-4)
- Sistema de upload y almacenamiento de archivos
- Extracción de contenido de diferentes formatos
- Gestión de transcripciones y áreas
- Integración básica con Gemini

### Fase 3 (Semana 5-6)
- Generación y validación de notas
- Sistema de diagnóstico
- Renderizado de diagramas Mermaid

### Fase 4 (Semana 7-8)
- Generación de ideas de proyectos
- Refinamiento de UI/UX
- Testing y optimización
- Políticas RLS de Supabase y optimización

## 12. Consideraciones de Seguridad

### Autenticación y Autorización
- **Supabase Auth**: Manejo completo de autenticación
- **Row Level Security (RLS)**: Políticas de acceso a nivel de fila
- **Middleware de autenticación**: Protección de rutas sensibles

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rutas del dashboard
  if (req.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Proteger APIs
  if (req.nextUrl.pathname.startsWith('/api/') && 
      !req.nextUrl.pathname.startsWith('/api/auth') && 
      !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
```

### Validación de Archivos
```typescript
// lib/file-utils/validation.ts
const ALLOWED_MIME_TYPES = [
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): { isValid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Tipo de archivo no permitido. Solo se aceptan .txt, .docx y .pdf' 
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: 'El archivo es demasiado grande. Máximo 10MB.' 
    };
  }

  return { isValid: true };
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
}
```

### Sanitización de Contenido IA
```typescript
// lib/utils/sanitization.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeAIContent(content: string): string {
  // Sanitizar HTML potencialmente peligroso
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: []
  });
}
```

## 13. Métricas y Monitoring

### Logging y Monitoreo
```typescript
// lib/monitoring/logger.ts
interface LogEvent {
  level: 'info' | 'warn' | 'error';
  message: string;
  userId?: string;
  projectId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class AppLogger {
  static log(event: LogEvent) {
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // En desarrollo: console
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(logEntry, null, 2));
    }

    // En producción: servicio de logging (ej: Vercel Analytics, LogRocket)
    // this.sendToLoggingService(logEntry);
  }

  static geminiRequest(userId: string, projectId: string, promptType: string, success: boolean) {
    this.log({
      level: success ? 'info' : 'error',
      message: `Gemini ${promptType} request ${success ? 'succeeded' : 'failed'}`,
      userId,
      projectId,
      metadata: { promptType, success }
    });
  }

  static fileUpload(userId: string, projectId: string, fileName: string, fileSize: number) {
    this.log({
      level: 'info',
      message: 'File uploaded',
      userId,
      projectId,
      metadata: { fileName, fileSize }
    });
  }
}
```

### Rate Limiting para Gemini
```typescript
// lib/gemini/rate-limiter.ts
interface RateLimitEntry {
  requests: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly maxRequests = 60; // por hora
  private readonly windowMs = 60 * 60 * 1000; // 1 hora

  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.limits.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      this.limits.set(userId, {
        requests: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (userLimit.requests >= this.maxRequests) {
      return false;
    }

    userLimit.requests++;
    return true;
  }

  getRemainingRequests(userId: string): number {
    const userLimit = this.limits.get(userId);
    if (!userLimit || Date.now() > userLimit.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - userLimit.requests);
  }
}

export const rateLimiter = new RateLimiter();
```

## 14. Testing Strategy

### Estructura de Tests
```
tests/
├── __mocks__/
├── unit/
│   ├── components/
│   ├── lib/
│   └── utils/
├── integration/
│   ├── api/
│   └── pages/
└── e2e/
    └── flows/
```

### Tests Unitarios Clave
```typescript
// tests/unit/lib/file-utils.test.ts
import { validateFile, sanitizeFileName } from '@/lib/file-utils/validation';

describe('File Validation', () => {
  test('should accept valid file types', () => {
    const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const result = validateFile(txtFile);
    expect(result.isValid).toBe(true);
  });

  test('should reject invalid file types', () => {
    const imgFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const result = validateFile(imgFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Tipo de archivo no permitido');
  });

  test('should sanitize file names', () => {
    const dangerous = 'file with spaces & symbols!.txt';
    const sanitized = sanitizeFileName(dangerous);
    expect(sanitized).toBe('file_with_spaces___symbols_.txt');
  });
});
```

### Tests de Integración API
```typescript
// tests/integration/api/transcriptions.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/transcriptions/upload/route';

describe('/api/transcriptions/upload', () => {
  test('should upload transcription successfully', async () => {
    const formData = new FormData();
    formData.append('file', new File(['content'], 'test.txt'));
    formData.append('projectId', 'test-project-id');
    formData.append('title', 'Test Transcription');

    const { req } = createMocks({
      method: 'POST',
      body: formData,
    });

    const response = await POST(req as any);
    expect(response.status).toBe(200);
  });
});
```

## 15. Deployment y DevOps

### Configuración de Vercel
```json
// vercel.json
{
  "builds": [
    {
      "src": "next.config.js",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "GEMINI_API_KEY": "@gemini-api-key"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### CI/CD con GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Backup y Mantenimiento
```typescript
// scripts/backup-uploads.ts
import { promises as fs } from 'fs';
import path from 'path';
import archiver from 'archiver';

async function backupUploads() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const backupPath = path.join(process.cwd(), 'backups', `uploads-${Date.now()}.zip`);
  
  await fs.mkdir(path.dirname(backupPath), { recursive: true });
  
  const output = fs.createWriteStream(backupPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.pipe(output);
  archive.directory(uploadsDir, false);
  await archive.finalize();
  
  console.log(`Backup created: ${backupPath}`);
}

// Ejecutar backup
if (require.main === module) {
  backupUploads().catch(console.error);
}
```

## 16. Escalabilidad y Performance

### Optimizaciones de Performance
- **Lazy loading** de componentes pesados
- **Virtualización** para listas largas de transcripciones
- **Caché** de respuestas de Gemini a nivel de aplicación
- **Compresión** de archivos estáticos
- **CDN** para assets estáticos

```typescript
// lib/cache/gemini-cache.ts
interface CacheEntry {
  result: string;
  timestamp: number;
  ttl: number;
}

class GeminiCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 24 * 60 * 60 * 1000; // 24 horas

  private generateKey(prompt: string, context: string): string {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(prompt + context)
      .digest('hex');
  }

  get(prompt: string, context: string): string | null {
    const key = this.generateKey(prompt, context);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.result;
  }

  set(prompt: string, context: string, result: string, ttl = this.defaultTTL): void {
    const key = this.generateKey(prompt, context);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const geminiCache = new GeminiCache();
```

### Escalabilidad Horizontal
- **Microservicios**: Separar procesamiento de IA en servicio independiente
- **Queue system**: Redis/BullMQ para procesamiento asíncrono
- **Load balancing**: Múltiples instancias de la aplicación
- **Database sharding**: Particionado por usuario/proyecto

## 17. Documentación para Desarrollador

### Setup Local
```bash
# 1. Clonar repositorio
git clone <repository-url>
cd consultoria-ai-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Configurar Supabase
# - Crear proyecto en supabase.com
# - Ejecutar el SQL del esquema en el editor SQL
# - Configurar políticas RLS

# 5. Crear directorio de uploads
mkdir -p uploads/transcriptions

# 6. Ejecutar en desarrollo
npm run dev
```

### Guía de Contribución
```markdown
## Contribuir al Proyecto

### Flujo de Trabajo
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commits descriptivos: `git commit -m "feat: añadir validación de archivos"`
4. Push y crear Pull Request

### Estándares de Código
- **ESLint + Prettier** para formateo
- **Conventional Commits** para mensajes
- **TypeScript strict mode** obligatorio
- **Tests** para nuevas funcionalidades

### Estructura de Commits
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` cambios de formateo
- `refactor:` refactorización
- `test:` añadir tests
```

---

## Resumen de Cambios Implementados

✅ **Supabase como Base de Datos**
- Configuración completa de Supabase
- Esquema SQL con políticas RLS
- Cliente tipado con TypeScript

✅ **Sistema de Archivos Local**
- Almacenamiento en `/uploads/transcriptions/`
- Extractores de contenido para txt, docx, pdf
- API de upload con validación

✅ **Seguridad Mejorada**
- Autenticación con Supabase Auth
- Middleware de protección de rutas
- Validación y sanitización de archivos

✅ **Monitoring y Testing**
- Sistema de logging
- Rate limiting para Gemini
- Estrategia de testing completa

✅ **DevOps y Deployment**
- Configuración para Vercel
- CI/CD con GitHub Actions
- Scripts de backup y mantenimiento

Esta documentación ahora está completamente adaptada para usar Supabase como base de datos y almacenamiento local de archivos, proporcionando una base sólida para que el desarrollador implemente la aplicación.
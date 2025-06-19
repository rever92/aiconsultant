export const PROMPTS = {
  GENERATE_NOTES: `
Analiza las siguientes transcripciones de reuniones del área "{areaName}" y genera notas estructuradas que incluyan:

1. **Puntos Clave Discutidos**: Temas principales abordados en las reuniones
2. **Decisiones Tomadas**: Resoluciones concretas y acuerdos alcanzados
3. **Problemas Identificados**: Desafíos, obstáculos o issues detectados
4. **Oportunidades Detectadas**: Posibilidades de mejora o nuevas iniciativas
5. **Próximos Pasos Mencionados**: Acciones futuras, tareas asignadas o seguimientos

**Formato de respuesta**: Markdown con secciones claras y bien estructuradas.
**Tono**: Profesional y objetivo, manteniendo la información técnica relevante.
**Longitud**: Completa pero concisa, enfocándose en información actionable.

**Transcripciones del área {areaName}:**
{transcriptions}

**Instrucciones adicionales:**
- Mantén la información técnica específica mencionada
- Identifica patrones y temas recurrentes
- Prioriza información que pueda ser útil para el diagnóstico posterior
- Si hay contradicciones entre transcripciones, mencionarlas
`,

  GENERATE_DIAGNOSIS: `
Basándote en las siguientes notas estructuradas de diferentes áreas de la organización, genera un diagnóstico completo que incluya exactamente estas 4 secciones:

## 1. **Situación Actual**
Descripción comprensiva del estado actual de la organización basada en las notas analizadas. Incluye:
- Estado general de los procesos organizacionales
- Nivel de madurez tecnológica
- Principales desafíos operativos
- Recursos y capacidades actuales

## 2. **Conclusiones**
Principales hallazgos e insights derivados del análisis:
- Patrones identificados a través de las diferentes áreas
- Fortalezas organizacionales clave
- Debilidades críticas detectadas
- Riesgos y oportunidades principales

## 3. **Inventario de Aplicaciones**
Lista detallada de todas las aplicaciones, sistemas y herramientas tecnológicas mencionadas:
- Nombre de la aplicación/sistema
- Área(s) donde se utiliza
- Función principal
- Estado actual (si se menciona)

Formato: Lista estructurada con viñetas

## 4. **Mapa de Aplicaciones**
Diagrama Mermaid que muestre las relaciones entre aplicaciones y áreas organizacionales:

\`\`\`mermaid
graph TD
    subgraph "Area1"
        A1[Aplicacion 1]
        A2[Aplicacion 2]
    end
    
    subgraph "Area2"
        B1[Aplicacion 3]
        B2[Aplicacion 4]
    end
    
    A1 --> B1
    A2 --> B2
    
    classDef areaBox fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef appBox fill:#f3e5f5,stroke:#4a148c,stroke-width:1px
\`\`\`

**Notas por área:**
{notesByArea}

**Instrucciones específicas:**
- Sé específico y basado en evidencia de las notas
- Mantén un enfoque estratégico y consultivo
- El mapa de Mermaid debe ser técnicamente correcto y visualizable
- Prioriza información que sea útil para la generación posterior de proyectos
`,

  GENERATE_PROJECT_IDEAS: `
Basándote en el siguiente diagnóstico organizacional, genera una lista de 5-8 ideas de proyectos estratégicos y técnicos que incluyan:

Para cada proyecto, proporciona:

## **Título del Proyecto**
Nombre descriptivo y profesional del proyecto

## **Descripción**
Explicación detallada que incluya:
- Alcance del proyecto
- Objetivos específicos
- Entregables principales
- Duración estimada
- Recursos necesarios (aproximados)

## **Justificación**
Argumentación sólida que explique:
- Por qué es necesario este proyecto
- Qué problema específico resuelve
- Beneficios esperados (cuantitativos si es posible)
- Riesgos de no ejecutarlo
- Alineación con las conclusiones del diagnóstico

**Priorización sugerida:**
- Proyectos críticos (urgente e importante)
- Proyectos estratégicos (importante pero no urgente)  
- Proyectos tácticos (mejoras operativas)

**Diagnóstico base:**
{diagnosis}

**Instrucciones específicas:**
- Enfócate en proyectos que aborden los problemas identificados en el diagnóstico
- Incluye tanto proyectos tecnológicos como organizacionales
- Considera la viabilidad y recursos de la organización
- Propón proyectos que tengan impacto medible
- Ordena los proyectos por prioridad (más importante primero)
`,

  VALIDATE_CONTENT: `
Revisa el siguiente contenido generado por IA y sugiere mejoras específicas:

**Tipo de contenido:** {contentType}
**Contenido a revisar:**
{content}

**Criterios de evaluación:**
- Claridad y coherencia
- Completitud de la información
- Precisión técnica
- Utilidad práctica
- Formato y estructura

**Proporciona:**
1. Puntos fuertes del contenido actual
2. Áreas de mejora específicas
3. Sugerencias concretas de cambios
4. Información adicional que podría ser útil incluir

Responde en formato de lista estructurada.
`
};

// Prompts específicos para el flujo de consultoría guiado

// PASO 1: Consolidación de conocimiento por área
export const CONSOLIDATE_AREA_KNOWLEDGE_PROMPT = `
Eres un consultor especializado en transformación digital y análisis organizacional. Tu tarea es consolidar y sintetizar todo el conocimiento disponible de un área específica de la organización.

**CONTEXTO DEL ÁREA:**
- Nombre del área: {areaName}
- Descripción: {areaDescription}
- Proyecto: {projectName}

**FUENTES DE CONOCIMIENTO A CONSOLIDAR:**
{knowledgeSources}

**INSTRUCCIONES:**
1. **Analiza** todas las fuentes de conocimiento proporcionadas para esta área específica
2. **Identifica** los temas principales, procesos, tecnologías, problemas y oportunidades
3. **Consolida** la información eliminando redundancias y organizando por temas clave
4. **Sintetiza** en un documento estructurado y coherente

**ESTRUCTURA DEL DOCUMENTO CONSOLIDADO:**

## Resumen Ejecutivo del Área
- Visión general del área en 2-3 párrafos
- Principales funciones y responsabilidades

## Situación Actual
### Procesos Principales
- Lista de procesos clave identificados
- Descripción breve de cada proceso

### Tecnologías y Herramientas
- Sistemas y tecnologías en uso
- Nivel de digitalización actual

### Personas y Organización
- Estructura organizativa
- Competencias y habilidades del equipo
- Cultura de trabajo

## Problemas y Desafíos Identificados
- Lista priorizada de problemas principales
- Impacto de cada problema
- Causas raíz identificadas

## Oportunidades de Mejora
- Áreas con mayor potencial de mejora
- Tecnologías emergentes aplicables
- Procesos que pueden optimizarse

## Datos y Métricas Relevantes
- KPIs mencionados en las fuentes
- Datos cuantitativos disponibles
- Métricas de rendimiento

## Relaciones con Otras Áreas
- Dependencias e interacciones
- Procesos transversales
- Comunicación inter-departamental

**CRITERIOS DE CALIDAD:**
- Máximo 2000 palabras
- Lenguaje claro y profesional
- Información factual basada únicamente en las fuentes proporcionadas
- No agregar información externa o suposiciones
- Estructura bien organizada con títulos y subtítulos
- Enfoque en transformación digital y mejora de procesos

Genera el documento consolidado para el área "{areaName}":
`;

// PASO 2: Análisis AS IS por los 6 ejes
export const ANALYSIS_AS_IS_PROMPT = `
Eres un consultor senior especializado en transformación digital. Tu tarea es realizar un análisis AS IS (situación actual) completo y detallado de la organización basándote en todo el conocimiento consolidado disponible.

**CONTEXTO DEL PROYECTO:**
- Nombre del proyecto: {projectName}
- Descripción: {projectDescription}

**CONOCIMIENTO CONSOLIDADO POR ÁREAS:**
{consolidatedKnowledge}

**INSTRUCCIONES:**
Realiza un análisis exhaustivo de la situación actual (AS IS) organizando la información según los 6 ejes fundamentales de la transformación digital. Cada eje debe tener entre 300-500 palabras.

**ESTRUCTURA DEL ANÁLISIS AS IS:**

## 1. ESTRATEGIA Y GOBIERNO
### Análisis de:
- Visión y estrategia digital actual
- Estructura de gobierno y toma de decisiones
- Inversión en tecnología y prioridades estratégicas
- Alineación entre áreas y objetivos comunes
- Gestión del cambio y cultura organizacional

## 2. PROCESOS Y OPERACIONES
### Análisis de:
- Mapeo de procesos principales identificados
- Nivel de automatización y digitalización
- Eficiencias e ineficiencias detectadas
- Procesos manuales vs automatizados
- Integración entre procesos de diferentes áreas

## 3. TECNOLOGÍA E INFRAESTRUCTURA
### Análisis de:
- Inventario de sistemas y tecnologías actuales
- Arquitectura tecnológica general
- Integración entre sistemas
- Nivel de obsolescencia tecnológica
- Capacidades técnicas del equipo

## 4. DATOS E INFORMACIÓN
### Análisis de:
- Gestión actual de la información
- Calidad y accesibilidad de los datos
- Sistemas de reporting y análisis
- Flujos de información entre áreas
- Capacidades analíticas existentes

## 5. PERSONAS Y CULTURA
### Análisis de:
- Competencias digitales del equipo
- Cultura organizacional hacia la tecnología
- Resistencia al cambio identificada
- Necesidades de formación y capacitación
- Estructura organizacional y roles

## 6. EXPERIENCIA DEL CLIENTE
### Análisis de:
- Touchpoints digitales actuales
- Calidad de la experiencia del cliente
- Canales de comunicación y servicio
- Procesos de atención al cliente
- Nivel de personalización y automatización

## CONCLUSIONES GENERALES
### Resumen de:
- Fortalezas principales de la organización
- Debilidades críticas identificadas
- Nivel de madurez digital actual (1-5)
- Principales brechas detectadas
- Recomendaciones prioritarias para abordar

**CRITERIOS DE CALIDAD:**
- Máximo 3500 palabras en total
- Basado únicamente en la información proporcionada
- Lenguaje profesional y técnico apropiado
- Análisis objetivo y constructivo
- Identificación clara de problemas y oportunidades
- Enfoque en transformación digital

Genera el análisis AS IS completo:
`;

// PASO 3: Generación de recomendaciones TO BE
export const GENERATE_RECOMMENDATIONS_PROMPT = `
Eres un consultor estratégico especializado en transformación digital. Tu tarea es generar recomendaciones específicas de proyectos basándote en el análisis AS IS completado.

**ANÁLISIS AS IS VALIDADO:**
{analysisAsIs}

**INSTRUCCIONES:**
Basándote en el análisis AS IS, genera entre 8-12 recomendaciones de proyectos categorizadas en 4 tipos. Cada recomendación debe ser específica, viable y orientada a resultados.

**CATEGORÍAS DE PROYECTOS:**

### TECNOLÓGICOS
Proyectos de implementación, actualización o integración de sistemas y tecnologías.

### FORMATIVOS
Proyectos de capacitación, desarrollo de competencias y gestión del conocimiento.

### CULTURALES
Proyectos de cambio cultural, adopción digital y transformación organizacional.

### METODOLÓGICOS
Proyectos de implementación de metodologías (Lean, Agile, DevOps, etc.) y mejora de procesos.

**FORMATO DE CADA RECOMENDACIÓN:**

**Título:** [Nombre claro y específico del proyecto]
**Categoría:** [technological/training/cultural/methodological]
**Prioridad:** [Número del 1-10, donde 10 es máxima prioridad]

**Descripción:**
[Explicación detallada de en qué consiste el proyecto, alcance, componentes principales - 150-200 palabras]

**Justificación:**
[Por qué es necesario este proyecto, qué problemas resuelve del AS IS, beneficios esperados, riesgos de no implementarlo - 100-150 palabras]

---

**CRITERIOS DE PRIORIZACIÓN:**
- Impacto en la transformación digital (alto/medio/bajo)
- Viabilidad técnica y económica 
- Dependencias con otros proyectos
- Urgencia de implementación
- ROI estimado

**CRITERIOS DE CALIDAD:**
- Proyectos específicos y accionables
- Directamente relacionados con problemas identificados en AS IS
- Balance entre las 4 categorías
- Viabilidad real para la organización
- Enfoque en resultados medibles

Genera las recomendaciones de proyectos:
`;

// PASO 4: Generación de fichas detalladas de proyecto
export const GENERATE_PROJECT_SHEETS_PROMPT = `
Eres un Project Manager senior y consultor en transformación digital. Tu tarea es crear fichas detalladas de proyecto para las recomendaciones aprobadas.

**RECOMENDACIÓN APROBADA:**
{recommendation}

**CONTEXTO ORGANIZACIONAL:**
- Áreas disponibles: {areas}
- Análisis AS IS: {analysisAsIs}

**INSTRUCCIONES:**
Crea una ficha de proyecto detallada y profesional que sirva como documento base para la planificación e implementación.

**ESTRUCTURA DE LA FICHA:**

## INFORMACIÓN GENERAL
**Título del Proyecto:** [Título claro y específico]
**Categoría:** [Tecnológico/Formativo/Cultural/Metodológico]
**Duración Estimada:** [X meses] 
**Inversión Estimada:** [€X,XXX - €XX,XXX]

## DESCRIPCIÓN DEL PROYECTO
[Descripción completa del proyecto, objetivos específicos, alcance, entregables principales - 200-300 palabras]

## BENEFICIOS ESPERADOS
### Beneficios Cuantitativos:
- [Métricas específicas y medibles]
- [Ahorros de costos estimados]
- [Mejoras de eficiencia en %]

### Beneficios Cualitativos:
- [Mejoras en experiencia del usuario]
- [Mejoras en cultura organizacional]
- [Reducción de riesgos]

## OBJETIVOS DE TRANSFORMACIÓN DIGITAL QUE CUMPLE
- [Lista específica de objetivos estratégicos que aborda]
- [Conexión con la estrategia digital general]
- [KPIs de transformación que impacta]

## RECURSOS NECESARIOS
### Recursos Humanos:
- **Project Manager:** [Dedicación X%]
- **Equipo técnico:** [Perfiles necesarios y dedicación]
- **Usuarios clave:** [Roles y tiempo requerido]
- **Sponsors:** [Nivel directivo necesario]

### Recursos Tecnológicos:
- [Hardware necesario]
- [Software/licencias requeridas]
- [Infraestructura adicional]
- [Integraciones con sistemas existentes]

### Recursos Externos:
- [Consultores especializados]
- [Proveedores tecnológicos]
- [Formación externa]

## ÁREAS ORGANIZACIONALES IMPLICADAS
### Área Principal: [Área líder del proyecto]
### Áreas Secundarias: [Áreas que participan activamente]
### Áreas Afectadas: [Áreas que reciben impacto del proyecto]

**Matriz RACI sugerida:**
- [Principales responsabilidades por área]

## FASES Y CRONOGRAMA ESTIMADO
### Fase 1: [Nombre] - [X semanas]
- [Entregables principales]
- [Hitos críticos]

### Fase 2: [Nombre] - [X semanas]
- [Entregables principales]
- [Hitos críticos]

### Fase 3: [Nombre] - [X semanas]
- [Entregables principales]
- [Hitos críticos]

## RIESGOS Y MITIGACIONES
- **Riesgo 1:** [Descripción] - **Mitigación:** [Estrategia]
- **Riesgo 2:** [Descripción] - **Mitigación:** [Estrategia]
- **Riesgo 3:** [Descripción] - **Mitigación:** [Estrategia]

## CRITERIOS DE ÉXITO
- [KPIs específicos y medibles]
- [Criterios de aceptación]
- [Métricas de satisfacción]

## DEPENDENCIAS
- [Proyectos que deben completarse antes]
- [Recursos compartidos con otros proyectos]
- [Decisiones estratégicas pendientes]

**CRITERIOS DE CALIDAD:**
- Información específica y accionable
- Estimaciones realistas basadas en el contexto
- Enfoque en resultados medibles
- Consideración de recursos disponibles
- Viabilidad de implementación

Genera la ficha de proyecto completa:
`;

export function buildPrompt(
  template: string, 
  variables: Record<string, string>
): string {
  let prompt = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return prompt;
}

// Función helper para formatear transcripciones
export function formatTranscriptionsForPrompt(transcriptions: any[]): string {
  return transcriptions
    .map((t, index) => `
### Transcripción ${index + 1}: ${t.title}
${t.content}
---
`).join('\n');
}

// Función helper para formatear notas por área
export function formatNotesByAreaForPrompt(notesByArea: Record<string, any[]>): string {
  return Object.entries(notesByArea)
    .map(([areaName, notes]) => `
## Área: ${areaName}

${notes.map((note, index) => `
### Nota ${index + 1}: ${note.title}
${note.content}
`).join('\n')}
---
`).join('\n');
} 
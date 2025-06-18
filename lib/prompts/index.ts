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
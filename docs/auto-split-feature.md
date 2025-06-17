# Funcionalidad de División Automática de Audio

## 🚀 Nueva Funcionalidad Implementada

La aplicación ahora puede **dividir automáticamente** videos largos que excedan los límites de Groq API (25MB tier gratuito / 100MB tier dev) y transcribirlos segmento por segmento.

## ✨ Características

### División Inteligente
- **Cálculo automático** del número de segmentos necesarios
- **División por tiempo** (no por tamaño de archivo) para mayor precisión
- **Estimación de duración** por segmento para máxima eficiencia
- **90% del límite** como margen de seguridad

### Transcripción Secuencial
- Procesamiento **segmento por segmento** para evitar límites de API
- **Reintentos automáticos** por segmento en caso de fallas
- **Combinación automática** de todas las transcripciones
- **Marcadores de tiempo** [MM:SS] para videos largos (>3 segmentos)

### Experiencia de Usuario
- **Feedback visual** del número de segmentos y duración estimada
- **Progreso transparente** durante el procesamiento
- **Información detallada** de los segmentos procesados
- **Tiempo estimado** de procesamiento

## 🔧 Flujo de Trabajo

### Paso 1: Análisis del Video
```
Usuario sube video → Extracción de audio → Análisis de tamaño
```

### Paso 2: Decisión Automática
- **Si audio ≤ límite**: Transcripción directa normal
- **Si audio > límite**: Oferta de división automática

### Paso 3: División (cuando es necesaria)
```
Audio grande → División en segmentos temporales → Verificación de tamaños
```

### Paso 4: Transcripción Múltiple
```
Segmento 1 → Groq API → Resultado 1
Segmento 2 → Groq API → Resultado 2
...
Segmento N → Groq API → Resultado N
```

### Paso 5: Combinación Final
```
Todos los resultados → Combinación con timestamps → Transcripción final
```

## 📊 Ejemplo de Cálculos

### Video de 45 minutos (estimado 60MB de audio):
- **Límite**: 25MB (tier gratuito)
- **Segmentos necesarios**: 3 (60MB ÷ 22.5MB)
- **Duración por segmento**: ~15 minutos
- **Tiempo estimado**: 4-9 minutos

### Resultado con Timestamps:
```
[00:00] Transcripción del primer segmento...

[15:00] Transcripción del segundo segmento...

[30:00] Transcripción del tercer segmento...
```

## 🎯 Ventajas

### Para el Usuario
- ✅ **Sin límites** de duración de video (dentro de lo razonable)
- ✅ **Proceso automático** - no requiere intervención manual
- ✅ **Retroalimentación clara** sobre el progreso
- ✅ **Calidad consistente** - mismo modelo de IA para todos los segmentos

### Para el Sistema
- ✅ **Gestión eficiente** de recursos de API
- ✅ **Manejo de errores** por segmento individual
- ✅ **Limpieza automática** de archivos temporales
- ✅ **Escalabilidad** para videos muy largos

## 🔧 Configuración Técnica

### Estimaciones de Audio
```javascript
// Estimación: 1 minuto de audio mono 16kHz 64kbps ≈ 0.5MB
const estimatedMBPerMinute = 0.5;
const maxMinutesPerSegment = (maxSizeMB * 0.9) / estimatedMBPerMinute;
```

### División por FFmpeg
```bash
ffmpeg -i audio.mp3 -ss 00:00:00 -t 900 -c copy segment_1.mp3
ffmpeg -i audio.mp3 -ss 00:15:00 -t 900 -c copy segment_2.mp3
```

### APIs Involucradas
- **`/api/convert-audio`**: Conversión inicial y análisis
- **`/api/split-transcribe`**: División y transcripción múltiple
- **`/api/transcribe`**: Transcripción simple (archivos pequeños)

## ⚠️ Consideraciones

### Limitaciones
- **Tiempo de procesamiento**: Videos largos toman considerablemente más tiempo
- **Uso de API**: Múltiples llamadas a Groq (costo proporcional)
- **Almacenamiento temporal**: Requiere espacio para segmentos

### Recomendaciones
- **Videos óptimos**: 5-30 minutos para mejor balance tiempo/calidad
- **Conexión estable**: Proceso largo requiere conexión confiable
- **Paciencia**: Videos de 1+ hora pueden tomar 20-40 minutos

## 🚀 Casos de Uso Ideales

### ✅ Perfectos para División Automática
- Conferencias largas (30-120 minutos)
- Entrevistas extensas (45-90 minutos)
- Seminarios web completos
- Presentaciones corporativas largas

### ⚠️ Considerar Compresión Manual
- Videos con mucho ruido de fondo
- Grabaciones de muy baja calidad
- Videos con múltiples idiomas
- Contenido con música de fondo alta

## 📈 Métricas de Rendimiento

### Tiempo Promedio por Segmento
- **Conversión**: 30-60 segundos
- **Transcripción**: 15-45 segundos (depende de Groq API)
- **Total por segmento**: ~1-2 minutos

### Precisión
- **Misma calidad** que transcripción simple
- **Timestamps aproximados** (±10-15 segundos)
- **Continuidad preservada** entre segmentos

¡Esta funcionalidad hace que la aplicación pueda manejar prácticamente cualquier duración de video de manera inteligente y automática! 🎉 
# Guía para Comprimir Videos

## Métodos Rápidos para Reducir el Tamaño de Videos

### Opción 1: Comprimir con FFmpeg (Línea de Comandos)

#### Compresión Básica
```bash
ffmpeg -i "archivo-original.mp4" -crf 28 -preset medium "archivo-comprimido.mp4"
```

#### Compresión Manteniendo Audio Original
```bash
ffmpeg -i "archivo-original.mp4" -c:a copy -crf 30 "archivo-comprimido.mp4"
```

#### Compresión Agresiva (Reduce significativamente el tamaño)
```bash
ffmpeg -i "archivo-original.mp4" -vf "scale=1280:720" -crf 32 -preset fast "archivo-comprimido.mp4"
```

### Opción 2: Herramientas Online (Sin Instalaciones)

1. **CloudConvert** - https://cloudconvert.com/mp4-converter
2. **VideoSmaller** - https://www.videosmaller.com/
3. **Clideo** - https://clideo.com/compress-video

### Opción 3: Software Gratuito

#### HandBrake (Recomendado)
1. Descarga: https://handbrake.fr/
2. Abre el video
3. Preset: "Fast 1080p30" o "Fast 720p30"
4. Ajusta calidad: RF 20-25 (menor = mejor calidad, mayor tamaño)

#### VLC Media Player
1. Media → Convert/Save
2. Selecciona archivo
3. Profile: "Video - H.264 + MP3 (MP4)"
4. Ajusta bitrate de video a 1000-2000 kbps

### Opción 4: Dividir el Video

Si el video es muy largo, divídelo en partes:

```bash
# Dividir en segmentos de 10 minutos
ffmpeg -i "archivo-original.mp4" -c copy -segment_time 600 -f segment "parte_%03d.mp4"

# Dividir en partes específicas
ffmpeg -i "archivo-original.mp4" -ss 00:00:00 -t 00:10:00 -c copy "parte1.mp4"
ffmpeg -i "archivo-original.mp4" -ss 00:10:00 -t 00:10:00 -c copy "parte2.mp4"
```

## Recomendaciones de Tamaño

| Duración del Video | Tamaño Recomendado | Configuración |
|-------------------|-------------------|---------------|
| 0-5 minutos | < 50MB | CRF 25-28 |
| 5-15 minutos | < 150MB | CRF 28-30 |
| 15-30 minutos | < 300MB | CRF 30-32 |
| 30-60 minutos | < 500MB | CRF 32-35 |

## Comandos Específicos para Transcripción

### Optimizado para Audio (Mantiene Calidad de Voz)
```bash
ffmpeg -i "input.mp4" -c:a aac -b:a 128k -c:v libx264 -crf 35 -preset fast "output.mp4"
```

### Solo Audio (Si no necesitas el video)
```bash
ffmpeg -i "input.mp4" -vn -c:a mp3 -b:a 128k "output.mp3"
```

## Consejos Importantes

### ✅ **Para Transcripción de Audio:**
- Mantén la calidad de audio alta (`-b:a 128k` o superior)
- La calidad del video puede ser baja sin afectar la transcripción
- Usa formatos compatibles: MP4, WAV, MP3

### ⚠️ **Antes de Comprimir:**
- Haz una copia de seguridad del archivo original
- Prueba con un fragmento pequeño primero
- Verifica que el audio se escuche claramente

### 🎯 **Configuración Recomendada para Esta App:**
```bash
ffmpeg -i "original.mp4" -c:a aac -b:a 128k -c:v libx264 -crf 30 -preset fast -vf "scale=1280:-2" "compressed.mp4"
```

Esta configuración típicamente reduce el tamaño en 60-80% manteniendo la calidad de audio necesaria para una buena transcripción.

## Verificación del Resultado

Después de comprimir, verifica:
1. **Tamaño:** Debe ser < 500MB idealmente < 100MB
2. **Audio:** Se escucha claramente
3. **Duración:** Se mantiene igual que el original

## Solución de Problemas

### Error: "Video muy grande"
- Usa CRF más alto (35-40)
- Reduce resolución: `scale=854:480` (480p) o `scale=640:360` (360p)
- Reduce framerate: `-r 15` o `-r 10`

### Audio de Mala Calidad
- Aumenta bitrate de audio: `-b:a 192k`
- Usa codec mejor: `-c:a libmp3lame`
- Evita compresión de audio: `-c:a copy` 
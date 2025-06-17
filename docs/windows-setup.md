# Guía de Instalación para Windows

## Instalación de FFmpeg Completo en Windows

### Opción 1: Descarga Manual (Recomendada)

1. **Descarga FFmpeg completo:**
   - Ve a [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/)
   - Descarga "release builds" → "ffmpeg-release-essentials.zip"
   - O usa este enlace directo: [FFmpeg Release Essentials](https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip)

2. **Instalación:**
   ```cmd
   # Extrae el archivo ZIP a C:\ffmpeg
   # La estructura debería ser: C:\ffmpeg\bin\ffmpeg.exe
   ```

3. **Agregar al PATH:**
   - Presiona `Win + R`, escribe `sysdm.cpl` y presiona Enter
   - Ve a la pestaña "Avanzado" → "Variables de entorno"
   - En "Variables del sistema", busca "Path" y haz clic en "Editar"
   - Haz clic en "Nuevo" y agrega: `C:\ffmpeg\bin`
   - Haz clic en "Aceptar" en todas las ventanas

4. **Verificar instalación:**
   ```cmd
   # Abre una nueva terminal PowerShell/CMD
   ffmpeg -version
   ffmpeg -codecs | findstr mp3
   ```

### Opción 2: Chocolatey

```powershell
# Instalar Chocolatey si no lo tienes
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar FFmpeg
choco install ffmpeg
```

### Opción 3: Winget

```powershell
winget install FFmpeg
```

## Verificación de Codecs

Después de instalar FFmpeg, verifica que tienes los codecs necesarios:

```cmd
# Verificar codecs de audio
ffmpeg -codecs | findstr "mp3\|aac\|wav"

# Debería mostrar algo como:
# DEA.L. mp3              MP3 (MPEG audio layer 3)
# DEA.L. aac              AAC (Advanced Audio Coding)
# DEA.L. pcm_s16le        PCM signed 16-bit little-endian
```

## Solución de Problemas Comunes

### Error: "Audio codec mp3 is not available"

**Causa:** FFmpeg básico sin codecs adicionales.

**Solución:**
1. Desinstala la versión actual de FFmpeg
2. Descarga la versión "full" o "essentials" desde [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)
3. Asegúrate de que sea la versión completa con libmp3lame

### Error: "ffmpeg command not found"

**Causa:** FFmpeg no está en el PATH del sistema.

**Solución:**
1. Abre una nueva terminal después de modificar el PATH
2. Verifica la ruta: `where ffmpeg`
3. Si no aparece, revisa que el PATH esté configurado correctamente

### Error: "Cannot find module fluent-ffmpeg"

**Causa:** Dependencias de Node.js no instaladas.

**Solución:**
```cmd
npm install
```

## Configuración Adicional

### Variables de Entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```env
GROQ_API_KEY=tu_clave_api_de_groq_aqui
```

### Ejecutar la Aplicación

```cmd
# Instalar dependencias
npm install

# Ejecutar script de verificación
npm run setup

# Iniciar la aplicación
npm run dev
```

## Verificación Final

1. **FFmpeg:** `ffmpeg -version`
2. **Codecs MP3:** `ffmpeg -codecs | findstr mp3`
3. **Node.js:** `node --version` (debe ser >= 18)
4. **Dependencias:** `npm list --depth=0`

La aplicación debería funcionar correctamente en [http://localhost:3000](http://localhost:3000) después de seguir estos pasos. 
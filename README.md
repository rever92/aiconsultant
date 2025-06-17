# AI Consultant - Herramienta de Consultoría

Una aplicación NextJS moderna para soporte de proyectos de consultoría con transcripción automática de videos usando la API de Groq.

## 🚀 Funcionalidades

- ✅ Subida de videos MP4
- ✅ Extracción automática de audio
- ✅ Transcripción con **múltiples proveedores de IA**:
  - **Groq** (whisper-large-v3-turbo) - Rápido y gratuito
  - **AssemblyAI** (modelo universal) - Preciso y archivos grandes
- ✅ **Sistema de recuperación parcial** - Los segmentos exitosos se guardan aunque otros fallen
- ✅ **Reintento selectivo** - Solo se reprocesas los segmentos fallidos
- ✅ Interfaz moderna y responsive
- ✅ Manejo de errores robusto
- ✅ Procesamiento en tiempo real

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [FFmpeg](https://ffmpeg.org/) para procesamiento de audio/video
- Una clave API de [Groq](https://console.groq.com/) (gratuita)
- Una clave API de [AssemblyAI](https://www.assemblyai.com/app/api-keys) (incluye créditos gratuitos)

### Instalación de FFmpeg

#### Windows:
1. Descarga FFmpeg desde [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Extrae el archivo y agrega la carpeta `bin` al PATH del sistema
3. O usa chocolatey: `choco install ffmpeg`

#### macOS:
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg
```

## 🛠️ Instalación

1. **Clona el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd ai-consultant
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   GROQ_API_KEY=tu_clave_api_de_groq_aqui
   ASSEMBLYAI_API_KEY=tu_clave_api_de_assemblyai_aqui
   ```

4. **Ejecuta la aplicación:**
   ```bash
   npm run dev
   ```

5. **Abre tu navegador:**
   Ve a [http://localhost:3000](http://localhost:3000)

## 🎯 Uso

1. **Subir Video:** Haz clic en "Seleccionar Video MP4" y elige tu archivo
2. **Elegir Proveedor:** Selecciona entre Groq (rápido) o AssemblyAI (preciso)
3. **Transcribir:** Presiona el botón de transcripción para iniciar el proceso
4. **Ver Resultado:** La transcripción aparecerá automáticamente una vez completada
5. **Reintentar:** Si algunos segmentos fallan, puedes reintentarlos sin perder el trabajo ya hecho

## 🔧 Configuración Avanzada

### Modelos de IA Disponibles

#### Groq (whisper-large-v3-turbo)
- **Ventajas:** Muy rápido (segundos), gratuito, multilingüe
- **Limitaciones:** 25MB máximo por archivo, problemas ocasionales de conexión
- **Ideal para:** Videos cortos (< 15 min), pruebas rápidas

#### AssemblyAI (modelo universal)
- **Ventajas:** Muy preciso, archivos grandes (200MB+), conexiones estables
- **Limitaciones:** Más lento (1-2 minutos), servicio de pago
- **Ideal para:** Videos largos, transcripciones profesionales

### ¿Qué Proveedor Elegir?
- **Para videos cortos (< 15 min):** Usa Groq
- **Para videos largos (> 15 min):** Usa AssemblyAI  
- **Para máxima precisión:** Usa AssemblyAI
- **Para pruebas rápidas:** Usa Groq

### Límites de Archivo

#### Groq
- **Tamaño máximo:** 25MB (tier gratuito), 100MB (tier desarrollador)
- **Duración mínima:** 0.01 segundos
- **Facturación mínima:** 10 segundos

#### AssemblyAI
- **Tamaño máximo:** 200MB+ (muy generoso)
- **Duración mínima:** Sin límite práctico
- **Facturación:** Por minuto de audio procesado

#### Ambos Proveedores
- **Formatos soportados:** MP4 (conversión automática a audio optimizado)
- **Idioma principal:** Español (configurado por defecto)

## 📁 Estructura del Proyecto

```
ai-consultant/
├── app/
│   ├── api/
│   │   ├── convert-audio/
│   │   │   └── route.ts         # Conversión video → audio
│   │   ├── transcribe/
│   │   │   └── route.ts         # Transcripción con Groq
│   │   ├── transcribe-assemblyai/
│   │   │   └── route.ts         # Transcripción con AssemblyAI
│   │   ├── split-transcribe/
│   │   │   └── route.ts         # Transcripción dividida (Groq)
│   │   ├── split-transcribe-assemblyai/
│   │   │   └── route.ts         # Transcripción dividida (AssemblyAI)
│   │   ├── retry-segments/
│   │   │   └── route.ts         # Reintento segmentos (Groq)
│   │   └── retry-segments-assemblyai/
│   │       └── route.ts         # Reintento segmentos (AssemblyAI)
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx              # Layout principal
│   └── page.tsx                # Página principal con selector IA
├── lib/
│   └── ffmpeg-config.ts        # Configuración FFmpeg
├── types/
│   └── global.d.ts             # Tipos TypeScript
├── docs/                       # Documentación
├── public/                     # Archivos estáticos
├── .env.local                  # Variables de entorno (no incluir en git)
├── supabase.md                 # Documentación base de datos
├── next.config.js             # Configuración NextJS
├── package.json               # Dependencias
├── tailwind.config.js         # Configuración Tailwind
└── tsconfig.json             # Configuración TypeScript
```

## 🔍 Solución de Problemas

### Error: "Cannot find ffmpeg"
- Asegúrate de que FFmpeg esté instalado y en el PATH del sistema
- En Windows, reinicia la terminal después de instalar FFmpeg

### Error: "GROQ_API_KEY not found"
- Verifica que el archivo `.env.local` existe
- Confirma que la clave API es correcta
- Reinicia el servidor de desarrollo

### Error: "File too large"
- Los archivos MP4 no pueden exceder 25MB (tier gratuito)
- Comprime el video o usa un tier superior

### Problemas de Transcripción
- Verifica que el audio sea claro
- Asegúrate de que hay contenido de voz en el video
- Revisa los logs de la consola para errores específicos

## 🧪 Testing

Para probar la aplicación:

1. Prepara un video MP4 corto (menos de 25MB)
2. Sube el archivo a través de la interfaz
3. Verifica que la transcripción sea correcta
4. Prueba con diferentes idiomas si es necesario

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Soporte

Si encuentras algún problema o necesitas ayuda:

1. Revisa la sección de solución de problemas
2. Consulta los logs en la consola del navegador y del servidor
3. Abre un issue en el repositorio con detalles del error

## 🚀 Próximas Funcionalidades

- [x] **Múltiples proveedores de IA** (Groq + AssemblyAI) ✅
- [x] **Sistema de recuperación parcial** ✅
- [x] **Reintento selectivo de segmentos** ✅
- [ ] Soporte para múltiples formatos de video
- [ ] Transcripción en tiempo real
- [ ] Exportación de transcripciones (PDF, DOCX, SRT)
- [ ] Análisis de sentimientos con IA
- [ ] Resumen automático de contenido
- [ ] Integración con Supabase para historial
- [ ] Autenticación de usuarios
- [ ] API REST para integración externa 
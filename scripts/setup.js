#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando AI Consultant...\n');

// Verificar Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    console.error('❌ Node.js versión 18 o superior es requerida');
    console.error(`   Versión actual: ${nodeVersion}`);
    process.exit(1);
  }
  
  console.log(`✅ Node.js ${nodeVersion} detectado`);
}

// Verificar FFmpeg
function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    console.log('✅ FFmpeg está instalado');
    
    // Verificar codecs específicos
    try {
      const codecsOutput = execSync('ffmpeg -codecs', { encoding: 'utf8' });
      const hasMP3 = codecsOutput.includes('mp3') || codecsOutput.includes('libmp3lame');
      const hasAAC = codecsOutput.includes('aac');
      const hasWAV = codecsOutput.includes('pcm_s16le');
      
      if (hasMP3) {
        console.log('✅ Codec MP3 disponible');
      } else if (hasAAC) {
        console.log('⚠️  MP3 no disponible, pero AAC sí');
      } else if (hasWAV) {
        console.log('⚠️  Solo WAV disponible (funcional pero menos eficiente)');
      } else {
        console.log('❌ Codecs de audio limitados');
        console.log('   Considera instalar FFmpeg completo desde:');
        console.log('   https://www.gyan.dev/ffmpeg/builds/');
      }
    } catch (codecError) {
      console.log('⚠️  No se pudo verificar codecs (pero FFmpeg funciona)');
    }
    
    return true;
  } catch (error) {
    console.log('❌ FFmpeg no está instalado');
    console.log('   Para Windows, sigue la guía en: docs/windows-setup.md');
    console.log('   O instala con: choco install ffmpeg');
    console.log('   - macOS: brew install ffmpeg');
    console.log('   - Linux: sudo apt install ffmpeg');
    return false;
  }
}

// Verificar archivo .env.local
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  Archivo .env.local no encontrado');
    console.log('   Crea el archivo .env.local con:');
    console.log('   GROQ_API_KEY=tu_clave_api_aqui');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('GROQ_API_KEY')) {
    console.log('⚠️  GROQ_API_KEY no encontrada en .env.local');
    return false;
  }
  
  console.log('✅ Archivo .env.local configurado');
  return true;
}

// Instalar dependencias
function installDependencies() {
  console.log('📦 Instalando dependencias...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencias instaladas');
  } catch (error) {
    console.error('❌ Error instalando dependencias');
    process.exit(1);
  }
}

// Ejecutar verificaciones
function main() {
  checkNodeVersion();
  
  const ffmpegOk = checkFFmpeg();
  const envOk = checkEnvFile();
  
  if (!ffmpegOk || !envOk) {
    console.log('\n❌ Configuración incompleta. Revisa los requisitos arriba.');
    process.exit(1);
  }
  
  installDependencies();
  
  console.log('\n🎉 ¡Configuración completada!');
  console.log('   Ejecuta: npm run dev');
  console.log('   Abre: http://localhost:3000');
}

main(); 
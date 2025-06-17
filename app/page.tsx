'use client';

import { useState } from 'react';

interface AudioInfo {
  audioId: string;
  fileName: string;
  audioSize: number;
  maxSize: number;
  duration: number;
  codec: string;
  format: string;
  canTranscribe: boolean;
  canSplit?: boolean;
  estimatedSegments?: number;
  segmentDuration?: number;
  audioPath: string;
  originalVideoSize: number;
  message: string;
  suggestions?: string[];
}

interface FailedSegment {
  index: number;
  segmentNumber: number;
  path: string;
  duration: number;
  error?: string;
}

interface TranscriptionResult {
  text: string;
  status: 'processing' | 'completed' | 'error' | 'retrying' | 'partial';
  error?: string;
  retryCount?: number;
  segments?: number;
  successfulSegments?: number;
  failedSegments?: FailedSegment[];
  isPartialSuccess?: boolean;
  totalDuration?: number;
  segmentDurations?: number[];
  provider?: 'groq' | 'assemblyai';
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'groq' | 'assemblyai'>('groq');
  const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'video/mp4') {
      const fileSizeMB = file.size / (1024 * 1024);
      
      if (fileSizeMB > 1000) {
        alert(`El video es muy grande (${fileSizeMB.toFixed(1)}MB). Por favor selecciona un archivo menor a 1GB.`);
        event.target.value = '';
        return;
      }
      
      // Estimación aproximada del tamaño de audio (muy conservadora)
      const estimatedAudioMB = fileSizeMB * 0.1; // Estimación: audio ~10% del video
      
      if (estimatedAudioMB > 20) {
        const proceed = confirm(
          `ADVERTENCIA: El video es grande (${fileSizeMB.toFixed(1)}MB).\n` +
          `El audio extraído podría exceder los límites de Groq API (25MB).\n` +
          `Esto podría causar errores. ¿Deseas continuar de todos modos?\n\n` +
          `Recomendación: Usa videos de máximo 10-15 minutos.`
        );
        if (!proceed) {
          event.target.value = '';
          return;
        }
      }
      
      setSelectedFile(file);
      setAudioInfo(null);
      setTranscription(null);
    } else {
      alert('Por favor selecciona un archivo MP4 válido');
    }
  };

  const handleConvertToAudio = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setAudioInfo(null);
    setTranscription(null);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      const response = await fetch('/api/convert-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.audioId) {
        setAudioInfo(result);
      } else if (result.error) {
        setAudioInfo({
          ...result,
          audioId: '',
          fileName: '',
          audioSize: 0,
          maxSize: 0,
          duration: 0,
          codec: '',
          format: '',
          canTranscribe: false,
          audioPath: '',
          originalVideoSize: 0,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error en la conversión:', error);
      setAudioInfo({
        audioId: '',
        fileName: '',
        audioSize: 0,
        maxSize: 0,
        duration: 0,
        codec: '',
        format: '',
        canTranscribe: false,
        audioPath: '',
        originalVideoSize: 0,
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleTranscription = async () => {
    if (!audioInfo || !audioInfo.canTranscribe) return;

    setIsTranscribing(true);
    setTranscription({ text: '', status: 'processing', provider: selectedProvider });

    try {
      const formData = new FormData();
      formData.append('audioId', audioInfo.audioId);
      formData.append('audioPath', audioInfo.audioPath);
      formData.append('fileName', audioInfo.fileName);

      // Elegir endpoint según el proveedor seleccionado
      const endpoint = selectedProvider === 'assemblyai' ? '/api/transcribe-assemblyai' : '/api/transcribe';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.transcription) {
        setTranscription({
          text: result.transcription,
          status: 'completed',
          segments: result.segments || 1,
          totalDuration: result.totalDuration || audioInfo.duration,
          provider: result.provider || selectedProvider
        });
      } else if (result.error) {
        setTranscription({
          text: '',
          status: 'error',
          error: result.error,
          provider: selectedProvider
        });
      }
    } catch (error) {
      console.error('Error en la transcripción:', error);
      setTranscription({
        text: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
        provider: selectedProvider
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSplitTranscription = async () => {
    if (!audioInfo || !audioInfo.canSplit) return;

    setIsTranscribing(true);
    setTranscription({ text: '', status: 'processing', provider: selectedProvider });

    try {
      const formData = new FormData();
      formData.append('audioPath', audioInfo.audioPath);
      formData.append('audioSize', audioInfo.audioSize.toString());
      formData.append('duration', audioInfo.duration.toString());
      formData.append('fileName', audioInfo.fileName);
      formData.append('maxSize', audioInfo.maxSize.toString());

      // Elegir endpoint según el proveedor seleccionado
      const endpoint = selectedProvider === 'assemblyai' ? '/api/split-transcribe-assemblyai' : '/api/split-transcribe';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      
      console.log(`Respuesta de split-transcribe (${selectedProvider}):`, result);
      console.log('¿Tiene transcription?', !!result.transcription);
      console.log('Transcription length:', result.transcription?.length || 0);
      
      if (result.transcription) {
        const status = result.isPartialSuccess ? 'partial' : 'completed';
        console.log(`✅ Configurando transcripción ${status} con`, result.segments, 'segmentos');
        setTranscription({
          text: result.transcription,
          status,
          segments: result.segments,
          successfulSegments: result.successfulSegments,
          failedSegments: result.failedSegments,
          isPartialSuccess: result.isPartialSuccess,
          totalDuration: result.totalDuration,
          segmentDurations: result.segmentDurations,
          provider: result.provider || selectedProvider
        });
      } else if (result.error) {
        console.log('❌ Error en resultado:', result.error);
        setTranscription({
          text: '',
          status: 'error',
          error: result.error,
          provider: selectedProvider
        });
      } else {
        console.log('⚠️ Resultado inesperado:', result);
        setTranscription({
          text: '',
          status: 'error',
          error: 'Respuesta inesperada del servidor',
          provider: selectedProvider
        });
      }
    } catch (error) {
      console.error('Error en la transcripción dividida:', error);
      setTranscription({
        text: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
        provider: selectedProvider
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRetryFailedSegments = async () => {
    if (!transcription || !transcription.failedSegments || !audioInfo) return;

    setIsRetrying(true);

    try {
      const formData = new FormData();
      formData.append('failedSegments', JSON.stringify(transcription.failedSegments));
      formData.append('originalTranscription', transcription.text);
      formData.append('maxSize', audioInfo.maxSize.toString());

      // Usar el endpoint de reintento según el proveedor de la transcripción original
      const currentProvider = transcription.provider || selectedProvider;
      const endpoint = currentProvider === 'assemblyai' ? '/api/retry-segments-assemblyai' : '/api/retry-segments';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      
      console.log(`Resultado del reintento (${currentProvider}):`, result);
      
      if (result.transcription) {
        const newStatus = result.allFixed ? 'completed' : 'partial';
        setTranscription({
          text: result.transcription,
          status: newStatus,
          segments: transcription.segments,
          successfulSegments: (transcription.successfulSegments || 0) + result.retriedSegments,
          failedSegments: result.stillFailedSegments,
          isPartialSuccess: !result.allFixed,
          totalDuration: transcription.totalDuration,
          segmentDurations: transcription.segmentDurations,
          provider: result.provider || currentProvider
        });
      } else if (result.error) {
        setTranscription({
          ...transcription,
          status: 'error',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error en el reintento:', error);
      setTranscription({
        ...transcription,
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            AI Consultant
          </h1>
          <p className="text-xl text-gray-600">
            Herramienta de Consultoría - Transcripción de Videos
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Subir Video para Transcripción
          </h2>
          
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <input
              type="file"
              accept=".mp4"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />
            
            <label
              htmlFor="video-upload"
              className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Seleccionar Video MP4
            </label>
            
            {selectedFile && (
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-700 font-medium">
                    Archivo seleccionado: {selectedFile.name}
                  </p>
                  <p className="text-green-600 text-sm">
                    Tamaño: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                
                {(selectedFile.size / (1024 * 1024)) > 50 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Limitaciones de Groq API</h4>
                    <p className="text-yellow-700 text-sm mb-2">
                      <strong>Importante:</strong> El audio extraído no puede exceder 25MB (tier gratuito) o 100MB (tier dev).
                    </p>
                    <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                      <li><strong>Videos recomendados:</strong> 5-15 minutos máximo</li>
                      <li><strong>Si falla:</strong> Divide el video en partes más pequeñas</li>
                      <li><strong>Alternativa:</strong> Comprime el video reduciendo calidad de audio</li>
                    </ul>
                    <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                      💡 <strong>Tip:</strong> Videos de 10 minutos = ~3-8MB de audio (usualmente OK)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedFile && !audioInfo && (
            <div className="mt-6 text-center">
              <button
                onClick={handleConvertToAudio}
                disabled={isConverting}
                className={`${
                  isConverting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white font-semibold py-3 px-8 rounded-lg transition-colors`}
              >
                {isConverting ? 'Convirtiendo a Audio...' : 'Paso 1: Convertir a Audio'}
              </button>
            </div>
          )}

          {audioInfo && (
            <div className="mt-6 space-y-4">
              {/* Información del Audio */}
              <div className={`p-4 rounded-lg border ${
                audioInfo.canTranscribe 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  audioInfo.canTranscribe ? 'text-green-800' : 'text-red-800'
                }`}>
                  {audioInfo.canTranscribe ? '✅ Audio Listo para Transcripción' : '❌ Audio No Compatible'}
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Archivo:</span> {audioInfo.fileName}
                  </div>
                  <div>
                    <span className="font-medium">Duración:</span> {audioInfo.duration} min
                  </div>
                  <div>
                    <span className="font-medium">Tamaño Audio:</span> 
                    <span className={audioInfo.audioSize > audioInfo.maxSize ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {audioInfo.audioSize} MB
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Límite Groq:</span> {audioInfo.maxSize} MB
                  </div>
                  <div>
                    <span className="font-medium">Codec:</span> {audioInfo.codec}
                  </div>
                  <div>
                    <span className="font-medium">Video Original:</span> {audioInfo.originalVideoSize} MB
                  </div>
                </div>

                {audioInfo.suggestions && audioInfo.suggestions.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium text-yellow-800 mb-2">💡 Sugerencias:</h5>
                    <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                      {audioInfo.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Selector de Proveedor de IA */}
              {(audioInfo.canTranscribe || audioInfo.canSplit) && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-medium text-purple-800 mb-3">🤖 Seleccionar Proveedor de IA</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`cursor-pointer p-4 rounded-lg border-2 transition-colors ${
                      selectedProvider === 'groq' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}>
                      <input
                        type="radio"
                        name="provider"
                        value="groq"
                        checked={selectedProvider === 'groq'}
                        onChange={(e) => setSelectedProvider(e.target.value as 'groq' | 'assemblyai')}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="text-2xl mb-2">⚡</div>
                        <h6 className="font-medium text-gray-800 mb-1">Groq</h6>
                        <p className="text-xs text-gray-600 mb-2">Muy rápido, whisper-large-v3-turbo</p>
                        <div className="text-xs space-y-1">
                          <div className="text-green-600">✅ Muy rápido (segundos)</div>
                          <div className="text-yellow-600">⚠️ Límite: 25MB por archivo</div>
                          <div className="text-red-600">❌ A veces problemas de conexión</div>
                        </div>
                      </div>
                    </label>
                    
                    <label className={`cursor-pointer p-4 rounded-lg border-2 transition-colors ${
                      selectedProvider === 'assemblyai' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}>
                      <input
                        type="radio"
                        name="provider"
                        value="assemblyai"
                        checked={selectedProvider === 'assemblyai'}
                        onChange={(e) => setSelectedProvider(e.target.value as 'groq' | 'assemblyai')}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="text-2xl mb-2">🎯</div>
                        <h6 className="font-medium text-gray-800 mb-1">AssemblyAI</h6>
                        <p className="text-xs text-gray-600 mb-2">Muy preciso, modelo universal</p>
                        <div className="text-xs space-y-1">
                          <div className="text-green-600">✅ Muy preciso</div>
                          <div className="text-green-600">✅ Archivos grandes (200MB+)</div>
                          <div className="text-yellow-600">⚠️ Más lento (1-2 min)</div>
                        </div>
                      </div>
                    </label>
                  </div>
                  <p className="text-purple-600 text-xs mt-3 text-center">
                    💡 Puedes cambiar el proveedor antes de cada transcripción
                  </p>
                </div>
              )}

              {/* Botones de Transcripción */}
              {audioInfo.canTranscribe && (
                <div className="text-center">
                  <button
                    onClick={handleTranscription}
                    disabled={isTranscribing}
                    className={`${
                      isTranscribing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : selectedProvider === 'groq' 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                    } text-white font-semibold py-3 px-8 rounded-lg transition-colors`}
                  >
                    {isTranscribing ? 
                      `Transcribiendo con ${selectedProvider === 'groq' ? 'Groq' : 'AssemblyAI'}...` : 
                      `Paso 2: Transcribir con ${selectedProvider === 'groq' ? 'Groq' : 'AssemblyAI'}`
                    }
                  </button>
                </div>
              )}

              {audioInfo.canSplit && (
                <div className="text-center space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-800 mb-2">🔄 Transcripción Automática con División</h5>
                    <div className="text-blue-700 text-sm space-y-1">
                      <p><strong>Segmentos estimados:</strong> {audioInfo.estimatedSegments}</p>
                      <p><strong>Duración por segmento:</strong> ~{audioInfo.segmentDuration} minutos</p>
                      <p><strong>Tiempo estimado:</strong> {audioInfo.estimatedSegments && audioInfo.estimatedSegments > 1 ? 
                        `${Math.round(audioInfo.estimatedSegments * 1.5)} - ${Math.round(audioInfo.estimatedSegments * 3)} minutos` : 
                        '1-2 minutos'}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSplitTranscription}
                    disabled={isTranscribing}
                    className={`${
                      isTranscribing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : selectedProvider === 'groq' 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : 'bg-blue-600 hover:bg-blue-700'
                    } text-white font-semibold py-3 px-8 rounded-lg transition-colors`}
                  >
                    {isTranscribing ? 
                      `Transcribiendo con ${selectedProvider === 'groq' ? 'Groq' : 'AssemblyAI'}... (puede tomar varios minutos)` : 
                      `Paso 2: Transcribir con ${selectedProvider === 'groq' ? 'Groq' : 'AssemblyAI'} (División Automática)`
                    }
                  </button>
                </div>
              )}

              {/* Botón para volver a convertir */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setAudioInfo(null);
                    setTranscription(null);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Seleccionar otro video
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Convert Audio Status */}
        {isConverting && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Convirtiendo Video a Audio
            </h2>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-4 text-gray-600">
                Extrayendo y optimizando audio del video...
              </span>
            </div>
          </div>
        )}

        {/* Retry Status */}
        {isRetrying && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Reintentando Segmentos Fallidos
            </h2>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <span className="ml-4 text-gray-600">
                Reintentando transcripción de segmentos que fallaron...
              </span>
            </div>
          </div>
        )}

        {/* Transcription Results */}
        {transcription && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Resultado de la Transcripción
            </h2>
            
            {/* Debug info - remover en producción */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <strong>Debug:</strong> Status: {transcription.status}, 
                Text length: {transcription.text?.length || 0}, 
                Segments: {transcription.segments || 'N/A'}
              </div>
            )}
            
            {(transcription.status === 'processing' || transcription.status === 'retrying') && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <div className="ml-4 text-gray-600">
                  {transcription.status === 'processing' ? (
                    <div className="space-y-1">
                      <p className="font-medium">
                        {audioInfo?.canSplit ? 
                          `Procesando transcripción con división automática usando ${transcription.provider === 'assemblyai' ? 'AssemblyAI' : 'Groq'}...` : 
                          `Enviando audio a ${transcription.provider === 'assemblyai' ? 'AssemblyAI' : 'Groq'} para transcripción...`
                        }
                      </p>
                      {audioInfo?.canSplit && audioInfo.estimatedSegments && (
                        <p className="text-sm text-gray-500">
                          Dividiendo en {audioInfo.estimatedSegments} segmentos y transcribiendo cada uno
                        </p>
                      )}
                    </div>
                  ) : (
                    <span>Reintentando conexión... ({transcription.retryCount || 1}/3)</span>
                  )}
                </div>
              </div>
            )}

            {transcription.status === 'completed' && (
              <div className="space-y-4">
                {transcription.segments && transcription.segments > 1 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">ℹ️ Información de Procesamiento</h4>
                    <div className="text-blue-700 text-sm grid grid-cols-2 gap-2">
                      <div><strong>Proveedor:</strong> {transcription.provider === 'assemblyai' ? 'AssemblyAI' : 'Groq'}</div>
                      <div><strong>Segmentos procesados:</strong> {transcription.segments}</div>
                      <div><strong>Duración total:</strong> {transcription.totalDuration} min</div>
                      {transcription.segmentDurations && (
                        <div className="col-span-2">
                          <strong>Duración por segmento:</strong> {transcription.segmentDurations.map(dur => `${dur}min`).join(', ')}
                        </div>
                      )}
                    </div>
                    <p className="text-blue-600 text-xs mt-2">
                      💡 Los timestamps [MM:SS] indican el tiempo aproximado de inicio de cada segmento
                    </p>
                  </div>
                )}
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Transcripción:</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {transcription.text}
                  </p>
                </div>
              </div>
            )}

            {transcription.status === 'partial' && (
              <div className="space-y-4">
                {/* Información de transcripción parcial */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">⚠️ Transcripción Parcialmente Completada</h4>
                  <div className="text-orange-700 text-sm grid grid-cols-2 gap-2">
                    <div><strong>Proveedor:</strong> {transcription.provider === 'assemblyai' ? 'AssemblyAI' : 'Groq'}</div>
                    <div><strong>Segmentos exitosos:</strong> {transcription.successfulSegments}/{transcription.segments}</div>
                    <div><strong>Duración total:</strong> {transcription.totalDuration} min</div>
                    <div><strong>Segmentos fallidos:</strong> {transcription.failedSegments?.length || 0}</div>
                    <div className="col-span-2"><strong>Causa:</strong> Problemas de conexión/API</div>
                  </div>
                  <p className="text-orange-600 text-xs mt-2">
                    💡 Los segmentos exitosos se muestran abajo. Los fallidos aparecen marcados con "❌ ERROR"
                  </p>
                </div>

                {/* Botón de reintento */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-800 mb-2">🔄 Reintentar Segmentos Fallidos</h5>
                  <p className="text-blue-700 text-sm mb-3">
                    Puedes reintentar solo los segmentos que fallaron. Los segmentos exitosos se mantendrán intactos.
                  </p>
                  <div className="space-y-2">
                    {transcription.failedSegments?.map((segment, index) => (
                      <div key={index} className="text-xs bg-white p-2 rounded border">
                        <strong>Segmento {segment.segmentNumber}:</strong> {segment.duration} min
                        {segment.error && <span className="text-red-600 ml-2">({segment.error})</span>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleRetryFailedSegments}
                      disabled={isRetrying}
                      className={`${
                        isRetrying
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 hover:bg-orange-600'
                      } text-white font-semibold py-2 px-6 rounded-lg transition-colors`}
                    >
                      {isRetrying ? 
                        `Reintentando ${transcription.failedSegments?.length || 0} segmentos...` : 
                        `Reintentar ${transcription.failedSegments?.length || 0} Segmentos Fallidos`
                      }
                    </button>
                  </div>
                </div>

                {/* Transcripción con marcadores de error */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Transcripción Parcial:</h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {transcription.text.split('\n\n').map((paragraph, index) => (
                      <div key={index} className={`mb-2 ${paragraph.includes('❌ ERROR') ? 'bg-red-100 p-2 rounded border-l-4 border-red-400' : ''}`}>
                        {paragraph}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {transcription.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-800 mb-3">Error en la transcripción:</h3>
                <p className="text-red-700 mb-4">
                  {transcription.error || 'Ocurrió un error durante el procesamiento'}
                </p>
                
                {(transcription.error?.includes('Connection error') || 
                  transcription.error?.includes('audio extraído es muy grande')) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-yellow-800 mb-2">
                      💡 {transcription.error?.includes('audio extraído') ? 
                        'El audio extraído excede los límites de Groq:' : 
                        'Consejos para resolver problemas de conexión:'}
                    </h4>
                    <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                      {transcription.error?.includes('audio extraído') ? (
                        <>
                          <li><strong>Divide el video:</strong> Máximo 10-15 minutos por segmento</li>
                          <li><strong>Comprime el audio:</strong> Reduce la calidad de audio del video</li>
                          <li><strong>Usa formato óptimo:</strong> MP3 64kbps es suficiente para transcripción</li>
                          <li><strong>Comando FFmpeg:</strong> <code className="bg-gray-200 px-1 rounded">ffmpeg -i video.mp4 -b:a 32k audio.mp3</code></li>
                        </>
                      ) : (
                        <>
                          <li>Verifica tu conexión a internet</li>
                          <li>Revisa que tu clave API de Groq sea válida</li>
                          <li>Espera unos minutos y vuelve a intentar</li>
                          <li>Intenta con un video más pequeño</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
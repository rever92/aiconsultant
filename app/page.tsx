'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                AI Consultant
              </h1>
            </div>
            <div className="flex items-center space-x-8">
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/transcription" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Transcripción
              </Link>
              <Link 
                href="/projects" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Proyectos
              </Link>
              <Link 
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Herramienta de Consultoría con IA
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Automatiza el análisis de transcripciones de reuniones para generar diagnósticos, 
            mapas de aplicaciones y propuestas de proyectos utilizando inteligencia artificial.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {/* Feature 1: Transcripción */}
          <Link href="/transcription" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group-hover:scale-105 transform duration-200">
              <div className="text-center">
                <div className="text-4xl mb-4">🎤</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Transcripción de Videos
                </h3>
                <p className="text-gray-600 mb-4">
                  Convierte videos MP4 a texto usando Groq o AssemblyAI con sistema de recuperación parcial.
                </p>
                <div className="flex justify-center space-x-4 text-sm text-gray-500">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Groq</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">AssemblyAI</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Feature 2: Gestión de Proyectos */}
          <Link href="/dashboard" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group-hover:scale-105 transform duration-200">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Gestión de Proyectos
                </h3>
                <p className="text-gray-600 mb-4">
                  Crea y gestiona proyectos de consultoría con análisis automatizado usando Gemini AI.
                </p>
                <div className="flex justify-center space-x-4 text-sm text-gray-500">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Gemini</span>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Supabase</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Feature 3: Análisis con IA */}
          <Link href="/projects" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group-hover:scale-105 transform duration-200">
              <div className="text-center">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Análisis con IA
                </h3>
                <p className="text-gray-600 mb-4">
                  Genera diagnósticos, mapas de aplicaciones y propuestas de proyectos automáticamente.
                </p>
                <div className="flex justify-center space-x-4 text-sm text-gray-500">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Diagnóstico</span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Proyectos</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Workflow Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Flujo de Trabajo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
                          <h4 className="font-semibold text-gray-800 mb-2">Gestionar Conocimiento</h4>
            <p className="text-gray-600 text-sm">
              Añade conocimiento subiendo archivos o escribiendo notas, y asígnalos a áreas específicas.
            </p>
            </div>
            <div className="text-center">
              <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
                          <h4 className="font-semibold text-gray-800 mb-2">Generar Notas</h4>
            <p className="text-gray-600 text-sm">
              La IA analiza el conocimiento y genera notas estructuradas por área.
            </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Crear Diagnóstico</h4>
              <p className="text-gray-600 text-sm">
                Genera diagnóstico completo con mapas de aplicaciones usando Mermaid.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Proponer Proyectos</h4>
              <p className="text-gray-600 text-sm">
                Recibe ideas de proyectos priorizadas basadas en el diagnóstico.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            ¿Listo para comenzar?
          </h2>
          <div className="space-x-4">
            <Link 
              href="/dashboard"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-block"
            >
              Crear Proyecto
            </Link>
            <Link 
              href="/transcription"
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-block"
            >
              Transcribir Video
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">
            © 2024 AI Consultant. Herramienta de consultoría empresarial con inteligencia artificial.
          </p>
        </div>
      </footer>
    </div>
  );
} 
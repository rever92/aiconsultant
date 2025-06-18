'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const StatusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  TRANSCRIPTIONS_UPLOADED: 'bg-blue-100 text-blue-800',
  AREAS_MAPPED: 'bg-purple-100 text-purple-800',
  NOTES_GENERATED: 'bg-yellow-100 text-yellow-800',
  NOTES_VALIDATED: 'bg-orange-100 text-orange-800',
  DIAGNOSIS_GENERATED: 'bg-green-100 text-green-800',
  DIAGNOSIS_VALIDATED: 'bg-green-200 text-green-900',
  IDEAS_GENERATED: 'bg-blue-200 text-blue-900',
  IDEAS_VALIDATED: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800'
};

const StatusLabels = {
  DRAFT: 'Borrador',
  TRANSCRIPTIONS_UPLOADED: 'Transcripciones Subidas',
  AREAS_MAPPED: 'Áreas Mapeadas',
  NOTES_GENERATED: 'Notas Generadas',
  NOTES_VALIDATED: 'Notas Validadas',
  DIAGNOSIS_GENERATED: 'Diagnóstico Generado',
  DIAGNOSIS_VALIDATED: 'Diagnóstico Validado',
  IDEAS_GENERATED: 'Ideas Generadas',
  IDEAS_VALIDATED: 'Ideas Validadas',
  COMPLETED: 'Completado'
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        console.log('Cargando proyectos...');
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Proyectos cargados:', data);
        setProjects(data);
      } catch (error) {
        console.error('Error loading projects:', error);
        setError('Error cargando los proyectos');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const getProgressPercentage = (status: string) => {
    const statuses = [
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
    ];
    const index = statuses.indexOf(status);
    return ((index + 1) / statuses.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600">
                AI Consultant
              </Link>
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
                className="text-blue-600 font-medium px-3 py-2 rounded-md text-sm border-b-2 border-blue-600"
              >
                Proyectos
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Proyectos</h1>
            <p className="text-gray-600 mt-2">Gestiona todos tus proyectos de consultoría en un solo lugar</p>
          </div>
          <Link 
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Nuevo Proyecto
          </Link>
        </div>

        {isLoading ? (
          // Loading State
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error State
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error cargando proyectos</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : projects.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No tienes proyectos aún</h2>
            <p className="text-gray-600 mb-6">Crea tu primer proyecto para empezar a analizar transcripciones con IA</p>
            <Link 
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-block"
            >
              Crear Primer Proyecto
            </Link>
          </div>
        ) : (
          // Projects Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                key={project.id} 
                href={`/projects/${project.id}`}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {project.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ml-2 ${
                      StatusColors[project.status as keyof typeof StatusColors]
                    }`}>
                      {StatusLabels[project.status as keyof typeof StatusLabels]}
                    </span>
                  </div>

                  {/* Project Description */}
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {project.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Progreso</span>
                      <span className="text-xs text-gray-500">
                        {getProgressPercentage(project.status).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(project.status)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Project Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      Creado: {new Date(project.created_at).toLocaleDateString('es-ES')}
                    </span>
                    <span className="group-hover:text-blue-600 transition-colors">
                      Ver detalles →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer with Quick Actions */}
        {projects.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                href="/dashboard"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="text-2xl mr-4">➕</div>
                <div>
                  <div className="font-medium text-gray-800 group-hover:text-blue-600">Nuevo Proyecto</div>
                  <div className="text-sm text-gray-600">Crear proyecto de consultoría</div>
                </div>
              </Link>
              <Link 
                href="/transcription"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="text-2xl mr-4">🎤</div>
                <div>
                  <div className="font-medium text-gray-800 group-hover:text-blue-600">Transcribir Video</div>
                  <div className="text-sm text-gray-600">Convertir MP4 a texto</div>
                </div>
              </Link>
              <Link 
                href="/dashboard"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="text-2xl mr-4">📊</div>
                <div>
                  <div className="font-medium text-gray-800 group-hover:text-blue-600">Ver Dashboard</div>
                  <div className="text-sm text-gray-600">Resumen general</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
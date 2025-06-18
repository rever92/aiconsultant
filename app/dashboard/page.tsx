'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/supabase/client';

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

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Cargar proyectos reales de Supabase
  useEffect(() => {
    const loadProjects = async () => {
      try {
        console.log('Cargando proyectos desde Supabase...');
        const response = await authenticatedFetch('/api/projects');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Proyectos cargados:', data);
        setProjects(data);
      } catch (error) {
        console.error('Error loading projects:', error);
        // Usar datos mock como fallback
        const mockProjects: Project[] = [
          {
            id: '1',
            name: 'Proyecto Demo - Análisis Organizacional',
            description: 'Análisis completo de procesos y sistemas de la organización para identificar oportunidades de mejora.',
            status: 'NOTES_GENERATED',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-16T14:30:00Z'
          }
        ];
        setProjects(mockProjects);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    setIsCreating(true);
    
    try {
      console.log('Creando proyecto:', newProject);
      const response = await authenticatedFetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const project = await response.json();
      console.log('Proyecto creado:', project);
      
      setProjects(prev => [project, ...prev]);
      setNewProject({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creando el proyecto. Por favor intenta de nuevo.');
    } finally {
      setIsCreating(false);
    }
  };

  const getProgressPercentage = (status: string) => {
    const statusOrder = [
      'DRAFT', 'TRANSCRIPTIONS_UPLOADED', 'AREAS_MAPPED', 'NOTES_GENERATED',
      'NOTES_VALIDATED', 'DIAGNOSIS_GENERATED', 'DIAGNOSIS_VALIDATED',
      'IDEAS_GENERATED', 'IDEAS_VALIDATED', 'COMPLETED'
    ];
    const currentIndex = statusOrder.indexOf(status);
    return Math.round((currentIndex / (statusOrder.length - 1)) * 100);
  };

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, el useEffect ya redirigirá a login
  if (!user) {
    return null;
  }

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
                className="text-blue-600 font-medium px-3 py-2 rounded-md text-sm border-b-2 border-blue-600"
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
              {user && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Proyectos
          </h1>
          <p className="text-gray-600">
            Gestiona tus proyectos de consultoría con análisis automatizado de IA
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
              <div className="ml-2 text-sm text-gray-500">Proyectos Totales</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'COMPLETED').length}
              </div>
              <div className="ml-2 text-sm text-gray-500">Completados</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-yellow-600">
                {projects.filter(p => ['NOTES_GENERATED', 'DIAGNOSIS_GENERATED', 'IDEAS_GENERATED'].includes(p.status)).length}
              </div>
              <div className="ml-2 text-sm text-gray-500">En Progreso</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-gray-600">
                {projects.filter(p => p.status === 'DRAFT').length}
              </div>
              <div className="ml-2 text-sm text-gray-500">Borradores</div>
            </div>
          </div>
        </div>

        {/* Create Project Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors"
          >
            {showCreateForm ? 'Cancelar' : '+ Nuevo Proyecto'}
          </button>
        </div>

        {/* Create Project Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Nuevo Proyecto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Ej: Análisis de Procesos TI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Describe brevemente el alcance y objetivos del proyecto..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateProject}
                  disabled={!newProject.name.trim() || isCreating}
                  className={`${
                    !newProject.name.trim() || isCreating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white font-semibold py-2 px-4 rounded transition-colors`}
                >
                  {isCreating ? 'Creando...' : 'Crear Proyecto'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Proyectos Recientes</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando proyectos...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No hay proyectos aún</h3>
              <p className="text-gray-600 mb-4">Comienza creando tu primer proyecto de consultoría</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Crear Primer Proyecto
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {projects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {project.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          StatusColors[project.status as keyof typeof StatusColors]
                        }`}>
                          {StatusLabels[project.status as keyof typeof StatusLabels]}
                        </span>
                      </div>
                      
                      {project.description && (
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progreso</span>
                          <span>{getProgressPercentage(project.status)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(project.status)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Creado: {new Date(project.created_at).toLocaleDateString('es-ES')}</span>
                        <span>Actualizado: {new Date(project.updated_at).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Link 
                        href={`/projects/${project.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                      >
                        Ver Proyecto
                      </Link>
                      <button className="text-gray-400 hover:text-gray-600 p-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/transcription" className="group">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group-hover:scale-105 transform duration-200">
                <div className="text-blue-600 text-3xl mb-3">🎤</div>
                <h3 className="font-semibold text-gray-800 mb-2">Transcribir Video</h3>
                <p className="text-gray-600 text-sm">Convierte videos a texto para usar en proyectos</p>
              </div>
            </Link>
            
            <div className="bg-white rounded-lg shadow p-6 opacity-50 cursor-not-allowed">
              <div className="text-purple-600 text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-800 mb-2">Análisis con IA</h3>
              <p className="text-gray-600 text-sm">Generar insights automáticos (Próximamente)</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 opacity-50 cursor-not-allowed">
              <div className="text-green-600 text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-gray-800 mb-2">Plantillas</h3>
              <p className="text-gray-600 text-sm">Crear proyecto desde plantilla (Próximamente)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
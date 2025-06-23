'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { authenticatedFetchMongo } from '@/lib/supabase/client';

interface Area {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

interface Knowledge {
  id: string;
  title: string;
  file_name?: string;
  file_size?: number;
  content: string;
  source_type: 'upload' | 'manual';
  notes?: string;
  uploaded_at: string;
  knowledge_areas: {
    area_id: string;
    areas: {
      id: string;
      name: string;
      color: string;
    };
  }[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
  '#EC4899', '#6366F1', '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981', '#06B6D4',
  '#F97316', '#84CC16', '#EC4899', '#6366F1', '#14B8A6', '#DC2626', '#059669', '#7C3AED',
  '#DB2777'
];

export default function ProjectPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const projectId = params.id;

  // Estados del proyecto
  const [project, setProject] = useState<Project | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de UI
  const [activeTab, setActiveTab] = useState<'areas' | 'knowledge'>('areas');
  const [showCreateArea, setShowCreateArea] = useState(false);
  const [showUploadKnowledge, setShowUploadKnowledge] = useState(false);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [showAssignAreas, setShowAssignAreas] = useState(false);
  const [showViewContent, setShowViewContent] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<Knowledge | null>(null);
  const [showMultiUpload, setShowMultiUpload] = useState(false);

  // Función para obtener el siguiente color disponible
  const getNextAvailableColor = () => {
    const usedColors = areas.map(area => area.color);
    const availableColor = DEFAULT_COLORS.find(color => !usedColors.includes(color));
    return availableColor || DEFAULT_COLORS[0]; // Fallback al primer color si todos están usados
  };

  // Función para contar conocimiento por área
  const getKnowledgeCountByArea = (areaId: string) => {
    return knowledge.filter(k => 
      k.knowledge_areas && k.knowledge_areas.some(ka => ka.area_id === areaId)
    ).length;
  };

  // Funciones para notificaciones
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Estados de formularios
  const [newArea, setNewArea] = useState({ name: '', description: '', color: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  // Estados para subida múltiple
  const [multiFiles, setMultiFiles] = useState<{file: File, areaId: string, title: string}[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMultiUploading, setIsMultiUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: 'pending' | 'uploading' | 'success' | 'error'}>({});

  // Estados para notificaciones
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'error' | 'info'}[]>([]);

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Cargar datos del proyecto
  useEffect(() => {
    if (user && projectId) {
      loadProjectData();
    }
  }, [user, projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // Cargar proyecto desde backend MongoDB
      const projectResponse = await authenticatedFetchMongo(`/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Project not found');
      }
      const projectData = await projectResponse.json();
      setProject(projectData.project || projectData);

      // Cargar áreas desde backend MongoDB
      const areasResponse = await authenticatedFetchMongo(`/areas?projectId=${projectId}`);
      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        const areasFormatted = (areasData.areas || areasData).map((area: any) => ({
          id: area._id,
          name: area.name,
          description: area.description,
          color: area.color,
          created_at: area.createdAt
        }));
        setAreas(areasFormatted);
      }

      // Cargar conocimiento desde backend MongoDB
      const knowledgeResponse = await authenticatedFetchMongo(`/knowledge?projectId=${projectId}`);
      if (knowledgeResponse.ok) {
        const knowledgeData = await knowledgeResponse.json();
        const rawKnowledge = knowledgeData.knowledge || knowledgeData;
        // Mapear datos de MongoDB al formato esperado por el frontend
        const knowledgeWithAreas = rawKnowledge.map((k: any) => ({
          id: k._id,
          title: k.title,
          content: k.content,
          source_type: k.sourceType,
          file_name: k.fileInfo?.originalName,
          file_size: k.fileInfo?.fileSize,
          notes: k.notes,
          uploaded_at: k.createdAt,
          knowledge_areas: (k.areas || []).map((area: any) => ({
            area_id: area._id,
            areas: {
              id: area._id,
              name: area.name,
              color: area.color
            }
          }))
        }));
        setKnowledge(knowledgeWithAreas);
      }

    } catch (error) {
      console.error('Error loading project data:', error);
      alert('Error cargando el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArea = async () => {
    if (!newArea.name.trim()) return;

    setIsCreating(true);
    try {
      const response = await authenticatedFetchMongo('/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newArea,
          projectId: projectId
        }),
      });

      if (!response.ok) {
        throw new Error('Error creating area');
      }

      const areaResponse = await response.json();
      const areaFormatted = {
        id: areaResponse.area._id,
        name: areaResponse.area.name,
        description: areaResponse.area.description,
        color: areaResponse.area.color,
        created_at: areaResponse.area.createdAt
      };
      setAreas(prev => [...prev, areaFormatted]);
      setNewArea({ name: '', description: '', color: getNextAvailableColor() });
      setShowCreateArea(false);
    } catch (error) {
      console.error('Error creating area:', error);
      alert('Error creando el área');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('projectId', projectId);
      formData.append('title', uploadTitle || selectedFile.name);

      const response = await authenticatedFetchMongo('/knowledge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error uploading file');
      }

      const newKnowledge = await response.json();

      // Si se asignó un área, asignarla
      if (selectedAreaId) {
        const assignResponse = await authenticatedFetchMongo(`/knowledge/${newKnowledge.knowledge._id}/assign-areas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ areaIds: [selectedAreaId] }),
        });

        if (assignResponse.ok) {
          // Actualizar el conocimiento con las áreas asignadas
          const areaData = areas.find(a => a.id === selectedAreaId);
          if (areaData) {
            newKnowledge.knowledge.knowledge_areas = [{
              area_id: selectedAreaId,
              areas: {
                id: areaData.id,
                name: areaData.name,
                color: areaData.color
              }
            }];
          }
        }
      }

      // Mapear la estructura de MongoDB al formato frontend
      const mappedKnowledge = {
        id: newKnowledge.knowledge._id,
        title: newKnowledge.knowledge.title,
        content: newKnowledge.knowledge.content,
        source_type: newKnowledge.knowledge.sourceType,
        file_name: newKnowledge.knowledge.fileInfo?.originalName,
        file_size: newKnowledge.knowledge.fileInfo?.fileSize,
        notes: newKnowledge.knowledge.notes,
        uploaded_at: newKnowledge.knowledge.createdAt,
        knowledge_areas: newKnowledge.knowledge.knowledge_areas || []
      };
      
      setKnowledge(prev => [mappedKnowledge, ...prev]);
      setSelectedFile(null);
      setUploadTitle('');
      setShowUploadKnowledge(false);
      showNotification('Archivo subido exitosamente', 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification(`Error subiendo archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddManualKnowledge = async () => {
    if (!manualTitle.trim() || !manualContent.trim()) return;

    setIsAdding(true);
    try {
      const response = await authenticatedFetchMongo('/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle.trim(),
          content: manualContent.trim(),
          notes: manualNotes.trim() || null,
          projectId,
          areaId: selectedAreaId || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error adding knowledge');
      }

      const knowledgeResponse = await response.json();
      const knowledgeFormatted = {
        id: knowledgeResponse.knowledge._id,
        title: knowledgeResponse.knowledge.title,
        content: knowledgeResponse.knowledge.content,
        source_type: knowledgeResponse.knowledge.sourceType,
        notes: knowledgeResponse.knowledge.notes,
        uploaded_at: knowledgeResponse.knowledge.createdAt,
        knowledge_areas: (knowledgeResponse.knowledge.areas || []).map((area: any) => ({
          area_id: area._id,
          areas: {
            id: area._id,
            name: area.name,
            color: area.color
          }
        }))
      };
      setKnowledge(prev => [knowledgeFormatted, ...prev]);
      setManualTitle('');
      setManualContent('');
      setManualNotes('');
      setSelectedAreaId('');
      setShowAddKnowledge(false);
      showNotification('Conocimiento añadido exitosamente', 'success');
    } catch (error) {
      console.error('Error adding manual knowledge:', error);
      showNotification(`Error añadiendo conocimiento: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta área?')) return;

    try {
      const response = await authenticatedFetchMongo(`/areas/${areaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error deleting area');
      }

      setAreas(prev => prev.filter(area => area.id !== areaId));
    } catch (error) {
      console.error('Error deleting area:', error);
      alert('Error eliminando el área');
    }
  };

  const handleAssignAreas = (knowledge: Knowledge) => {
    setSelectedKnowledge(knowledge);
    // Inicializar con las áreas ya asignadas
    const currentAreaIds = (knowledge.knowledge_areas || []).map((ka: any) => ka.area_id);
    setSelectedAreas(currentAreaIds);
    setShowAssignAreas(true);
  };

  const handleSaveAreaAssignments = async () => {
    if (!selectedKnowledge) return;

    setIsAssigning(true);
    try {
      const response = await authenticatedFetchMongo(`/knowledge/${selectedKnowledge.id}/assign-areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaIds: selectedAreas
        }),
      });

      if (!response.ok) {
        throw new Error('Error asignando áreas');
      }

      // Recargar datos del proyecto para reflejar los cambios
      await loadProjectData();
      
      setShowAssignAreas(false);
      setSelectedKnowledge(null);
      setSelectedAreas([]);
      alert('Áreas asignadas exitosamente');
    } catch (error) {
      console.error('Error assigning areas:', error);
      alert(`Error asignando áreas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleAreaSelection = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleViewContent = (knowledge: Knowledge) => {
    setSelectedKnowledge(knowledge);
    setShowViewContent(true);
  };

  const handleDeleteKnowledge = async (knowledge: Knowledge) => {
    const confirmDelete = confirm(
      `¿Estás seguro de que quieres eliminar "${knowledge.title}"?\n\n` +
      `Esta acción no se puede deshacer y eliminará:\n` +
      `- El conocimiento de la base de datos\n` +
      `- El archivo del sistema (si existe)\n` +
      `- Todas las asignaciones de áreas`
    );

    if (!confirmDelete) return;

    try {
      const response = await authenticatedFetchMongo(`/knowledge/${knowledge.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error eliminando conocimiento');
      }

      // Remover el conocimiento de la lista local
      setKnowledge(prev => prev.filter(k => k.id !== knowledge.id));
      showNotification(`"${knowledge.title}" eliminado exitosamente`, 'success');
      
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      showNotification(`Error eliminando conocimiento: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    }
  };

  const handleDeleteAllKnowledge = async () => {
    if (knowledge.length === 0) {
      showNotification('No hay conocimiento para eliminar', 'info');
      return;
    }

    const confirmDelete = confirm(
      `⚠️ ATENCIÓN: ¿Estás seguro de que quieres eliminar TODO el conocimiento de este proyecto?\n\n` +
      `Esta acción eliminará ${knowledge.length} elementos de conocimiento y:\n` +
      `- Todos los registros de la base de datos\n` +
      `- Todos los archivos del sistema\n` +
      `- Todas las asignaciones de áreas\n\n` +
      `Esta acción NO SE PUEDE DESHACER.`
    );

    if (!confirmDelete) return;

    try {
      const response = await authenticatedFetchMongo(`/knowledge/delete-all?projectId=${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error eliminando conocimiento');
      }

      const result = await response.json();
      
      // Limpiar la lista local
      setKnowledge([]);
      showNotification(
        `${result.deletedCount} elementos de conocimiento eliminados exitosamente` + 
        (result.filesDeleted > 0 ? ` (${result.filesDeleted} archivos eliminados)` : ''), 
        'success'
      );
      
    } catch (error) {
      console.error('Error deleting all knowledge:', error);
      showNotification(`Error eliminando conocimiento: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    }
  };

  // Funciones para subida múltiple
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'text/plain' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/pdf'
    );

    if (files.length === 0) {
      alert('Por favor, arrastra solo archivos .txt, .docx o .pdf');
      return;
    }

    // Verificar tamaño de archivos (advertir si son > 5MB)
    const largeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      const fileNames = largeFiles.map(f => f.name).join(', ');
      if (!confirm(`Los siguientes archivos son muy grandes (>${5} MB):\n\n${fileNames}\n\nLa subida puede tardar más tiempo. ¿Continuar?`)) {
        return;
      }
    }

    const newFiles = files.map(file => ({
      file,
      areaId: '',
      title: file.name.replace(/\.[^/.]+$/, '') // Remover extensión
    }));

    setMultiFiles(newFiles);
    setUploadProgress({});
    setShowMultiUpload(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files).filter(file => 
      file.type === 'text/plain' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/pdf'
    );

    if (files.length === 0) {
      alert('Por favor, selecciona solo archivos .txt, .docx o .pdf');
      return;
    }

    // Verificar tamaño de archivos (advertir si son > 5MB)
    const largeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      const fileNames = largeFiles.map(f => f.name).join(', ');
      if (!confirm(`Los siguientes archivos son muy grandes (>${5} MB):\n\n${fileNames}\n\nLa subida puede tardar más tiempo. ¿Continuar?`)) {
        return;
      }
    }

    const newFiles = files.map(file => ({
      file,
      areaId: '',
      title: file.name.replace(/\.[^/.]+$/, '') // Remover extensión
    }));

    setMultiFiles(newFiles);
    setUploadProgress({});
    setShowMultiUpload(true);
  };

  const updateFileTitle = (index: number, title: string) => {
    setMultiFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, title } : item
    ));
  };

  const updateFileArea = (index: number, areaId: string) => {
    setMultiFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, areaId } : item
    ));
  };

  const removeFile = (index: number) => {
    setMultiFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMultiUpload = async () => {
    if (multiFiles.length === 0) return;

    setIsMultiUploading(true);
    const initialProgress: {[key: string]: 'pending' | 'uploading' | 'success' | 'error'} = {};
    multiFiles.forEach((_, index) => {
      initialProgress[index] = 'pending';
    });
    setUploadProgress(initialProgress);

    try {
      // Subir archivos en paralelo
      const uploadPromises = multiFiles.map(async (fileData, index) => {
        try {
          setUploadProgress(prev => ({ ...prev, [index]: 'uploading' }));

          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('projectId', projectId);
          formData.append('title', fileData.title);

          const response = await authenticatedFetchMongo('/knowledge', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error uploading file');
          }

          const newKnowledge = await response.json();

          // Si se asignó un área, asignarla
          if (fileData.areaId) {
            const assignResponse = await authenticatedFetchMongo(`/knowledge/${newKnowledge.knowledge._id}/assign-areas`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ areaIds: [fileData.areaId] }),
            });

            if (assignResponse.ok) {
              // Actualizar el conocimiento con las áreas asignadas
              const areaData = areas.find(a => a.id === fileData.areaId);
              if (areaData) {
                newKnowledge.knowledge.knowledge_areas = [{
                  area_id: fileData.areaId,
                  areas: {
                    id: areaData.id,
                    name: areaData.name,
                    color: areaData.color
                  }
                }];
              }
            }
          }

          setUploadProgress(prev => ({ ...prev, [index]: 'success' }));
          
          // Mapear la estructura de MongoDB al formato frontend
          const mappedKnowledge = {
            id: newKnowledge.knowledge._id,
            title: newKnowledge.knowledge.title,
            content: newKnowledge.knowledge.content,
            source_type: newKnowledge.knowledge.sourceType,
            file_name: newKnowledge.knowledge.fileInfo?.originalName,
            file_size: newKnowledge.knowledge.fileInfo?.fileSize,
            notes: newKnowledge.knowledge.notes,
            uploaded_at: newKnowledge.knowledge.createdAt,
            knowledge_areas: newKnowledge.knowledge.knowledge_areas || []
          };
          
          return mappedKnowledge;
        } catch (error) {
          console.error(`Error uploading file ${index}:`, error);
          setUploadProgress(prev => ({ ...prev, [index]: 'error' }));
          throw error;
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

      // Actualizar lista de conocimiento con las subidas exitosas
      if (successfulUploads.length > 0) {
        setKnowledge(prev => [...successfulUploads, ...prev]);
      }

      const failedCount = results.filter(result => result.status === 'rejected').length;
      
      if (failedCount === 0) {
        showNotification(`¡${successfulUploads.length} archivos subidos exitosamente!`, 'success');
        setShowMultiUpload(false);
        setMultiFiles([]);
        setUploadProgress({});
      } else {
        showNotification(`${successfulUploads.length} archivos subidos correctamente, ${failedCount} fallaron.`, 'info');
      }

    } catch (error) {
      console.error('Error in multi upload:', error);
      showNotification('Error en la subida múltiple', 'error');
    } finally {
      setIsMultiUploading(false);
    }
  };

  // Mostrar loading mientras se verifica autenticación
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (!user || !project) {
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
              <span className="mx-2 text-gray-400">/</span>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
                Dashboard
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-800 font-medium">{project.name}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                Volver al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Flujo Principal de Consultoría */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">🎯 Proceso de Consultoría Guiado</h2>
                <p className="text-blue-100 text-lg">
                  Metodología estructurada en 4 pasos con IA integrada
                </p>
                <div className="mt-3 flex items-center space-x-6 text-sm text-blue-100">
                  <span>📚 Base de Conocimiento</span>
                  <span>📊 Análisis AS IS (6 ejes)</span>
                  <span>💡 Recomendaciones TO BE</span>
                  <span>📋 Fichas TO DO</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <Link 
                href={`/projects/${projectId}/guided`}
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-bold text-lg text-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🚀 Iniciar Proceso
              </Link>
              <span className="text-blue-200 text-xs text-center font-medium">Método principal recomendado</span>
            </div>
          </div>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 mb-4">{project.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Estado: {project.status}</span>
                <span>•</span>
                <span>Creado: {new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {areas.length} {areas.length === 1 ? 'área' : 'áreas'}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {knowledge.length} {knowledge.length === 1 ? 'conocimiento' : 'conocimientos'}
              </span>
            </div>
          </div>
          
          {/* Modo Legado */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">Modo de Gestión Legado</h3>
                <p className="text-gray-500 text-sm">
                  Gestión manual de áreas y conocimiento. Se mantiene para compatibilidad con proyectos existentes.
                </p>
              </div>
              <div className="text-right">
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium mb-1">
                  Modo Legado
                </div>
                <p className="text-xs text-gray-500">Para expertos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('areas')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'areas'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Áreas Organizacionales ({areas.length})
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'knowledge'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Conocimiento ({knowledge.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tab Content: Areas */}
            {activeTab === 'areas' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Gestión de Áreas Organizacionales
                  </h3>
                  <button
                    onClick={() => {
                      setNewArea({ name: '', description: '', color: getNextAvailableColor() });
                      setShowCreateArea(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    + Crear Área
                  </button>
                </div>

                {/* Areas Grid */}
                {areas.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay áreas organizacionales
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Crea áreas para organizar el conocimiento por departamento o tema.
                    </p>
                    <button
                      onClick={() => {
                        setNewArea({ name: '', description: '', color: getNextAvailableColor() });
                        setShowCreateArea(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Crear primera área
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {areas.map((area) => {
                      const knowledgeCount = getKnowledgeCountByArea(area.id);
                      return (
                        <div key={area.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-3"
                                style={{ backgroundColor: area.color }}
                              ></div>
                              <h4 className="font-medium text-gray-900">{area.name}</h4>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                {knowledgeCount} {knowledgeCount === 1 ? 'fuente' : 'fuentes'}
                              </span>
                              {area.name !== 'Global' && (
                                <button
                                  onClick={() => handleDeleteArea(area.id)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                          {area.description && (
                            <p className="text-gray-600 text-sm mb-3">{area.description}</p>
                          )}
                          <div className="text-xs text-gray-500">
                            Creada: {new Date(area.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Knowledge */}
            {activeTab === 'knowledge' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Gestión de Conocimiento del Proyecto
                  </h3>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowAddKnowledge(true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        📝 Añadir Conocimiento
                      </button>
                      <button
                        onClick={() => setShowUploadKnowledge(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        📄 Subir Archivo
                      </button>
                      <button
                        onClick={() => setShowMultiUpload(true)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        📎 Subida Múltiple
                      </button>
                    </div>
                    {knowledge.length > 0 && (
                      <button
                        onClick={handleDeleteAllKnowledge}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        🗑️ Eliminar Todo ({knowledge.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Drag & Drop Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 mb-6 transition-colors ${
                    isDragOver 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">📎</div>
                    <h4 className="text-lg font-medium text-gray-700 mb-2">
                      Arrastra múltiples archivos aquí
                    </h4>
                    <p className="text-gray-500 mb-4">
                      Soporta archivos .txt, .docx y .pdf. Podrás asignar cada archivo a un área específica.
                    </p>
                    <div className="flex justify-center">
                      <label className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium cursor-pointer">
                        O selecciona archivos
                        <input
                          type="file"
                          multiple
                          accept=".txt,.docx,.pdf"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Knowledge List */}
                {knowledge.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🧠</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay conocimiento añadido
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Añade conocimiento subiendo archivos (.txt, .docx) o escribiendo notas manualmente.
                    </p>
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => setShowAddKnowledge(true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                      >
                        📝 Añadir Conocimiento
                      </button>
                      <button
                        onClick={() => setShowUploadKnowledge(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                      >
                        📄 Subir Archivo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {knowledge.map((item) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
                        {/* Header de la tarjeta */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">
                              {item.source_type === 'upload' ? '📄' : '📝'}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                                {item.title}
                              </h4>
                              <div className="text-xs text-gray-500">
                                {item.source_type === 'upload' ? 'Archivo' : 'Manual'} • {new Date(item.uploaded_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Áreas asignadas */}
                        <div className="mb-3">
                          {(item.knowledge_areas || []).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {(item.knowledge_areas || []).map((ka: any) => (
                                <span
                                  key={ka.area_id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                  style={{ backgroundColor: ka.areas?.color || '#6B7280' }}
                                >
                                  {ka.areas?.name || 'Área sin nombre'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Sin áreas asignadas</span>
                          )}
                        </div>

                        {/* Preview del contenido */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="text-sm text-gray-600 line-clamp-3">
                            {item.content.substring(0, 150)}
                            {item.content.length > 150 && '...'}
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="mb-4">
                          {item.file_name && (
                            <div className="text-xs text-gray-500 mb-1">
                              📎 {item.file_name}
                              {item.file_size && ` (${(item.file_size / 1024 / 1024).toFixed(2)} MB)`}
                            </div>
                          )}
                          {item.notes && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mt-2">
                              <div className="text-xs text-yellow-800 font-medium mb-1">Notas:</div>
                              <div className="text-xs text-yellow-700 line-clamp-2">{item.notes}</div>
                            </div>
                          )}
                        </div>

                        {/* Botones de acción */}
                        <div className="flex justify-between pt-3 border-t border-gray-100">
                          <button 
                            onClick={() => handleAssignAreas(item)}
                            className="text-blue-500 hover:text-blue-700 text-xs font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                          >
                            Asignar Áreas
                          </button>
                          <button 
                            onClick={() => handleViewContent(item)}
                            className="text-green-500 hover:text-green-700 text-xs font-medium hover:bg-green-50 px-2 py-1 rounded transition-colors"
                          >
                            Ver Contenido
                          </button>
                          <button 
                            onClick={() => handleDeleteKnowledge(item)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Area */}
      {showCreateArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nueva Área</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Área
                </label>
                <input
                  type="text"
                  value={newArea.name}
                  onChange={(e) => setNewArea(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="ej. Recursos Humanos, IT, Ventas..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={newArea.description}
                  onChange={(e) => setNewArea(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={3}
                  placeholder="Describe el propósito de esta área..."
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: newArea.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    Se asignará automáticamente el color {newArea.color}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateArea(false);
                  setNewArea({ name: '', description: '', color: getNextAvailableColor() });
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateArea}
                disabled={!newArea.name.trim() || isCreating}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isCreating ? 'Creando...' : 'Crear Área'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Manual Knowledge */}
      {showAddKnowledge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Añadir Conocimiento Manual</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="ej. Notas de la reunión con IT, Análisis de procesos..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido *
                </label>
                <textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  rows={10}
                  placeholder="Escribe aquí el conocimiento que quieres añadir al proyecto..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  {manualContent.length} caracteres
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  rows={3}
                  placeholder="Contexto, fuente, observaciones..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asignar a área (opcional)
                </label>
                <select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                >
                  <option value="">Sin asignar</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddKnowledge(false);
                  setManualTitle('');
                  setManualContent('');
                  setManualNotes('');
                  setSelectedAreaId('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddManualKnowledge}
                disabled={!manualTitle.trim() || !manualContent.trim() || isAdding}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {isAdding ? 'Añadiendo...' : 'Añadir Conocimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Upload Knowledge */}
      {showUploadKnowledge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Subir Archivo de Conocimiento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Si está vacío, se usará el nombre del archivo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo (.txt, .docx, .pdf)
                </label>
                <input
                  type="file"
                  accept=".txt,.docx,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadKnowledge(false);
                  setSelectedFile(null);
                  setUploadTitle('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || isUploading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isUploading ? 'Subiendo...' : 'Subir Archivo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign Areas */}
      {showAssignAreas && selectedKnowledge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Asignar Áreas a: {selectedKnowledge.title}
            </h3>
            
            <div className="space-y-3">
              {areas.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay áreas creadas. Crea áreas primero para poder asignarlas.
                </p>
              ) : (
                areas.map((area) => {
                  const isAssigned = selectedAreas.includes(area.id);
                  return (
                    <div key={area.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`area-${area.id}`}
                        checked={isAssigned}
                        onChange={() => toggleAreaSelection(area.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label 
                        htmlFor={`area-${area.id}`}
                        className="flex items-center space-x-2 cursor-pointer flex-1"
                      >
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: area.color }}
                        ></div>
                        <span className="text-gray-900">{area.name}</span>
                      </label>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignAreas(false);
                  setSelectedKnowledge(null);
                  setSelectedAreas([]);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAreaAssignments}
                disabled={isAssigning}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isAssigning ? 'Guardando...' : 'Guardar Asignaciones'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Content */}
      {showViewContent && selectedKnowledge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contenido: {selectedKnowledge.title}
            </h3>
            
            <div className="mb-4 text-sm text-gray-600">
              <p><strong>Tipo:</strong> {selectedKnowledge.source_type === 'upload' ? 'Archivo subido' : 'Contenido manual'}</p>
              {selectedKnowledge.file_name && (
                <p><strong>Archivo:</strong> {selectedKnowledge.file_name}</p>
              )}
              {selectedKnowledge.file_size && (
                <p><strong>Tamaño:</strong> {(selectedKnowledge.file_size / 1024 / 1024).toFixed(2)} MB</p>
              )}
              <p><strong>Añadido:</strong> {new Date(selectedKnowledge.uploaded_at).toLocaleString()}</p>
              <p><strong>Caracteres:</strong> {selectedKnowledge.content.length}</p>
            </div>

            {selectedKnowledge.notes && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                <h4 className="font-medium text-yellow-800 mb-2">Notas:</h4>
                <p className="text-yellow-700">{selectedKnowledge.notes}</p>
              </div>
            )}
            
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {selectedKnowledge.content}
              </pre>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowViewContent(false);
                  setSelectedKnowledge(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedKnowledge.content);
                  alert('Contenido copiado al portapapeles');
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Copiar Texto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Multi Upload */}
      {showMultiUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📎 Subida Múltiple de Archivos</h3>
            
            {multiFiles.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📎</div>
                <p className="text-gray-500 mb-4">
                  No hay archivos seleccionados. Arrastra archivos o usa el botón de selección.
                </p>
                <label className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium cursor-pointer">
                  Seleccionar Archivos
                  <input
                    type="file"
                    multiple
                    accept=".txt,.docx,.pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div>
                <div className="mb-4 text-sm text-gray-600">
                  {multiFiles.length} {multiFiles.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {multiFiles.map((fileData, index) => {
                    const status = uploadProgress[index] || 'pending';
                    const statusIcons = {
                      pending: '⏳',
                      uploading: '🔄',
                      success: '✅',
                      error: '❌'
                    };
                    const statusColors = {
                      pending: 'border-gray-300 bg-white',
                      uploading: 'border-blue-300 bg-blue-50',
                      success: 'border-green-300 bg-green-50',
                      error: 'border-red-300 bg-red-50'
                    };

                    return (
                      <div key={index} className={`border rounded-lg p-4 ${statusColors[status]}`}>
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{statusIcons[status]}</div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  📄 {fileData.file.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                              </div>
                              {status === 'pending' && (
                                <button
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  ✕ Remover
                                </button>
                              )}
                            </div>

                            {status === 'pending' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Título personalizado
                                  </label>
                                                                     <input
                                     type="text"
                                     value={fileData.title}
                                     onChange={(e) => updateFileTitle(index, e.target.value)}
                                     className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                     placeholder="Deja vacío para usar nombre del archivo"
                                   />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Asignar a área
                                  </label>
                                                                     <select
                                     value={fileData.areaId}
                                     onChange={(e) => updateFileArea(index, e.target.value)}
                                     className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                   >
                                    <option value="">Sin asignar</option>
                                    {areas.map((area) => (
                                      <option key={area.id} value={area.id}>
                                        {area.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}

                            {status === 'error' && (
                              <div className="text-red-600 text-sm">
                                Error al subir el archivo. Inténtalo de nuevo.
                              </div>
                            )}

                            {status === 'success' && (
                              <div className="text-green-600 text-sm">
                                ✅ Archivo subido exitosamente
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    {Object.values(uploadProgress).filter(status => status === 'success').length} / {multiFiles.length} completados
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowMultiUpload(false);
                        setMultiFiles([]);
                        setUploadProgress({});
                      }}
                      disabled={isMultiUploading}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleMultiUpload}
                      disabled={multiFiles.length === 0 || isMultiUploading}
                      className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
                    >
                      {isMultiUploading ? 'Subiendo...' : `Subir ${multiFiles.length} ${multiFiles.length === 1 ? 'archivo' : 'archivos'}`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notificaciones Toast */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`min-w-80 max-w-md bg-white shadow-xl rounded-xl pointer-events-auto transform transition-all duration-300 ease-out animate-in slide-in-from-right ${
              notification.type === 'success' ? 'border border-green-200' :
              notification.type === 'error' ? 'border border-red-200' :
              'border border-blue-200'
            }`}
          >
            <div className="p-4">
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'success' ? 'bg-green-100' :
                  notification.type === 'error' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  {notification.type === 'success' && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {notification.type === 'error' && (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                  {notification.type === 'info' && (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 leading-5">
                    {notification.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md p-1 transition-colors"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { authenticatedFetch } from '@/lib/supabase/client';

// Interfaces
interface Project {
  id: string;
  name: string;
  description: string;
  current_step: number;
  step_1_completed: boolean;
  step_2_completed: boolean;
  step_3_completed: boolean;
  step_4_completed: boolean;
  created_at: string;
}

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

interface ConsolidatedKnowledge {
  id: string;
  area_id: string;
  content: string;
  ai_generated: boolean;
  validated: boolean;
  original_sources_count: number;
  created_at: string;
  updated_at: string;
}

interface AnalysisAsIs {
  id: string;
  project_id: string;
  strategy_governance: string;
  processes_operations: string;
  technology_infrastructure: string;
  data_information: string;
  people_culture: string;
  customer_experience: string;
  conclusions: string;
  ai_generated: boolean;
  validated: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface ProjectRecommendation {
  id: string;
  project_id: string;
  title: string;
  description: string;
  justification: string;
  category: 'technological' | 'training' | 'cultural' | 'methodological';
  priority: number;
  status: 'proposed' | 'accepted' | 'rejected' | 'modified';
  ai_generated: boolean;
  validated: boolean;
  created_at: string;
  updated_at: string;
}

interface ProjectSheet {
  id: string;
  recommendation_id: string;
  project_id: string;
  title: string;
  description: string;
  expected_benefits: string;
  strategic_objectives: string;
  human_resources: string;
  technological_resources: string;
  estimated_investment: number;
  estimated_duration: number;
  involved_areas: string;
  validated: boolean;
  created_at: string;
  updated_at: string;
  project_recommendations?: {
    id: string;
    title: string;
    category: string;
    priority: number;
    status: string;
  };
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
  '#EC4899', '#6366F1', '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981', '#06B6D4'
];

export default function ProjectGuidedPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const projectId = params.id;

  // Estados principales
  const [project, setProject] = useState<Project | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [consolidatedKnowledge, setConsolidatedKnowledge] = useState<{[areaId: string]: ConsolidatedKnowledge}>({});
  const [loading, setLoading] = useState(true);

  // Estados del flujo guiado
  const [currentStep, setCurrentStep] = useState(1);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'error' | 'info'}[]>([]);

  // Estados para Paso 1 - Gestión de Conocimiento Completa
  const [showCreateArea, setShowCreateArea] = useState(false);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [showViewConsolidated, setShowViewConsolidated] = useState(false);
  const [showViewKnowledge, setShowViewKnowledge] = useState(false);
  const [selectedAreaForConsolidated, setSelectedAreaForConsolidated] = useState<Area | null>(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState<Knowledge | null>(null);
  const [consolidatingArea, setConsolidatingArea] = useState<string | null>(null);
  const [expandedAreaSources, setExpandedAreaSources] = useState<{[areaId: string]: boolean}>({});

  // Estados de Drag & Drop
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragTargetArea, setDragTargetArea] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<{[fileName: string]: 'pending' | 'uploading' | 'success' | 'error'}>({});

  // Estados para el popup de asignación de áreas
  const [showAssignAreasModal, setShowAssignAreasModal] = useState(false);
  const [pendingKnowledgeAssignments, setPendingKnowledgeAssignments] = useState<Knowledge[]>([]);
  const [knowledgeAreaAssignments, setKnowledgeAreaAssignments] = useState<{[knowledgeId: string]: string}>({});

  // Estados para Paso 2 - AS IS Analysis
  const [analysisAsIs, setAnalysisAsIs] = useState<AnalysisAsIs | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisEditData, setAnalysisEditData] = useState<Partial<AnalysisAsIs>>({});

  // Estados para Paso 3 - Recommendations
  const [recommendations, setRecommendations] = useState<ProjectRecommendation[]>([]);
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ProjectRecommendation | null>(null);

  // Estados para Paso 4 - Project Sheets
  const [projectSheets, setProjectSheets] = useState<ProjectSheet[]>([]);
  const [generatingSheets, setGeneratingSheets] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<ProjectSheet | null>(null);

  // Estados de formularios
  const [newArea, setNewArea] = useState({ name: '', description: '', color: '' });
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      
      // Cargar proyecto con información de pasos
      const projectResponse = await authenticatedFetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Project not found');
      }
      const projectData = await projectResponse.json();
      setProject(projectData);
      setCurrentStep(projectData.current_step || 1);

      // Cargar áreas
      const areasResponse = await authenticatedFetch(`/api/areas?projectId=${projectId}`);
      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        console.log('📍 Áreas cargadas desde el backend:', areasData);
        // Verificación defensiva: asegurar que siempre sea un array
        const safeAreasData = Array.isArray(areasData) ? areasData : [];
        console.log('📍 Áreas después de verificación:', safeAreasData);
        setAreas(safeAreasData);
      } else {
        console.error('❌ Error cargando áreas:', areasResponse.status);
        // Si la respuesta no es ok, asegurar que areas sea un array vacío
        setAreas([]);
      }

      // Cargar conocimiento
      const knowledgeResponse = await authenticatedFetch(`/api/knowledge?projectId=${projectId}`);
      if (knowledgeResponse.ok) {
        const knowledgeData = await knowledgeResponse.json();
        // Verificación defensiva: asegurar que siempre sea un array
        const safeKnowledgeData = Array.isArray(knowledgeData) ? knowledgeData : [];
        const knowledgeWithAreas = safeKnowledgeData.map((k: any) => ({
          ...k,
          knowledge_areas: k.knowledge_areas || []
        }));
        setKnowledge(knowledgeWithAreas);
      } else {
        // Si la respuesta no es ok, asegurar que knowledge sea un array vacío
        setKnowledge([]);
      }

      // Cargar conocimiento consolidado
      const consolidatedResponse = await authenticatedFetch(`/api/areas/consolidated?projectId=${projectId}`);
      if (consolidatedResponse.ok) {
        const consolidatedData = await consolidatedResponse.json();
        // Verificación defensiva: asegurar que siempre sea un array
        const safeConsolidatedData = Array.isArray(consolidatedData) ? consolidatedData : [];
        const consolidatedMap: {[areaId: string]: ConsolidatedKnowledge} = {};
        safeConsolidatedData.forEach((item: ConsolidatedKnowledge) => {
          consolidatedMap[item.area_id] = item;
        });
        setConsolidatedKnowledge(consolidatedMap);
      } else {
        // Si la respuesta no es ok, asegurar que consolidatedKnowledge sea un objeto vacío
        setConsolidatedKnowledge({});
      }

    } catch (error) {
      console.error('Error loading project data:', error);
      showNotification('Error cargando los datos del proyecto', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el siguiente color disponible
  const getNextAvailableColor = () => {
    // Verificación defensiva: asegurar que areas sea un array válido
    if (!Array.isArray(areas)) {
      return DEFAULT_COLORS[0];
    }
    const usedColors = areas.map(area => area.color);
    const availableColor = DEFAULT_COLORS.find(color => !usedColors.includes(color));
    return availableColor || DEFAULT_COLORS[0];
  };

  // Función para contar conocimiento por área
  const getKnowledgeCountByArea = (areaId: string) => {
    // Verificación defensiva: asegurar que knowledge sea un array válido
    if (!Array.isArray(knowledge)) return 0;
    return knowledge.filter(k => 
      k.knowledge_areas && k.knowledge_areas.some(ka => ka.area_id === areaId)
    ).length;
  };

  // Función para obtener conocimiento por área
  const getKnowledgeByArea = (areaId: string) => {
    // Verificación defensiva: asegurar que knowledge sea un array válido
    if (!Array.isArray(knowledge)) return [];
    return knowledge.filter(k => 
      k.knowledge_areas && k.knowledge_areas.some(ka => ka.area_id === areaId)
    );
  };

  // Funciones para notificaciones
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Funciones de gestión de áreas
  const handleCreateArea = async () => {
    if (!newArea.name.trim()) return;

    setIsCreating(true);
    try {
      const response = await authenticatedFetch('/api/areas', {
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

      const area = await response.json();
      setAreas(prev => [...prev, area]);
      setNewArea({ name: '', description: '', color: getNextAvailableColor() });
      setShowCreateArea(false);
      showNotification(`Área "${area.name}" creada exitosamente`, 'success');
    } catch (error) {
      console.error('Error creating area:', error);
      showNotification('Error creando el área', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Funciones de gestión de conocimiento
  const handleAddManualKnowledge = async () => {
    if (!manualTitle.trim() || !manualContent.trim()) return;

    setIsAdding(true);
    try {
      const response = await authenticatedFetch('/api/knowledge', {
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

      const newKnowledge = await response.json();
      const knowledgeWithAreas = {
        ...newKnowledge,
        knowledge_areas: newKnowledge.knowledge_areas || []
      };
      setKnowledge(prev => [knowledgeWithAreas, ...prev]);
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

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('projectId', projectId);
      formData.append('title', uploadTitle || selectedFile.name);

      const response = await authenticatedFetch('/api/knowledge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error uploading file');
      }

      const newKnowledge = await response.json();
      const knowledgeWithAreas = {
        ...newKnowledge,
        knowledge_areas: newKnowledge.knowledge_areas || []
      };

      // Si se seleccionó un área, asignarla
      if (selectedAreaId) {
        const assignResponse = await authenticatedFetch(`/api/knowledge/${newKnowledge.id}/assign-areas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ areaIds: [selectedAreaId] }),
        });

        if (assignResponse.ok) {
                  const areaData = Array.isArray(areas) ? areas.find(a => a.id === selectedAreaId) : undefined;
          if (areaData) {
          knowledgeWithAreas.knowledge_areas = [{
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

      setKnowledge(prev => [knowledgeWithAreas, ...prev]);
      setSelectedFile(null);
      setUploadTitle('');
      setSelectedAreaId('');
      setShowUploadFile(false);
      showNotification('Archivo subido exitosamente', 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification(`Error subiendo archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Funciones de Drag & Drop
  const handleDragOver = (e: React.DragEvent, areaId?: string) => {
    e.preventDefault();
    setIsDragOver(true);
    if (areaId) {
      setDragTargetArea(areaId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragTargetArea(null);
  };

  const handleDrop = async (e: React.DragEvent, areaId?: string) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragTargetArea(null);
    
    // Solo permitir drop en la zona general, NO en áreas específicas
    if (areaId) {
      showNotification('Los archivos se deben arrastrar a la zona general para asignarlos después', 'info');
      return;
    }

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'text/plain' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    if (files.length === 0) {
      showNotification('Por favor, arrastra solo archivos .txt o .docx', 'error');
      return;
    }

    // Subir archivos en paralelo
    const uploadPromises = files.map(async (file) => {
      try {
        setUploadingFiles(prev => ({ ...prev, [file.name]: 'uploading' }));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

        const response = await authenticatedFetch('/api/knowledge', {
        method: 'POST',
          body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
          throw new Error(error.error || 'Error uploading file');
        }

        const newKnowledge = await response.json();
        console.log('📋 Datos del conocimiento recibido:', {
          id: newKnowledge.id,
          title: newKnowledge.title,
          hasContent: !!newKnowledge.content,
          contentLength: newKnowledge.content ? newKnowledge.content.length : 'undefined',
          fullObject: newKnowledge
        });
        
        const knowledgeWithAreas = {
          ...newKnowledge,
          knowledge_areas: newKnowledge.knowledge_areas || []
        };

        setUploadingFiles(prev => ({ ...prev, [file.name]: 'success' }));
        return knowledgeWithAreas;
    } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        setUploadingFiles(prev => ({ ...prev, [file.name]: 'error' }));
        throw error;
      }
    });

    try {
      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads = results
        .filter((result): result is PromiseFulfilledResult<Knowledge> => result.status === 'fulfilled')
        .map(result => result.value);

      if (successfulUploads.length > 0) {
        // Actualizar lista de conocimiento
        setKnowledge(prev => [...successfulUploads, ...prev]);
        
        // Preparar popup de asignación de áreas
        setPendingKnowledgeAssignments(successfulUploads);
        
        // Inicializar asignaciones con valores vacíos
        const initialAssignments: {[knowledgeId: string]: string} = {};
        successfulUploads.forEach(knowledge => {
          initialAssignments[knowledge.id] = '';
        });
        setKnowledgeAreaAssignments(initialAssignments);
        
        // Mostrar popup de asignación
        setShowAssignAreasModal(true);
      }

      const failedCount = results.filter(result => result.status === 'rejected').length;
      
      if (failedCount > 0) {
        showNotification(`${successfulUploads.length} archivos subidos correctamente, ${failedCount} fallaron.`, 'info');
      }

    } catch (error) {
      showNotification('Error en la subida de archivos', 'error');
    } finally {
      // Limpiar estados de subida después de un delay
      setTimeout(() => {
        setUploadingFiles({});
      }, 3000);
    }
  };

  const handleDeleteKnowledge = async (knowledgeItem: Knowledge) => {
    const confirmDelete = confirm(
      `¿Estás seguro de que quieres eliminar "${knowledgeItem.title}"?\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      const response = await authenticatedFetch(`/api/knowledge/${knowledgeItem.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error eliminando conocimiento');
      }

      setKnowledge(prev => prev.filter(k => k.id !== knowledgeItem.id));
      showNotification(`"${knowledgeItem.title}" eliminado exitosamente`, 'success');
      
    } catch (error) {
      console.error('Error deleting knowledge:', error);
      showNotification(`Error eliminando conocimiento: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    }
  };

  const toggleAreaSources = (areaId: string) => {
    setExpandedAreaSources(prev => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  const handleViewKnowledge = (knowledgeItem: Knowledge) => {
    setSelectedKnowledge(knowledgeItem);
    setShowViewKnowledge(true);
  };

  // Función de consolidación de área
  const handleConsolidateArea = async (area: Area) => {
    setConsolidatingArea(area.id);
    try {
      const response = await authenticatedFetch(`/api/areas/${area.id}/consolidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error consolidating area');
      }

      const consolidatedData = await response.json();
      setConsolidatedKnowledge(prev => ({
        ...prev,
        [area.id]: consolidatedData
      }));

      showNotification(`Área "${area.name}" consolidada exitosamente`, 'success');
    } catch (error) {
      console.error('Error consolidating area:', error);
      showNotification(`Error consolidando área: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
    } finally {
      setConsolidatingArea(null);
    }
  };

  const handleViewConsolidated = (area: Area) => {
    setSelectedAreaForConsolidated(area);
    setShowViewConsolidated(true);
  };

  // Funciones del popup de asignación de áreas
  const handleAssignmentChange = (knowledgeId: string, areaId: string) => {
    setKnowledgeAreaAssignments(prev => ({
      ...prev,
      [knowledgeId]: areaId
    }));
  };

  const handleConfirmAssignments = async () => {
    try {
      console.log('🔄 Iniciando asignaciones de áreas...');
      console.log('📋 Pending assignments:', pendingKnowledgeAssignments);
      console.log('📋 Area assignments:', knowledgeAreaAssignments);
      console.log('📍 Available areas:', areas);
      
      const assignmentPromises = pendingKnowledgeAssignments.map(async (knowledge) => {
        const areaId = knowledgeAreaAssignments[knowledge.id];
        console.log(`🔗 Asignando knowledge ${knowledge.id} a área ${areaId}`);
        
        if (areaId) {
          const response = await authenticatedFetch(`/api/knowledge/${knowledge.id}/assign-areas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ areaIds: [areaId] }),
          });

          if (response.ok) {
            const areaData = areas.find(a => a.id === areaId);
            if (areaData) {
              return {
                ...knowledge,
                knowledge_areas: [{
                  area_id: areaId,
                  areas: {
                    id: areaData.id,
                    name: areaData.name,
                    color: areaData.color
                  }
                }]
              };
            }
          }
        }
        return knowledge;
      });

      const updatedKnowledge = await Promise.all(assignmentPromises);
      
      // Actualizar la lista de conocimiento con las asignaciones
      setKnowledge(prev => {
        const newKnowledge = [...prev];
        updatedKnowledge.forEach(updated => {
          const index = newKnowledge.findIndex(k => k.id === updated.id);
          if (index !== -1) {
            newKnowledge[index] = updated;
          }
        });
        return newKnowledge;
      });

      // Cerrar popup
      setShowAssignAreasModal(false);
      setPendingKnowledgeAssignments([]);
      setKnowledgeAreaAssignments({});

      // Mostrar notificación de éxito
      const assignedCount = Object.values(knowledgeAreaAssignments).filter(areaId => areaId).length;
      if (assignedCount > 0) {
        showNotification(`¡${assignedCount} archivos asignados exitosamente!`, 'success');
      } else {
        showNotification('Archivos subidos sin asignar a áreas', 'info');
      }
      
    } catch (error) {
      console.error('Error assigning areas:', error);
      showNotification('Error asignando áreas al conocimiento', 'error');
    }
  };

  const handleSkipAssignments = () => {
    setShowAssignAreasModal(false);
    setPendingKnowledgeAssignments([]);
    setKnowledgeAreaAssignments({});
    showNotification('Archivos subidos sin asignar a áreas', 'info');
  };

  // Funciones de progreso
  const getStepProgress = () => {
    let completed = 0;
    if (project?.step_1_completed) completed += 25;
    if (project?.step_2_completed) completed += 25;
    if (project?.step_3_completed) completed += 25;
    if (project?.step_4_completed) completed += 25;
    return completed;
  };

  const getStep1Completion = () => {
    // Verificación defensiva: asegurar que areas sea un array válido
    if (!Array.isArray(areas) || areas.length === 0) return 0;
    
    const areasWithKnowledge = areas.filter(area => getKnowledgeCountByArea(area.id) > 0);
    const areasWithConsolidation = areas.filter(area => consolidatedKnowledge[area.id]);
    
    const knowledgeProgress = (areasWithKnowledge.length / areas.length) * 50;
    const consolidationProgress = (areasWithConsolidation.length / areas.length) * 50;
    
    return knowledgeProgress + consolidationProgress;
  };

  // ========== FUNCIONES PASO 2: AS IS ANALYSIS ==========

  const handleGenerateAnalysis = async () => {
    try {
      setGeneratingAnalysis(true);

      const response = await authenticatedFetch(`/api/projects/${projectId}/analysis-as-is`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generando análisis AS IS');
      }

      const analysisData = await response.json();
      setAnalysisAsIs(analysisData);
      showNotification('Análisis AS IS generado exitosamente', 'success');
      
    } catch (error: any) {
      console.error('Error generando análisis:', error);
      showNotification(error.message || 'Error generando análisis AS IS', 'error');
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const handleEditAnalysis = () => {
    if (analysisAsIs) {
      setAnalysisEditData({
        strategy_governance: analysisAsIs.strategy_governance || '',
        processes_operations: analysisAsIs.processes_operations || '',
        technology_infrastructure: analysisAsIs.technology_infrastructure || '',
        data_information: analysisAsIs.data_information || '',
        people_culture: analysisAsIs.people_culture || '',
        customer_experience: analysisAsIs.customer_experience || '',
        conclusions: analysisAsIs.conclusions || ''
      });
      setEditingAnalysis(true);
      setShowAnalysisModal(true);
    }
  };

  const handleSaveAnalysis = async () => {
    try {
      const response = await authenticatedFetch(`/api/projects/${projectId}/analysis-as-is`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisEditData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error actualizando análisis AS IS');
      }

      const updatedAnalysis = await response.json();
      setAnalysisAsIs(updatedAnalysis);
      setShowAnalysisModal(false);
      setEditingAnalysis(false);
      showNotification('Análisis AS IS actualizado exitosamente', 'success');
      
    } catch (error: any) {
      console.error('Error actualizando análisis:', error);
      showNotification(error.message || 'Error actualizando análisis AS IS', 'error');
    }
  };

  const handleValidateAnalysis = async () => {
    try {
      const response = await authenticatedFetch(`/api/projects/${projectId}/analysis-as-is`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...analysisAsIs, validated: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error validando análisis AS IS');
      }

      const updatedAnalysis = await response.json();
      setAnalysisAsIs(updatedAnalysis);
      showNotification('Análisis AS IS validado exitosamente', 'success');
      
      // Avanzar al paso 3 automáticamente
      await advanceStep(2);
      
    } catch (error: any) {
      console.error('Error validando análisis:', error);
      showNotification(error.message || 'Error validando análisis AS IS', 'error');
    }
  };

  // ========== FUNCIONES PASO 3: RECOMMENDATIONS ==========

  const handleGenerateRecommendations = async () => {
    try {
      setGeneratingRecommendations(true);

      const response = await authenticatedFetch(`/api/projects/${projectId}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generando recomendaciones');
      }

      const recommendationsData = await response.json();
      setRecommendations(recommendationsData);
      showNotification('Recomendaciones generadas exitosamente', 'success');
      
    } catch (error: any) {
      console.error('Error generando recomendaciones:', error);
      showNotification(error.message || 'Error generando recomendaciones', 'error');
    } finally {
      setGeneratingRecommendations(false);
    }
  };

  const handleUpdateRecommendationStatus = async (recommendationId: string, status: string) => {
    try {
      // Verificación defensiva: asegurar que recommendations sea un array válido
      if (!Array.isArray(recommendations)) {
        showNotification('Error: datos de recomendaciones no válidos', 'error');
        return;
      }
      const updatedRecommendations = recommendations.map(rec => 
        rec.id === recommendationId ? { ...rec, status } : rec
      );

      const response = await authenticatedFetch(`/api/projects/${projectId}/recommendations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recommendations: updatedRecommendations }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error actualizando recomendaciones');
      }

      const updatedData = await response.json();
      setRecommendations(updatedData);
      showNotification('Recomendación actualizada', 'success');
      
    } catch (error: any) {
      console.error('Error actualizando recomendación:', error);
      showNotification(error.message || 'Error actualizando recomendación', 'error');
    }
  };

  const getAcceptedRecommendationsCount = () => {
    // Verificación defensiva: asegurar que recommendations sea un array válido
    if (!Array.isArray(recommendations)) return 0;
    return recommendations.filter(rec => rec.status === 'accepted').length;
  };

  // ========== FUNCIONES PASO 4: PROJECT SHEETS ==========

  const handleGenerateProjectSheets = async () => {
    try {
      setGeneratingSheets(true);

      const response = await authenticatedFetch(`/api/projects/${projectId}/project-sheets`, {
            method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          });

          if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generando fichas de proyecto');
      }

      const sheetsData = await response.json();
      setProjectSheets(sheetsData);
      showNotification('Fichas de proyecto generadas exitosamente', 'success');
      
    } catch (error: any) {
      console.error('Error generando fichas:', error);
      showNotification(error.message || 'Error generando fichas de proyecto', 'error');
    } finally {
      setGeneratingSheets(false);
    }
  };

  const handleValidateSheet = async (sheetId: string) => {
    try {
      const updatedSheets = projectSheets.map(sheet => 
        sheet.id === sheetId ? { ...sheet, validated: true } : sheet
      );

      const response = await authenticatedFetch(`/api/projects/${projectId}/project-sheets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectSheets: updatedSheets }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error validando ficha de proyecto');
      }

      const updatedData = await response.json();
      setProjectSheets(updatedData);
      showNotification('Ficha de proyecto validada', 'success');
      
    } catch (error: any) {
      console.error('Error validando ficha:', error);
      showNotification(error.message || 'Error validando ficha de proyecto', 'error');
    }
  };

  // ========== FUNCIÓN GENERAL PARA AVANZAR PASOS ==========

  const advanceStep = async (completedStep: number) => {
    try {
      const response = await authenticatedFetch(`/api/projects/${projectId}/advance-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completedStep }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error avanzando paso');
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      setCurrentStep(updatedProject.current_step);
      showNotification(`Paso ${completedStep} completado. Avanzando al paso ${updatedProject.current_step}`, 'success');
      
    } catch (error: any) {
      console.error('Error avanzando paso:', error);
      showNotification(error.message || 'Error avanzando paso', 'error');
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
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-blue-600 font-medium">Flujo Guiado</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={`/projects/${projectId}`} className="text-gray-600 hover:text-gray-800">
                Vista Clásica
              </Link>
              <span className="text-sm text-gray-600">{user.email}</span>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                Volver al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
              <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600">Flujo de Consultoría Guiado - 4 Pasos</p>
                </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Progreso General</div>
              <div className="text-2xl font-bold text-blue-600">{getStepProgress().toFixed(0)}%</div>
              </div>
            </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getStepProgress()}%` }}
            ></div>
          </div>

          {/* Steps Navigation */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { number: 1, title: 'Base de Conocimiento', completed: project.step_1_completed, current: currentStep === 1 },
              { number: 2, title: 'AS IS', completed: project.step_2_completed, current: currentStep === 2 },
              { number: 3, title: 'TO BE', completed: project.step_3_completed, current: currentStep === 3 },
              { number: 4, title: 'TO DO', completed: project.step_4_completed, current: currentStep === 4 }
            ].map((step) => (
              <div 
                key={step.number}
                className={`p-3 rounded-lg border-2 text-center cursor-pointer transition-all ${
                  step.current 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : step.completed 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-300 bg-gray-50 text-gray-500'
                }`}
                onClick={() => setCurrentStep(step.number)}
              >
                <div className="flex items-center justify-center mb-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.completed ? 'bg-green-500 text-white' : 
                    step.current ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step.completed ? '✓' : step.number}
            </div>
          </div>
                <div className="text-xs font-medium">{step.title}</div>
        </div>
            ))}
              </div>
            </div>
          </div>
          
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* PASO 1: BASE DE CONOCIMIENTO */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Paso 1: Base de Conocimiento
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Organiza el conocimiento por áreas y genera consolidaciones inteligentes con IA
                </p>
              </div>
              <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Completado</div>
                  <div className="text-2xl font-bold text-green-600">{getStep1Completion().toFixed(0)}%</div>
                </div>
              </div>
              
              {/* Step 1 Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getStep1Completion()}%` }}
                ></div>
          </div>
          </div>

          <div className="p-6">
              {/* Action Buttons */}
              <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => {
                      setNewArea({ name: '', description: '', color: getNextAvailableColor() });
                      setShowCreateArea(true);
                    }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    + Crear Área
                  </button>
                <button
                  onClick={() => setShowAddKnowledge(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  📝 Añadir Conocimiento
                </button>
                <button
                  onClick={() => setShowUploadFile(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  📄 Subir Archivo
                </button>
              </div>

              {/* Drag & Drop Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 mb-6 transition-colors ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDragOver={(e) => handleDragOver(e)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e)}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">📎</div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">
                    Arrastra archivos aquí para añadir conocimiento
                  </h4>
                  <p className="text-gray-500 mb-4">
                    Soporta archivos .txt y .docx. Después de subir los archivos podrás asignarlos a las áreas correspondientes.
                  </p>
                  <div className="flex justify-center">
                    <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium cursor-pointer">
                      O selecciona archivos
                      <input
                        type="file"
                        multiple
                        accept=".txt,.docx"
                        onChange={async (e) => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files).filter(file => 
                              file.type === 'text/plain' || 
                              file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                            );

                            if (files.length === 0) {
                              showNotification('Por favor, selecciona solo archivos .txt o .docx', 'error');
                              return;
                            }

                            // Simular el mismo comportamiento que el drag & drop
                            const fakeEvent = {
                              preventDefault: () => {},
                              dataTransfer: { files }
                            } as any;
                            
                            await handleDrop(fakeEvent);

                            // Limpiar el input
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Upload Progress */}
                {Object.keys(uploadingFiles).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Subiendo archivos:</h5>
                    {Object.entries(uploadingFiles).map(([fileName, status]) => (
                      <div key={fileName} className="flex items-center space-x-2 text-sm">
                        <div className={`w-4 h-4 rounded-full ${
                          status === 'uploading' ? 'bg-blue-500 animate-spin' :
                          status === 'success' ? 'bg-green-500' :
                          status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                        }`}>
                          {status === 'success' && <span className="text-white text-xs">✓</span>}
                          {status === 'error' && <span className="text-white text-xs">✗</span>}
                        </div>
                        <span className="text-gray-700">{fileName}</span>
                        <span className={`capitalize ${
                          status === 'success' ? 'text-green-600' :
                          status === 'error' ? 'text-red-600' :
                          status === 'uploading' ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {status === 'uploading' ? 'Subiendo...' : 
                           status === 'success' ? 'Completado' :
                           status === 'error' ? 'Error' : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Crear primera área
                    </button>
                  </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {areas.map((area) => {
                      const knowledgeCount = getKnowledgeCountByArea(area.id);
                    const hasConsolidated = consolidatedKnowledge[area.id];
                    const isConsolidating = consolidatingArea === area.id;
                    
                      return (
                      <div 
                        key={area.id} 
                        className="border-2 border-gray-200 hover:border-gray-300 rounded-lg p-6 hover:shadow-md transition-all"
                      >
                        {/* Area Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-3"
                                style={{ backgroundColor: area.color }}
                              ></div>
                            <h4 className="font-semibold text-gray-900">{area.name}</h4>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                              onClick={() => toggleAreaSources(area.id)}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                                >
                              {knowledgeCount} {knowledgeCount === 1 ? 'fuente' : 'fuentes'}
                              <span className="ml-1">{expandedAreaSources[area.id] ? '▼' : '▶'}</span>
                                </button>
                            {hasConsolidated && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                ✓ Consolidado
                              </span>
                              )}
                            </div>
                          </div>

                        {/* Area Description */}
                          {area.description && (
                          <p className="text-gray-600 text-sm mb-4">{area.description}</p>
                        )}

                        {/* Sources List - Expandable */}
                        {expandedAreaSources[area.id] && knowledgeCount > 0 && (
                          <div className="mb-4 bg-gray-50 rounded-lg p-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Fuentes de Conocimiento:</h5>
                            <div className="space-y-2">
                                                            {getKnowledgeByArea(area.id).map((knowledgeItem) => (
                                <div key={knowledgeItem.id} className="flex items-center justify-between bg-white p-2 rounded border">
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <div className="text-sm flex-shrink-0">
                                      {knowledgeItem.source_type === 'upload' ? '📄' : '📝'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        {knowledgeItem.title}
                                      </div>
                                      <div className="text-xs text-gray-500 truncate">
                                        {knowledgeItem.source_type === 'upload' ? 'Archivo' : 'Manual'} • {new Date(knowledgeItem.uploaded_at).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                    <button
                                      onClick={() => handleViewKnowledge(knowledgeItem)}
                                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                      title="Ver contenido"
                                    >
                                      👁️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteKnowledge(knowledgeItem)}
                                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                      title="Eliminar"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}



                        {/* Area Actions */}
                        <div className="space-y-2">
                          <button
                            onClick={() => handleConsolidateArea(area)}
                            disabled={knowledgeCount === 0 || isConsolidating}
                            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                              knowledgeCount === 0 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isConsolidating
                                  ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                                  : hasConsolidated
                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {isConsolidating ? (
                              <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                Consolidando con IA...
                              </span>
                            ) : hasConsolidated ? (
                              '🔄 Regenerar Consolidación'
                            ) : (
                              '🤖 Consolidar con IA'
                            )}
                          </button>

                          {hasConsolidated && (
                            <button
                              onClick={() => handleViewConsolidated(area)}
                              className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200"
                            >
                              👁️ Ver Conocimiento Consolidado
                            </button>
                          )}
                        </div>

                        {/* Area Meta */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="text-xs text-gray-500">
                            Creada: {new Date(area.created_at).toLocaleDateString('es-ES')}
                          </div>
                          {hasConsolidated && (
                            <div className="text-xs text-gray-500 mt-1">
                              Consolidado: {new Date(consolidatedKnowledge[area.id].updated_at).toLocaleDateString('es-ES')}
                            </div>
                          )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
              </div>
            )}

        {/* PASO 2: ANÁLISIS AS IS */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Paso 2: Análisis AS IS
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Análisis del estado actual de la organización según los 6 ejes de transformación digital
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Estado</div>
                  <div className={`text-2xl font-bold ${analysisAsIs?.validated ? 'text-green-600' : 'text-yellow-600'}`}>
                    {analysisAsIs?.validated ? 'Validado' : analysisAsIs ? 'Generado' : 'Pendiente'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {!analysisAsIs ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Análisis AS IS no generado
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Genera un análisis completo del estado actual de la organización basado en el conocimiento consolidado.
                  </p>
                      <button
                    onClick={handleGenerateAnalysis}
                    disabled={generatingAnalysis}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                  >
                    {generatingAnalysis ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generando con IA...
                      </span>
                    ) : (
                      '🤖 Generar Análisis AS IS'
                    )}
                      </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Analysis Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        analysisAsIs.validated 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {analysisAsIs.validated ? '✓ Validado' : '⏳ Pendiente de Validación'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Versión {analysisAsIs.version} • {new Date(analysisAsIs.updated_at).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleEditAnalysis}
                        className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                      >
                        ✏️ Editar
                      </button>
                      {!analysisAsIs.validated && (
                      <button
                          onClick={handleValidateAnalysis}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                          ✅ Validar y Continuar
                      </button>
                      )}
                    </div>
                  </div>

                  {/* Analysis Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[
                      { key: 'strategy_governance', title: '1. Estrategia y Gobierno', content: analysisAsIs.strategy_governance },
                      { key: 'processes_operations', title: '2. Procesos y Operaciones', content: analysisAsIs.processes_operations },
                      { key: 'technology_infrastructure', title: '3. Tecnología e Infraestructura', content: analysisAsIs.technology_infrastructure },
                      { key: 'data_information', title: '4. Datos e Información', content: analysisAsIs.data_information },
                      { key: 'people_culture', title: '5. Personas y Cultura', content: analysisAsIs.people_culture },
                      { key: 'customer_experience', title: '6. Experiencia del Cliente', content: analysisAsIs.customer_experience }
                    ].map((section) => (
                      <div key={section.key} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">{section.title}</h4>
                        <div className="text-sm text-gray-700 max-h-48 overflow-y-auto">
                          {section.content ? (
                            <pre className="whitespace-pre-wrap font-sans">{section.content}</pre>
                          ) : (
                            <span className="text-gray-400 italic">Sin contenido</span>
                    )}
                  </div>
                      </div>
                    ))}
                </div>

                  {/* Conclusions */}
                  {analysisAsIs.conclusions && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-3">Conclusiones Generales</h4>
                      <div className="text-sm text-gray-700">
                        <pre className="whitespace-pre-wrap font-sans">{analysisAsIs.conclusions}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 3: RECOMENDACIONES TO BE */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Paso 3: Recomendaciones TO BE
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Proyectos recomendados para la transformación digital de la organización
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Aprobadas</div>
                  <div className="text-2xl font-bold text-green-600">
                    {getAcceptedRecommendationsCount()}/{recommendations.length}
                  </div>
                    </div>
                  </div>
                </div>

            <div className="p-6">
              {recommendations.length === 0 ? (
                  <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💡</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Recomendaciones no generadas
                    </h3>
                  <p className="text-gray-500 mb-6">
                    Genera recomendaciones de proyectos basadas en el análisis AS IS validado.
                    </p>
                      <button
                    onClick={handleGenerateRecommendations}
                    disabled={generatingRecommendations}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                  >
                    {generatingRecommendations ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generando con IA...
                      </span>
                    ) : (
                      '🤖 Generar Recomendaciones'
                    )}
                      </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4">
                      <button
                        onClick={handleGenerateRecommendations}
                        disabled={generatingRecommendations}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                      >
                        🔄 Regenerar Recomendaciones
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      {getAcceptedRecommendationsCount() > 0 && (
                        <span className="text-green-600 font-medium">
                          ✓ {getAcceptedRecommendationsCount()} recomendaciones aprobadas para el paso 4
                        </span>
                      )}
                  </div>
                            </div>

                  {/* Categories Filter */}
                  <div className="flex flex-wrap gap-3">
                    {['technological', 'training', 'cultural', 'methodological'].map((category) => {
                      const count = recommendations.filter(rec => rec.category === category).length;
                      const categoryNames = {
                        technological: 'Tecnológicos',
                        training: 'Formativos',
                        cultural: 'Culturales',
                        methodological: 'Metodológicos'
                      };
                      
                      return (
                        <div key={category} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {categoryNames[category as keyof typeof categoryNames]}: {count}
                        </div>
                      );
                    })}
                  </div>

                  {/* Recommendations Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {recommendations.map((recommendation) => (
                      <div key={recommendation.id} className="border border-gray-200 rounded-lg p-6">
                        {/* Recommendation Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">{recommendation.title}</h4>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                recommendation.category === 'technological' ? 'bg-blue-100 text-blue-800' :
                                recommendation.category === 'training' ? 'bg-green-100 text-green-800' :
                                recommendation.category === 'cultural' ? 'bg-purple-100 text-purple-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {recommendation.category === 'technological' ? 'Tecnológico' :
                                 recommendation.category === 'training' ? 'Formativo' :
                                 recommendation.category === 'cultural' ? 'Cultural' : 'Metodológico'}
                              </span>
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                                Prioridad: {recommendation.priority}/10
                              </span>
                              </div>
                            </div>
                          </div>

                        {/* Description */}
                        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                          {recommendation.description}
                        </p>

                        {/* Status and Actions */}
                        <div className="flex items-center justify-between">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            recommendation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            recommendation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            recommendation.status === 'modified' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {recommendation.status === 'accepted' ? '✓ Aprobada' :
                             recommendation.status === 'rejected' ? '✗ Rechazada' :
                             recommendation.status === 'modified' ? '📝 Modificada' : '⏳ Propuesta'}
                        </div>

                          <div className="flex space-x-2">
                            {recommendation.status !== 'accepted' && (
                              <button
                                onClick={() => handleUpdateRecommendationStatus(recommendation.id, 'accepted')}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                ✓ Aprobar
                              </button>
                            )}
                            {recommendation.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateRecommendationStatus(recommendation.id, 'rejected')}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                ✗ Rechazar
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedRecommendation(recommendation);
                                setShowRecommendationModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              👁️ Ver
                            </button>
                          </div>
                        </div>
                      </div>
                              ))}
                            </div>

                  {/* Continue to Step 4 */}
                  {getAcceptedRecommendationsCount() > 0 && (
                    <div className="text-center pt-6 border-t border-gray-200">
                      <button
                        onClick={() => advanceStep(3)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                      >
                        ➡️ Continuar al Paso 4 con {getAcceptedRecommendationsCount()} proyectos aprobados
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 4: FICHAS DE PROYECTO TO DO */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Paso 4: Fichas de Proyecto TO DO
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Documentación detallada de los proyectos aprobados para su implementación
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Fichas Generadas</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {projectSheets.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {projectSheets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Fichas de proyecto no generadas
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Genera fichas detalladas para todos los proyectos aprobados en el paso anterior.
                  </p>
                  <button
                    onClick={handleGenerateProjectSheets}
                    disabled={generatingSheets}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                  >
                    {generatingSheets ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generando fichas...
                      </span>
                    ) : (
                      '🤖 Generar Fichas de Proyecto'
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleGenerateProjectSheets}
                      disabled={generatingSheets}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                      🔄 Regenerar Fichas
                    </button>
                    <div className="text-sm text-gray-600">
                      {projectSheets.filter(sheet => sheet.validated).length} de {projectSheets.length} fichas validadas
                    </div>
                        </div>

                  {/* Project Sheets Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {projectSheets.map((sheet) => (
                      <div key={sheet.id} className="border border-gray-200 rounded-lg p-6">
                        {/* Sheet Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">{sheet.title}</h4>
                            {sheet.project_recommendations && (
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  sheet.project_recommendations.category === 'technological' ? 'bg-blue-100 text-blue-800' :
                                  sheet.project_recommendations.category === 'training' ? 'bg-green-100 text-green-800' :
                                  sheet.project_recommendations.category === 'cultural' ? 'bg-purple-100 text-purple-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {sheet.project_recommendations.category === 'technological' ? 'Tecnológico' :
                                   sheet.project_recommendations.category === 'training' ? 'Formativo' :
                                   sheet.project_recommendations.category === 'cultural' ? 'Cultural' : 'Metodológico'}
                                </span>
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                                  Prioridad: {sheet.project_recommendations.priority}/10
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            sheet.validated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sheet.validated ? '✓ Validada' : '⏳ Pendiente'}
                          </div>
                        </div>

                        {/* Sheet Summary */}
                        <div className="space-y-3 text-sm">
                          {sheet.estimated_investment && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Inversión estimada:</span>
                              <span className="font-medium">€{sheet.estimated_investment.toLocaleString()}</span>
                            </div>
                          )}
                          {sheet.estimated_duration && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duración estimada:</span>
                              <span className="font-medium">{Math.round(sheet.estimated_duration / 30)} meses</span>
                            </div>
                          )}
                          <div className="text-gray-700">
                            <p className="line-clamp-3">{sheet.description}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <button 
                            onClick={() => {
                              setSelectedSheet(sheet);
                              setShowSheetModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            👁️ Ver Completa
                          </button>
                          {!sheet.validated && (
                          <button 
                              onClick={() => handleValidateSheet(sheet.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                              ✓ Validar
                          </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Complete Project */}
                  {projectSheets.length > 0 && projectSheets.every(sheet => sheet.validated) && (
                    <div className="text-center pt-6 border-t border-gray-200">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="text-green-600 text-6xl mb-4">🎉</div>
                        <h3 className="text-xl font-bold text-green-800 mb-2">
                          ¡Felicitaciones! Flujo de Consultoría Completado
                        </h3>
                        <p className="text-green-700 mb-4">
                          Has completado exitosamente los 4 pasos del proceso de consultoría guiado.
                          Todas las fichas de proyecto están validadas y listas para implementación.
                        </p>
                          <button 
                          onClick={() => advanceStep(4)}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                          >
                          ✅ Marcar Proyecto como Completado
                          </button>
                        </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}
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

      {/* Modal: Add Knowledge */}
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

      {/* Modal: View Consolidated Knowledge */}
      {showViewConsolidated && selectedAreaForConsolidated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Conocimiento Consolidado: {selectedAreaForConsolidated.name}
            </h3>
            
            {consolidatedKnowledge[selectedAreaForConsolidated.id] && (
              <div>
                <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <p><strong>Generado por IA:</strong> {consolidatedKnowledge[selectedAreaForConsolidated.id].ai_generated ? 'Sí' : 'No'}</p>
                  <p><strong>Fuentes originales:</strong> {consolidatedKnowledge[selectedAreaForConsolidated.id].original_sources_count}</p>
                  <p><strong>Última actualización:</strong> {new Date(consolidatedKnowledge[selectedAreaForConsolidated.id].updated_at).toLocaleString()}</p>
                  <p><strong>Validado:</strong> {consolidatedKnowledge[selectedAreaForConsolidated.id].validated ? 'Sí' : 'No'}</p>
              </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {consolidatedKnowledge[selectedAreaForConsolidated.id].content}
                  </pre>
                  </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowViewConsolidated(false);
                  setSelectedAreaForConsolidated(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cerrar
              </button>
              {consolidatedKnowledge[selectedAreaForConsolidated.id] && (
              <button
                  onClick={() => {
                    navigator.clipboard.writeText(consolidatedKnowledge[selectedAreaForConsolidated.id].content);
                    showNotification('Contenido copiado al portapapeles', 'success');
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Copiar Texto
              </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Analysis AS IS */}
      {showAnalysisModal && analysisAsIs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ✏️ Editar Análisis AS IS
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { key: 'strategy_governance', title: '1. Estrategia y Gobierno' },
                { key: 'processes_operations', title: '2. Procesos y Operaciones' },
                { key: 'technology_infrastructure', title: '3. Tecnología e Infraestructura' },
                { key: 'data_information', title: '4. Datos e Información' },
                { key: 'people_culture', title: '5. Personas y Cultura' },
                { key: 'customer_experience', title: '6. Experiencia del Cliente' }
              ].map((section) => (
                <div key={section.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {section.title}
                      </label>
                  <textarea
                    value={String(analysisEditData[section.key as keyof AnalysisAsIs] || '')}
                    onChange={(e) => setAnalysisEditData(prev => ({
                      ...prev,
                      [section.key]: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    rows={6}
                    placeholder={`Análisis de ${section.title.toLowerCase()}...`}
                  />
                    </div>
              ))}
            </div>

            {/* Conclusions */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conclusiones Generales
              </label>
              <textarea
                value={analysisEditData.conclusions || ''}
                onChange={(e) => setAnalysisEditData(prev => ({
                  ...prev,
                  conclusions: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={4}
                placeholder="Conclusiones generales del análisis..."
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  setAnalysisEditData({});
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAnalysis}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                💾 Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Recommendation Details */}
      {showRecommendationModal && selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💡 Detalle de Recomendación
            </h3>
            
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedRecommendation.title}
                </h4>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedRecommendation.category === 'technological' ? 'bg-blue-100 text-blue-800' :
                    selectedRecommendation.category === 'training' ? 'bg-green-100 text-green-800' :
                    selectedRecommendation.category === 'cultural' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {selectedRecommendation.category === 'technological' ? 'Tecnológico' :
                     selectedRecommendation.category === 'training' ? 'Formativo' :
                     selectedRecommendation.category === 'cultural' ? 'Cultural' : 'Metodológico'}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    Prioridad: {selectedRecommendation.priority}/10
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedRecommendation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    selectedRecommendation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    selectedRecommendation.status === 'modified' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedRecommendation.status === 'accepted' ? '✓ Aprobada' :
                     selectedRecommendation.status === 'rejected' ? '✗ Rechazada' :
                     selectedRecommendation.status === 'modified' ? '📝 Modificada' : '⏳ Propuesta'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Descripción</h5>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {selectedRecommendation.description}
                  </pre>
                </div>
              </div>

              {/* Justification */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Justificación</h5>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {selectedRecommendation.justification}
                  </pre>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Generado por IA:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedRecommendation.ai_generated ? 'Sí' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Validado:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedRecommendation.validated ? 'Sí' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Creado:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(selectedRecommendation.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Actualizado:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(selectedRecommendation.updated_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                {selectedRecommendation.status !== 'accepted' && (
                  <button
                    onClick={() => {
                      handleUpdateRecommendationStatus(selectedRecommendation.id, 'accepted');
                      setShowRecommendationModal(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    ✓ Aprobar
                  </button>
                )}
                {selectedRecommendation.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      handleUpdateRecommendationStatus(selectedRecommendation.id, 'rejected');
                      setShowRecommendationModal(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    ✗ Rechazar
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRecommendationModal(false);
                  setSelectedRecommendation(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
              </div>
            )}
            
      {/* Modal: View Project Sheet Details */}
      {showSheetModal && selectedSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Ficha de Proyecto Completa
            </h3>
            
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedSheet.title}
                </h4>
                <div className="flex items-center space-x-3">
                  {selectedSheet.project_recommendations && (
                    <>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedSheet.project_recommendations.category === 'technological' ? 'bg-blue-100 text-blue-800' :
                        selectedSheet.project_recommendations.category === 'training' ? 'bg-green-100 text-green-800' :
                        selectedSheet.project_recommendations.category === 'cultural' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {selectedSheet.project_recommendations.category === 'technological' ? 'Tecnológico' :
                         selectedSheet.project_recommendations.category === 'training' ? 'Formativo' :
                         selectedSheet.project_recommendations.category === 'cultural' ? 'Cultural' : 'Metodológico'}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                        Prioridad: {selectedSheet.project_recommendations.priority}/10
                      </span>
                    </>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedSheet.validated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedSheet.validated ? '✓ Validada' : '⏳ Pendiente'}
                  </span>
                </div>
              </div>

              {/* Investment and Duration Summary */}
              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    €{selectedSheet.estimated_investment ? selectedSheet.estimated_investment.toLocaleString() : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Inversión Estimada</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedSheet.estimated_duration ? Math.round(selectedSheet.estimated_duration / 30) : 'N/A'} meses
                  </div>
                  <div className="text-sm text-gray-600">Duración Estimada</div>
                </div>
              </div>

              {/* Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">📝 Descripción</h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {selectedSheet.description}
              </pre>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">🎯 Objetivos Estratégicos</h5>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {selectedSheet.strategic_objectives}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">💰 Beneficios Esperados</h5>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {selectedSheet.expected_benefits}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">👥 Recursos Humanos</h5>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {selectedSheet.human_resources}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">💻 Recursos Tecnológicos</h5>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {selectedSheet.technological_resources}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">🏢 Áreas Involucradas</h5>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {selectedSheet.involved_areas}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Creado:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(selectedSheet.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Actualizado:</span>
                    <span className="ml-2 text-gray-600">  
                      {new Date(selectedSheet.updated_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Action */}
              {!selectedSheet.validated && (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <button
                    onClick={() => {
                      handleValidateSheet(selectedSheet.id);
                      setShowSheetModal(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    ✅ Validar Ficha de Proyecto
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSheetModal(false);
                  setSelectedSheet(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  // Create download content
                  const content = `
FICHA DE PROYECTO: ${selectedSheet.title}
================================================

DESCRIPCIÓN:
${selectedSheet.description}

OBJETIVOS ESTRATÉGICOS:
${selectedSheet.strategic_objectives}

BENEFICIOS ESPERADOS:
${selectedSheet.expected_benefits}

RECURSOS HUMANOS:
${selectedSheet.human_resources}

RECURSOS TECNOLÓGICOS:
${selectedSheet.technological_resources}

ÁREAS INVOLUCRADAS:
${selectedSheet.involved_areas}

INVERSIÓN ESTIMADA: €${selectedSheet.estimated_investment?.toLocaleString() || 'N/A'}
DURACIÓN ESTIMADA: ${selectedSheet.estimated_duration ? Math.round(selectedSheet.estimated_duration / 30) : 'N/A'} meses

Generado el: ${new Date().toLocaleDateString('es-ES')}
                  `.trim();
                  
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Ficha_Proyecto_${selectedSheet.title.replace(/\s+/g, '_')}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  showNotification('Ficha descargada correctamente', 'success');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                📥 Descargar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal: Upload File */}
      {showUploadFile && (
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
                  Archivo (.txt, .docx)
                </label>
                <input
                  type="file"
                  accept=".txt,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    📄 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asignar a área (opcional)
                                  </label>
                                                                     <select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                  setShowUploadFile(false);
                  setSelectedFile(null);
                  setUploadTitle('');
                  setSelectedAreaId('');
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

      {/* Modal: Assign Areas to Knowledge */}
      {showAssignAreasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📂 Asignar Conocimiento a Áreas
            </h3>
            
            <p className="text-gray-600 mb-6">
              Selecciona el área correspondiente para cada archivo subido. Puedes dejar archivos sin asignar si lo prefieres.
            </p>

            <div className="space-y-4 mb-6">
              {pendingKnowledgeAssignments.map((knowledge) => (
                <div key={knowledge.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">📄</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {knowledge.title}
                      </h4>
                                             <div className="text-sm text-gray-500 mb-3">
                         {knowledge.file_name && (
                           <span>Archivo: {knowledge.file_name}</span>
                         )}
                         {knowledge.file_size && (
                           <span className="ml-3">
                             Tamaño: {(knowledge.file_size / 1024 / 1024).toFixed(2)} MB
                           </span>
                         )}
                         <span className="ml-3">
                           Caracteres: {knowledge.content ? knowledge.content.length.toLocaleString() : 'No disponible'}
                         </span>
                       </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">
                          Asignar a área:
                        </label>
                        <select
                          value={knowledgeAreaAssignments[knowledge.id] || ''}
                          onChange={(e) => handleAssignmentChange(knowledge.id, e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                          <option value="">Sin asignar</option>
                          {areas.map((area) => (
                            <option key={area.id} value={area.id}>
                              {area.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {knowledgeAreaAssignments[knowledge.id] && (
                        <div className="mt-2">
                          {(() => {
                            const selectedArea = areas.find(a => a.id === knowledgeAreaAssignments[knowledge.id]);
                            return selectedArea ? (
                              <span
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: selectedArea.color }}
                              >
                                ✓ {selectedArea.name}
                              </span>
                            ) : null;
                          })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
              ))}
                </div>

            {areas.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="text-yellow-400 text-xl mr-3">⚠️</div>
                  <div>
                    <h4 className="text-yellow-800 font-medium">No hay áreas creadas</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      Los archivos se subirán sin asignar a ningún área. Puedes crear áreas y asignarlos después.
                    </p>
                  </div>
                </div>
              </div>
            )}

                <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                {Object.values(knowledgeAreaAssignments).filter(areaId => areaId).length} de {pendingKnowledgeAssignments.length} archivos asignados
                  </div>
                  <div className="flex space-x-3">
                    <button
                  onClick={handleSkipAssignments}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Omitir Asignación
                    </button>
                    <button
                  onClick={handleConfirmAssignments}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                  Confirmar Asignaciones
                    </button>
              </div>
                  </div>
                </div>
              </div>
            )}

      {/* Modal: View Knowledge Content */}
      {showViewKnowledge && selectedKnowledge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              👁️ Contenido: {selectedKnowledge.title}
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
              {selectedKnowledge.knowledge_areas && selectedKnowledge.knowledge_areas.length > 0 && (
                <div className="mt-2">
                  <strong>Áreas asignadas:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedKnowledge.knowledge_areas.map((ka: any) => (
                      <span
                        key={ka.area_id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: ka.areas?.color || '#6B7280' }}
                      >
                        {ka.areas?.name || 'Área sin nombre'}
                      </span>
                    ))}
          </div>
        </div>
      )}
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
                  setShowViewKnowledge(false);
                  setSelectedKnowledge(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedKnowledge.content);
                  showNotification('Contenido copiado al portapapeles', 'success');
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Copiar Texto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Toast */}
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
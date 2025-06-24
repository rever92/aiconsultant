const express = require('express');
const Area = require('../models/Area');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/areas - Obtener áreas de un proyecto
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId es requerido'
      });
    }

    console.log('📋 Obteniendo áreas para proyecto:', projectId);
    
    const areas = await Area.findByProject(projectId)
      .populate('projectId', 'name userId')
      .lean();

    // Verificar que el usuario tenga acceso al proyecto
    const userCanAccess = areas.length === 0 || areas.some(area => 
      area.projectId && area.projectId.userId.toString() === req.user._id.toString()
    );

    if (!userCanAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este proyecto'
      });
    }

    console.log(`✅ Encontradas ${areas.length} áreas`);
    
    // Devolver directamente el array para compatibilidad con el frontend
    res.json(areas);
  } catch (error) {
    console.error('❌ Error obteniendo áreas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/areas - Crear nueva área
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, color, projectId } = req.body;

    // Validación básica
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del área es requerido'
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'El projectId es requerido'
      });
    }

    console.log('📝 Creando área:', { name, projectId, userId: req.user._id });

    // Verificar que el proyecto pertenece al usuario
    const Project = require('../models/Project');
    const project = await Project.findOne({
      _id: projectId,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }

    const area = new Area({
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#3B82F6',
      projectId: projectId
    });

    const savedArea = await area.save();
    console.log('✅ Área creada exitosamente:', savedArea._id);

    // Devolver directamente el área para compatibilidad con el frontend
    res.status(201).json(savedArea);
  } catch (error) {
    console.error('❌ Error creando área:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Datos de área inválidos'
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un área con ese nombre en este proyecto'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/areas/consolidated - Obtener conocimiento consolidado de áreas de un proyecto
router.get('/consolidated', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId es requerido'
      });
    }

    console.log('📚 Obteniendo conocimiento consolidado para proyecto:', projectId);
    
    // Obtener todas las áreas del proyecto que tienen conocimiento consolidado
    const areasWithConsolidated = await Area.find({
      projectId: projectId,
      'consolidatedKnowledge.content': { $exists: true, $ne: null }
    })
    .populate('projectId', 'name userId')
    .lean();

    // Verificar que el usuario tenga acceso al proyecto
    if (areasWithConsolidated.length > 0) {
      const userCanAccess = areasWithConsolidated.some(area => 
        area.projectId && area.projectId.userId.toString() === req.user._id.toString()
      );

      if (!userCanAccess) {
        return res.status(403).json({
          success: false,
          error: 'No tienes acceso a este proyecto'
        });
      }
    }

    // Transformar la respuesta para que coincida con la estructura esperada por el frontend
    const consolidatedKnowledge = areasWithConsolidated.map(area => ({
      id: area._id.toString() + '_consolidated',
      area_id: area._id.toString(),
      content: area.consolidatedKnowledge.content,
      ai_generated: area.consolidatedKnowledge.aiGenerated || true,
      validated: area.consolidatedKnowledge.validated || false,
      original_sources_count: area.consolidatedKnowledge.originalSourcesCount || 0,
      created_at: area.consolidatedKnowledge.createdAt || area.createdAt,
      updated_at: area.consolidatedKnowledge.updatedAt || area.updatedAt
    }));

    console.log(`✅ Encontrado conocimiento consolidado en ${consolidatedKnowledge.length} áreas`);
    
    res.json(consolidatedKnowledge);
  } catch (error) {
    console.error('❌ Error obteniendo conocimiento consolidado:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/areas/:id/consolidate - Consolidar conocimiento de un área con IA
router.post('/:id/consolidate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🤖 Consolidando conocimiento del área:', id);

    // Obtener el área y verificar permisos
    const area = await Area.findById(id)
      .populate('projectId', 'name userId');

    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Área no encontrada'
      });
    }

    // Verificar que el usuario tenga acceso
    if (area.projectId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a esta área'
      });
    }

    // Obtener todo el conocimiento asignado a esta área
    const Knowledge = require('../models/Knowledge');
    const knowledgeItems = await Knowledge.find({
      areas: id
    }).lean();

    if (knowledgeItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay conocimiento asignado a esta área para consolidar'
      });
    }

    console.log(`📚 Encontrados ${knowledgeItems.length} elementos de conocimiento para consolidar`);

    // Preparar el contenido para el prompt
    const knowledgeSources = knowledgeItems.map(item => {
      let source = `**${item.title}**\n`;
      if (item.sourceType === 'upload' && item.fileInfo?.originalName) {
        source += `(Archivo: ${item.fileInfo.originalName})\n`;
      }
      source += `${item.content}\n`;
      if (item.notes) {
        source += `Notas: ${item.notes}\n`;
      }
      return source;
    }).join('\n---\n\n');

    // Importar el prompt y la función de Gemini desde utilidades del backend
    const { CONSOLIDATE_AREA_KNOWLEDGE_PROMPT } = require('../utils/prompts');
    const { generateContentWithRetry } = require('../utils/geminiClient');

    // Construir el prompt final
    const finalPrompt = CONSOLIDATE_AREA_KNOWLEDGE_PROMPT + '\n\n**CONOCIMIENTO A CONSOLIDAR:**\n\n' + knowledgeSources;

    console.log('🧠 Enviando prompt a Gemini para consolidación...');

    // Generar contenido consolidado con Gemini (con reintentos)
    const consolidatedContent = await generateContentWithRetry(finalPrompt);

    console.log('✅ Contenido consolidado generado por IA');

    // Guardar el conocimiento consolidado en el área
    area.consolidatedKnowledge = {
      content: consolidatedContent,
      aiGenerated: true,
      validated: false,
      originalSourcesCount: knowledgeItems.length,
      generatedAt: new Date(),
      validatedAt: null
    };

    await area.save();

    console.log('💾 Conocimiento consolidado guardado en el área');

    res.json({
      success: true,
      consolidatedKnowledge: {
        id: area._id.toString() + '_consolidated',
        area_id: area._id.toString(),
        content: consolidatedContent,
        ai_generated: true,
        validated: false,
        original_sources_count: knowledgeItems.length,
        created_at: area.consolidatedKnowledge.generatedAt,
        updated_at: area.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error consolidando conocimiento:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'ID de área inválido'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/areas/:id - Obtener área específica
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Obteniendo área:', id);

    const area = await Area.findById(id)
      .populate('projectId', 'name userId');

    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Área no encontrada'
      });
    }

    // Verificar que el usuario tenga acceso
    if (area.projectId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a esta área'
      });
    }

    console.log('✅ Área encontrada:', area.name);
    
    res.json({
      success: true,
      area: area
    });
  } catch (error) {
    console.error('❌ Error obteniendo área:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'ID de área inválido'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/areas/:id - Actualizar área
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    console.log('📝 Actualizando área:', id);

    const area = await Area.findById(id)
      .populate('projectId', 'userId');

    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Área no encontrada'
      });
    }

    // Verificar que el usuario tenga acceso
    if (area.projectId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a esta área'
      });
    }

    // Actualizar campos
    if (name !== undefined) area.name = name.trim();
    if (description !== undefined) area.description = description.trim();
    if (color !== undefined) area.color = color;

    const updatedArea = await area.save();

    console.log('✅ Área actualizada exitosamente');
    
    res.json({
      success: true,
      area: updatedArea
    });
  } catch (error) {
    console.error('❌ Error actualizando área:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Datos de área inválidos'
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'ID de área inválido'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/areas/:id - Eliminar área
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando área:', id);

    const area = await Area.findById(id)
      .populate('projectId', 'userId');

    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Área no encontrada'
      });
    }

    // Verificar que el usuario tenga acceso
    if (area.projectId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a esta área'
      });
    }

    // No permitir eliminar el área Global
    if (area.isGlobal || area.name === 'Global') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el área Global'
      });
    }

    await Area.findByIdAndDelete(id);

    console.log('✅ Área eliminada exitosamente:', area.name);
    
    res.json({
      success: true,
      message: 'Área eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando área:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'ID de área inválido'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router; 
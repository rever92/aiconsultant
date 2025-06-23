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
    
    res.json({
      success: true,
      areas: areas
    });
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

    res.status(201).json({
      success: true,
      area: savedArea
    });
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
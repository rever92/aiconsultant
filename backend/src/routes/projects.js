const express = require('express');
const Project = require('../models/Project');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects - Obtener todos los proyectos del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Obteniendo proyectos para usuario:', req.user._id);
    
    const projects = await Project.find({ userId: req.user._id })
      .sort({ createdAt: -1 }); // Más recientes primero

    console.log(`✅ Encontrados ${projects.length} proyectos`);
    
    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('❌ Error obteniendo proyectos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/projects - Crear nuevo proyecto
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validación básica
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del proyecto es requerido'
      });
    }

    console.log('📝 Creando proyecto:', { name, description, userId: req.user._id });

    const project = new Project({
      name: name.trim(),
      description: description?.trim() || '',
      userId: req.user._id,
      status: 'DRAFT',
      currentStep: 1
    });

    const savedProject = await project.save();
    console.log('✅ Proyecto creado exitosamente:', savedProject._id);

    // Crear área "Global" automáticamente
    try {
      const Area = require('../models/Area');
      await Area.createGlobalArea(savedProject._id);
      console.log('✅ Área Global creada automáticamente');
    } catch (areaError) {
      console.warn('⚠️ Warning: No se pudo crear el área Global:', areaError.message);
      // No fallar la creación del proyecto por esto
    }

    res.status(201).json({
      success: true,
      project: savedProject
    });
  } catch (error) {
    console.error('❌ Error creando proyecto:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Datos de proyecto inválidos'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/projects/:id - Obtener un proyecto específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Obteniendo proyecto:', id, 'para usuario:', req.user._id);

    const project = await Project.findOne({ 
      _id: id, 
      userId: req.user._id 
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }

    console.log('✅ Proyecto encontrado:', project.name);
    
    res.json({
      success: true,
      project: project
    });
  } catch (error) {
    console.error('❌ Error obteniendo proyecto:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'ID de proyecto inválido'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/projects/:id - Actualizar proyecto
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, currentStep } = req.body;

    console.log('📝 Actualizando proyecto:', id);

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;
    if (currentStep !== undefined) updateData.currentStep = currentStep;
    
    updateData.updatedAt = new Date();

    const project = await Project.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }

    console.log('✅ Proyecto actualizado exitosamente');
    
    res.json({
      success: true,
      project: project
    });
  } catch (error) {
    console.error('❌ Error actualizando proyecto:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Datos de proyecto inválidos'
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'ID de proyecto inválido'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/projects/:id - Eliminar proyecto
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando proyecto:', id, 'para usuario:', req.user._id);

    const project = await Project.findOneAndDelete({ 
      _id: id, 
      userId: req.user._id 
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }

    console.log('✅ Proyecto eliminado exitosamente:', project.name);
    
    res.json({
      success: true,
      message: 'Proyecto eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando proyecto:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'ID de proyecto inválido'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router; 
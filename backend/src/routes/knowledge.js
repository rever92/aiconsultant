const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Knowledge = require('../models/Knowledge');
const Area = require('../models/Area');
const { authenticateToken } = require('../middleware/auth');

// Importar librerías para extraer texto
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const router = express.Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/knowledge');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    // Permitir solo archivos de texto y documentos
    const allowedTypes = ['.txt', '.docx', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten archivos .txt, .docx y .pdf'));
    }
  }
});

// Función para limpiar contenido de transcripciones
function cleanTranscriptionContent(content) {
  // Si el contenido parece ser una transcripción con timestamps, limpiarlo
  if (content.includes('-->') && content.includes('[')) {
    // Limpiar timestamps y marcadores de speaker
    let cleaned = content
      // Remover timestamps como "00:00:01,979 --> 00:05:57,339"
      .replace(/\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/g, '')
      // Remover marcadores de timestamp en corchetes
      .replace(/\[\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}\]/g, '')
      // Remover marcadores de speaker como "- [speaker_0]"
      .replace(/\s*-\s*\[speaker_\d+\]/g, '')
      // Limpiar líneas vacías múltiples
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Limpiar espacios al inicio y final
      .trim();
    
    return cleaned;
  }
  
  return content;
}

// Función para extraer texto de archivos
async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  
  try {
    let extractedContent = '';
    
    if (ext === '.txt') {
      extractedContent = await fs.readFile(filePath, 'utf-8');
    } else if (ext === '.docx') {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      extractedContent = result.value;
    } else if (ext === '.pdf') {
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      extractedContent = data.text;
    } else {
      throw new Error(`Tipo de archivo "${ext}" no soportado. Tipos permitidos: .txt, .docx, .pdf`);
    }
    
    // Limpiar el contenido si es una transcripción
    const cleanedContent = cleanTranscriptionContent(extractedContent);
    
    return cleanedContent;
  } catch (error) {
    console.error('❌ Error extrayendo contenido del archivo:', error);
    throw new Error(`Error extrayendo contenido: ${error.message}`);
  }
}

// GET /api/knowledge - Obtener conocimiento de un proyecto
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, areaId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId es requerido'
      });
    }

    console.log('📋 Obteniendo conocimiento para proyecto:', projectId);
    
    let query = { projectId: projectId, userId: req.user._id };
    
    if (areaId) {
      query.areas = areaId;
    }

    const knowledge = await Knowledge.find(query)
      .populate('areas', 'name color')
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Encontrado ${knowledge.length} elementos de conocimiento`);
    
    res.json({
      success: true,
      knowledge: knowledge
    });
  } catch (error) {
    console.error('❌ Error obteniendo conocimiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/knowledge - Crear nuevo conocimiento
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { title, content, notes, projectId, areaId } = req.body;
    const file = req.file;

    console.log('📝 Creando conocimiento:', { 
      title, 
      hasFile: !!file, 
      projectId, 
      userId: req.user._id 
    });

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

    let knowledgeData = {
      projectId: projectId,
      userId: req.user._id,
      notes: notes || undefined
    };

    if (file) {
      // Es un archivo subido
      try {
        const extractedContent = await extractTextFromFile(file.path, file.originalname);
        
        knowledgeData = {
          ...knowledgeData,
          title: title || file.originalname,
          content: extractedContent,
          sourceType: 'upload',
          fileInfo: {
            originalName: file.originalname,
            fileName: file.filename,
            fileSize: file.size,
            mimeType: file.mimetype,
            filePath: path.relative(path.join(__dirname, '../../'), file.path)
          }
        };
      } catch (extractError) {
        // Limpiar archivo si falla la extracción
        await fs.unlink(file.path).catch(() => {});
        return res.status(400).json({
          success: false,
          error: `Error extrayendo contenido: ${extractError.message}`
        });
      }
    } else {
      // Es contenido manual
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: 'Título y contenido son requeridos para conocimiento manual'
        });
      }

      knowledgeData = {
        ...knowledgeData,
        title: title.trim(),
        content: content.trim(),
        sourceType: 'manual'
      };
    }

    const knowledge = new Knowledge(knowledgeData);

    // Asignar a área si se especifica
    if (areaId) {
      const area = await Area.findOne({
        _id: areaId,
        projectId: projectId
      });

      if (area) {
        knowledge.areas = [areaId];
      }
    }

    const savedKnowledge = await knowledge.save();
    
    // Poblar los datos para la respuesta
    await savedKnowledge.populate(['areas', 'userId']);

    console.log('✅ Conocimiento creado exitosamente:', savedKnowledge._id);

    res.status(201).json({
      success: true,
      knowledge: savedKnowledge
    });
  } catch (error) {
    console.error('❌ Error creando conocimiento:', error);
    
    // Limpiar archivo en caso de error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Datos de conocimiento inválidos'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/knowledge/:id - Eliminar conocimiento
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando conocimiento:', id);

    const knowledge = await Knowledge.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!knowledge) {
      return res.status(404).json({
        success: false,
        error: 'Conocimiento no encontrado'
      });
    }

    // Eliminar archivo físico si existe
    if (knowledge.fileInfo && knowledge.fileInfo.filePath) {
      const fullPath = path.join(__dirname, '../../', knowledge.fileInfo.filePath);
      await fs.unlink(fullPath).catch(err => {
        console.warn('No se pudo eliminar archivo físico:', err.message);
      });
    }

    await Knowledge.findByIdAndDelete(id);

    console.log('✅ Conocimiento eliminado exitosamente:', knowledge.title);
    
    res.json({
      success: true,
      message: 'Conocimiento eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando conocimiento:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'ID de conocimiento inválido'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/knowledge/:id/assign-areas - Asignar áreas a conocimiento
router.post('/:id/assign-areas', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { areaIds } = req.body;

    console.log('🔗 Asignando áreas al conocimiento:', id, areaIds);

    const knowledge = await Knowledge.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!knowledge) {
      return res.status(404).json({
        success: false,
        error: 'Conocimiento no encontrado'
      });
    }

    // Validar que las áreas pertenecen al mismo proyecto
    if (areaIds && areaIds.length > 0) {
      const areas = await Area.find({
        _id: { $in: areaIds },
        projectId: knowledge.projectId
      });

      if (areas.length !== areaIds.length) {
        return res.status(400).json({
          success: false,
          error: 'Algunas áreas no pertenecen al proyecto'
        });
      }

      knowledge.areas = areaIds;
    } else {
      knowledge.areas = [];
    }

    const updatedKnowledge = await knowledge.save();
    await updatedKnowledge.populate(['areas', 'userId']);

    console.log('✅ Áreas asignadas exitosamente');
    
    res.json({
      success: true,
      knowledge: updatedKnowledge
    });
  } catch (error) {
    console.error('❌ Error asignando áreas:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/knowledge/delete-all - Eliminar todo el conocimiento de un proyecto
router.delete('/delete-all', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId es requerido'
      });
    }

    console.log('🗑️ Eliminando todo el conocimiento del proyecto:', projectId);

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

    // Obtener todo el conocimiento del proyecto
    const knowledgeItems = await Knowledge.find({
      projectId: projectId,
      userId: req.user._id
    });

    let filesDeleted = 0;

    // Eliminar archivos físicos si existen
    for (const knowledge of knowledgeItems) {
      if (knowledge.fileInfo && knowledge.fileInfo.filePath) {
        const fullPath = path.join(__dirname, '../../', knowledge.fileInfo.filePath);
        try {
          await fs.unlink(fullPath);
          filesDeleted++;
        } catch (err) {
          console.warn('No se pudo eliminar archivo físico:', err.message);
        }
      }
    }

    // Eliminar todos los registros
    const deleteResult = await Knowledge.deleteMany({
      projectId: projectId,
      userId: req.user._id
    });

    console.log(`✅ Eliminados ${deleteResult.deletedCount} elementos de conocimiento y ${filesDeleted} archivos`);
    
    res.json({
      success: true,
      deletedCount: deleteResult.deletedCount,
      filesDeleted: filesDeleted,
      message: 'Todo el conocimiento eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando conocimiento:', error);
    
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
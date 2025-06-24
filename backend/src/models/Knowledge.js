const mongoose = require('mongoose');

// Enum para tipos de fuente
const SOURCE_TYPES = {
  UPLOAD: 'upload',
  MANUAL: 'manual'
};

const knowledgeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título es requerido'],
    trim: true,
    maxlength: [200, 'Título no puede exceder 200 caracteres']
  },
  content: {
    type: String,
    required: [true, 'Contenido es requerido'],
    maxlength: [2000000, 'Contenido no puede exceder 2000000 caracteres']
  },
  sourceType: {
    type: String,
    enum: Object.values(SOURCE_TYPES),
    required: [true, 'Tipo de fuente es requerido']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Proyecto es requerido'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuario es requerido'],
    index: true
  },
  // Campos específicos para archivos subidos
  fileInfo: {
    originalName: { type: String },
    fileName: { type: String }, // Nombre generado único
    fileSize: { type: Number },
    mimeType: { type: String },
    filePath: { type: String } // Ruta relativa donde se guardó
  },
  // Áreas asignadas (many-to-many)
  areas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area'
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notas no pueden exceder 1000 caracteres']
  },
  metadata: {
    wordCount: { type: Number, default: 0 },
    extractedAt: { type: Date },
    lastProcessed: { type: Date },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'error'],
      default: 'completed'
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Índices para mejorar performance
knowledgeSchema.index({ projectId: 1, createdAt: -1 });
knowledgeSchema.index({ userId: 1 });
knowledgeSchema.index({ sourceType: 1 });
knowledgeSchema.index({ areas: 1 });
knowledgeSchema.index({ tags: 1 });
knowledgeSchema.index({ 'metadata.processingStatus': 1 });

// Índice de texto para búsqueda
knowledgeSchema.index({
  title: 'text',
  content: 'text',
  notes: 'text'
}, {
  weights: {
    title: 10,
    content: 5,
    notes: 1
  }
});

// Virtual para verificar si es un archivo
knowledgeSchema.virtual('isFile').get(function() {
  return this.sourceType === SOURCE_TYPES.UPLOAD;
});

// Virtual para obtener nombre de display
knowledgeSchema.virtual('displayName').get(function() {
  return this.fileInfo?.originalName || this.title;
});

// Pre-save middleware para calcular word count
knowledgeSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Calcular número aproximado de palabras
    this.metadata.wordCount = this.content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }
  
  // Si es archivo, establecer extractedAt
  if (this.sourceType === SOURCE_TYPES.UPLOAD && !this.metadata.extractedAt) {
    this.metadata.extractedAt = new Date();
  }
  
  next();
});

// Método para asignar a áreas
knowledgeSchema.methods.assignToAreas = function(areaIds) {
  this.areas = Array.isArray(areaIds) ? areaIds : [areaIds];
  return this;
};

// Método para añadir área
knowledgeSchema.methods.addArea = function(areaId) {
  if (!this.areas.includes(areaId)) {
    this.areas.push(areaId);
  }
  return this;
};

// Método para remover área
knowledgeSchema.methods.removeArea = function(areaId) {
  this.areas = this.areas.filter(id => !id.equals(areaId));
  return this;
};

// Método para actualizar estado de procesamiento
knowledgeSchema.methods.updateProcessingStatus = function(status) {
  this.metadata.processingStatus = status;
  this.metadata.lastProcessed = new Date();
  return this;
};

// Método para añadir tags
knowledgeSchema.methods.addTags = function(newTags) {
  const tagsArray = Array.isArray(newTags) ? newTags : [newTags];
  const uniqueTags = [...new Set([...this.tags, ...tagsArray])];
  this.tags = uniqueTags;
  return this;
};

// Método estático para buscar por proyecto
knowledgeSchema.statics.findByProject = function(projectId, options = {}) {
  const query = this.find({ projectId });
  
  if (options.sourceType) {
    query.where('sourceType').equals(options.sourceType);
  }
  
  if (options.areaId) {
    query.where('areas').in([options.areaId]);
  }
  
  if (options.withAreas) {
    query.populate('areas', 'name color');
  }
  
  if (options.withUser) {
    query.populate('userId', 'fullName email');
  }
  
  return query.sort({ createdAt: -1 });
};

// Método estático para buscar por área
knowledgeSchema.statics.findByArea = function(areaId, options = {}) {
  const query = this.find({ areas: areaId });
  
  if (options.withProject) {
    query.populate('projectId', 'name description');
  }
  
  return query.sort({ createdAt: -1 });
};

// Método estático para búsqueda de texto
knowledgeSchema.statics.searchText = function(searchTerm, projectId = null) {
  const query = this.find({
    $text: { $search: searchTerm }
  }, {
    score: { $meta: 'textScore' }
  });
  
  if (projectId) {
    query.where('projectId').equals(projectId);
  }
  
  return query.sort({ score: { $meta: 'textScore' } });
};

// Método estático para obtener estadísticas del proyecto
knowledgeSchema.statics.getProjectStats = function(projectId) {
  return this.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: '$sourceType',
        count: { $sum: 1 },
        totalWords: { $sum: '$metadata.wordCount' },
        avgWords: { $avg: '$metadata.wordCount' }
      }
    }
  ]);
};

// Método estático para obtener conocimiento sin áreas asignadas
knowledgeSchema.statics.findUnassigned = function(projectId) {
  return this.find({
    projectId: projectId,
    $or: [
      { areas: { $size: 0 } },
      { areas: { $exists: false } }
    ]
  }).sort({ createdAt: -1 });
};

// Asegurar que los virtuals sean incluidos
knowledgeSchema.set('toJSON', { virtuals: true });
knowledgeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Knowledge', knowledgeSchema);
module.exports.SOURCE_TYPES = SOURCE_TYPES; 
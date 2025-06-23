const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nombre del área es requerido'],
    trim: true,
    maxlength: [100, 'Nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descripción no puede exceder 500 caracteres']
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#[0-9A-F]{6}$/i, 'Color debe ser un código hexadecimal válido']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Proyecto es requerido'],
    index: true
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  metadata: {
    knowledgeCount: { type: Number, default: 0 },
    consolidatedAt: { type: Date },
    lastUpdated: { type: Date, default: Date.now }
  },
  consolidatedKnowledge: {
    content: { type: String },
    aiGenerated: { type: Boolean, default: false },
    validated: { type: Boolean, default: false },
    originalSourcesCount: { type: Number, default: 0 },
    generatedAt: { type: Date },
    validatedAt: { type: Date }
  }
}, {
  timestamps: true
});

// Índices compuestos para mejorar performance
areaSchema.index({ projectId: 1, createdAt: 1 });
areaSchema.index({ projectId: 1, name: 1 }, { unique: true }); // Nombres únicos por proyecto
areaSchema.index({ isGlobal: 1 });

// Virtual para verificar si está consolidada
areaSchema.virtual('isConsolidated').get(function() {
  return !!(this.consolidatedKnowledge && this.consolidatedKnowledge.content);
});

// Virtual para obtener estado de consolidación
areaSchema.virtual('consolidationStatus').get(function() {
  if (!this.consolidatedKnowledge || !this.consolidatedKnowledge.content) {
    return 'pending';
  }
  
  if (this.consolidatedKnowledge.validated) {
    return 'validated';
  }
  
  return 'generated';
});

// Método para consolidar conocimiento
areaSchema.methods.consolidateKnowledge = function(content, sourcesCount = 0) {
  this.consolidatedKnowledge = {
    content: content,
    aiGenerated: true,
    validated: false,
    originalSourcesCount: sourcesCount,
    generatedAt: new Date(),
    validatedAt: null
  };
  this.metadata.consolidatedAt = new Date();
  this.metadata.lastUpdated = new Date();
  return this;
};

// Método para validar conocimiento consolidado
areaSchema.methods.validateConsolidation = function() {
  if (this.consolidatedKnowledge && this.consolidatedKnowledge.content) {
    this.consolidatedKnowledge.validated = true;
    this.consolidatedKnowledge.validatedAt = new Date();
    this.metadata.lastUpdated = new Date();
  }
  return this;
};

// Método para actualizar contador de conocimiento
areaSchema.methods.updateKnowledgeCount = function(count) {
  this.metadata.knowledgeCount = count;
  this.metadata.lastUpdated = new Date();
  return this;
};

// Pre-save middleware para validaciones
areaSchema.pre('save', function(next) {
  // Asegurar que Global sea única por proyecto
  if (this.name === 'Global') {
    this.isGlobal = true;
  }
  
  this.metadata.lastUpdated = new Date();
  next();
});

// Método estático para crear área Global automáticamente
areaSchema.statics.createGlobalArea = function(projectId) {
  return this.create({
    name: 'Global',
    description: 'Conocimiento general del proyecto',
    color: '#6B7280',
    projectId: projectId,
    isGlobal: true
  });
};

// Método estático para buscar áreas de un proyecto
areaSchema.statics.findByProject = function(projectId, options = {}) {
  const query = this.find({ projectId });
  
  if (options.includeConsolidated) {
    // Incluir solo áreas con conocimiento consolidado
    query.where('consolidatedKnowledge.content').ne(null);
  }
  
  if (options.validated) {
    query.where('consolidatedKnowledge.validated').equals(true);
  }
  
  return query.sort({ isGlobal: -1, createdAt: 1 });
};

// Método estático para obtener estadísticas del proyecto
areaSchema.statics.getProjectStats = function(projectId) {
  return this.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: null,
        totalAreas: { $sum: 1 },
        consolidatedAreas: {
          $sum: {
            $cond: [
              { $ne: ['$consolidatedKnowledge.content', null] },
              1,
              0
            ]
          }
        },
        validatedAreas: {
          $sum: {
            $cond: [
              { $eq: ['$consolidatedKnowledge.validated', true] },
              1,
              0
            ]
          }
        },
        totalKnowledge: { $sum: '$metadata.knowledgeCount' }
      }
    }
  ]);
};

// Asegurar que los virtuals sean incluidos
areaSchema.set('toJSON', { virtuals: true });
areaSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Area', areaSchema); 
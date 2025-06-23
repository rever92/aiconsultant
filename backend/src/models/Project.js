const mongoose = require('mongoose');

// Enum para estados del proyecto
const PROJECT_STATUS = {
  DRAFT: 'DRAFT',
  TRANSCRIPTIONS_UPLOADED: 'TRANSCRIPTIONS_UPLOADED',
  AREAS_MAPPED: 'AREAS_MAPPED',
  NOTES_GENERATED: 'NOTES_GENERATED',
  NOTES_VALIDATED: 'NOTES_VALIDATED',
  DIAGNOSIS_GENERATED: 'DIAGNOSIS_GENERATED',
  DIAGNOSIS_VALIDATED: 'DIAGNOSIS_VALIDATED',
  IDEAS_GENERATED: 'IDEAS_GENERATED',
  IDEAS_VALIDATED: 'IDEAS_VALIDATED',
  COMPLETED: 'COMPLETED'
};

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nombre del proyecto es requerido'],
    trim: true,
    maxlength: [200, 'Nombre no puede exceder 200 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Descripción no puede exceder 1000 caracteres']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuario es requerido'],
    index: true
  },
  status: {
    type: String,
    enum: Object.values(PROJECT_STATUS),
    default: PROJECT_STATUS.DRAFT
  },
  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 4
  },
  stepCompleted: {
    step1: { type: Boolean, default: false },
    step2: { type: Boolean, default: false },
    step3: { type: Boolean, default: false },
    step4: { type: Boolean, default: false }
  },
  settings: {
    autoGenerateAreas: { type: Boolean, default: true },
    allowMultipleAreas: { type: Boolean, default: true },
    requireValidation: { type: Boolean, default: true }
  },
  metadata: {
    totalKnowledge: { type: Number, default: 0 },
    totalAreas: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
    completionPercentage: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Índices para mejorar performance
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ status: 1 });
projectSchema.index({ 'metadata.lastActivity': -1 });

// Virtual para calcular progreso
projectSchema.virtual('progress').get(function() {
  const completed = Object.values(this.stepCompleted).filter(Boolean).length;
  return Math.round((completed / 4) * 100);
});

// Método para avanzar paso
projectSchema.methods.advanceStep = function(step) {
  if (step >= 1 && step <= 4) {
    this.currentStep = Math.max(this.currentStep, step);
    this.stepCompleted[`step${step}`] = true;
    this.metadata.lastActivity = new Date();
    
    // Actualizar porcentaje de completado
    const completed = Object.values(this.stepCompleted).filter(Boolean).length;
    this.metadata.completionPercentage = Math.round((completed / 4) * 100);
    
    // Si se completan todos los pasos, marcar como completado
    if (completed === 4) {
      this.status = PROJECT_STATUS.COMPLETED;
    }
  }
  return this;
};

// Método para verificar si un paso está completado
projectSchema.methods.isStepCompleted = function(step) {
  return this.stepCompleted[`step${step}`] || false;
};

// Método para obtener próximo paso disponible
projectSchema.methods.getNextStep = function() {
  for (let i = 1; i <= 4; i++) {
    if (!this.stepCompleted[`step${i}`]) {
      return i;
    }
  }
  return null; // Todos los pasos completados
};

// Método para actualizar metadata
projectSchema.methods.updateMetadata = function(updates) {
  this.metadata = { ...this.metadata, ...updates };
  this.metadata.lastActivity = new Date();
  return this;
};

// Pre-save middleware para actualizar lastActivity
projectSchema.pre('save', function(next) {
  if (this.isModified() && !this.isModified('metadata.lastActivity')) {
    this.metadata.lastActivity = new Date();
  }
  next();
});

// Método estático para buscar proyectos del usuario
projectSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ userId });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.populate) {
    query.populate('userId', 'fullName email');
  }
  
  return query.sort({ 'metadata.lastActivity': -1 });
};

// Método estático para obtener estadísticas del usuario
projectSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgCompletion: { $avg: '$metadata.completionPercentage' }
      }
    }
  ]);
};

// Asegurar que los virtuals sean incluidos
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

// Exportar modelo y enums
module.exports = mongoose.model('Project', projectSchema);
module.exports.PROJECT_STATUS = PROJECT_STATUS; 
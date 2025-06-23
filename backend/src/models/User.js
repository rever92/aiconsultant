const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  password: {
    type: String,
    required: [true, 'Password es requerido'],
    minlength: [6, 'Password debe tener al menos 6 caracteres'],
    select: false // No incluir password en consultas por defecto
  },
  fullName: {
    type: String,
    required: [true, 'Nombre completo es requerido'],
    trim: true,
    maxlength: [100, 'Nombre no puede exceder 100 caracteres']
  },
  role: {
    type: String,
    enum: ['admin', 'consultor'],
    default: 'consultor'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false // Los usuarios necesitan aprobación admin por defecto
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date
  },
  refreshToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

// Índices para mejorar performance (email ya tiene unique: true)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isApproved: 1 });

// Middleware para hashear password antes de guardar
userSchema.pre('save', async function(next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) return next();
  
  try {
    // Hashear password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparando passwords');
  }
};

// Método para obtener datos públicos del usuario
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    email: this.email,
    fullName: this.fullName,
    role: this.role,
    isActive: this.isActive,
    isApproved: this.isApproved,
    approvedBy: this.approvedBy,
    approvedAt: this.approvedAt,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Método estático para buscar usuario activo y aprobado por email
userSchema.statics.findActiveByEmail = function(email) {
  return this.findOne({ email, isActive: true, isApproved: true }).select('+password');
};

// Método estático para buscar usuario por email (sin filtros de aprobación, para admin)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+password');
};

// Virtual para el nombre de display
userSchema.virtual('displayName').get(function() {
  return this.fullName || this.email;
});

// Asegurar que los virtuals sean incluidos en JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema); 
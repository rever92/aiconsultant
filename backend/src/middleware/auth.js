const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de acceso requerido',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Usuario no válido o inactivo',
        code: 'INVALID_USER'
      });
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Añadir usuario al request
    req.user = user;
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'EXPIRED_TOKEN'
      });
    }
    
    return res.status(500).json({ 
      error: 'Error interno de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware para verificar rol de admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado: Se requieren permisos de administrador',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando permisos de admin:', error);
    return res.status(500).json({ 
      error: 'Error verificando permisos',
      code: 'PERMISSION_ERROR'
    });
  }
};

// Middleware para verificar propiedad de recurso
const requireOwnership = (resourceModel, resourceIdParam = 'id', userField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({ 
          error: 'ID de recurso requerido',
          code: 'MISSING_RESOURCE_ID'
        });
      }

      // Si es admin, permitir acceso
      if (req.user.role === 'admin') {
        return next();
      }

      // Verificar propiedad del recurso
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ 
          error: 'Recurso no encontrado',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Verificar si el usuario es propietario
      const ownerId = resource[userField]?.toString() || resource[userField];
      const userId = req.user._id.toString();

      if (ownerId !== userId) {
        return res.status(403).json({ 
          error: 'Acceso denegado: No eres propietario de este recurso',
          code: 'NOT_OWNER'
        });
      }

      // Añadir recurso al request para evitar otra consulta
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Error verificando propiedad:', error);
      return res.status(500).json({ 
        error: 'Error verificando permisos de propietario',
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
};

// Middleware opcional de autenticación (no requiere token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continuar sin usuario
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // En caso de error, simplemente continuar sin usuario
    next();
  }
};

// Utility function para generar token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'aiconsultant-backend'
    }
  );
};

// Utility function para generar refresh token
const generateRefreshToken = () => {
  return jwt.sign(
    { type: 'refresh', timestamp: Date.now() },
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'aiconsultant-backend'
    }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnership,
  optionalAuth,
  generateToken,
  generateRefreshToken
}; 
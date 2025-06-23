const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validaciones para registro
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email válido es requerido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password debe tener al menos 6 caracteres'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre completo debe tener entre 2 y 100 caracteres'),
  body('role')
    .optional()
    .isIn(['admin', 'consultor'])
    .withMessage('Rol debe ser admin o consultor')
];

// Validaciones para login
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email válido es requerido'),
  body('password')
    .notEmpty()
    .withMessage('Password es requerido')
];

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }

    const { email, password, fullName, role = 'consultor' } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: 'El usuario ya existe',
        code: 'USER_EXISTS'
      });
    }

    // Crear nuevo usuario
    const user = new User({
      email,
      password,
      fullName,
      role
    });

    await user.save();

    // Generar tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken();

    // Guardar refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Espera la aprobación de un administrador para poder acceder.',
      user: user.toPublicJSON(),
      requiresApproval: true
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'El email ya está registrado',
        code: 'DUPLICATE_EMAIL'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuario con password
    const user = await User.findActiveByEmail(email);
    if (!user) {
      // Verificar si el usuario existe pero no está aprobado
      const pendingUser = await User.findByEmail(email);
      if (pendingUser && !pendingUser.isApproved) {
        return res.status(403).json({
          error: 'Tu cuenta está pendiente de aprobación por un administrador',
          code: 'PENDING_APPROVAL'
        });
      }
      
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generar tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken();

    // Actualizar último login y refresh token
    user.lastLogin = new Date();
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: 'Login exitoso',
      user: user.toPublicJSON(),
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Limpiar refresh token
    req.user.refreshToken = null;
    await req.user.save();

    res.json({
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/auth/me - Obtener información del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/auth/me - Actualizar perfil del usuario
router.put('/me', [
  authenticateToken,
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre completo debe tener entre 2 y 100 caracteres'),
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Password actual es requerido para cambiar datos'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Nuevo password debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }

    const { fullName, currentPassword, newPassword } = req.body;
    const user = req.user;

    // Si se quiere cambiar password, verificar el actual
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          error: 'Password actual es requerido para cambiar password',
          code: 'CURRENT_PASSWORD_REQUIRED'
        });
      }

      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          error: 'Password actual incorrecto',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      user.password = newPassword;
    }

    // Actualizar otros campos
    if (fullName !== undefined) {
      user.fullName = fullName;
    }

    await user.save();

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/refresh - Renovar token usando refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token es requerido',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Buscar usuario con este refresh token
    const user = await User.findOne({ refreshToken, isActive: true });
    if (!user) {
      return res.status(401).json({
        error: 'Refresh token inválido',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generar nuevo token
    const newToken = generateToken(user._id);

    res.json({
      message: 'Token renovado exitosamente',
      token: newToken
    });

  } catch (error) {
    console.error('Error renovando token:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/forgot-password - Solicitar reset de password (placeholder)
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Email válido es requerido')
], async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }

    // Por ahora, solo simular el proceso
    // En producción, aquí se enviaría un email con un token de reset
    
    res.json({
      message: 'Si el email existe, recibirás instrucciones para resetear tu password'
    });

  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 
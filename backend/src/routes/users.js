const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /api/users - Listar usuarios (solo admin)
router.get('/', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;

    // Construir filtro de búsqueda
    const filter = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && ['admin', 'consultor'].includes(role)) {
      filter.role = role;
    }
    if (status === 'pending') {
      filter.isApproved = false;
      filter.isActive = true;
    } else if (status === 'approved') {
      filter.isApproved = true;
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener usuarios con paginación
    const users = await User.find(filter)
      .select('-refreshToken') // Excluir refresh token
      .populate('approvedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total para paginación
    const total = await User.countDocuments(filter);

    // Estadísticas adicionales
    const stats = {
      pending: await User.countDocuments({ isApproved: false, isActive: true }),
      approved: await User.countDocuments({ isApproved: true, isActive: true }),
      inactive: await User.countDocuments({ isActive: false }),
      total: await User.countDocuments({ isActive: true })
    };

    res.json({
      users: users.map(user => user.toPublicJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    });

  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/users/pending - Listar usuarios pendientes de aprobación (solo admin)
router.get('/pending', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      isApproved: false, 
      isActive: true 
    })
      .select('-refreshToken')
      .sort({ createdAt: -1 });

    res.json({
      users: pendingUsers.map(user => user.toPublicJSON()),
      total: pendingUsers.length
    });

  } catch (error) {
    console.error('Error obteniendo usuarios pendientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/users/:id/approve - Aprobar usuario (solo admin)
router.put('/:id/approve', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.isApproved) {
      return res.status(400).json({
        error: 'El usuario ya está aprobado',
        code: 'ALREADY_APPROVED'
      });
    }

    // Aprobar usuario
    user.isApproved = true;
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    // Poblar la información de quien aprobó
    await user.populate('approvedBy', 'fullName email');

    res.json({
      message: 'Usuario aprobado exitosamente',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Error aprobando usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/users/:id/reject - Rechazar/desactivar usuario (solo admin)
router.put('/:id/reject', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar que no se está desactivando a un admin (excepto si es el mismo admin)
    if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'No puedes desactivar a otro administrador',
        code: 'CANNOT_DEACTIVATE_ADMIN'
      });
    }

    // Desactivar usuario
    user.isActive = false;
    user.isApproved = false;
    await user.save();

    res.json({
      message: 'Usuario desactivado exitosamente',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/users/:id/role - Cambiar rol de usuario (solo admin)
router.put('/:id/role', [
  authenticateToken, 
  requireAdmin,
  body('role').isIn(['admin', 'consultor']).withMessage('Rol debe ser admin o consultor')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar que no se está cambiando el rol del propio admin a consultor
    if (user._id.toString() === req.user._id.toString() && role === 'consultor') {
      return res.status(403).json({
        error: 'No puedes cambiar tu propio rol de administrador',
        code: 'CANNOT_CHANGE_OWN_ADMIN_ROLE'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      message: `Rol actualizado a ${role} exitosamente`,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Error cambiando rol:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/users/:id - Obtener usuario específico (solo admin)
router.get('/:id', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-refreshToken')
      .populate('approvedBy', 'fullName email');

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 
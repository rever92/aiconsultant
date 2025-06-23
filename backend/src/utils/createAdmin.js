const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Script para crear usuario administrador inicial
const createAdminUser = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aiconsultant');
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador:', existingAdmin.email);
      process.exit(0);
    }

    // Crear usuario administrador (auto-aprobado)
    const adminData = {
      email: 'admin@aiconsultant.com',
      password: 'admin123456',
      fullName: 'Administrador del Sistema',
      role: 'admin',
      isApproved: true, // Admin se auto-aprueba
      approvedAt: new Date()
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('🎉 Usuario administrador creado exitosamente!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser; 
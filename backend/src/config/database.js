const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aiconsultant', {
      // Configuraciones para evitar warnings deprecados
    });

    console.log(`📊 MongoDB conectado: ${conn.connection.host}`);
    console.log(`🗃️  Base de datos: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Manejo de eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de conexión Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  Mongoose desconectado');
});

// Manejo de cierre limpio
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔒 Conexión MongoDB cerrada por terminación de la aplicación');
  process.exit(0);
});

module.exports = connectDB; 
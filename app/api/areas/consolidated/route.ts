import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/areas/consolidated - Redirigiendo al backend');
    
    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization');
    
    // Hacer petición al backend
    const response = await fetch(`${BACKEND_URL}/areas/consolidated${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error del backend:', response.status, errorText);
      return NextResponse.json(
        { error: 'Error del backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Conocimiento consolidado obtenido exitosamente');
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Error en GET /api/areas/consolidated:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
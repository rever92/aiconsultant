import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:5000/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 POST /api/projects/${params.id}/advance-step - Redirigiendo al backend`);
    
    // Obtener datos del cuerpo
    const body = await request.json();
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization');
    
    // Hacer petición al backend
    const response = await fetch(`${BACKEND_URL}/projects/${params.id}/advance-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
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
    console.log(`✅ Paso avanzado exitosamente`);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`❌ Error en POST /api/projects/${params.id}/advance-step:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
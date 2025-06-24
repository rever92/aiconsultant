import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:5000/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🤖 POST /api/areas/[id]/consolidate - Consolidando área:', params.id);
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization');
    
    // Hacer petición al backend para consolidar
    const response = await fetch(`${BACKEND_URL}/areas/${params.id}/consolidate`, {
      method: 'POST',
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

    const responseData = await response.json();
    console.log('✅ Área consolidada exitosamente');
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('❌ Error en POST /api/areas/[id]/consolidate:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
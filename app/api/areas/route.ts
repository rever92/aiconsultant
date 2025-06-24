import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/areas - Redirigiendo al backend');
    
    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization');
    
    // Hacer petición al backend
    const response = await fetch(`${BACKEND_URL}/areas${queryString ? `?${queryString}` : ''}`, {
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

    const responseData = await response.json();
    console.log('✅ Áreas obtenidas exitosamente');
    
    // Mapear campos del backend al frontend
    let data;
    if (Array.isArray(responseData)) {
      data = responseData.map(area => ({
        id: area._id,
        name: area.name,
        description: area.description,
        color: area.color,
        created_at: area.createdAt
      }));
      console.log('📍 Áreas mapeadas:', data);
    } else {
      data = responseData;
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Error en GET /api/areas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/areas - Redirigiendo al backend');
    
    // Obtener datos del cuerpo
    const body = await request.json();
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization');
    
    // Hacer petición al backend
    const response = await fetch(`${BACKEND_URL}/areas`, {
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

    const responseData = await response.json();
    console.log('✅ Área creada exitosamente');
    
    // Mapear campos del backend al frontend
    const data = {
      id: responseData._id,
      name: responseData.name,
      description: responseData.description,
      color: responseData.color,
      created_at: responseData.createdAt
    };
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Error en POST /api/areas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
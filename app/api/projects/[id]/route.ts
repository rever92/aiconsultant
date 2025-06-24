import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 GET /api/projects/${params.id} - Redirigiendo al backend`);
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization');
    
    // Hacer petición al backend
    const response = await fetch(`${BACKEND_URL}/projects/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Proyecto no encontrado' },
          { status: 404 }
        );
      }
      const errorText = await response.text();
      console.error('❌ Error del backend:', response.status, errorText);
      return NextResponse.json(
        { error: 'Error del backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Proyecto ${params.id} obtenido exitosamente`);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`❌ Error en GET /api/projects/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 PUT /api/projects/${params.id} - Redirigiendo al backend`);
    
    // Obtener datos del cuerpo
    const body = await request.json();
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization');
    
    // Hacer petición al backend
    const response = await fetch(`${BACKEND_URL}/projects/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Proyecto no encontrado' },
          { status: 404 }
        );
      }
      const errorText = await response.text();
      console.error('❌ Error del backend:', response.status, errorText);
      return NextResponse.json(
        { error: 'Error del backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Proyecto ${params.id} actualizado exitosamente`);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`❌ Error en PUT /api/projects/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 DELETE /api/projects/${params.id} - Redirigiendo al backend`);
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization');
    
    // Hacer petición al backend
    const response = await fetch(`${BACKEND_URL}/projects/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Proyecto no encontrado' },
          { status: 404 }
        );
      }
      const errorText = await response.text();
      console.error('❌ Error del backend:', response.status, errorText);
      return NextResponse.json(
        { error: 'Error del backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Proyecto ${params.id} eliminado exitosamente`);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`❌ Error en DELETE /api/projects/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
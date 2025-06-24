import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:5000/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 POST /api/knowledge/[id]/assign-areas - Redirigiendo al backend');
    
    // Obtener datos del cuerpo
    const body = await request.json();
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization');
    
    // Hacer petición al backend
    const response = await fetch(`${BACKEND_URL}/knowledge/${params.id}/assign-areas`, {
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
    console.log('✅ Asignación de áreas exitosa');
    
    // Mapear la respuesta del backend al formato del frontend
    let data;
    if (responseData.success && responseData.knowledge) {
      const knowledge = responseData.knowledge;
      data = {
        id: knowledge._id,
        title: knowledge.title,
        content: knowledge.content,
        source_type: knowledge.sourceType,
        file_name: knowledge.fileInfo?.originalName,
        file_size: knowledge.fileInfo?.fileSize,
        notes: knowledge.notes,
        uploaded_at: knowledge.createdAt,
        knowledge_areas: knowledge.areas ? knowledge.areas.map((area: any) => ({
          area_id: area._id,
          areas: {
            id: area._id,
            name: area.name,
            color: area.color
          }
        })) : []
      };
    } else {
      data = responseData;
    }
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error en POST /api/knowledge/[id]/assign-areas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
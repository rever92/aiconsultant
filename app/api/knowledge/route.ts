import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/knowledge - Redirigiendo al backend');
    
    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization');
    
    // Hacer petición al backend
    const response = await fetch(`${BACKEND_URL}/knowledge${queryString ? `?${queryString}` : ''}`, {
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
    console.log('✅ Conocimiento obtenido exitosamente');
    
    // Función helper para mapear un objeto knowledge del backend al formato frontend
    const mapKnowledgeItem = (knowledge: any) => ({
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
    });
    
    let data;
    
    // Manejar respuesta del backend con wrapper success
    if (responseData.success && responseData.knowledge) {
      const knowledge = responseData.knowledge;
      
      if (Array.isArray(knowledge)) {
        // Es un array de objetos knowledge (caso GET)
        data = knowledge.map(mapKnowledgeItem);
      } else {
        // Es un objeto knowledge individual (caso POST)
        data = mapKnowledgeItem(knowledge);
      }
    } else if (Array.isArray(responseData)) {
      // Si la respuesta es directamente un array
      data = responseData.map(mapKnowledgeItem);
    } else {
      // Respuesta directa sin wrapper
      data = responseData;
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Error en GET /api/knowledge:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/knowledge - Redirigiendo al backend');
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization');
    
    // Verificar si es FormData (subida de archivos) o JSON
    const contentType = request.headers.get('content-type');
    console.log('🔍 Content-Type recibido:', contentType);
    
    let body: any;
    let headers: any = {
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

    if (contentType && contentType.includes('multipart/form-data')) {
      // Es FormData (subida de archivos)
      console.log('📁 Procesando FormData para subida de archivos');
      body = await request.formData();
      
      // Log para debug
      for (const [key, value] of body.entries()) {
        console.log(`FormData - ${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }
      
      // No agregar Content-Type para FormData, el browser lo maneja automáticamente
    } else {
      // Es JSON
      console.log('📝 Procesando JSON');
      const jsonData = await request.json();
      console.log('JSON data:', jsonData);
      body = JSON.stringify(jsonData);
      headers['Content-Type'] = 'application/json';
    }
    
    // Hacer petición al backend
    console.log('📡 Enviando petición al backend:', `${BACKEND_URL}/knowledge`);
    const response = await fetch(`${BACKEND_URL}/knowledge`, {
      method: 'POST',
      headers,
      body,
    });

    console.log('📨 Respuesta del backend - Status:', response.status);
    console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorText: string;
      try {
        // Intentar obtener error como JSON primero
        const errorData = await response.json();
        errorText = errorData.error || errorData.message || response.statusText;
      } catch (parseError) {
        // Si no es JSON, obtener como texto
        errorText = await response.text();
        console.error('❌ Error parseando respuesta de error:', parseError);
      }
      console.error('❌ Error del backend:', response.status, errorText);
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    let data: any;
    const responseText = await response.text();
    console.log('📋 Respuesta del backend (raw):', responseText);
    
    try {
      // Intentar parsear como JSON
      const parsedData = JSON.parse(responseText);
      console.log('✅ JSON parseado exitosamente');
      
      // Usar la misma función helper para mapear la respuesta
      if (parsedData.success && parsedData.knowledge) {
        const knowledge = parsedData.knowledge;
        
        if (Array.isArray(knowledge)) {
          // Es un array de objetos knowledge
          data = knowledge.map((k: any) => ({
            id: k._id,
            title: k.title,
            content: k.content,
            source_type: k.sourceType,
            file_name: k.fileInfo?.originalName,
            file_size: k.fileInfo?.fileSize,
            notes: k.notes,
            uploaded_at: k.createdAt,
            knowledge_areas: k.areas ? k.areas.map((area: any) => ({
              area_id: area._id,
              areas: {
                id: area._id,
                name: area.name,
                color: area.color
              }
            })) : []
          }));
        } else {
          // Es un objeto knowledge individual
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
        }
        
        console.log('📤 Extrayendo y mapeando objeto knowledge del backend');
        console.log('📋 Knowledge mapeado:', data);
      } else {
        data = parsedData;
      }
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError);
      console.error('❌ Contenido que causó el error:', responseText);
      // Si no es JSON, crear objeto con el texto
      data = { message: responseText };
    }
    
    console.log('✅ Conocimiento creado exitosamente');
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Error en POST /api/knowledge:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
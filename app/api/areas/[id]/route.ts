import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const areaId = params.id;

    if (!areaId) {
      return NextResponse.json({ error: 'Area ID es requerido' }, { status: 400 });
    }

    console.log('Deleting area:', areaId);

    // Eliminar área (las relaciones se eliminan automáticamente por CASCADE)
    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', areaId);

    if (error) {
      console.error('Error deleting area:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Area deleted successfully:', areaId);
    return NextResponse.json({ message: 'Área eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting area:', error);
    return NextResponse.json({ error: 'Error eliminando área' }, { status: 500 });
  }
} 
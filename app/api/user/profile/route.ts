import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, address, district } = body;

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: name || null,
        phone: phone || null,
        address: address || null,
        district: district || null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        district: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}

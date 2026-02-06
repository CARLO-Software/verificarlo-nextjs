import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BookingStatus, InspectionResultStatus } from '@prisma/client';

// ============================================
// Tipos
// ============================================

export interface BookingWithDetails {
  id: number;
  code: string;
  status: BookingStatus;
  date: Date;
  startTime: Date;
  timeSlot: string;
  expiresAt: Date | null;
  createdAt: Date;
  clientNotes: string | null;
  inspectorNotes: string | null;
  adminNotes: string | null;
  client: {
    id: number;
    name: string;
    email: string;
    image: string | null;
  };
  vehicle: {
    id: number;
    plate: string | null;
    year: number;
    mileage: number | null;
    model: {
      id: number;
      name: string;
      brand: {
        id: number;
        name: string;
        logo: string;
      };
    };
  };
  inspectionPlan: {
    id: number;
    type: string;
    title: string;
    price: number;
  };
  inspector: {
    id: number;
    name: string;
    email: string;
    image: string | null;
  } | null;
  payment: {
    id: number;
    status: string;
    amount: number;
    paidAt: Date | null;
    receiptNumber: string | null;
  } | null;
  report: {
    id: number;
    legalStatus: InspectionResultStatus;
    legalScore: number | null;
    mechanicalStatus: InspectionResultStatus;
    mechanicalScore: number | null;
    bodyStatus: InspectionResultStatus;
    bodyScore: number | null;
    overallScore: number | null;
    overallStatus: InspectionResultStatus;
    executiveSummary: string | null;
    recommendations: string | null;
    completedAt: Date | null;
    pdfUrl: string | null;
  } | null;
}

// ============================================
// Generar código de inspección
// ============================================

function generateInspectionCode(id: number, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const paddedId = String(id).padStart(4, '0');
  return `#INS-${year}-${paddedId}`;
}

// ============================================
// GET - Inspecciones del cliente actual
// ============================================

export async function getClientInspections(): Promise<BookingWithDetails[]> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const bookings = await db.booking.findMany({
    where: {
      clientId: session.user.id,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      vehicle: {
        include: {
          model: {
            include: {
              brand: true,
            },
          },
        },
      },
      inspectionPlan: {
        select: {
          id: true,
          type: true,
          title: true,
          price: true,
        },
      },
      inspector: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return bookings.map((booking) => ({
    ...booking,
    code: generateInspectionCode(booking.id, booking.createdAt),
  }));
}

// ============================================
// GET - Todos los bookings (Admin)
// ============================================

export async function getAllBookings(filters?: {
  status?: BookingStatus;
  inspectorId?: number;
  search?: string;
}): Promise<BookingWithDetails[]> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.inspectorId) {
    where.inspectorId = filters.inspectorId;
  }

  if (filters?.search) {
    where.OR = [
      { client: { name: { contains: filters.search } } },
      { client: { email: { contains: filters.search } } },
      { vehicle: { plate: { contains: filters.search } } },
    ];
  }

  const bookings = await db.booking.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      vehicle: {
        include: {
          model: {
            include: {
              brand: true,
            },
          },
        },
      },
      inspectionPlan: {
        select: {
          id: true,
          type: true,
          title: true,
          price: true,
        },
      },
      inspector: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return bookings.map((booking) => ({
    ...booking,
    code: generateInspectionCode(booking.id, booking.createdAt),
  }));
}

// ============================================
// GET - Estadísticas de inspecciones (Admin)
// ============================================

export async function getInspectionStats() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  const [pending, inProgress, completed, cancelled] = await Promise.all([
    db.booking.count({ where: { status: 'PENDING_PAYMENT' } }),
    db.booking.count({ where: { status: { in: ['PAID', 'CONFIRMED'] } } }),
    db.booking.count({ where: { status: 'COMPLETED' } }),
    db.booking.count({ where: { status: { in: ['CANCELLED', 'NO_SHOW', 'EXPIRED'] } } }),
  ]);

  return {
    pending,
    inProgress,
    completed,
    cancelled,
    total: pending + inProgress + completed + cancelled,
  };
}

// ============================================
// GET - Inspección por ID
// ============================================

export async function getInspectionById(id: number): Promise<BookingWithDetails | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      vehicle: {
        include: {
          model: {
            include: {
              brand: true,
            },
          },
        },
      },
      inspectionPlan: {
        select: {
          id: true,
          type: true,
          title: true,
          price: true,
        },
      },
      inspector: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      payment: {
        select: {
          id: true,
          status: true,
          amount: true,
          paidAt: true,
          receiptNumber: true,
        },
      },
      report: {
        select: {
          id: true,
          legalStatus: true,
          legalScore: true,
          mechanicalStatus: true,
          mechanicalScore: true,
          bodyStatus: true,
          bodyScore: true,
          overallScore: true,
          overallStatus: true,
          executiveSummary: true,
          recommendations: true,
          completedAt: true,
          pdfUrl: true,
        },
      },
    },
  });

  if (!booking) return null;

  // Verificar acceso: cliente solo puede ver las suyas, admin puede ver todas
  const isOwner = booking.clientId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';
  const isInspector = booking.inspectorId === session.user.id;

  if (!isOwner && !isAdmin && !isInspector) {
    throw new Error('No autorizado');
  }

  return {
    ...booking,
    code: generateInspectionCode(booking.id, booking.createdAt),
  };
}

// ============================================
// GET - Inspectores disponibles (Admin)
// ============================================

export async function getAvailableInspectors() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  return db.user.findMany({
    where: {
      role: 'INSPECTOR',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });
}

// ============================================
// PUT - Actualizar estado de inspección (Admin)
// ============================================

export async function updateInspectionStatus(
  id: number,
  status: BookingStatus
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  const updateData: any = { status };

  // Actualizar timestamps según el estado
  if (status === 'CONFIRMED') {
    updateData.confirmedAt = new Date();
  } else if (status === 'COMPLETED') {
    updateData.completedAt = new Date();
  } else if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date();
  }

  return db.booking.update({
    where: { id },
    data: updateData,
  });
}

// ============================================
// PUT - Asignar inspector (Admin)
// ============================================

export async function assignInspector(bookingId: number, inspectorId: number) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  // Verificar que el inspector existe y es inspector
  const inspector = await db.user.findFirst({
    where: {
      id: inspectorId,
      role: 'INSPECTOR',
      isActive: true,
    },
  });

  if (!inspector) {
    throw new Error('Inspector no válido');
  }

  return db.booking.update({
    where: { id: bookingId },
    data: {
      inspectorId,
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
  });
}

// ============================================
// PUT - Actualizar notas (Admin/Inspector)
// ============================================

export async function updateInspectionNotes(
  id: number,
  notes: {
    clientNotes?: string;
    inspectorNotes?: string;
    adminNotes?: string;
  }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const booking = await db.booking.findUnique({ where: { id } });

  if (!booking) {
    throw new Error('Inspección no encontrada');
  }

  const isAdmin = session.user.role === 'ADMIN';
  const isInspector = booking.inspectorId === session.user.id;

  if (!isAdmin && !isInspector) {
    throw new Error('No autorizado');
  }

  const updateData: any = {};

  if (isAdmin && notes.adminNotes !== undefined) {
    updateData.adminNotes = notes.adminNotes;
  }

  if ((isAdmin || isInspector) && notes.inspectorNotes !== undefined) {
    updateData.inspectorNotes = notes.inspectorNotes;
  }

  return db.booking.update({
    where: { id },
    data: updateData,
  });
}

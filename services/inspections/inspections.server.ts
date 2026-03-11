import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BookingStatus, InspectionResultStatus } from '@prisma/client';

// ============================================
// Tipos
// ============================================

// Tipo base del reporte para la lista del cliente (campos mínimos)
interface ReportSummary {
  id: number;
  overallStatus: InspectionResultStatus;
  overallScore: number | null;
  pdfUrl: string | null;
}

// Tipo completo del reporte para vistas detalladas
interface ReportFull extends ReportSummary {
  legalStatus: InspectionResultStatus;
  legalScore: number | null;
  mechanicalStatus: InspectionResultStatus;
  mechanicalScore: number | null;
  bodyStatus: InspectionResultStatus;
  bodyScore: number | null;
  executiveSummary: string | null;
  recommendations: string | null;
  completedAt: Date | null;
}

// Tipo base para booking con detalles
interface BookingBase {
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
    id: string;
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
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  payment?: {
    id: number;
    status: string;
    amount: number;
    paidAt: Date | null;
    receiptNumber: string | null;
  } | null;
}

// Tipo para la lista de inspecciones del cliente (reporte resumido)
export interface ClientBookingWithDetails extends BookingBase {
  report?: ReportSummary | null;
}

// Tipo para vistas detalladas (reporte completo)
export interface BookingWithDetails extends BookingBase {
  report?: ReportFull | null;
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

export async function getClientInspections(): Promise<ClientBookingWithDetails[]> {
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
      report: {
        select: {
          id: true,
          overallStatus: true,
          overallScore: true,
          pdfUrl: true,
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
      isInspectorAvailable: true,
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

export async function assignInspector(bookingId: number, inspectorId: string, autoConfirm = false) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  // Verificar que el inspector existe y es inspector
  const inspector = await db.user.findFirst({
    where: {
      id: inspectorId,
      role: 'INSPECTOR',
      isInspectorAvailable: true,
    },
  });

  if (!inspector) {
    throw new Error('Inspector no válido');
  }

  // Solo asignar inspector, sin cambiar el estado automáticamente
  // El estado se maneja por separado con updateInspectionStatus
  const updateData: { inspectorId: string; status?: 'CONFIRMED'; confirmedAt?: Date } = {
    inspectorId,
  };

  // Solo confirmar automáticamente si se indica explícitamente
  if (autoConfirm) {
    updateData.status = 'CONFIRMED';
    updateData.confirmedAt = new Date();
  }

  return db.booking.update({
    where: { id: bookingId },
    data: updateData,
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

// ============================================
// POST - Crear inspección manual (Admin)
// ============================================

export interface ManualBookingInput {
  // Datos del cliente
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  // Datos del vehículo
  brandId: number;
  modelId: number;
  year: number;
  plate?: string;
  // Datos de la inspección
  inspectionPlanId: number;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  inspectorId?: string;
  adminNotes?: string;
  // Pago manual
  isPaid?: boolean;
  passClient: string
}

export async function createManualBooking(input: ManualBookingInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  // 1. Buscar o crear el cliente
  let client = await db.user.findUnique({
    where: { email: input.clientEmail.toLowerCase().trim() },
  });

  if (!client) {
    client = await db.user.create({
      data: {
        name: input.clientName.trim(),
        email: input.clientEmail.toLowerCase().trim(),
        phone: input.clientPhone?.trim() || null,
        role: 'CLIENT',
      },
    });
  }

  // 2. Verificar que el modelo existe
  const model = await db.model.findUnique({
    where: { id: input.modelId },
  });

  if (!model) {
    throw new Error('Modelo de vehículo no válido');
  }

  // 3. Crear o encontrar el vehículo
  let vehicle;
  const normalizedPlate = input.plate?.toUpperCase().replace(/[^A-Z0-9-]/g, '') || null;

  if (normalizedPlate) {
    vehicle = await db.vehicle.findFirst({
      where: { plate: normalizedPlate },
    });
  }

  if (!vehicle) {
    vehicle = await db.vehicle.create({
      data: {
        userId: client.id,
        modelId: input.modelId,
        year: input.year,
        plate: normalizedPlate,
      },
    });
  }

  // 4. Verificar que el plan de inspección existe
  const plan = await db.inspectionPlan.findUnique({
    where: { id: input.inspectionPlanId },
  });

  if (!plan) {
    throw new Error('Plan de inspección no válido');
  }

  // 5. Calcular fecha y hora
  const [hours, minutes] = input.timeSlot.split(':').map(Number);
  const startTime = new Date(input.date);
  startTime.setHours(hours, minutes, 0, 0);

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + 45);

  // 6. Determinar el estado inicial
  let status: BookingStatus = 'PENDING_PAYMENT';
  if (input.isPaid) {
    status = input.inspectorId ? 'CONFIRMED' : 'PAID';
  }

  // 7. Crear el booking
  const booking = await db.booking.create({
    data: {
      clientId: client.id,
      vehicleId: vehicle.id,
      inspectionPlanId: input.inspectionPlanId,
      inspectorId: input.inspectorId || null,
      date: new Date(input.date),
      timeSlot: input.timeSlot,
      startTime,
      endTime,
      status,
      adminNotes: input.adminNotes || `Reserva creada manualmente por admin (WhatsApp)`,
      confirmedAt: status === 'CONFIRMED' ? new Date() : null,
    },
    include: {
      client: { select: { id: true, name: true, email: true, password: true } },
      vehicle: {
        include: {
          model: { include: { brand: true } },
        },
      },
      inspectionPlan: { select: { title: true, price: true } },
      inspector: { select: { id: true, name: true } },
    },
  });

  // 8. Si está pagado, crear el registro de pago
  if (input.isPaid) {
    await db.payment.create({
      data: {
        bookingId: booking.id,
        amount: plan.price * 100, // Convertir a céntimos
        status: 'COMPLETED',
        paidAt: new Date(),
        receiptNumber: `MAN-${booking.id}-${Date.now()}`,
      },
    });
  }

  return {
    ...booking,
    code: generateInspectionCode(booking.id, booking.createdAt),
  };
}

// ============================================
// GET - Marcas de vehículos
// ============================================

export async function getBrands() {
  return db.brand.findMany({
    orderBy: { name: 'asc' },
  });
}

// ============================================
// GET - Modelos por marca
// ============================================

export async function getModelsByBrand(brandId: number) {
  return db.model.findMany({
    where: { brandId },
    orderBy: { name: 'asc' },
  });
}

// ============================================
// GET - Planes de inspección
// ============================================

export async function getInspectionPlans() {
  return db.inspectionPlan.findMany({
    orderBy: { price: 'asc' },
  });
}

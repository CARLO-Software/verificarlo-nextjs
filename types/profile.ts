// ============================================
// Tipos para el módulo de Perfil de Usuario
// ============================================

export type Role = 'CLIENT' | 'INSPECTOR' | 'ADMIN';
export type UserStatus = "ACTIVE" | "SUSPENDED";

// Datos del usuario que vienen de la sesión/BD
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: Role;
  isInspectorAvailable: boolean;
  createdAt: Date;
  status: UserStatus;
  // Campos específicos de INSPECTOR
  availability: Record<string, string[]> | null; // {"lunes": ["09:00-13:00"], ...}

  // Campos específicos de CLIENT
  address: string | null;
  district: string | null;
}

// Datos que se pueden actualizar (sin campos sensibles como id, role, etc.)
export interface UpdateProfileData {
  name?: string;
  phone?: string;
  image?: string;

  // Inspector
  availability?: Record<string, string[]>;

  // Cliente
  address?: string;
  district?: string;
}

// Respuesta de Server Actions
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Distritos de Lima para el select
export const LIMA_DISTRICTS = [
  'Ate',
  'Barranco',
  'Breña',
  'Chorrillos',
  'Comas',
  'El Agustino',
  'Independencia',
  'Jesús María',
  'La Molina',
  'La Victoria',
  'Lima Cercado',
  'Lince',
  'Los Olivos',
  'Lurín',
  'Magdalena del Mar',
  'Miraflores',
  'Pueblo Libre',
  'Puente Piedra',
  'Rímac',
  'San Borja',
  'San Isidro',
  'San Juan de Lurigancho',
  'San Juan de Miraflores',
  'San Luis',
  'San Martín de Porres',
  'San Miguel',
  'Santa Anita',
  'Santiago de Surco',
  'Surquillo',
  'Villa El Salvador',
  'Villa María del Triunfo',
] as const;

// Zonas de atención para inspectores
export const SERVICE_ZONES = [
  'Lima Norte',
  'Lima Sur',
  'Lima Este',
  'Lima Centro',
  'Callao',
  'Lima Metropolitana (todas las zonas)',
] as const;

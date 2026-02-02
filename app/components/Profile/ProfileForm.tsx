'use client';

import { FormEvent } from 'react';
import { FormField } from '@/app/components/ui/FormField';
import { RoleGuard } from '@/app/components/ui/RoleGuard';
import { useToast } from '@/app/components/Toast';
import { useProfile } from '@/app/(dashboard)/perfil/useProfile';
import styles from './Profile.module.css';
import type { UserProfile, Role } from '@/types/profile';
import { LIMA_DISTRICTS, SERVICE_ZONES } from '@/types/profile';

// ============================================
// ProfileForm: Formulario editable según el rol
//
// Renderiza campos diferentes según el rol:
// - Todos: nombre, teléfono
// - Cliente: dirección, distrito
// - Inspector: zona de atención, disponibilidad
// - Admin: puede ver todo (solo para referencia)
// ============================================

interface ProfileFormProps {
  user: UserProfile;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const {
    formData,
    errors,
    isLoading,
    isDirty,
    handleChange,
    handleSubmit,
    resetForm,
  } = useProfile(user);

  const { showToast } = useToast();

  // Handler del formulario
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const success = await handleSubmit();

    if (success) {
      showToast('Perfil actualizado correctamente', 'success');
    } else if (errors._server) {
      showToast(errors._server, 'error');
    }
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {/* ============================================
          SECCIÓN: Información Personal (todos los roles)
          ============================================ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Información Personal</h2>

        <div className={styles.fieldsGrid}>
          <FormField
            label="Nombre completo"
            name="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            placeholder="Ej: Juan Pérez"
          />

          <FormField
            label="Teléfono / WhatsApp"
            name="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={errors.phone}
            placeholder="987654321"
            hint="Formato: 9 dígitos empezando con 9"
          />
        </div>

        {/* Email (solo lectura) */}
        <FormField
          label="Correo electrónico"
          name="email"
          type="email"
          value={user.email}
          disabled
          hint="El correo no se puede cambiar"
        />
      </section>

      {/* ============================================
          SECCIÓN: Campos de CLIENTE
          Solo visible para rol CLIENT
          ============================================ */}
      <RoleGuard allowedRoles={['CLIENT'] as Role[]} userRole={user.role}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Dirección</h2>
          <p className={styles.sectionHint}>
            Para inspecciones a domicilio
          </p>

          <div className={styles.fieldsGrid}>
            <FormField
              label="Distrito"
              name="district"
              as="select"
              value={formData.district || ''}
              onChange={(e) => handleChange('district', e.target.value)}
              error={errors.district}
              options={LIMA_DISTRICTS.map((d) => ({ value: d, label: d }))}
            />

            <FormField
              label="Dirección completa"
              name="address"
              as="textarea"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              error={errors.address}
              placeholder="Av. Javier Prado 123, Dpto 401"
            />
          </div>
        </section>
      </RoleGuard>

      {/* ============================================
          SECCIÓN: Campos de INSPECTOR
          Solo visible para rol INSPECTOR
          ============================================ */}
      <RoleGuard allowedRoles={['INSPECTOR'] as Role[]} userRole={user.role}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Configuración de Servicio</h2>
          <p className={styles.sectionHint}>
            Define tu zona de atención y disponibilidad
          </p>

          {/* Nota: La disponibilidad completa requeriría un componente
              más complejo (scheduler). Esto es un placeholder. */}
          <div className={styles.availabilityNote}>
            <p>
              La disponibilidad horaria se configura desde el panel de administración.
              Contacta al admin para cambios.
            </p>
          </div>
        </section>
      </RoleGuard>

      {/* ============================================
          SECCIÓN: Vista de ADMIN
          Admin ve todos los campos (solo lectura para campos de otros roles)
          ============================================ */}
      <RoleGuard allowedRoles={['ADMIN'] as Role[]} userRole={user.role}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Información de Admin</h2>
          <p className={styles.sectionHint}>
            Como administrador, puedes editar tu información básica.
            Para editar otros usuarios, usa el panel de administración.
          </p>
        </section>
      </RoleGuard>

      {/* ============================================
          BOTONES DE ACCIÓN
          ============================================ */}
      <div className={styles.actions}>
        {/* Botón cancelar (solo si hay cambios) */}
        {isDirty && (
          <button
            type="button"
            onClick={resetForm}
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Cancelar
          </button>
        )}

        {/* Botón guardar */}
        <button
          type="submit"
          className={styles.saveButton}
          disabled={isLoading || !isDirty}
        >
          {isLoading ? (
            <span className={styles.loading}>
              <span className={styles.spinner}></span>
              Guardando...
            </span>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>
    </form>
  );
}

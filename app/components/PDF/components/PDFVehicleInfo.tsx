// ============================================
// PDFVehicleInfo - Datos del vehículo (compacto)
// REDISEÑO: Una línea con toda la info relevante
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface PDFVehicleInfoProps {
  brand: string;
  model: string;
  year: number;
  plate: string | null;
  mileage: number | null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  mileage: {
    fontSize: 10,
    color: colors.slate,
  },
  plate: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.graphite,
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
});

export default function PDFVehicleInfo({
  brand,
  model,
  year,
  plate,
  mileage,
}: PDFVehicleInfoProps) {
  const formatMileage = (km: number | null) => {
    if (!km) return null;
    return `${km.toLocaleString('es-PE')} km`;
  };

  const mileageText = formatMileage(mileage);

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.vehicleName}>
          {brand} {model} {year}
        </Text>
        {mileageText && <Text style={styles.mileage}>{mileageText}</Text>}
      </View>
      <Text style={styles.plate}>{plate || 'SIN PLACA'}</Text>
    </View>
  );
}

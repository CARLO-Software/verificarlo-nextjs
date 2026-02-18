// ============================================
// PDFVehicleInfo - Datos del vehículo (compacto)
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface PDFVehicleInfoProps {
  brand: string;
  model: string;
  year: number;
  plate: string | null;
  vin: string | null;
  mileage: number | null;
  color: string | null;
  engineNumber: string | null;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.graphite,
  },
  plate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.graphite,
    backgroundColor: colors.brand,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    width: '25%',
  },
  label: {
    fontSize: 7,
    color: colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    color: colors.charcoal,
    fontWeight: 'bold',
  },
});

export default function PDFVehicleInfo({
  brand,
  model,
  year,
  plate,
  vin,
  mileage,
  color,
  engineNumber,
}: PDFVehicleInfoProps) {
  const formatMileage = (km: number | null) => {
    if (!km) return '-';
    return `${km.toLocaleString('es-PE')} km`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.vehicleName}>
          {brand} {model} {year}
        </Text>
        <Text style={styles.plate}>{plate || 'SIN PLACA'}</Text>
      </View>
      <View style={styles.grid}>
        <View style={styles.item}>
          <Text style={styles.label}>Kilometraje</Text>
          <Text style={styles.value}>{formatMileage(mileage)}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>Color</Text>
          <Text style={styles.value}>{color || '-'}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>VIN</Text>
          <Text style={styles.value}>{vin ? vin.slice(-8) : '-'}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>Motor</Text>
          <Text style={styles.value}>{engineNumber ? engineNumber.slice(-8) : '-'}</Text>
        </View>
      </View>
    </View>
  );
}

// ============================================
// PDFVehicleInfo - Datos del vehículo
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, typography } from '../styles/pdfStyles';

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
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    width: '33%',
    marginBottom: 10,
  },
  itemWide: {
    width: '50%',
    marginBottom: 10,
  },
  label: {
    ...typography.label,
  },
  value: {
    ...typography.value,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[800],
    marginBottom: 12,
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
    if (!km) return 'No registrado';
    return `${km.toLocaleString('es-PE')} km`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DATOS DEL VEHICULO</Text>
      <Text style={styles.vehicleName}>
        {brand} {model} {year}
      </Text>
      <View style={styles.grid}>
        <View style={styles.item}>
          <Text style={styles.label}>Placa</Text>
          <Text style={styles.value}>{plate || 'Sin placa'}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>Kilometraje</Text>
          <Text style={styles.value}>{formatMileage(mileage)}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>Color</Text>
          <Text style={styles.value}>{color || 'No especificado'}</Text>
        </View>
        <View style={styles.itemWide}>
          <Text style={styles.label}>VIN / Chasis</Text>
          <Text style={styles.value}>{vin || 'No registrado'}</Text>
        </View>
        <View style={styles.itemWide}>
          <Text style={styles.label}>Numero de Motor</Text>
          <Text style={styles.value}>{engineNumber || 'No registrado'}</Text>
        </View>
      </View>
    </View>
  );
}

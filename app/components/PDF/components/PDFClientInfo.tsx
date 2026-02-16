// ============================================
// PDFClientInfo - Datos del cliente
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, typography } from '../styles/pdfStyles';

interface PDFClientInfoProps {
  name: string;
  email: string;
  phone: string | null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  item: {
    flex: 1,
  },
  label: {
    ...typography.label,
  },
  value: {
    fontSize: 10,
    color: colors.gray[800],
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
});

export default function PDFClientInfo({ name, email, phone }: PDFClientInfoProps) {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.label}>Cliente</Text>
        <Text style={styles.value}>{name}</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email}</Text>
      </View>
      <View style={styles.item}>
        <Text style={styles.label}>Telefono</Text>
        <Text style={styles.value}>{phone || 'No registrado'}</Text>
      </View>
    </View>
  );
}

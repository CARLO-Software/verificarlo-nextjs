// ============================================
// PDFClientInfo - Datos del cliente (compacto)
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../styles/pdfStyles';

interface PDFClientInfoProps {
  name: string;
  email: string;
  phone: string | null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  item: {
    flex: 1,
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
    color: colors.graphite,
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
        <Text style={styles.label}>Teléfono</Text>
        <Text style={styles.value}>{phone || '-'}</Text>
      </View>
    </View>
  );
}

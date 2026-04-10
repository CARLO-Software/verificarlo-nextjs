// ============================================
// PDFVerdict - Banner de decisión DOMINANTE
// REDISEÑO: Grande, bold, imposible de ignorar
// Rojo = NO COMPRAR | Amarillo = NEGOCIAR | Verde = COMPRA SEGURA
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, getVerdictConfig } from '../styles/pdfStyles';

interface PDFVerdictProps {
  status: string;
  estimatedCost?: number | null;
}

const styles = StyleSheet.create({
  // Banner principal - FULL WIDTH, muy visible
  banner: {
    marginBottom: 14,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // Contenedor principal del veredicto
  mainSection: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Ícono grande circular
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  // Contenido de texto
  textContent: {
    flex: 1,
  },
  // Label principal - MUY GRANDE
  mainLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  // Subtítulo con acción
  subtitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  // Descripción breve
  description: {
    fontSize: 9,
    lineHeight: 1.4,
    opacity: 0.9,
  },
  // Barra de acento lateral
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
});

export default function PDFVerdict({ status, estimatedCost }: PDFVerdictProps) {
  const config = getVerdictConfig(status, estimatedCost);

  // Usar fondo más intenso para mayor impacto visual
  const bgColor = config.bgColorStrong;
  const textColor = config.colorDark;

  return (
    <View style={[styles.banner, { backgroundColor: bgColor }]}>
      {/* Barra de acento lateral */}
      <View style={[styles.accentBar, { backgroundColor: config.color }]} />

      <View style={styles.mainSection}>
        {/* Ícono circular grande */}
        <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
          <Text style={styles.iconText}>{config.icon}</Text>
        </View>

        {/* Contenido de texto */}
        <View style={styles.textContent}>
          <Text style={[styles.mainLabel, { color: textColor }]}>
            {config.label}
          </Text>
          <Text style={[styles.subtitle, { color: textColor }]}>
            {config.subtitle}
          </Text>
          <Text style={[styles.description, { color: textColor }]}>
            {config.description}
          </Text>
        </View>
      </View>
    </View>
  );
}

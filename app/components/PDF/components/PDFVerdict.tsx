// ============================================
// PDFVerdict - Veredicto principal del informe
// Rediseño: Más compacto y profesional
//
// 📚 CONCEPTO REACT - Props y Renderizado Condicional:
// Este componente recibe `status` y `estimatedCost` como props.
// Dependiendo del status, cambia completamente su apariencia.
// Esto se llama "renderizado condicional basado en props".
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, getVerdictConfig } from '../styles/pdfStyles';

interface PDFVerdictProps {
  status: string;
  estimatedCost?: number | null;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  verdictBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Estilo especial para el veredicto CRITICAL (NO COMPRAR)
  // Usa borde más grueso y doble para hacerlo más notorio
  verdictBoxCritical: {
    borderWidth: 2,
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  // Ícono más grande para CRITICAL
  iconContainerCritical: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  iconTextCritical: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  textContainer: {
    flex: 1,
  },
  verdictLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  // Label más destacado para CRITICAL
  verdictLabelCritical: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 8,
    lineHeight: 1.3,
  },
});

export default function PDFVerdict({ status, estimatedCost }: PDFVerdictProps) {
  const config = getVerdictConfig(status, estimatedCost);

  // 📚 CONCEPTO REACT - Renderizado condicional:
  // Verificamos si es CRITICAL para aplicar estilos más notorios
  const isCritical = status === 'CRITICAL';

  return (
    <View style={styles.container}>
      <View
        style={[
          // Usamos estilos diferentes según el estado
          isCritical ? styles.verdictBoxCritical : styles.verdictBox,
          {
            borderColor: config.borderColor,
            backgroundColor: config.bgColor,
          },
        ]}
      >
        <View
          style={[
            isCritical ? styles.iconContainerCritical : styles.iconContainer,
            { backgroundColor: config.color }
          ]}
        >
          <Text style={isCritical ? styles.iconTextCritical : styles.iconText}>
            {config.icon}
          </Text>
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              isCritical ? styles.verdictLabelCritical : styles.verdictLabel,
              { color: config.color }
            ]}
          >
            {config.label}
          </Text>
          <Text style={[styles.subtitle, { color: config.color }]}>
            {config.subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';

// === TYPES ===

export interface TableEntry {
  concept: string;
  entity: string;
  result: string;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
  statusText: string;
}

export interface LegalReportData {
  plate: string;
  fields: {
    key: string;
    label: string;
    status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
    badgeText: string;
    text: string;
  }[];
  // New detailed sections
  emissionDate?: string;
  code?: string;
  vehicleDescription?: string;
  vehicleMain?: { label: string; value: string }[];
  vehicleComplementary?: { label: string; value: string }[];
  owners?: { number: number; name: string; document: string; acquisitionDate: string; timeAsOwner: string; price: string; title: string; tags?: string[] }[];
  ownershipNote?: string;
  registryEntries?: { number: number; date: string; act: string; title: string }[];
  registryNote?: string;
  registryNoteStatus?: 'OK' | 'WARNING' | 'CRITICAL';
  registryNoteTitle?: string;
  liensStatus?: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
  liensTitle?: string;
  liensDetail?: string;
  liensSource?: string;
  taxYears?: { year: string; contributor: string; amount: string; status: 'OK' | 'WARNING' | 'CRITICAL'; statusText: string }[];
  taxCriteria?: string;
  taxReminder?: string;
  taxSource?: string;
  debts?: TableEntry[];
  debtsNote?: string;
  debtsSource?: string;
  insurance?: TableEntry[];
  insuranceNote?: string;
  insuranceSource?: string;
  claims?: TableEntry[];
  activationsTable?: { insurer: string; policyNumber: string; period: string; count: number }[];
  claimsNote?: string;
  claimsSource?: string;
  gnvItems?: TableEntry[];
  gnvSource?: string;
  conclusionText?: string;
  disclaimer?: string;
  // Backward compat
  inspectionId?: number;
  clientName?: string;
  date?: string;
  conclusion?: { label: string; text: string };
  vehicleDetails?: { color?: string; nroMotor?: string; nroVin?: string };
  otherObservations?: string;
  screenshots?: { sourceId: string; sourceName: string; imageUrl: string }[];
  inspectorName?: string;
  totalPages?: number;
  soatExpiryDate?: string | null;
  techReviewExpiryDate?: string | null;
  techReviewNotes?: string | null;
  lastTransferPrice?: string | null;
}

// === COLORS ===

const C = {
  primary: '#FBBF24',
  dark: '#333333',
  darkHeader: '#4B5563',
  white: '#FFFFFF',
  offWhite: '#F9FAFB',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  green: '#16A34A',
  greenBg: '#F0FDF4',
  greenBorder: '#16A34A',
  amber: '#D97706',
  amberBg: '#FFFBEB',
  amberBorder: '#D97706',
  red: '#DC2626',
  redBg: '#FEF2F2',
  redBorder: '#DC2626',
  grayBadge: '#6B7280',
};

function badgeColor(status: string): string {
  switch (status) {
    case 'OK': return C.green;
    case 'WARNING': return C.amber;
    case 'CRITICAL': return C.red;
    default: return C.grayBadge;
  }
}

function statusIcon(status: string): string {
  switch (status) {
    case 'OK': return '✓';
    case 'WARNING': return '!';
    case 'CRITICAL': return '✕';
    default: return '–';
  }
}

function formatPlate(plate: string): string {
  const clean = plate.replace(/[-\s]/g, '').toUpperCase();
  if (clean.length === 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return clean;
}

// === STYLES ===

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: 'Helvetica',
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 22,
    fontSize: 7.5,
    color: C.text,
  },

  // Top header
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  topText: { fontSize: 7, color: C.textLight },
  topBold: { fontFamily: 'Helvetica-Bold' },

  // Main banner
  banner: { backgroundColor: C.dark, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, marginBottom: 0 },
  logo: { fontFamily: 'Helvetica-BoldOblique', fontSize: 26, color: C.white, letterSpacing: 1 },
  plateBox: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', borderRadius: 3 },
  plateCountry: { fontSize: 5.5, color: C.textLight, letterSpacing: 1.5, marginBottom: 1, fontFamily: 'Helvetica-Bold' },
  plateFlag: { flexDirection: 'row', justifyContent: 'center', marginBottom: 2 },
  plateFlagR: { width: 7, height: 4, backgroundColor: '#DC2626' },
  plateFlagW: { width: 7, height: 4, backgroundColor: C.white, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#E5E7EB' },
  plateNum: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: C.text, letterSpacing: 2 },

  // Section banners
  secYellow: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, marginTop: 10 },
  secDark: { backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, marginTop: 10 },
  secIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  secIconText: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.white },
  secContent: { flex: 1 },
  secTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.white, letterSpacing: 0.3 },
  secTitleYellow: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.primary, letterSpacing: 0.3 },
  secSub: { fontSize: 6.5, color: 'rgba(255,255,255,0.85)', marginTop: 1 },

  // Summary table
  sumHeader: { flexDirection: 'row', backgroundColor: C.darkHeader, paddingVertical: 5, paddingHorizontal: 10 },
  sumHeaderL: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.white, flex: 1, letterSpacing: 0.5 },
  sumHeaderR: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.white, width: 110, textAlign: 'right', letterSpacing: 0.5 },
  sumRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderBottomWidth: 0.5, borderBottomColor: C.border, minHeight: 26 },
  sumRowAlt: { backgroundColor: C.offWhite },
  sumLeft: { flex: 1 },
  sumLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.text },
  sumDesc: { fontSize: 6.5, color: C.textLight, marginTop: 1, lineHeight: 1.3 },
  sumRight: { width: 110, alignItems: 'flex-end' },

  // Badge
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 3 },
  badgeCircle: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: C.white, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  badgeCircleText: { fontFamily: 'Helvetica-Bold', fontSize: 7 },
  badgeText: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.white, letterSpacing: 0.3 },

  // Vehicle tables
  vehContainer: { flexDirection: 'row', /* gap:0 not supported */ },
  vehTable: { width: '50%' },
  vehHeader: { backgroundColor: C.dark, paddingVertical: 4, paddingHorizontal: 6 },
  vehHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.white, textAlign: 'center', letterSpacing: 0.3 },
  vehRow: { flexDirection: 'row', paddingVertical: 2.5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border },
  vehRowAlt: { backgroundColor: C.offWhite },
  vehLabel: { fontSize: 6.5, color: C.textLight, width: '48%' },
  vehValue: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text, width: '52%' },

  // Owner table
  ownHeader: { flexDirection: 'row', backgroundColor: C.dark, paddingVertical: 4, paddingHorizontal: 6 },
  ownHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.white, letterSpacing: 0.3 },
  ownRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border, alignItems: 'flex-start' },
  ownRowAlt: { backgroundColor: C.offWhite },
  ownNum: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.dark, width: 18, textAlign: 'center' },
  ownName: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text },
  ownTag: { fontSize: 5.5, color: C.amber, marginTop: 1 },
  ownCell: { fontSize: 6.5, color: C.text },
  ownCellBold: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text },

  // Registry table
  regHeader: { flexDirection: 'row', backgroundColor: C.dark, paddingVertical: 4, paddingHorizontal: 6 },
  regRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border },
  regRowAlt: { backgroundColor: C.offWhite },
  regNum: { width: 30, alignItems: 'center', justifyContent: 'center' },
  regNumCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  regNumText: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.dark },

  // Callout box
  callout: { flexDirection: 'row', padding: 10, marginTop: 6, borderLeftWidth: 3 },
  calloutIcon: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  calloutIconText: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.white },
  calloutContent: { flex: 1 },
  calloutTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 2 },
  calloutText: { fontSize: 7, color: C.text, lineHeight: 1.4 },

  // 4-col table
  t4Header: { flexDirection: 'row', backgroundColor: C.dark, paddingVertical: 4, paddingHorizontal: 6 },
  t4HeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.white, letterSpacing: 0.3 },
  t4Row: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border, alignItems: 'center' },
  t4RowAlt: { backgroundColor: C.offWhite },
  t4Cell: { fontSize: 6.5, color: C.text },
  t4CellBold: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text },

  // Tax section side-by-side
  taxContainer: { flexDirection: 'row', /* gap:0 not supported */ },
  taxTable: { width: '48%' },
  taxCriteria: { width: '52%', paddingLeft: 8 },
  taxCriteriaBox: { backgroundColor: C.offWhite, padding: 8, borderLeftWidth: 2, borderLeftColor: C.primary },
  taxCriteriaTitle: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.text, marginBottom: 3 },
  taxCriteriaText: { fontSize: 6.5, color: C.text, lineHeight: 1.4 },

  // Source line
  source: { fontSize: 5.5, color: C.textMuted, textAlign: 'right', marginTop: 4, marginBottom: 2 },

  // Note
  note: { fontSize: 6.5, color: C.text, lineHeight: 1.4, marginTop: 5 },
  noteBold: { fontFamily: 'Helvetica-Bold' },

  // Conclusion
  conclusionBox: { backgroundColor: C.offWhite, padding: 14, marginTop: 0, borderWidth: 0.5, borderColor: C.border },
  conclusionText: { fontSize: 7.5, color: C.text, lineHeight: 1.5 },

  // Footer
  footer: { marginTop: 8, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: C.border },
  footerText: { fontSize: 5.5, color: C.textMuted, lineHeight: 1.4 },
  footerBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  footerCode: { fontSize: 6.5, color: C.textLight },
  footerCodeBold: { fontFamily: 'Helvetica-Bold' },
  footerLogo: { fontFamily: 'Helvetica-BoldOblique', fontSize: 11, color: C.text },

  // Activation sub-table
  actHeader: { flexDirection: 'row', backgroundColor: C.lightGray, paddingVertical: 3, paddingHorizontal: 6, marginTop: 6 },
  actHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.text, letterSpacing: 0.3 },
  actRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border },
  actLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.text, marginTop: 6, marginBottom: 2 },
});

// === REUSABLE COMPONENTS ===

function StatusBadge({ status, text }: { status: string; text: string }) {
  const bg = badgeColor(status);
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <View style={s.badgeCircle}>
        <Text style={[s.badgeCircleText, { color: bg }]}>{statusIcon(status)}</Text>
      </View>
      <Text style={s.badgeText}>{text}</Text>
    </View>
  );
}

function SectionBanner({ type, title, subtitle, icon }: { type: 'yellow' | 'dark'; title: string; subtitle?: string; icon?: string }) {
  const isYellow = type === 'yellow';
  return (
    <View style={isYellow ? s.secYellow : s.secDark} wrap={false}>
      {icon && (
        <View style={s.secIcon}>
          <Text style={s.secIconText}>{icon}</Text>
        </View>
      )}
      <View style={s.secContent}>
        <Text style={isYellow ? s.secTitle : s.secTitleYellow}>{title}</Text>
        {subtitle && <Text style={s.secSub}>{subtitle}</Text>}
      </View>
    </View>
  );
}

function SourceLine({ text }: { text: string }) {
  return <Text style={s.source}>Fuente: {text}</Text>;
}

function CalloutBox({ status, title, detail }: { status: 'OK' | 'WARNING' | 'CRITICAL'; title: string; detail: string }) {
  const bg = status === 'OK' ? C.greenBg : status === 'WARNING' ? C.amberBg : C.redBg;
  const border = status === 'OK' ? C.greenBorder : status === 'WARNING' ? C.amberBorder : C.redBorder;
  const iconBg = status === 'OK' ? C.green : status === 'WARNING' ? C.amber : C.red;
  const titleColor = status === 'OK' ? C.green : status === 'WARNING' ? C.amber : C.red;
  const iconChar = status === 'OK' ? '✓' : status === 'WARNING' ? '!' : '✕';
  return (
    <View style={[s.callout, { backgroundColor: bg, borderLeftColor: border }]} wrap={false}>
      <View style={[s.calloutIcon, { backgroundColor: iconBg }]}>
        <Text style={s.calloutIconText}>{iconChar}</Text>
      </View>
      <View style={s.calloutContent}>
        <Text style={[s.calloutTitle, { color: titleColor }]}>{title}</Text>
        <Text style={s.calloutText}>{detail}</Text>
      </View>
    </View>
  );
}

function FourColTable({ headers, widths, rows }: {
  headers: string[];
  widths: number[];
  rows: { cells: string[]; status?: string; statusText?: string; alt: boolean }[];
}) {
  return (
    <View>
      <View style={s.t4Header}>
        {headers.map((h, i) => (
          <Text key={i} style={[s.t4HeaderCell, { width: `${widths[i]}%` }]}>{h}</Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={[s.t4Row, row.alt ? s.t4RowAlt : {}]} wrap={false}>
          {row.cells.map((cell, ci) => (
            ci < row.cells.length - 1 ? (
              <Text key={ci} style={[ci === 0 ? s.t4CellBold : s.t4Cell, { width: `${widths[ci]}%` }]}>{cell}</Text>
            ) : null
          ))}
          <View style={{ width: `${widths[widths.length - 1]}%`, alignItems: 'flex-end' }}>
            {row.status && row.statusText ? (
              <StatusBadge status={row.status} text={row.statusText} />
            ) : (
              <Text style={s.t4Cell}>{row.cells[row.cells.length - 1]}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

// === MAIN COMPONENT ===

export default function LegalReportPDF({ data }: { data: LegalReportData }) {
  const hasDetail = !!data.owners;
  const plate = formatPlate(data.plate);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ===== TOP HEADER ===== */}
        <View style={s.topRow}>
          <Text style={s.topText}>
            <Text style={s.topBold}>Fecha y hora de emisión: </Text>
            {data.emissionDate || data.date || ''}
          </Text>
          <Text style={s.topText}>
            <Text style={s.topBold}>Código: </Text>
            {data.code || ''}
          </Text>
        </View>

        {/* ===== MAIN BANNER ===== */}
        <View style={s.banner}>
          <Text style={s.logo}>VERIFICARLO</Text>
          <View style={s.plateBox}>
            <Text style={s.plateCountry}>PERÚ</Text>
            <View style={s.plateFlag}>
              <View style={s.plateFlagR} />
              <View style={s.plateFlagW} />
              <View style={s.plateFlagR} />
            </View>
            <Text style={s.plateNum}>{plate}</Text>
          </View>
        </View>

        {/* ===== SUMMARY SECTION ===== */}
        <SectionBanner
          type="yellow"
          title="RESUMEN DE LA SITUACIÓN LEGAL DEL VEHÍCULO"
          subtitle="Situación registral, tributaria, de infracciones y de seguros a la fecha de emisión."
          icon="V"
        />

        <View style={s.sumHeader}>
          <Text style={s.sumHeaderL}>CONCEPTO VERIFICADO</Text>
          <Text style={s.sumHeaderR}>RESULTADO</Text>
        </View>

        {data.fields.map((field, i) => (
          <View key={field.key} style={[s.sumRow, i % 2 === 1 ? s.sumRowAlt : {}]} wrap={false}>
            <View style={s.sumLeft}>
              <Text style={s.sumLabel}>{field.label}</Text>
              <Text style={s.sumDesc}>{field.text}</Text>
            </View>
            <View style={s.sumRight}>
              <StatusBadge status={field.status} text={field.badgeText} />
            </View>
          </View>
        ))}

        {/* ===== VEHICLE DETAILS ===== */}
        {data.vehicleMain && data.vehicleComplementary && (
          <>
            <SectionBanner
              type="dark"
              title="CARACTERÍSTICAS DEL VEHÍCULO"
              subtitle={data.vehicleDescription || 'Datos técnicos según la partida registral (SUNARP).'}
              icon="E"
            />
            <View style={s.vehContainer}>
              {/* Left table */}
              <View style={s.vehTable}>
                <View style={s.vehHeader}>
                  <Text style={s.vehHeaderText}>DATOS DEL VEHICULO</Text>
                </View>
                {data.vehicleMain.filter(r => r.value).map((row, i) => (
                  <View key={i} style={[s.vehRow, i % 2 === 1 ? s.vehRowAlt : {}]}>
                    <Text style={s.vehLabel}>{row.label}</Text>
                    <Text style={s.vehValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
              {/* Right table */}
              <View style={s.vehTable}>
                <View style={s.vehHeader}>
                  <Text style={s.vehHeaderText}>DATOS COMPLEMENTARIOS</Text>
                </View>
                {data.vehicleComplementary.filter(r => r.value).map((row, i) => (
                  <View key={i} style={[s.vehRow, i % 2 === 1 ? s.vehRowAlt : {}]}>
                    <Text style={s.vehLabel}>{row.label}</Text>
                    <Text style={s.vehValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ===== PAGE 2: OWNERSHIP ===== */}
        {hasDetail && data.owners && data.owners.length > 0 && (
          <View break>
            <SectionBanner
              type="yellow"
              title="TITULARIDAD E HISTORIAL DE PROPIETARIOS"
              subtitle={`Cadena de propietarios de la placa ${data.plate} según SUNARP.`}
              icon="P"
            />

            {/* Owner table */}
            <View style={s.ownHeader}>
              <Text style={[s.ownHeaderCell, { width: 18 }]}></Text>
              <Text style={[s.ownHeaderCell, { width: '26%' }]}>PROPIETARIO(S)</Text>
              <Text style={[s.ownHeaderCell, { width: '17%' }]}>DOCUMENTO</Text>
              <Text style={[s.ownHeaderCell, { width: '13%' }]}>ADQUISICIÓN</Text>
              <Text style={[s.ownHeaderCell, { width: '17%' }]}>TIEMPO COMO{'\n'}PROPIETARIO</Text>
              <Text style={[s.ownHeaderCell, { width: '12%' }]}>PRECIO</Text>
              <Text style={[s.ownHeaderCell, { width: '12%' }]}>TÍTULO</Text>
            </View>

            {data.owners.map((own, i) => (
              <View key={i} style={[s.ownRow, i % 2 === 1 ? s.ownRowAlt : {}]} wrap={false}>
                <Text style={[s.ownNum, { width: 18 }]}>{own.number}</Text>
                <View style={{ width: '26%' }}>
                  <Text style={s.ownName}>{own.name}</Text>
                  {own.tags?.map((tag, ti) => (
                    <Text key={ti} style={s.ownTag}>{tag === 'Titular vigente' ? `★ ${tag}` : tag}</Text>
                  ))}
                </View>
                <Text style={[s.ownCell, { width: '17%' }]}>{own.document}</Text>
                <Text style={[s.ownCell, { width: '13%' }]}>{own.acquisitionDate}</Text>
                <Text style={[s.ownCellBold, { width: '17%' }]}>{own.timeAsOwner}</Text>
                <Text style={[s.ownCell, { width: '12%' }]}>{own.price}</Text>
                <Text style={[s.ownCell, { width: '12%' }]}>{own.title}</Text>
              </View>
            ))}

            {/* Ownership note */}
            {data.ownershipNote && (
              <Text style={s.note}>{data.ownershipNote}</Text>
            )}

            <SourceLine text="SUNARP" />

            {/* ===== REGISTRY ENTRIES ===== */}
            {data.registryEntries && data.registryEntries.length > 0 && (
              <>
                <SectionBanner
                  type="dark"
                  title="LISTA DE ASIENTOS REGISTRALES"
                  subtitle="Historial completo de actos inscritos en la partida, en orden cronológico."
                  icon="a"
                />

                <View style={s.regHeader}>
                  <Text style={[s.ownHeaderCell, { width: 30, textAlign: 'center' }]}>ASIENTO</Text>
                  <Text style={[s.ownHeaderCell, { width: '18%' }]}>FECHA</Text>
                  <Text style={[s.ownHeaderCell, { flex: 1 }]}>ACTO</Text>
                  <Text style={[s.ownHeaderCell, { width: '20%' }]}>TÍTULO</Text>
                </View>

                {data.registryEntries.map((entry, i) => (
                  <View key={i} style={[s.regRow, i % 2 === 1 ? s.regRowAlt : {}]} wrap={false}>
                    <View style={[s.regNum, { width: 30 }]}>
                      <View style={s.regNumCircle}>
                        <Text style={s.regNumText}>{entry.number}</Text>
                      </View>
                    </View>
                    <Text style={[s.ownCell, { width: '18%' }]}>{entry.date}</Text>
                    <Text style={[s.ownCellBold, { flex: 1 }]}>{entry.act}</Text>
                    <Text style={[s.ownCell, { width: '20%' }]}>{entry.title}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Registry status callout */}
            {data.registryNoteTitle && (
              <CalloutBox
                status={data.registryNoteStatus || 'OK'}
                title={data.registryNoteTitle}
                detail={data.registryNote || ''}
              />
            )}

            <SourceLine text="SUNARP" />
          </View>
        )}

        {/* ===== PAGE 3: LIENS + TAX + DEBTS + INSURANCE ===== */}
        {hasDetail && (
          <View break>
            {/* LIENS */}
            <SectionBanner
              type="yellow"
              title="GRAVÁMENES Y AFECTACIONES"
              subtitle="Embargos, garantías mobiliarias u otras cargas que impidan la transferencia."
              icon="V"
            />

            {data.liensStatus && (
              <CalloutBox
                status={data.liensStatus === 'PENDING' ? 'OK' : data.liensStatus}
                title={data.liensTitle || ''}
                detail={data.liensDetail || 'Sin informacion disponible.'}
              />
            )}

            <SourceLine text={data.liensSource || 'SUNARP · SIGM'} />

            {/* TAX */}
            {data.taxYears && data.taxYears.length > 0 && (
              <>
                <SectionBanner
                  type="dark"
                  title="IMPUESTO VEHICULAR"
                  subtitle="Estado de pago del impuesto vehicular ante el SAT, detallado por año."
                  icon="a"
                />

                <View style={s.taxContainer}>
                  <View style={s.taxTable}>
                    {(() => {
                      const hasCont = data.taxYears!.some(t => t.contributor);
                      const hasAmt = data.taxYears!.some(t => t.amount);
                      return (
                        <>
                          <View style={s.t4Header}>
                            <Text style={[s.t4HeaderCell, { width: '30%' }]}>AÑO</Text>
                            {hasCont && <Text style={[s.t4HeaderCell, { width: '25%' }]}>CONTRIBUYENTE</Text>}
                            {hasAmt && <Text style={[s.t4HeaderCell, { width: '20%' }]}>MONTO</Text>}
                            <Text style={[s.t4HeaderCell, { flex: 1, textAlign: 'right' }]}>ESTADO</Text>
                          </View>
                          {data.taxYears!.map((ty, i) => (
                            <View key={i} style={[s.t4Row, i % 2 === 1 ? s.t4RowAlt : {}]} wrap={false}>
                              <Text style={[s.t4CellBold, { width: '30%' }]}>{ty.year}</Text>
                              {hasCont && <Text style={[s.t4Cell, { width: '25%' }]}>{ty.contributor}</Text>}
                              {hasAmt && <Text style={[s.t4Cell, { width: '20%' }]}>{ty.amount}</Text>}
                              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <StatusBadge status={ty.status} text={ty.statusText} />
                              </View>
                            </View>
                          ))}
                        </>
                      );
                    })()}
                  </View>

                  {data.taxCriteria && (
                    <View style={s.taxCriteria}>
                      <View style={s.taxCriteriaBox}>
                        <Text style={s.taxCriteriaTitle}>Criterio aplicado.</Text>
                        <Text style={s.taxCriteriaText}>{data.taxCriteria}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Tax reminder callout */}
                {data.taxReminder && (
                  <CalloutBox
                    status="WARNING"
                    title="Requisito de transferencia"
                    detail={data.taxReminder}
                  />
                )}

                <SourceLine text={data.taxSource || 'SAT — Lima'} />
              </>
            )}

            {/* DEBTS */}
            {data.debts && data.debts.length > 0 && (
              <>
                <SectionBanner
                  type="dark"
                  title="DEUDAS, MULTAS Y CAPTURAS"
                  subtitle="Consultas a SAT, Municipalidad del Callao, ATU y SUTRAN."
                  icon="Q"
                />

                <FourColTable
                  headers={['CONCEPTO', 'ENTIDAD', 'RESULTADO', 'ESTADO']}
                  widths={[15, 15, 52, 18]}
                  rows={data.debts.map((d, i) => ({
                    cells: [d.concept, d.entity, d.result, ''],
                    status: d.status,
                    statusText: d.statusText,
                    alt: i % 2 === 1,
                  }))}
                />

                {data.debtsNote && <Text style={s.note}>{data.debtsNote}</Text>}
                <SourceLine text={data.debtsSource || ''} />
              </>
            )}

            {/* INSURANCE */}
            {data.insurance && data.insurance.length > 0 && (
              <>
                <SectionBanner
                  type="dark"
                  title="SEGUROS Y REVISIÓN TÉCNICA"
                  subtitle="Vigencia de SOAT e inspección técnica (CITV)."
                  icon="V"
                />

                <FourColTable
                  headers={['CONCEPTO', 'ENTIDAD', 'RESULTADO', 'ESTADO']}
                  widths={[15, 15, 52, 18]}
                  rows={data.insurance.map((ins, i) => ({
                    cells: [ins.concept, ins.entity, ins.result, ''],
                    status: ins.status,
                    statusText: ins.statusText,
                    alt: i % 2 === 1,
                  }))}
                />

                {data.insuranceNote && <Text style={s.note}>{data.insuranceNote}</Text>}
                <SourceLine text={data.insuranceSource || ''} />
              </>
            )}
          </View>
        )}

        {/* ===== PAGE 4: CLAIMS + GNV + CONCLUSION ===== */}
        {hasDetail && (
          <View break>
            {/* CLAIMS */}
            {data.claims && data.claims.length > 0 && (
              <>
                <SectionBanner
                  type="dark"
                  title="SINIESTRALIDAD"
                  subtitle="Reporte de siniestros y activaciones de póliza (SBS)."
                  icon="!"
                />

                <FourColTable
                  headers={['CONCEPTO', 'ENTIDAD', 'RESULTADO', 'ESTADO']}
                  widths={[15, 15, 52, 18]}
                  rows={data.claims.map((cl, i) => ({
                    cells: [cl.concept, cl.entity, cl.result, ''],
                    status: cl.status,
                    statusText: cl.statusText,
                    alt: i % 2 === 1,
                  }))}
                />

                {/* Activations sub-table */}
                {data.activationsTable && data.activationsTable.length > 0 && (
                  <>
                    <Text style={s.actLabel}>Registro de activaciones de seguro vehicular</Text>
                    <View style={s.actHeader}>
                      <Text style={[s.actHeaderCell, { width: '30%' }]}>ASEGURADORA</Text>
                      <Text style={[s.actHeaderCell, { width: '25%' }]}>N.° DE POLIZA</Text>
                      <Text style={[s.actHeaderCell, { width: '25%' }]}>PERIODO</Text>
                      <Text style={[s.actHeaderCell, { width: '20%', textAlign: 'right' }]}>CANTIDAD</Text>
                    </View>
                    {data.activationsTable.map((act, i) => (
                      <View key={i} style={s.actRow}>
                        <Text style={[s.t4Cell, { width: '30%' }]}>{act.insurer}</Text>
                        <Text style={[s.t4Cell, { width: '25%' }]}>{act.policyNumber}</Text>
                        <Text style={[s.t4Cell, { width: '25%' }]}>{act.period}</Text>
                        <Text style={[s.t4CellBold, { width: '20%', textAlign: 'right' }]}>{act.count}</Text>
                      </View>
                    ))}
                  </>
                )}

                {data.claimsNote && <Text style={s.note}>{data.claimsNote}</Text>}
                <SourceLine text={data.claimsSource || ''} />
              </>
            )}

            {/* GNV */}
            {data.gnvItems && data.gnvItems.length > 0 && (
              <>
                <SectionBanner
                  type="yellow"
                  title="CONVERSIÓN / SISTEMA A GNV"
                  subtitle="Verificación de instalación de GNV (InfoGas) y subsidio asociado (FISE)."
                  icon="G"
                />

                <FourColTable
                  headers={['CONCEPTO', 'ENTIDAD', 'RESULTADO', 'ESTADO']}
                  widths={[15, 15, 52, 18]}
                  rows={data.gnvItems.map((g, i) => ({
                    cells: [g.concept, g.entity, g.result, ''],
                    status: g.status,
                    statusText: g.statusText,
                    alt: i % 2 === 1,
                  }))}
                />

                <SourceLine text={data.gnvSource || ''} />
              </>
            )}

            {/* CONCLUSION */}
            {data.conclusionText && (
              <>
                <SectionBanner
                  type="yellow"
                  title="CONCLUSIÓN LEGAL"
                  icon="V"
                />

                <View style={s.conclusionBox}>
                  <Text style={s.conclusionText}>{data.conclusionText}</Text>
                </View>
              </>
            )}

            {/* FOOTER */}
            <View style={s.footer}>
              {data.disclaimer && <Text style={s.footerText}>{data.disclaimer}</Text>}
              <View style={s.footerBottom}>
                <Text style={s.footerCode}>
                  Código de verificación: <Text style={s.footerCodeBold}>{data.code || ''}</Text>
                </Text>
                <Text style={s.footerLogo}>VERIFICARLO</Text>
              </View>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}

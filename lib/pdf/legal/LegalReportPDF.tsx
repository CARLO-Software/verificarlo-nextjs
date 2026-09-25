import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Path,
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
  registryNoteStatus?: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
  registryNoteTitle?: string;
  liensStatus?: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
  liensTitle?: string;
  liensDetail?: string;
  liensSource?: string;
  taxYears?: { year: string; contributor: string; amount: string; status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING'; statusText: string }[];
  taxPendingSummary?: string;
  taxCriteria?: string;
  taxReminder?: string;
  taxSource?: string;
  debts?: TableEntry[];
  debtsNote?: string;
  debtsSource?: string;
  insurance?: TableEntry[];
  soatBreakdown?: { compania: string; uso: string; vigencia: string; certificado: string; accidentes: number; estado: string; status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING' }[];
  soatBreakdownNote?: string;
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
  isFallback?: boolean;
}

// === COLORS ===

const C = {
  yellow: '#fad307',
  dark: '#1c1d21',
  white: '#FFFFFF',
  lightYellow: '#fff8e5',
  darkGrayRow: '#f4f4f4',
  lightGrayRow: '#ffffff',


  offWhite: '#F9FAFB',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  green: '#166534',
  greenBadge: '#1e9f37',
  greenBg: '#eaf7ee',
  greenBorder: '#bfe6cb',
  amber: '#dc870f',
  amberBg: '#fef9e7',
  amberBorder: '#f6e4a8',
  red: '#DC2626',
  redBg: '#FEF2F2',
  redBorder: '#DC2626',
  grayBadge: '#6B7280',
  gray: '#6B7280',
  grayBg: '#F3F4F6',
  grayBorder: '#D1D5DB',
};

function badgeColor(status: string): string {
  switch (status) {
    case 'OK': return C.greenBadge;
    case 'WARNING': return C.amber;
    case 'CRITICAL': return C.red;
    default: return C.grayBadge;
  }
}

function SvgCheck({ size = 7, color = C.greenBadge }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill={color} />
    </Svg>
  );
}

function SvgX({ size = 7, color = C.red }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill={color} />
    </Svg>
  );
}

function SvgBang({ size = 7, color = C.amber }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M11 3h2v12h-2zM11 19h2v2h-2z" fill={color} />
    </Svg>
  );
}

function SvgDash({ size = 7, color = C.grayBadge }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 11h12v2H6z" fill={color} />
    </Svg>
  );
}

function SvgStar({ size = 7, color = C.amber }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" fill={color} />
    </Svg>
  );
}

function StatusIcon({ status, size = 7, color }: { status: string; size?: number; color?: string }) {
  switch (status) {
    case 'OK': return <SvgCheck size={size} color={color || C.greenBadge} />;
    case 'WARNING': return <SvgBang size={size} color={color || C.amber} />;
    case 'CRITICAL': return <SvgX size={size} color={color || C.red} />;
    default: return <SvgDash size={size} color={color || C.grayBadge} />;
  }
}

const SEC_ICON_PATHS: Record<string, string[]> = {
  shield: ['M3 3h18v18H3z', 'M9 12l2 2 4-4'],
  car: ['M21 8l-2 2-1.5-3.7A2 2 0 0 0 15.65 5h-7.3a2 2 0 0 0-1.85 1.3L5 10 3 8', 'M7 14h.01', 'M17 14h.01', 'M5 10h14v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4z', 'M5 17v2', 'M19 17v2'],
  person: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  document: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M10 13H8', 'M16 17H8', 'M16 9H8'],
  lock: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4L12 14.01l-3-3'],
  receipt: ['M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z', 'M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8', 'M12 17.5v-11'],
  search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'M21 21l-4.35-4.35'],
  insurance: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C8.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z', 'M9 12l2 2 4-4'],
  warning: ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  gas: ['M3 22V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v17', 'M3 12h10', 'M13 8h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0 2-2V7.5', 'M18 3l2.5 2.5L18 8'],
  gavel: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C8.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z', 'M9 12l2 2 4-4'],
};

function SectionIconSvg({ type, size = 13, color = C.white }: { type: string; size?: number; color?: string }) {
  const paths = SEC_ICON_PATHS[type];
  if (!paths) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths.map((d, i) => (
        <Path key={i} d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
    </Svg>
  );
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
  topBold: { fontFamily: 'Helvetica-Bold', color: C.dark },

  fallbackBanner: { backgroundColor: '#FEF3C7', borderRadius: 4, padding: 6, marginBottom: 6, borderWidth: 1, borderColor: '#F59E0B' } as const,
  fallbackText: { fontSize: 7, color: '#92400E', fontFamily: 'Helvetica-Bold', textAlign: 'center' } as const,

  // Main banner
  banner: { backgroundColor: C.yellow, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 5, marginBottom: 0 },
  logo: { fontFamily: 'Helvetica-BoldOblique', fontSize: 26, color: '#000000', letterSpacing: 1 },
  logoCarlo: { fontFamily: 'Helvetica-Bold' },
  plateBox: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000000', paddingHorizontal: 10, paddingVertical: 3, alignItems: 'center', borderRadius: 3 },
  plateTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  plateCountry: { fontSize: 5.5, color: C.textLight, letterSpacing: 1.5, fontFamily: 'Helvetica-Bold', marginLeft: 3 },
  plateFlag: { flexDirection: 'row', width: 12, height: 8 },
  plateFlagR: { flex: 1, backgroundColor: '#DC2626' },
  plateFlagW: { flex: 1, backgroundColor: C.white, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#E5E7EB' },
  plateNum: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: C.text, letterSpacing: 2 },

  // Section banners
  secYellow: { backgroundColor: C.yellow, flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 14, paddingVertical: 4, marginTop: 10 },
  secDark: { backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 14, paddingVertical: 4, marginTop: 10 },
  
  secIcon: { justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  secContent: { flex: 1 },
  secTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.dark, letterSpacing: 0.3 },
  secTitleYellow: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.yellow, letterSpacing: 0.3 },
  secSub: { fontSize: 6.5, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  secSubDark: { fontSize: 6.5, color: 'rgba(0,0,0,0.55)', marginTop: 1 },

  // Summary table
  sumHeader: { flexDirection: 'row', backgroundColor: C.yellow, paddingVertical: 5, paddingHorizontal: 10, marginTop: 4, alignItems: 'center' },
  sumHeaderL: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.dark, flex: 1, letterSpacing: 0.5 },
  sumHeaderR: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.dark, width: 110, textAlign: 'right', letterSpacing: 0.5 },
  sumRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderBottomWidth: 0.5, borderBottomColor: C.border, minHeight: 26, backgroundColor: C.darkGrayRow },
  sumRowAlt: { backgroundColor: C.lightGrayRow },
  sumLeft: { flex: 1 },
  sumLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.text },
  sumDesc: { fontSize: 6.5, color: C.textLight, marginTop: 1, lineHeight: 1.3 },
  sumRight: { width: 110, alignItems: 'flex-end' },

  // Badge
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 25 },
  badgeCircle: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: C.white, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  // badgeCircleText removed — replaced by SVG icons
  badgeText: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.white, letterSpacing: 0.3 },

  // Vehicle tables
  vehContainer: { flexDirection: 'row', gap: 10, marginTop: 6, /* gap:0 not supported */ },
  vehTable: { width: '50%' },
  vehHeader: { backgroundColor: C.yellow, paddingVertical: 4, paddingHorizontal: 6 },
  vehHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.dark, textAlign: 'center', letterSpacing: 0.3 },
  vehRow: { flexDirection: 'row', paddingVertical: 2.5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.lightGrayRow },
  vehRowAlt: { backgroundColor: C.darkGrayRow },
  vehLabel: { fontSize: 6.5, color: C.textLight, width: '48%' },
  vehValue: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text, width: '52%' },

  // Owner table
  ownHeader: { flexDirection: 'row', backgroundColor: C.yellow, paddingVertical: 4, paddingLeft: 0, paddingRight: 6, marginTop: 6, alignItems: 'center' },
  ownHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.dark, letterSpacing: 0.3 },
  
  ownRow: { flexDirection: 'row', paddingVertical: 0, paddingLeft: 0, paddingRight: 6, borderBottomWidth: 0.5, borderBottomColor: C.border, alignItems: 'stretch', backgroundColor: C.darkGrayRow },
  ownRowAlt: { backgroundColor: C.lightGrayRow },
  ownRowTitular: { backgroundColor: '#f5f0df' },
  ownNum: { width: 22, backgroundColor: C.dark, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  ownNumText: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.white, textAlign: 'center' },
  ownName: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text, paddingTop: 4 },
  ownTag: { fontSize: 5.5, color: C.amber, marginTop: 1 },
  ownCell: { fontSize: 6.5, color: C.text, paddingVertical: 4 },
  ownCellBold: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text, paddingVertical: 4 },

  // Registry table
  regHeader: { flexDirection: 'row', backgroundColor: C.yellow, paddingVertical: 4, paddingLeft: 0, paddingRight: 6, alignItems: 'center', marginTop: 6 },
  regRow: { flexDirection: 'row', paddingVertical: 0, paddingLeft: 0, paddingRight: 6, borderBottomWidth: 0.5, borderBottomColor: C.border, alignItems: 'stretch', backgroundColor: C.darkGrayRow },
  regRowAlt: { backgroundColor: C.lightGrayRow },
  regNum: { width: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: C.dark, marginRight: 10 },
  regNumText: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.white, textAlign: 'center' },

  // Callout box
  callout: { flexDirection: 'row', padding: 10, marginTop: 6, borderLeftWidth: 3, borderRadius: 4 },
  calloutIcon: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  // calloutIconText removed — replaced by SVG icons
  calloutContent: { flex: 1 },
  calloutTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 2 },
  calloutText: { fontSize: 7, color: C.text, lineHeight: 1.4 },

  // 4-col table
  t4Header: { flexDirection: 'row', backgroundColor: C.yellow, paddingVertical: 4, paddingHorizontal: 6, alignItems: 'center'},
  t4HeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.dark, letterSpacing: 0.3 },
  t4Row: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: C.border, alignItems: 'center', backgroundColor: C.darkGrayRow },
  t4RowAlt: { backgroundColor: C.lightGrayRow },
  t4Cell: { fontSize: 6.5, color: C.text },
  t4CellBold: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text },

  // Tax section side-by-side
  taxContainer: { flexDirection: 'row', marginTop: 4/* gap:0 not supported */ },
  taxTable: { width: '48%' },
  taxCriteria: { width: '52%', paddingLeft: 8 },
  taxCriteriaBox: { backgroundColor: C.offWhite, padding: 8, borderLeftWidth: 2, borderLeftColor: C.yellow },
  taxCriteriaTitle: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.text, marginBottom: 3 },
  taxCriteriaText: { fontSize: 6.5, color: C.text, lineHeight: 1.4 },

  // Source line
  source: { fontSize: 5.5, color: C.textMuted, textAlign: 'right', marginTop: 4, marginBottom: 2 },

  // Note
  note: { fontSize: 6.5, color: C.text, lineHeight: 1.4, marginTop: 5 },
  noteBold: { fontFamily: 'Helvetica-Bold' },

  // Conclusion
  conclusionWrap: { borderWidth: 2, borderColor: C.dark, borderRadius: 10, marginTop: 6 },
  conclusionBox: { backgroundColor: C.offWhite, padding: 14, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  conclusionText: { fontSize: 7.5, color: C.text, lineHeight: 1.5 },

  // Footer
  footer: { marginTop: 8, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: C.border },
  footerText: { fontSize: 5.5, color: C.textMuted, lineHeight: 1.4 },
  footerBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  footerCode: { fontSize: 6.5, color: C.textLight },
  footerCodeBold: { fontFamily: 'Helvetica-Bold' },
  footerLogo: { fontFamily: 'Helvetica-BoldOblique', fontSize: 11, color: C.text },
  footerLogoCarlo: { fontFamily: 'Helvetica-Bold' },

  // Activation sub-table
  actHeader: { flexDirection: 'row', backgroundColor: C.yellow, paddingVertical: 3, paddingHorizontal: 6, marginTop: 6, alignItems: 'center' },
  actHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.dark, letterSpacing: 0.3 },
  actRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.darkGrayRow },
  actRowAlt: { backgroundColor: C.lightGrayRow },
  actLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.text, marginTop: 6, marginBottom: 2 },
});

// === REUSABLE COMPONENTS ===

function StatusBadge({ status, text }: { status: string; text: string }) {
  const bg = badgeColor(status);
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <View style={s.badgeCircle}>
        <StatusIcon status={status} size={7} color={bg} />
      </View>
      <Text style={s.badgeText}>{text}</Text>
    </View>
  );
}

function SectionBanner({ type, title, subtitle, icon, noTopMargin, rounded }: { type: 'yellow' | 'dark'; title: string; subtitle?: string; icon?: string; noTopMargin?: boolean; rounded?: boolean }) {
  const isYellow = type === 'yellow';
  return (
    <View style={[isYellow ? s.secYellow : s.secDark, noTopMargin ? { marginTop: 0 } : {}, rounded ? { borderTopLeftRadius: 8, borderTopRightRadius: 8 } : {}]} wrap={false}>
      {icon && (
        <View style={s.secIcon}>
          <SectionIconSvg type={icon} size={16} color={isYellow ? C.dark : C.yellow} />
        </View>
      )}
      <View style={s.secContent}>
        <Text style={isYellow ? s.secTitle : s.secTitleYellow}>{title}</Text>
        {subtitle && <Text style={isYellow ? s.secSubDark : s.secSub}>{subtitle}</Text>}
      </View>
    </View>
  );
}

function BoldCapsText({ children, style }: { children: string; style: any }) {
  const segments = children.split(/(\*\*[^*]+\*\*)/);
  const parts: React.ReactNode[] = [];
  segments.forEach((seg, si) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      parts.push(<Text key={`b${si}`} style={{ fontFamily: 'Helvetica-Bold' }}>{seg.slice(2, -2)}</Text>);
    } else {
      const capsRegex = /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ.\-/]{1,}(?:\s[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ.\-/]{1,})*)/g;
      let last = 0;
      let m;
      while ((m = capsRegex.exec(seg)) !== null) {
        if (m.index > last) parts.push(seg.slice(last, m.index));
        parts.push(<Text key={`c${si}-${m.index}`} style={{ fontFamily: 'Helvetica-Bold' }}>{m[0]}</Text>);
        last = capsRegex.lastIndex;
      }
      if (last < seg.length) parts.push(seg.slice(last));
    }
  });
  if (parts.length === 0) return <Text style={style}>{children}</Text>;
  return <Text style={style}>{parts}</Text>;
}

function SourceLine({ text }: { text: string }) {
  return <Text style={s.source}>Fuente: {text}</Text>;
}

function CalloutBox({ status, title, detail }: { status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING'; title: string; detail: string }) {
  const bg = status === 'OK' ? C.greenBg : status === 'WARNING' ? C.amberBg : status === 'PENDING' ? C.grayBg : C.redBg;
  const border = status === 'OK' ? C.greenBorder : status === 'WARNING' ? C.amberBorder : status === 'PENDING' ? C.grayBorder : C.redBorder;
  const iconBg = status === 'OK' ? C.green : status === 'WARNING' ? C.amber : status === 'PENDING' ? C.gray : C.red;
  const titleColor = status === 'OK' ? C.green : status === 'WARNING' ? C.amber : status === 'PENDING' ? C.gray : C.red;
  return (
    <View style={[s.callout, { backgroundColor: bg, borderLeftColor: border }]} wrap={false}>
      <View style={[s.calloutIcon, { backgroundColor: iconBg }]}>
        <StatusIcon status={status} size={10} color={C.white} />
      </View>
      <View style={s.calloutContent}>
        {title ? <Text style={[s.calloutTitle, { color: titleColor }]}>{title}</Text> : null}
        <Text style={s.calloutText}>
          {detail.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
              ? <Text key={i} style={{ fontFamily: 'Helvetica-Bold' }}>{part.slice(2, -2)}</Text>
              : part
          )}
        </Text>
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
    <View style={{ marginTop: 6 }}>
      <View style={s.t4Header}>
        {headers.map((h, i) => (
          <Text key={i} style={[s.t4HeaderCell, i === headers.length - 1 ? { flex: 1, textAlign: 'right' } : { width: `${widths[i]}%` }]}>{h}</Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={[s.t4Row, row.alt ? s.t4RowAlt : {}]} wrap={false}>
          {row.cells.map((cell, ci) => (
            ci < row.cells.length - 1 ? (
              <Text key={ci} style={[s.t4Cell, { width: `${widths[ci]}%` }]}>{cell}</Text>
            ) : null
          ))}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
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

        {data.isFallback && (
          <View style={s.fallbackBanner}>
            <Text style={s.fallbackText}>
              Informe generado con datos crudos — el análisis IA no estuvo disponible al momento de la consulta.
            </Text>
          </View>
        )}

        {/* ===== MAIN BANNER ===== */}
        <View style={s.banner}>
          <Text style={s.logo}>VERIFI<Text style={s.logoCarlo}>CARLO</Text></Text>
          <View style={s.plateBox}>
            <View style={s.plateTopRow}>
              <View style={s.plateFlag}>
                <View style={s.plateFlagR} />
                <View style={s.plateFlagW} />
                <View style={s.plateFlagR} />
              </View>
              <Text style={s.plateCountry}>PERÚ</Text>
            </View>
            <Text style={s.plateNum}>{plate}</Text>
          </View>
        </View>

        {/* ===== SUMMARY SECTION ===== */}
        <SectionBanner
          type="dark"
          title="RESUMEN DE LA SITUACIÓN LEGAL DEL VEHÍCULO"
          subtitle="Situación registral, tributaria, de infracciones y de seguros a la fecha de emisión."
          icon="shield"
          noTopMargin
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
              subtitle={'Datos técnicos según la partida registral (SUNARP).'}
              icon="car"
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
              type="dark"
              title="TITULARIDAD E HISTORIAL DE PROPIETARIOS"
              subtitle={`Cadena de propietarios de la placa ${data.plate} según SUNARP.`}
              icon="person"
            />

            {/* Owner table */}
            <View style={s.ownHeader}>
              <Text style={[s.ownHeaderCell, { width: 28 }]}></Text>
              <Text style={[s.ownHeaderCell, { width: '26%' }]}>PROPIETARIO(S)</Text>
              <Text style={[s.ownHeaderCell, { width: '17%' }]}>DOCUMENTO</Text>
              <Text style={[s.ownHeaderCell, { width: '13%' }]}>ADQUISICIÓN</Text>
              <Text style={[s.ownHeaderCell, { width: '17%' }]}>TIEMPO COMO{'\n'}PROPIETARIO</Text>
              <Text style={[s.ownHeaderCell, { width: '12%' }]}>PRECIO</Text>
              <Text style={[s.ownHeaderCell, { width: '12%' }]}>TÍTULO</Text>
            </View>

            {data.owners.map((own, i) => {
              const isLast = i === (data.owners?.length ?? 0) - 1;
              const isTitular = own.tags?.includes('Titular vigente') || isLast;
              return (
              <View key={i} style={[s.ownRow, i % 2 === 1 ? s.ownRowAlt : {}, isTitular ? s.ownRowTitular : {}]} wrap={false}>
                <View style={[s.ownNum, isTitular ? { backgroundColor: C.yellow } : {}]}><Text style={[s.ownNumText, isTitular ? { color: C.dark } : {}]}>{own.number}</Text></View>
                <View style={{ width: '26%' }}>
                  <Text style={s.ownName}>{own.name}</Text>
                  {own.tags?.map((tag, ti) => (
                    <View key={ti} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                      {tag === 'Titular vigente' && <SvgStar size={6} color="#8f833c" />}
                      <Text style={[s.ownTag, { color: '#8f833c' }, tag === 'Titular vigente' ? { marginLeft: 2 } : {}]}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[s.ownCell, { width: '17%' }]}>{own.document}</Text>
                <Text style={[s.ownCell, { width: '13%' }]}>{own.acquisitionDate}</Text>
                <Text style={[s.ownCellBold, { width: '17%' }]}>{own.timeAsOwner}</Text>
                <Text style={[s.ownCell, { width: '12%' }]}>{own.price}</Text>
                <Text style={[s.ownCell, { width: '12%' }]}>{own.title}</Text>
              </View>
              );
            })}

            {/* Ownership note */}
            {data.ownershipNote && (
              <Text style={s.note}>
                <Text style={s.noteBold}>Titular actual: </Text>
                {data.ownershipNote}
              </Text>
            )}

            <SourceLine text="SUNARP" />

            {/* ===== REGISTRY ENTRIES ===== */}
            {data.registryEntries && data.registryEntries.length > 0 && (
              <>
                <SectionBanner
                  type="dark"
                  title="LISTA DE ASIENTOS REGISTRALES"
                  subtitle={`Historial completo de actos inscritos en la partida${(() => { const p = data.vehicleComplementary?.find(v => v.label === 'N.° de partida')?.value; return p ? ` N.º ${p.replace(/\s*—.*/, '')}` : ''; })()}, en orden cronológico.`}
                  icon="document"
                />

                <View style={s.regHeader}>
                  <Text style={[s.ownHeaderCell, { width: 40, textAlign: 'center' }]}>ASIENTO</Text>
                  <Text style={[s.ownHeaderCell, { width: '18%' }]}>FECHA</Text>
                  <Text style={[s.ownHeaderCell, { flex: 1 }]}>ACTO</Text>
                  <Text style={[s.ownHeaderCell, { width: '20%' }]}>TÍTULO</Text>
                </View>

                {data.registryEntries.map((entry, i) => (
                  <View key={i} style={[s.regRow, i % 2 === 1 ? s.regRowAlt : {}]} wrap={false}>
                    <View style={s.regNum}>
                      <Text style={s.regNumText}>{entry.number}</Text>
                    </View>
                    <Text style={[s.ownCell, { width: '18%' }]}>{entry.date.replace(/^.*?(\d{2}\/\d{2}\/\d{4}).*$/, '$1')}</Text>
                    <Text style={[s.ownCell, { flex: 1 }]}>{entry.act}</Text>
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
              type="dark"
              title="GRAVÁMENES Y AFECTACIONES"
              subtitle="Embargos, garantías mobiliarias u otras cargas que impidan la transferencia."
              icon="lock"
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
            {(data.taxYears || data.taxCriteria || data.taxReminder) && (
              <>
                <SectionBanner
                  type="dark"
                  title="IMPUESTO VEHICULAR"
                  subtitle="Estado de pago del impuesto vehicular ante el SAT, detallado por año."
                  icon="receipt"
                />

                <View style={s.taxContainer}>
                  <View style={s.taxTable}>
                    {data.taxYears && data.taxYears.length > 0 ? (
                      <>
                        <View style={s.t4Header}>
                          <Text style={[s.t4HeaderCell, { width: '15%' }]}>AÑO</Text>
                          <Text style={[s.t4HeaderCell, { width: '35%' }]}>CONTRIBUYENTE</Text>
                          <Text style={[s.t4HeaderCell, { width: '20%' }]}>MONTO</Text>
                          <Text style={[s.t4HeaderCell, { flex: 1, textAlign: 'right' }]}>ESTADO</Text>
                        </View>
                        {data.taxYears.map((ty, i) => (
                          <View key={i} style={[s.t4Row, i % 2 === 1 ? s.t4RowAlt : {}]} wrap={false}>
                            <Text style={[s.t4CellBold, { width: '15%' }]}>{ty.year}</Text>
                            <Text style={[s.t4Cell, { width: '35%' }]}>{ty.contributor}</Text>
                            <Text style={[s.t4Cell, { width: '20%' }]}>{ty.amount}</Text>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                              <StatusBadge status={ty.status} text={ty.statusText} />
                            </View>
                          </View>
                        ))}
                      </>
                    ) : (
                      <View style={[s.t4Row, { paddingVertical: 8 }]}>
                        <Text style={s.t4Cell}>No se ubicó registro de pago de impuesto vehicular para esta placa.</Text>
                      </View>
                    )}
                  </View>

                  {data.taxPendingSummary && (
                    <View style={s.taxCriteria}>
                      <View style={{ ...s.taxCriteriaBox, borderLeftColor: C.red }}>
                        <Text style={{ ...s.taxCriteriaTitle, color: C.red }}>Cuotas pendientes.</Text>
                        <Text style={s.taxCriteriaText}>{data.taxPendingSummary}</Text>
                      </View>
                    </View>
                  )}

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
                    title=""
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
                  icon="search"
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

                {data.debtsNote && (
                  <Text style={s.note}>
                    {data.debtsNote.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                      part.startsWith('**') && part.endsWith('**')
                        ? <Text key={i} style={{ fontFamily: 'Helvetica-Bold' }}>{part.slice(2, -2)}</Text>
                        : part
                    )}
                  </Text>
                )}
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
                  icon="insurance"
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

                {data.soatBreakdown && data.soatBreakdown.length > 0 && (
                  <>
                    <SectionBanner
                      type="yellow"
                      title="DESGLOSE DE PÓLIZAS SOAT"
                      subtitle="Historial de certificados SOAT contratados en los últimos 5 años (APESEG / SBS)."
                      icon="insurance"
                      noTopMargin
                    />
                    <View style={s.actHeader}>
                      <Text style={[s.actHeaderCell, { width: '5%' }]}>#</Text>
                      <Text style={[s.actHeaderCell, { width: '20%' }]}>COMPAÑÍA</Text>
                      <Text style={[s.actHeaderCell, { width: '10%' }]}>USO</Text>
                      <Text style={[s.actHeaderCell, { width: '27%' }]}>VIGENCIA</Text>
                      <Text style={[s.actHeaderCell, { width: '20%' }]}>CERTIFICADO / PÓLIZA</Text>
                      <Text style={[s.actHeaderCell, { width: '8%', textAlign: 'center' }]}>ACC.</Text>
                      <Text style={[s.actHeaderCell, { width: '10%', textAlign: 'right' }]}>ESTADO</Text>
                    </View>
                    {data.soatBreakdown.map((sb, i) => (
                      <View key={i} style={[s.actRow, i % 2 === 1 ? s.actRowAlt : {}]} wrap={false}>
                        <Text style={[s.t4CellBold, { width: '5%' }]}>{i + 1}</Text>
                        <Text style={[s.t4Cell, { width: '20%' }]}>{sb.compania}</Text>
                        <Text style={[s.t4Cell, { width: '10%' }]}>{sb.uso}</Text>
                        <Text style={[s.t4Cell, { width: '27%' }]}>{sb.vigencia}</Text>
                        <Text style={[s.t4Cell, { width: '20%' }]}>{sb.certificado}</Text>
                        <Text style={[s.t4Cell, { width: '8%', textAlign: 'center' }]}>{sb.accidentes}</Text>
                        <View style={{ width: '10%', alignItems: 'flex-end' }}>
                          <StatusBadge status={sb.status} text={sb.estado} />
                        </View>
                      </View>
                    ))}
                    {data.soatBreakdownNote && (
                      <Text style={s.note}>
                        {data.soatBreakdownNote.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                          part.startsWith('**')
                            ? <Text key={i} style={{ fontFamily: 'Helvetica-Bold' }}>{part.slice(2, -2)}</Text>
                            : part
                        )}
                      </Text>
                    )}
                  </>
                )}

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
                  icon="warning"
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
                      <View key={i} style={[s.actRow, i % 2 === 1 ? s.actRowAlt : {}]}>
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
                  type="dark"
                  title="CONVERSIÓN / SISTEMA A GNV"
                  subtitle="Verificación de instalación de GNV (InfoGas) y subsidio asociado (FISE)."
                  icon="gas"
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
              <View style={s.conclusionWrap}>
                <SectionBanner
                  type="dark"
                  title="CONCLUSIÓN LEGAL"
                  icon="gavel"
                  noTopMargin
                  rounded
                />
                <View style={s.conclusionBox}>
                  {data.conclusionText!.split(/\n\n+/).map((para, i) => (
                    <BoldCapsText key={i} style={[s.conclusionText, i > 0 ? { marginTop: 6 } : {}]}>{para.trim()}</BoldCapsText>
                  ))}
                </View>
              </View>
            )}

            {/* FOOTER */}
            <View style={s.footer}>
              {data.disclaimer && (
                <Text style={s.footerText}>
                  {data.disclaimer.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <Text key={i} style={{ fontFamily: 'Helvetica-Bold' }}>{part.slice(2, -2)}</Text>
                      : part
                  )}
                </Text>
              )}
              <View style={s.footerBottom}>
                <Text style={s.footerCode}>
                  Código de verificación: <Text style={s.footerCodeBold}>{data.code || ''}</Text>
                </Text>
                <Text style={s.footerLogo}>VERIFI<Text style={s.footerLogoCarlo}>CARLO</Text></Text>
              </View>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
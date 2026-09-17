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
  registryNoteStatus?: 'OK' | 'WARNING' | 'CRITICAL';
  registryNoteTitle?: string;
  liensStatus?: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
  liensTitle?: string;
  liensDetail?: string;
  liensSource?: string;
  taxYears?: { year: string; contributor: string; amount: string; status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING'; statusText: string }[];
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
  yellow: '#f8d309',
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

function SvgCheck({ size = 7, color = C.green }: { size?: number; color?: string }) {
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
    case 'OK': return <SvgCheck size={size} color={color || C.green} />;
    case 'WARNING': return <SvgBang size={size} color={color || C.amber} />;
    case 'CRITICAL': return <SvgX size={size} color={color || C.red} />;
    default: return <SvgDash size={size} color={color || C.grayBadge} />;
  }
}

const SEC_ICON_PATHS: Record<string, string> = {
  shield: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
  car: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
  person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  document: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z',
  receipt: 'M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v20l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5zM19 19H5V5h14v14zM6 15h12v2H6zm0-4h12v2H6zm0-4h12v2H6z',
  search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  insurance: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
  warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  gas: 'M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5z',
  gavel: 'M1 21h12v2H1zM5.245 8.07l2.83-2.827 14.14 14.142-2.828 2.828zM9.9 2.41l2.83 2.83-2.83 2.827-2.828-2.828zM5.657 6.65l2.828 2.83L2.05 15.913 1 14.5z',
};

function SectionIconSvg({ type, size = 13, color = C.white }: { type: string; size?: number; color?: string }) {
  const d = SEC_ICON_PATHS[type];
  if (!d) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill={color} />
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
  topBold: { fontFamily: 'Helvetica-Bold' },

  // Main banner
  banner: { backgroundColor: C.yellow, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, marginBottom: 0 },
  logo: { fontFamily: 'Helvetica-BoldOblique', fontSize: 26, color: '#000000', letterSpacing: 1 },
  plateBox: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000000', paddingHorizontal: 10, paddingVertical: 3, alignItems: 'center', borderRadius: 3 },
  plateTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  plateCountry: { fontSize: 5.5, color: C.textLight, letterSpacing: 1.5, fontFamily: 'Helvetica-Bold', marginLeft: 3 },
  plateFlag: { flexDirection: 'row' },
  plateFlagR: { width: 5, height: 3.5, backgroundColor: '#DC2626' },
  plateFlagW: { width: 5, height: 3.5, backgroundColor: C.white, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#E5E7EB' },
  plateNum: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: C.text, letterSpacing: 2 },

  // Section banners
  secYellow: { backgroundColor: C.yellow, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, marginTop: 10 },
  secDark: { backgroundColor: C.dark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, marginTop: 10 },
  secIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  secContent: { flex: 1 },
  secTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.dark, letterSpacing: 0.3 },
  secTitleYellow: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: C.yellow, letterSpacing: 0.3 },
  secSub: { fontSize: 6.5, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  secSubDark: { fontSize: 6.5, color: 'rgba(0,0,0,0.55)', marginTop: 1 },

  // Summary table
  sumHeader: { flexDirection: 'row', backgroundColor: C.yellow, paddingVertical: 5, paddingHorizontal: 10 },
  sumHeaderL: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.dark, flex: 1, letterSpacing: 0.5 },
  sumHeaderR: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.dark, width: 110, textAlign: 'right', letterSpacing: 0.5 },
  sumRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderBottomWidth: 0.5, borderBottomColor: C.border, minHeight: 26, backgroundColor: C.darkGrayRow },
  sumRowAlt: { backgroundColor: C.lightGrayRow },
  sumLeft: { flex: 1 },
  sumLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.text },
  sumDesc: { fontSize: 6.5, color: C.textLight, marginTop: 1, lineHeight: 1.3 },
  sumRight: { width: 110, alignItems: 'flex-end' },

  // Badge
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 3 },
  badgeCircle: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: C.white, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  // badgeCircleText removed — replaced by SVG icons
  badgeText: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.white, letterSpacing: 0.3 },

  // Vehicle tables
  vehContainer: { flexDirection: 'row', /* gap:0 not supported */ },
  vehTable: { width: '50%' },
  vehHeader: { backgroundColor: C.dark, paddingVertical: 4, paddingHorizontal: 6 },
  vehHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.white, textAlign: 'center', letterSpacing: 0.3 },
  vehRow: { flexDirection: 'row', paddingVertical: 2.5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.darkGrayRow },
  vehRowAlt: { backgroundColor: C.lightGrayRow },
  vehLabel: { fontSize: 6.5, color: C.textLight, width: '48%' },
  vehValue: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text, width: '52%' },

  // Owner table
  ownHeader: { flexDirection: 'row', backgroundColor: C.dark, paddingVertical: 4, paddingHorizontal: 6 },
  ownHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.white, letterSpacing: 0.3 },
  ownRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border, alignItems: 'flex-start', backgroundColor: C.darkGrayRow },
  ownRowAlt: { backgroundColor: C.lightGrayRow },
  ownRowTitular: { backgroundColor: '#FEF9E6' },
  ownNum: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.dark, width: 18, textAlign: 'center' },
  ownName: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text },
  ownTag: { fontSize: 5.5, color: C.amber, marginTop: 1 },
  ownCell: { fontSize: 6.5, color: C.text },
  ownCellBold: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text },

  // Registry table
  regHeader: { flexDirection: 'row', backgroundColor: C.dark, paddingVertical: 4, paddingHorizontal: 6 },
  regRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.darkGrayRow },
  regRowAlt: { backgroundColor: C.lightGrayRow },
  regNum: { width: 30, alignItems: 'center', justifyContent: 'center' },
  regNumCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.lightGray, justifyContent: 'center', alignItems: 'center' },
  regNumText: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.dark },

  // Callout box
  callout: { flexDirection: 'row', padding: 10, marginTop: 6, borderLeftWidth: 3 },
  calloutIcon: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  // calloutIconText removed — replaced by SVG icons
  calloutContent: { flex: 1 },
  calloutTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 2 },
  calloutText: { fontSize: 7, color: C.text, lineHeight: 1.4 },

  // 4-col table
  t4Header: { flexDirection: 'row', backgroundColor: C.dark, paddingVertical: 4, paddingHorizontal: 6 },
  t4HeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 6, color: C.white, letterSpacing: 0.3 },
  t4Row: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border, alignItems: 'center', backgroundColor: C.darkGrayRow },
  t4RowAlt: { backgroundColor: C.lightGrayRow },
  t4Cell: { fontSize: 6.5, color: C.text },
  t4CellBold: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: C.text },

  // Tax section side-by-side
  taxContainer: { flexDirection: 'row', /* gap:0 not supported */ },
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

function SectionBanner({ type, title, subtitle, icon, noTopMargin }: { type: 'yellow' | 'dark'; title: string; subtitle?: string; icon?: string; noTopMargin?: boolean }) {
  const isYellow = type === 'yellow';
  return (
    <View style={[isYellow ? s.secYellow : s.secDark, noTopMargin ? { marginTop: 0 } : {}]} wrap={false}>
      {icon && (
        <View style={s.secIcon}>
          <SectionIconSvg type={icon} size={13} color={C.white} />
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
  const regex = /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ.\-/]{1,}(?:\s[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ.\-/]{1,})*)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m;
  while ((m = regex.exec(children)) !== null) {
    if (m.index > last) parts.push(children.slice(last, m.index));
    parts.push(<Text key={m.index} style={{ fontFamily: 'Helvetica-Bold' }}>{m[0]}</Text>);
    last = regex.lastIndex;
  }
  if (last < children.length) parts.push(children.slice(last));
  if (parts.length === 0) return <Text style={style}>{children}</Text>;
  return <Text style={style}>{parts}</Text>;
}

function SourceLine({ text }: { text: string }) {
  return <Text style={s.source}>Fuente: {text}</Text>;
}

function CalloutBox({ status, title, detail }: { status: 'OK' | 'WARNING' | 'CRITICAL'; title: string; detail: string }) {
  const bg = status === 'OK' ? C.greenBg : status === 'WARNING' ? C.amberBg : C.redBg;
  const border = status === 'OK' ? C.greenBorder : status === 'WARNING' ? C.amberBorder : C.redBorder;
  const iconBg = status === 'OK' ? C.green : status === 'WARNING' ? C.amber : C.red;
  const titleColor = status === 'OK' ? C.green : status === 'WARNING' ? C.amber : C.red;
  return (
    <View style={[s.callout, { backgroundColor: bg, borderLeftColor: border }]} wrap={false}>
      <View style={[s.calloutIcon, { backgroundColor: iconBg }]}>
        <StatusIcon status={status} size={10} color={C.white} />
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
              type="yellow"
              title="CARACTERÍSTICAS DEL VEHÍCULO"
              subtitle={data.vehicleDescription || 'Datos técnicos según la partida registral (SUNARP).'}
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
              <Text style={[s.ownHeaderCell, { width: 18 }]}></Text>
              <Text style={[s.ownHeaderCell, { width: '26%' }]}>PROPIETARIO(S)</Text>
              <Text style={[s.ownHeaderCell, { width: '17%' }]}>DOCUMENTO</Text>
              <Text style={[s.ownHeaderCell, { width: '13%' }]}>ADQUISICIÓN</Text>
              <Text style={[s.ownHeaderCell, { width: '17%' }]}>TIEMPO COMO{'\n'}PROPIETARIO</Text>
              <Text style={[s.ownHeaderCell, { width: '12%' }]}>PRECIO</Text>
              <Text style={[s.ownHeaderCell, { width: '12%' }]}>TÍTULO</Text>
            </View>

            {data.owners.map((own, i) => {
              const isTitular = own.tags?.includes('Titular vigente');
              return (
              <View key={i} style={[s.ownRow, i % 2 === 1 ? s.ownRowAlt : {}, isTitular ? s.ownRowTitular : {}]} wrap={false}>
                <Text style={[s.ownNum, { width: 18 }]}>{own.number}</Text>
                <View style={{ width: '26%' }}>
                  <Text style={s.ownName}>{own.name}</Text>
                  {own.tags?.map((tag, ti) => (
                    <View key={ti} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                      {tag === 'Titular vigente' && <SvgStar size={6} color={C.amber} />}
                      <Text style={[s.ownTag, tag === 'Titular vigente' ? { marginLeft: 2 } : {}]}>{tag}</Text>
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
                  type="yellow"
                  title="LISTA DE ASIENTOS REGISTRALES"
                  subtitle="Historial completo de actos inscritos en la partida, en orden cronológico."
                  icon="document"
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
            {data.taxYears && data.taxYears.length > 0 && (
              <>
                <SectionBanner
                  type="yellow"
                  title="IMPUESTO VEHICULAR"
                  subtitle="Estado de pago del impuesto vehicular ante el SAT, detallado por año."
                  icon="receipt"
                />

                <View style={s.taxContainer}>
                  <View style={s.taxTable}>
                    <View style={s.t4Header}>
                      <Text style={[s.t4HeaderCell, { width: '30%' }]}>AÑO</Text>
                      <Text style={[s.t4HeaderCell, { flex: 1, textAlign: 'right' }]}>ESTADO</Text>
                    </View>
                    {data.taxYears!.map((ty, i) => (
                      <View key={i} style={[s.t4Row, i % 2 === 1 ? s.t4RowAlt : {}]} wrap={false}>
                        <Text style={[s.t4CellBold, { width: '30%' }]}>{ty.year}</Text>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <StatusBadge status={ty.status} text={ty.statusText} />
                        </View>
                      </View>
                    ))}
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
                  type="yellow"
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
              <>
                <SectionBanner
                  type="dark"
                  title="CONCLUSIÓN LEGAL"
                  icon="gavel"
                />

                <View style={s.conclusionBox}>
                  {data.conclusionText!.split(/\n\n+/).map((para, i) => (
                    <BoldCapsText key={i} style={[s.conclusionText, i > 0 ? { marginTop: 6 } : {}]}>{para.trim()}</BoldCapsText>
                  ))}
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

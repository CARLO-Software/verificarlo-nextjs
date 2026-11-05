"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle, Search, Phone, FileText } from "lucide-react";
import styles from "./ConsultaLeads.module.css";

interface Lead {
  id: string;
  name: string;
  phone: string;
  plate: string;
  verified: boolean;
  createdAt: string;
}

export default function ConsultaLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [verified, setVerified] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/consulta-leads")
      .then(res => res.json())
      .then(data => {
        setLeads(data.leads || []);
        setTotal(data.total || 0);
        setVerified(data.verified || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = leads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.plate.toLowerCase().includes(q);
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Cargando...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Consultas de Reporte</h1>
          <p className={styles.subtitle}>Leads capturados desde la consulta gratuita de placa</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Users className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{total}</span>
            <span className={styles.statLabel}>Total registrados</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <CheckCircle className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{verified}</span>
            <span className={styles.statLabel}>Verificados</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Phone className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{total - verified}</span>
            <span className={styles.statLabel}>Pendientes</span>
          </div>
        </div>
      </div>

      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.sectionTitle}>Registros recientes</h2>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o placa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={40} />
            <p>No hay registros{search ? " que coincidan" : ""}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Placa</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id}>
                    <td className={styles.nameCell}>{lead.name}</td>
                    <td className={styles.phoneCell}>+51 {lead.phone}</td>
                    <td><span className={styles.plateBadge}>{lead.plate}</span></td>
                    <td>
                      <span className={lead.verified ? styles.badgeVerified : styles.badgePending}>
                        {lead.verified ? "Verificado" : "Pendiente"}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

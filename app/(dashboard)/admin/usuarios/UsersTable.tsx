"use client";
import { useEffect, useState } from "react";
import UserRoleBadge from "./UserRoleBadge";
import { UserActions } from "@/app/components/Admin/UserActions";
import { SuspendModal } from "@/app/components/Admin/SuspendModal";
import { DeleteConfirmModal } from "@/app/components/Admin/DeleteConfirmModal";
import { useSession } from "next-auth/react";
import { useToast } from "@/app/components/Toast";
import { Plus, Search, Users, UserCheck, UserX } from "lucide-react";
import { AddUserModal } from "@/app/components/Admin/AddUserModal";

type UserStatus = "ACTIVE" | "SUSPENDED";
type Role = "ADMIN" | "CLIENT" | "INSPECTOR";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  status: UserStatus;
  phone: number;
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");

  // Modals
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: session } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const filteredUsers = users
    .filter((user) =>
      `${user.name ?? ""} ${user.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .filter((user) => (roleFilter === "ALL" ? true : user.role === roleFilter));

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
  const suspendedUsers = users.filter((u) => u.status === "SUSPENDED").length;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-11 w-44 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        {/* Skeleton stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
        {/* Skeleton table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 h-14 bg-gray-50 animate-pulse" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 border-t animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ========== Cambiar rol (inline) ==========
  const handleRoleChange = async (user: User, newRole: string) => {
    const oldRole = user.role;

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole as Role } : u)),
    );
    setEditingUserId(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "changeRole",
          newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Rollback
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: oldRole } : u)),
        );
        showToast(data.error || "No se pudo actualizar el rol", "error");
        return;
      }

      showToast(`Rol actualizado a ${newRole}`, "success");
    } catch {
      // Rollback
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: oldRole } : u)),
      );
      showToast("No se pudo actualizar el rol", "error");
    }
  };

  // ========== Suspender / Reactivar ==========
  const handleSuspendConfirm = async () => {
    if (!suspendTarget) return;

    const action = suspendTarget.status === "ACTIVE" ? "suspend" : "reactivate";

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: suspendTarget.id, action }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error en la operación");
    }

    const newStatus: UserStatus = action === "suspend" ? "SUSPENDED" : "ACTIVE";

    setUsers((prev) =>
      prev.map((u) =>
        u.id === suspendTarget.id ? { ...u, status: newStatus } : u,
      ),
    );

    showToast(
      action === "suspend" ? "Usuario suspendido" : "Usuario reactivado",
      "success",
    );
  };

  // ========== Eliminar ==========
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteTarget.id }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error al eliminar");
    }

    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    showToast("Usuario eliminado", "success");
  };

  function getInitials(name: string | null) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="">
      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Usuarios
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona los usuarios registrados en la plataforma
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="
            inline-flex items-center justify-center gap-2
            bg-gradient-to-r from-yellow-400 to-yellow-500
            hover:from-yellow-500 hover:to-yellow-600
            text-gray-900 font-semibold
            px-5 py-2.5 rounded-xl
            shadow-lg shadow-yellow-400/25
            hover:shadow-xl hover:shadow-yellow-400/30
            transform hover:-translate-y-0.5
            transition-all duration-200
            text-sm sm:text-base
            w-full sm:w-auto
          "
        >
          <Plus size={20} strokeWidth={2.5} />
          Agregar usuario
        </button>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-blue-50">
            <Users size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            <p className="text-xs text-gray-500 font-medium">Total usuarios</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-emerald-50">
            <UserCheck size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
            <p className="text-xs text-gray-500 font-medium">Activos</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-red-50">
            <UserX size={22} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{suspendedUsers}</p>
            <p className="text-xs text-gray-500 font-medium">Suspendidos</p>
          </div>
        </div>
      </div>

      {/* ==================== TABLE CARD ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-100">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2.5
                bg-gray-50 border border-gray-200 rounded-lg
                text-sm text-gray-700 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400
                transition-colors duration-200
              "
            />
          </div>

          {/* Role filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(["ALL", "ADMIN", "INSPECTOR", "CLIENT"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
                  transition-all duration-200
                  ${
                    roleFilter === role
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                {role === "ALL" ? "Todos" : role === "ADMIN" ? "Admin" : role === "INSPECTOR" ? "Inspector" : "Cliente"}
              </button>
            ))}
          </div>
        </div>

        {/* ---- Desktop Table ---- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Celular
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={40} className="text-gray-300" />
                      <p className="text-gray-500 font-medium">No se encontraron usuarios</p>
                      <p className="text-gray-400 text-xs">Intenta con otro término de búsqueda</p>
                    </div>
                  </td>
                </tr>
              )}

              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50/60 transition-colors duration-150"
                >
                  {/* User info with avatar */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {getInitials(user.name)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {user.name ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4">
                    {editingUserId === user.id ? (
                      <select
                        autoFocus
                        defaultValue={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        onBlur={() => setEditingUserId(null)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none"
                      >
                        <option value="INSPECTOR">INSPECTOR</option>
                        <option value="CLIENT">CLIENT</option>
                      </select>
                    ) : (
                      <UserRoleBadge role={user.role} />
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      {user.status === "ACTIVE" ? "Activo" : "Suspendido"}
                    </span>
                  </td>

                  {/* Phone */}
                  <td className="px-5 py-4 text-gray-600">{user.phone}</td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <UserActions
                      userId={user.id}
                      role={user.role}
                      status={user.status}
                      isSelf={user.id === session?.user?.id}
                      onEditRole={(id) => setEditingUserId(id)}
                      onSuspend={(id) => {
                        const target = users.find((u) => u.id === id);
                        if (target) setSuspendTarget(target);
                      }}
                      onDelete={(id) => {
                        const target = users.find((u) => u.id === id);
                        if (target) setDeleteTarget(target);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---- Mobile Cards ---- */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredUsers.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Search size={40} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">No se encontraron usuarios</p>
              <p className="text-gray-400 text-xs mt-1">Intenta con otro término de búsqueda</p>
            </div>
          )}

          {filteredUsers.map((user) => (
            <div key={user.id} className="p-4 space-y-3">
              {/* User header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {getInitials(user.name)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {user.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <UserActions
                  userId={user.id}
                  role={user.role}
                  status={user.status}
                  isSelf={user.id === session?.user?.id}
                  onEditRole={(id) => setEditingUserId(id)}
                  onSuspend={(id) => {
                    const target = users.find((u) => u.id === id);
                    if (target) setSuspendTarget(target);
                  }}
                  onDelete={(id) => {
                    const target = users.find((u) => u.id === id);
                    if (target) setDeleteTarget(target);
                  }}
                />
              </div>

              {/* Badges and info row */}
              <div className="flex items-center gap-2 flex-wrap">
                {editingUserId === user.id ? (
                  <select
                    autoFocus
                    defaultValue={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    onBlur={() => setEditingUserId(null)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none"
                  >
                    <option value="INSPECTOR">INSPECTOR</option>
                    <option value="CLIENT">CLIENT</option>
                  </select>
                ) : (
                  <UserRoleBadge role={user.role} />
                )}

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  {user.status === "ACTIVE" ? "Activo" : "Suspendido"}
                </span>

                {user.phone && (
                  <span className="text-xs text-gray-500">
                    Tel: {user.phone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer with count */}
        {filteredUsers.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Mostrando <span className="font-semibold text-gray-700">{filteredUsers.length}</span> de{" "}
              <span className="font-semibold text-gray-700">{totalUsers}</span> usuarios
            </p>
          </div>
        )}
      </div>

      {/* Modal de Suspender / Reactivar */}
      {suspendTarget && (
        <SuspendModal
          isOpen={!!suspendTarget}
          onClose={() => setSuspendTarget(null)}
          user={suspendTarget}
          onConfirm={handleSuspendConfirm}
        />
      )}

      {/* Modal de Eliminar */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          user={deleteTarget}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Modal de Agregar Usuario */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(newUser) => {
          setUsers((prev) => [
            {
              ...newUser,
              phone: newUser.phone ? Number(newUser.phone) : 0,
            } as User,
            ...prev,
          ]);
          showToast(`Usuario ${newUser.name} creado exitosamente`, "success");
        }}
      />
    </div>
  );
}

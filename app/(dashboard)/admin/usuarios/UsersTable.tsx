"use client";
import { useEffect, useState } from "react";
import UserRoleBadge from "./UserRoleBadge";
import { UserActions } from "@/app/components/Admin/UserActions";
import { SuspendModal } from "@/app/components/Admin/SuspendModal";
import { DeleteConfirmModal } from "@/app/components/Admin/DeleteConfirmModal";
import { useSession } from "next-auth/react";
import { useToast } from "@/app/components/Toast";

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

  // Modals
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

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

  const filteredUsers = users.filter((user) =>
    `${user.name ?? ""} ${user.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  if (loading) {
    return <p className="text-gray-500">Cargando usuarios...</p>;
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

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-4 flex items-center justify-between">
        <h2 className="font-medium">Lista de usuarios</h2>
        <input
          type="text"
          placeholder="Buscar por nombre o email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Celular</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No se encontraron usuarios
                </td>
              </tr>
            )}

            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3 font-medium">{user.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  {editingUserId === user.id ? (
                    <select
                      autoFocus
                      defaultValue={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      onBlur={() => setEditingUserId(null)}
                      className="rounded-md border px-2 py-1 text-sm"
                    >
                      <option value="INSPECTOR">INSPECTOR</option>
                      <option value="CLIENT">CLIENT</option>
                    </select>
                  ) : (
                    <UserRoleBadge role={user.role} />
                  )}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.status === "ACTIVE" ? "Activo" : "Suspendido"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{user.phone}</td>
                <td className="px-4 py-3 text-right">
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
    </div>
  );
}

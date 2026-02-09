"use client";
import { useEffect, useState } from "react";
import UserRoleBadge from "./UserRoleBadge";
import { UserActions } from "@/app/components/Admin/UserActions";
import { useSession } from "next-auth/react";
import type { UserProfile } from "@/types/profile";

export const UserStatus = {};

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "CLIENT" | "INSPECTOR";
  createdAt: string;
  status: UserProfile;
  phone: number;
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const { data: session, status } = useSession();

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
              <th className="px-4 py-3">3</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
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
                  <UserRoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3 text-gray-500">{user.status}</td>
                <td className="px-4 py-3 text-gray-500">{user.phone}</td>
                <td className="px-4 py-3 text-right">
                  <UserActions
                    userId={user.id}
                    role={user.role}
                    status={user.status}
                    isSelf={session?.user.id === user.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

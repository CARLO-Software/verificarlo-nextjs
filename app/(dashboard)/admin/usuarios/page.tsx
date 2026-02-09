import { UsersTable } from "./UsersTable";

export default function UsersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Usuarios</h1>
      <UsersTable />
    </div>
  );
}

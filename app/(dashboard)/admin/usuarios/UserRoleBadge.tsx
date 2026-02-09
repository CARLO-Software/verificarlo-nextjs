interface Props {
  role: "ADMIN" | "CLIENT" | "INSPECTOR";
}

export default function UserRoleBadge({ role }: Props) {
  const styles =
    role === "ADMIN"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles}`}
    >
      {role}
    </span>
  );
}

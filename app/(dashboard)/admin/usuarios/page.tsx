import { Users } from 'lucide-react';

export default function UsuariosPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Usuarios</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <Users size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Próximamente</h2>
        <p className="text-sm text-gray-500">La gestión de usuarios estará disponible pronto.</p>
      </div>
    </div>
  );
}

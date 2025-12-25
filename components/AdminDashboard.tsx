import React, { useEffect, useState } from "react";
import { User, SupportedLanguage, TimeRecord } from "../types";
import { TRANSLATIONS } from "../constants";
import { generateBackupFile } from "../utils/helpers";
import axios from "axios";
import { API_URL } from "../api";
import {
  Users,
  UserPlus,
  Search,
  Pencil,
  Trash2,
  Database,
  ShieldCheck,
} from "lucide-react";

interface Props {
  users: User[];
  onAddUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  lang: SupportedLanguage;
  records: TimeRecord[];
  onRestoreData?: (data: { users: User[] }) => void;
}

const AdminDashboard: React.FC<Props> = ({
  users,
  onAddUser,
  onEditUser,
  onDeleteUser,
  lang,
  records,
  onRestoreData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<User>({
    id: "",
    name: "",
    username: "",
    role: "employee",
    nif: "",
    email: "",
    phone: "",
    hourlyRate: 0,
    currency: "EUR",
    country: "PT",
    isActive: true,
    password: "",
    isProvisionalPassword: false,
    language: lang,
  });

  const t = TRANSLATIONS[lang];

  // 🔴 Buscar usuários do backend ao carregar
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users`);
        onRestoreData?.({ users: res.data });
      } catch (err) {
        console.error("Erro ao buscar usuários do banco:", err);
      }
    };
    fetchUsers();
  }, [onRestoreData]);

  const manageableUsers = users.filter((u) => u.role !== "master");

  const filteredUsers = manageableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nif?.includes(searchTerm) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenNewUserModal = () => {
    setIsEditing(false);
    setFormData({
      id: "",
      name: "",
      username: "",
      role: "employee",
      nif: "",
      email: "",
      phone: "",
      hourlyRate: 0,
      currency: "EUR",
      country: "PT",
      isActive: true,
      password: "123",
      isProvisionalPassword: true,
      language: lang,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditUserModal = (user: User) => {
    setIsEditing(true);
    setFormData({ ...user });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Atualiza localmente e opcionalmente na API futura
        onEditUser(formData);
      } else {
        const response = await axios.post(`${API_URL}/api/register`, {
          name: formData.name,
          email: formData.email,
          plan: "free",
        });
        onAddUser(response.data);
      }
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase">
                {t.activeSubscriptions}
              </p>
              <h3 className="text-2xl font-bold">{manageableUsers.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <ShieldCheck size={20} className="text-emerald-600" />
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase">
              Suporte
            </p>
            <h3 className="text-xl font-bold">
              {manageableUsers.filter((u) => u.role === "support").length}
            </h3>
          </div>
        </div>

        <button
          onClick={() =>
            generateBackupFile({ users, records }, "dns_full_backup.json")
          }
          className="bg-white rounded-2xl p-4 flex items-center justify-center gap-2 text-purple-600 font-bold text-xs"
        >
          <Database size={16} /> Backup
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="w-full pl-10 pr-4 py-3 border rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={handleOpenNewUserModal}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <UserPlus size={18} /> {t.newSubscription}
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-2xl space-y-4 w-full max-w-md"
          >
            <h2 className="font-bold text-lg">
              {isEditing ? t.editUser : t.newSubscription}
            </h2>

            <input
              required
              placeholder="Nome"
              className="w-full border p-3 rounded"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <input
              required
              placeholder="Email"
              className="w-full border p-3 rounded"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
              {t.save}
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full text-gray-400 text-sm"
            >
              {t.cancel}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

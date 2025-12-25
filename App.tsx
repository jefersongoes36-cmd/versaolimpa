import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import SupportDashboard from './components/SupportDashboard';
import Chat from './components/Chat';
import Help from './components/Help';
import SalesPage from './components/SalesPage';
import { User, TimeRecord, SupportedLanguage, SupportTicket, ChatMessage, CURRENCIES, SUPPORTED_LANGUAGES } from './types';
import { getGreeting } from './utils/helpers';
import { LayoutDashboard, PieChart, LogOut, Globe, Wallet, Users as UsersIcon, UserCircle, MessageCircle, HelpCircle, Headphones, Boxes } from 'lucide-react';
import axios from 'axios';
import { API_URL } from './api';

const INITIAL_USERS: User[] = [
  {
    id: 'MASTER-01',
    username: 'admin',
    password: '123',
    name: 'Master Admin',
    role: 'master',
    currency: 'EUR',
    country: 'PT',
    language: 'pt',
    hourlyRate: 0,
    isActive: true,
    isProvisionalPassword: false
  },
  {
    id: 'SUPPORT-01',
    username: 'support',
    password: '123',
    name: 'Técnico Axis',
    role: 'support',
    currency: 'EUR',
    country: 'PT',
    language: 'pt',
    hourlyRate: 15,
    isActive: true,
    isProvisionalPassword: false
  }
];

const App: React.FC = () => {
  const [phase, setPhase] = useState<'splash' | 'sales' | 'login' | 'greeting' | 'app'>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [greetingOpacity, setGreetingOpacity] = useState(0);
  const [lang, setLang] = useState<SupportedLanguage>('pt');

  // 🔴 Busca usuários do backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users`);
        setUsers(res.data);
      } catch (err) {
        console.error('Erro ao buscar usuários do backend:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setLang(loggedInUser.language);
    if (loggedInUser.role === 'master') setActiveTab('admin');
    else if (loggedInUser.role === 'support') setActiveTab('support');
    else setActiveTab('dashboard');
    setPhase('greeting');
  };

  const handleRegister = async (name: string, email: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/register`, { name, email, plan: 'free' });
      setUsers(prev => [res.data, ...prev]);
      setPhase('login');
    } catch (err) {
      console.error('Erro ao registrar usuário:', err);
    }
  };

  const handleUpdateTicket = (updatedTicket: SupportTicket) => {
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
  };

  const handleCreateTicket = (subject: string): string => {
    if (!user) return '';
    const newId = `TK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newTicket: SupportTicket = {
      id: newId,
      userId: user.id,
      subject,
      status: 'open',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `M-${Date.now()}`,
          senderId: user.id,
          text: `Início de chamado técnico: ${subject}. Aguardando conexão com um especialista.`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    setTickets(prev => [newTicket, ...prev]);
    return newId;
  };

  const handleSendMessageToTicket = (ticketId: string, text: string) => {
    if (!user) return;
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          messages: [
            ...t.messages,
            {
              id: `M-${Date.now()}`,
              senderId: user.id,
              text,
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return t;
    }));
  };

  const handleGlobalConfigChange = (type: 'lang' | 'curr', value: string) => {
    if (!user) return;
    if (type === 'lang') {
      const newLang = value as SupportedLanguage;
      setLang(newLang);
      setUser({ ...user, language: newLang });
    } else {
      setUser({ ...user, currency: value });
    }
  };

  useEffect(() => {
    if (phase === 'greeting') {
      setTimeout(() => setGreetingOpacity(1), 100);
      setTimeout(() => setGreetingOpacity(0), 3500);
      setTimeout(() => setPhase('app'), 5000);
    }
  }, [phase]);

  const handlePasswordChange = (id: string, pass: string, firstAccess: boolean = false) => {
    const firstAccessDate = firstAccess ? new Date().toISOString() : undefined;
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = {
          ...u,
          password: pass,
          isProvisionalPassword: false,
          ...(firstAccessDate && { firstAccessDate })
        };
        if (user && user.id === id) setUser(updated);
        return updated;
      }
      return u;
    }));
  };

  const handleLogout = () => {
    setPhase('login');
    setUser(null);
  };

  if (phase === 'splash') return <SplashScreen onLoginClick={() => setPhase('login')} onSalesClick={() => setPhase('sales')} lang={lang} setLang={setLang} />;
  if (phase === 'sales') return <SalesPage onRegister={(name, email) => handleRegister(name, email)} lang={lang} setLang={setLang} onCancel={() => setPhase('splash')} />;
  if (phase === 'login') return <Login onLogin={handleLogin} lang={lang} users={users} onPasswordChange={handlePasswordChange} />;

  if (phase === 'greeting' && user) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white transition-opacity duration-[1500ms] ease-in-out" style={{ opacity: greetingOpacity }}>
        <div className="mb-8 scale-150 transform animate-bounce">
           {user.profilePicture ? <img src={user.profilePicture} className="w-24 h-24 rounded-3xl object-cover border-4 border-blue-100 shadow-2xl" /> : <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-black text-4xl shadow-2xl">{user.name.charAt(0)}</div>}
        </div>
        <div className="text-center px-6">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 tracking-tighter">
                {getGreeting(lang)}, <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600">{user.name.split(' ')[0]}</span>
            </h2>
            <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs">Digital Nexus Solutions</p>
        </div>
      </div>
    );
  }

  if (phase === 'app' && user) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
        {/* SIDEBAR, HEADER, MAIN, NAV ... */}
        {/* Use o AdminDashboard como antes, mas agora sempre usa `users` sincronizado do backend */}
        <AdminDashboard
          users={users}
          onAddUser={(newUser) => setUsers(prev => [newUser, ...prev])}
          onEditUser={(updatedUser) => setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))}
          onDeleteUser={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
          lang={lang}
          records={records}
        />
      </div>
    );
  }

  return null;
};

export default App;

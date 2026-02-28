import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useNavigate,
  useLocation
} from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  AlertTriangle,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  Save,
  UserPlus,
  MessageSquare,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_URL = '/api';

let currentSessionId: string | null = null;

const fetchWithAuth = async (url: string, options: any = {}) => {
  const token = localStorage.getItem('token');
  const sessionId = localStorage.getItem('sessionId');
  
  // Validate session hasn't changed (user logged out elsewhere)
  if (sessionId && currentSessionId && sessionId !== currentSessionId) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
    return Promise.reject(new Error('Session invalidated'));
  }
  
  currentSessionId = sessionId;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  
  if (response.status === 401 || response.status === 403) {
    localStorage.clear();
    sessionStorage.clear();
    currentSessionId = null;
    window.location.href = '/login';
    return Promise.reject(new Error('Unauthorized'));
  }
  
  return response;
};

// --- AUTH CONTEXT ---
const AuthContext = createContext<any>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  const login = (userData: any, userToken: string) => {
    // Clear any previous user data first
    localStorage.clear();
    // Set new user data
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    localStorage.setItem('sessionId', sessionId);
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
    
    // Call logout API to blacklist the token on server
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => {}); // Ignore errors, cleanup locally anyway
      } catch (err) {
        // Silently fail - local cleanup still happens
      }
    }
    
    setUser(null);
    setToken(null);
    localStorage.clear();
    sessionStorage.clear();
    currentSessionId = null;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, sessionId }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- COMPONENTS ---

const Card = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50 flex items-center gap-4">
    <div className={cn("p-4 rounded-xl", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const SidebarLink = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
        : "text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
    )}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </Link>
);

// --- PAGES ---

const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl bg-white p-10 rounded-3xl shadow-xl border border-emerald-100"
      >
        <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <ShoppingCart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">نظام البقالة الذكي</h1>
        <p className="text-gray-600 text-lg mb-10 leading-relaxed">
          الحل المتكامل لإدارة متجرك بكل سهولة واحترافية. تتبع مبيعاتك، مخزونك، وديون عملائك في مكان واحد.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'إدارة المنتجات', icon: Package },
            { label: 'تتبع المبيعات', icon: TrendingUp },
            { label: 'حساب الأرباح', icon: Wallet },
            { label: 'تسجيل الديون', icon: Users },
            { label: 'إدارة المصاريف', icon: Receipt },
            { label: 'تنبيه النواقص', icon: AlertTriangle },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <item.icon className="w-6 h-6 text-emerald-600" />
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login" className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
            تسجيل الدخول
          </Link>
          <Link to="/register" className="px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-2xl font-bold hover:bg-emerald-50 transition-colors">
            إنشاء حساب جديد
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        navigate('/dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-emerald-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">مرحباً بك مجدداً</h2>
        <p className="text-gray-500 text-center mb-8">سجل دخولك لإدارة متجرك</p>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم المستخدم</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
            دخول
          </button>
        </form>
        <p className="mt-6 text-center text-gray-500 text-sm">
          ليس لديك حساب؟ <Link to="/register" className="text-emerald-600 font-bold">سجل الآن</Link>
        </p>
      </motion.div>
    </div>
  );
};

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    city: '',
    phone: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/login');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl border border-emerald-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">إنشاء حساب جديد</h2>
        <p className="text-gray-500 text-center mb-8">ابدأ إدارة متجرك اليوم</p>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">المدينة</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم المستخدم</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="md:col-span-2 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
            إنشاء الحساب
          </button>
        </form>
        <p className="mt-6 text-center text-gray-500 text-sm">
          لديك حساب بالفعل؟ <Link to="/login" className="text-emerald-600 font-bold">دخول</Link>
        </p>
      </motion.div>
    </div>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { to: '/inventory', icon: Package, label: 'المخزون' },
    { to: '/pos', icon: ShoppingCart, label: 'نقطة البيع' },
    { to: '/expenses', icon: Receipt, label: 'المصاريف' },
    { to: '/customers', icon: Users, label: 'العملاء والديون' },
    { to: '/chat', icon: MessageSquare, label: 'المحادثات' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-100 transition-transform duration-300 md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">البقالة الذكية</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {links.map((link) => (
              <SidebarLink 
                key={link.to} 
                {...link} 
                active={location.pathname === link.to} 
              />
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-6 px-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                {user?.full_name?.[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-800 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-500 md:hidden"
          >
            {sidebarOpen ? <X /> : <Menu />}
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 font-medium">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>
        
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const DashboardHome = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchWithAuth('/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">نظرة عامة</h2>
        <p className="text-gray-500">متابعة أداء المتجر اليوم</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card title="مبيعات اليوم" value={`${stats.salesToday} ر.س`} icon={TrendingUp} color="bg-blue-500" />
        <Card title="أرباح اليوم" value={`${stats.profitToday} ر.س`} icon={Wallet} color="bg-emerald-500" />
        <Card title="مصاريف اليوم" value={`${stats.expensesToday} ر.س`} icon={Receipt} color="bg-red-500" />
        <Card title="نواقص المخزون" value={stats.lowStockCount} icon={AlertTriangle} color="bg-amber-500" subtitle="منتجات تحت الحد الأدنى" />
        <Card title="إجمالي الديون" value={`${stats.totalDebts} ر.س`} icon={Users} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">أحدث العمليات</h3>
          <div className="space-y-4">
            <p className="text-gray-400 text-center py-10 italic">سيتم عرض سجل العمليات هنا قريباً...</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">تنبيهات هامة</h3>
          <div className="space-y-4">
            {stats.lowStockCount > 0 && (
              <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <AlertTriangle className="text-amber-600" />
                <div>
                  <p className="font-bold text-amber-900">نقص في المخزون</p>
                  <p className="text-sm text-amber-700">يوجد {stats.lowStockCount} منتجات قاربت على النفاد.</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <TrendingUp className="text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-900">أداء جيد</p>
                <p className="text-sm text-emerald-700">المبيعات اليوم مستقرة وضمن المعدل الطبيعي.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    purchase_price: '',
    selling_price: '',
    quantity: '',
    low_stock_threshold: '5'
  });

  const loadProducts = () => {
    fetchWithAuth('/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/products/${editingProduct.id}` : '/products';
    
    const res = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', barcode: '', purchase_price: '', selling_price: '', quantity: '', low_stock_threshold: '5' });
      loadProducts();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await fetchWithAuth(`/products/${id}`, { method: 'DELETE' });
      loadProducts();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode?.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">إدارة المخزون</h2>
          <p className="text-gray-500">إضافة وتعديل المنتجات ومراقبة الكميات</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setFormData({ name: '', barcode: '', purchase_price: '', selling_price: '', quantity: '', low_stock_threshold: '5' }); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة منتج</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="بحث باسم المنتج أو الباركود..." 
              className="w-full pr-12 pl-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-200 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase">
                <th className="px-6 py-4 font-bold">المنتج</th>
                <th className="px-6 py-4 font-bold">الباركود</th>
                <th className="px-6 py-4 font-bold">سعر الشراء</th>
                <th className="px-6 py-4 font-bold">سعر البيع</th>
                <th className="px-6 py-4 font-bold">الكمية</th>
                <th className="px-6 py-4 font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-sm">{product.barcode || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{product.purchase_price} ر.س</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{product.selling_price} ر.س</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      product.quantity <= product.low_stock_threshold 
                        ? "bg-red-100 text-red-600" 
                        : "bg-emerald-100 text-emerald-600"
                    )}>
                      {product.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditingProduct(product); setFormData({ ...product }); setIsModalOpen(true); }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">{editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">اسم المنتج</label>
                  <input 
                    type="text" required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الباركود</label>
                  <input 
                    type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200"
                    value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الكمية الحالية</label>
                  <input 
                    type="number" required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200"
                    value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">سعر الشراء</label>
                  <input 
                    type="number" step="0.01" required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200"
                    value={formData.purchase_price} onChange={e => setFormData({...formData, purchase_price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">سعر البيع</label>
                  <input 
                    type="number" step="0.01" required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200"
                    value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">تنبيه عند وصول الكمية لـ</label>
                  <input 
                    type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200"
                    value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: e.target.value})}
                  />
                </div>
                <div className="col-span-2 flex gap-4 mt-4">
                  <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100">حفظ</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const POSPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWithAuth('/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) return alert('لا توجد كمية كافية في المخزون');
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.quantity <= 0) return alert('المنتج غير متوفر في المخزون');
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, q: number) => {
    const product = products.find(p => p.id === id);
    if (q > product.quantity) return alert('لا توجد كمية كافية');
    if (q <= 0) return removeFromCart(id);
    setCart(cart.map(item => item.id === id ? { ...item, quantity: q } : item));
  };

  const total = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  const completeSale = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth('/sales', {
        method: 'POST',
        body: JSON.stringify({ items: cart.map(item => ({ id: item.id, quantity: item.quantity })) })
      });
      if (res.ok) {
        setCart([]);
        alert('تمت عملية البيع بنجاح');
        // Reload products to update quantities
        fetchWithAuth('/products').then(res => res.json()).then(data => setProducts(data));
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert('حدث خطأ أثناء إتمام البيع');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode?.includes(search)
  );

  return (
    <div className="h-full flex flex-col lg:flex-row gap-8">
      {/* Products Selection */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="ابحث عن منتج أو امسح الباركود..." 
            className="w-full pr-12 pl-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-emerald-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
          {filteredProducts.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-500 hover:shadow-md transition-all text-right flex flex-col"
            >
              <div className="font-bold text-gray-800 mb-1 line-clamp-2">{product.name}</div>
              <div className="text-emerald-600 font-bold mt-auto">{product.selling_price} ر.س</div>
              <div className="text-xs text-gray-400 mt-1">المخزون: {product.quantity}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className="w-full lg:w-96 bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-emerald-50/50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-emerald-600" />
            <span>سلة المشتريات</span>
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>السلة فارغة</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</p>
                  <p className="text-xs text-emerald-600 font-bold">{item.selling_price} ر.س</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 p-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded">-</button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded">+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between text-lg font-bold">
            <span className="text-gray-600">الإجمالي</span>
            <span className="text-emerald-600 text-2xl">{total.toFixed(2)} ر.س</span>
          </div>
          <button 
            disabled={cart.length === 0 || loading}
            onClick={completeSale}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
          >
            {loading ? 'جاري المعالجة...' : (
              <>
                <Save className="w-5 h-5" />
                <span>إتمام عملية البيع</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', amount: '', date: new Date().toISOString().split('T')[0] });

  const loadExpenses = () => {
    fetchWithAuth('/expenses').then(res => res.json()).then(data => setExpenses(data));
  };

  useEffect(() => { loadExpenses(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetchWithAuth('/expenses', { method: 'POST', body: JSON.stringify(formData) });
    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ title: '', amount: '', date: new Date().toISOString().split('T')[0] });
      loadExpenses();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">المصاريف</h2>
          <p className="text-gray-500">تسجيل ومتابعة المصاريف اليومية</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مصروف</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm uppercase">
              <th className="px-6 py-4 font-bold">البيان</th>
              <th className="px-6 py-4 font-bold">المبلغ</th>
              <th className="px-6 py-4 font-bold">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-red-50/30 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800">{exp.title}</td>
                <td className="px-6 py-4 text-red-600 font-bold">{exp.amount} ر.س</td>
                <td className="px-6 py-4 text-gray-500">{exp.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">إضافة مصروف</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">البيان (مثلاً: إيجار، كهرباء)</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ</label>
                  <input type="number" step="0.01" required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">التاريخ</label>
                  <input type="date" required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100">حفظ</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [debtData, setDebtData] = useState({ amount: '', type: 'DEBT', description: '' });

  const loadCustomers = () => {
    fetchWithAuth('/customers').then(res => res.json()).then(data => setCustomers(data));
  };

  useEffect(() => { loadCustomers(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetchWithAuth('/customers', { method: 'POST', body: JSON.stringify(formData) });
    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ name: '', phone: '' });
      loadCustomers();
    }
  };

  const handleDebtSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetchWithAuth('/debts', { 
      method: 'POST', 
      body: JSON.stringify({ ...debtData, customer_id: selectedCustomer.id }) 
    });
    if (res.ok) {
      setIsDebtModalOpen(false);
      setDebtData({ amount: '', type: 'DEBT', description: '' });
      loadCustomers();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">العملاء والديون</h2>
          <p className="text-gray-500">إدارة حسابات العملاء والديون المستحقة</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100"
        >
          <UserPlus className="w-5 h-5" />
          <span>إضافة عميل</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xl">
                {customer.name[0]}
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold",
                customer.balance > 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
              )}>
                {customer.balance > 0 ? 'عليه ديون' : 'خالص'}
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{customer.name}</h3>
            <p className="text-sm text-gray-400 mb-4">{customer.phone || 'لا يوجد رقم هاتف'}</p>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-6">
              <span className="text-sm text-gray-500">الرصيد الحالي</span>
              <span className={cn("text-xl font-bold", customer.balance > 0 ? "text-red-600" : "text-emerald-600")}>
                {customer.balance} ر.س
              </span>
            </div>

            <button 
              onClick={() => { setSelectedCustomer(customer); setIsDebtModalOpen(true); }}
              className="w-full py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors"
            >
              تسجيل دين / دفعة
            </button>
          </div>
        ))}
      </div>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">إضافة عميل جديد</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">اسم العميل</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100">حفظ</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Debt/Payment Modal */}
      <AnimatePresence>
        {isDebtModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDebtModalOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">تسجيل عملية للعميل</h3>
              <p className="text-emerald-600 font-bold mb-6">{selectedCustomer?.name}</p>
              <form onSubmit={handleDebtSubmit} className="space-y-6">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button 
                    type="button" 
                    onClick={() => setDebtData({...debtData, type: 'DEBT'})}
                    className={cn("flex-1 py-2 rounded-lg font-bold transition-all", debtData.type === 'DEBT' ? "bg-white text-red-600 shadow-sm" : "text-gray-500")}
                  >
                    دين جديد
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setDebtData({...debtData, type: 'PAYMENT'})}
                    className={cn("flex-1 py-2 rounded-lg font-bold transition-all", debtData.type === 'PAYMENT' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500")}
                  >
                    تسديد دفعة
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ</label>
                  <input type="number" step="0.01" required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200" value={debtData.amount} onChange={e => setDebtData({...debtData, amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات</label>
                  <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-200" value={debtData.description} onChange={e => setDebtData({...debtData, description: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100">تأكيد</button>
                  <button type="button" onClick={() => setIsDebtModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChatPage = () => {
  const { user, token } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedChatRef = useRef<any>(selectedChat);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  /* -------------------- Scroll -------------------- */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* -------------------- Load Users -------------------- */
  useEffect(() => {
    fetchWithAuth('/users')
      .then(res => res.json())
      .then(data => setUsers(data.filter((u: any) => u.id !== user.id)));
  }, []);

  /* -------------------- WebSocket -------------------- */
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}?token=${token}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'ONLINE_USERS') {
        setOnlineUserIds(data.users);
        return;
      }

      if (data.type === 'NEW_MESSAGE') {
        const msg = data.message;
        const sc = selectedChatRef.current;
        const isCurrentChat =
          sc &&
          (
            (msg.sender_id === user.id && msg.receiver_id === sc.id) ||
            (msg.sender_id === sc.id && msg.receiver_id === user.id) ||
            msg.group_id === sc.id
          );

        if (isCurrentChat) {
          setMessages(prev => [...prev, msg]);
        }
      }

      if (data.type === 'MESSAGE_DELETED') {
        const msgId = data.messageId;
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, [token]);

  /* -------------------- Load Messages -------------------- */
  useEffect(() => {
    if (!selectedChat) return;

    const endpoint = selectedChat.isGroup
      ? `/groups/${selectedChat.id}/messages`
      : `/chat/${selectedChat.id}`;

    fetchWithAuth(endpoint)
      .then(res => res.json())
      .then(data => setMessages(data));

    inputRef.current?.focus();
  }, [selectedChat]);

  /* -------------------- Send Message -------------------- */
  const sendMessage = (e?: React.SyntheticEvent | any) => {
    // prevent any default behavior (form submit, key press)
    if (e && e.preventDefault) e.preventDefault();
    if (!input.trim() || !selectedChat || !socket) return;

    const tempMessage = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: selectedChat.isGroup ? null : selectedChat.id,
      group_id: selectedChat.isGroup ? selectedChat.id : null,
      content: input,
      created_at: new Date().toISOString(),
    };

    // Optimistic UI (WhatsApp style)
    setMessages(prev => [...prev, tempMessage]);

    try {
      socket.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        receiverId: selectedChat.isGroup ? null : selectedChat.id,
        groupId: selectedChat.isGroup ? selectedChat.id : null,
        content: input
      }));
    } catch (err) {
      console.error('Socket send failed:', err);
    }

    setInput('');
  };

  /* -------------------- Delete Message -------------------- */
  const deleteMessage = async (messageId: number) => {
    try {
      await fetchWithAuth(`/api/messages/${messageId}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  /* -------------------- Create Group -------------------- */
  const createGroup = async () => {
    if (!groupName || selectedGroupUsers.length === 0) return;

    const res = await fetchWithAuth('/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: groupName,
        members: selectedGroupUsers
      })
    });

    const data = await res.json();

    setUsers(prev => [...prev, { ...data, isGroup: true }]);
    setIsGroupModalOpen(false);
    setGroupName('');
    setSelectedGroupUsers([]);
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="h-full flex gap-6 overflow-hidden">

      {/* Users / Groups List */}
      <div className="w-80 bg-white rounded-3xl shadow border flex flex-col overflow-hidden">

        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="font-bold">المحادثات</h3>
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-sm"
          >
            مجموعة +
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => setSelectedChat(u)}
              className="w-full p-3 rounded-xl hover:bg-emerald-50 text-right"
            >
              <p className="font-semibold">{u.full_name || u.name}</p>
              {!u.isGroup && (
                <p className="text-xs text-gray-400">
                  {onlineUserIds.includes(u.id) ? 'متصل الآن' : 'غير متصل'}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white rounded-3xl shadow flex flex-col overflow-hidden">

        {selectedChat ? (
          <>
            <div className="p-6 border-b font-bold">
              {selectedChat.full_name || selectedChat.name}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex group ${msg.sender_id === user.id ? 'justify-start gap-2' : 'justify-end'}`}
                >
                  <div className={`max-w-[70%] p-4 rounded-2xl ${
                    msg.sender_id === user.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border'
                  }`}>
                    <p>{msg.content}</p>
                    <p className="text-[10px] mt-1 opacity-60">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  {msg.sender_id === user.id && (
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
                      title="حذف الرسالة"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t flex gap-3">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 px-4 py-3 rounded-xl bg-gray-100"
                placeholder="اكتب رسالة..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={sendMessage}
                className="bg-emerald-600 text-white px-6 rounded-xl"
              >
                إرسال
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            اختر محادثة
          </div>
        )}
      </div>

      {/* Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-96 p-6 rounded-3xl space-y-4">
            <h3 className="font-bold">إنشاء مجموعة</h3>

            <input
              type="text"
              placeholder="اسم المجموعة"
              className="w-full px-4 py-2 border rounded-xl"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <div className="max-h-40 overflow-y-auto space-y-2">
              {users.filter(u => !u.isGroup).map(u => (
                <label key={u.id} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedGroupUsers(prev => [...prev, u.id]);
                      else
                        setSelectedGroupUsers(prev => prev.filter(id => id !== u.id));
                    }}
                  />
                  {u.full_name}
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setIsGroupModalOpen(false)}>إلغاء</button>
              <button
                onClick={createGroup}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl"
              >
                إنشاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute><POSPage /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

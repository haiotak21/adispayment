import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { AppView, Card, UserProfile, Transaction, CardStatus, KycStatus, KycApplication, DepositRequest, WithdrawalRequest, SystemSettings } from './types';
import { apiService } from './services/api';

import Layout from './components/Layout';
import VirtualCard from './components/VirtualCard';
import { 
  Plus, History, User, AlertCircle, Wallet, ChevronLeft, ChevronRight, Banknote, Check, X, Zap, HelpCircle, ShieldQuestion, RefreshCcw, WifiOff, Link2, Settings, PlusCircle, BarChart3, Clock, ShieldCheck, Globe, Phone, Mail, UserCheck, QrCode, Lock, LayoutDashboard, Users, CreditCard, ArrowDownCircle, ArrowUpCircle, Activity, FileText, Save, Trash2, Search, ExternalLink, MoreVertical, LogOut, Sliders, Terminal, ShieldAlert, CheckCircle2, Camera, Scan, UserRound, FileBadge, Menu, RotateCcw, Sparkles, Smartphone, Eye, Info, ArrowUpRight, ArrowDownLeft, Copy, CreditCard as CardIcon, Shield, Briefcase, ListFilter, Trash, TrendingUp, TrendingDown, Layers, HardDrive, DollarSign, CreditCard as CardSvg, CheckCircle, Fingerprint, Image as ImageIcon, Upload
} from 'lucide-react';

const safeStorage = {
  get: (key: string) => { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch (e) {} },
  clear: () => { try { localStorage.clear(); } catch (e) {} }
};

const App: React.FC = () => {
  const { tg, user: tgUser, safeHaptic, safeAlert } = useTelegram();
  const [view, setView] = useState<AppView>('SPLASH');
  const [viewStack, setViewStack] = useState<AppView[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Data States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Admin Data States
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminKyc, setAdminKyc] = useState<KycApplication[]>([]);
  const [adminCards, setAdminCards] = useState<Card[]>([]);
  const [adminDeposits, setAdminDeposits] = useState<DepositRequest[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  // Form States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');

  // KYC Form
  const [kycStep, setKycStep] = useState(1);
  const [kycFullName, setKycFullName] = useState('');
  const [kycEmail, setKycEmail] = useState('');
  const [kycPhone, setKycPhone] = useState('');
  const [kycCountry, setKycCountry] = useState('');
  const [capturedImages, setCapturedImages] = useState<{front?: string, back?: string, selfie?: string}>({});
  const [cameraActive, setCameraActive] = useState<null | 'front' | 'back' | 'selfie'>(null);
  const [processingImage, setProcessingImage] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAdminData = useCallback(async () => {
    const [users, kyc, cards, deposits, withdrawals, settings] = await Promise.all([
      apiService.getAdminUsers(),
      apiService.getAdminKycApplications(),
      apiService.getAllCards(),
      apiService.getAdminDepositRequests(),
      apiService.getAdminWithdrawalRequests(),
      apiService.getSystemSettings()
    ]);
    setAdminUsers(users);
    setAdminKyc(kyc);
    setAdminCards(cards);
    setAdminDeposits(deposits);
    setAdminWithdrawals(withdrawals);
    setSystemSettings(settings);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const isAdminLoggedIn = safeStorage.get('stro_admin_logged_in') === 'true';
      if (isAdminLoggedIn) {
        await loadAdminData();
        setView('ADMIN_DASHBOARD');
        setLoading(false);
        return;
      }

      const isLoggedIn = safeStorage.get('stro_logged_in') === 'true';
      if (!isLoggedIn) {
        setView('SPLASH');
        setLoading(false);
        return;
      }

      const userProfile = await apiService.getProfile();
      const savedKyc = safeStorage.get('kyc_status') as KycStatus;
      if (savedKyc) userProfile.kycStatus = savedKyc;
      setProfile(userProfile);
      
      const userCards = await apiService.getCards();
      setCards(userCards);
      if (userCards.length > 0) {
        const txs = await apiService.getTransactions(userCards[0].id);
        setTransactions(txs);
        setSelectedCard(userCards[0]);
      }
      
      setView('DASHBOARD');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loadAdminData]);

  useEffect(() => { loadData(); }, [loadData]);

  const navigateTo = (newView: AppView) => {
    const isRestricted = ['CREATE_CARD', 'FUND_CARD', 'CARD_DETAILS', 'TRANSACTIONS'].includes(newView);
    const isVerified = profile?.kycStatus === 'APPROVED';

    if (isRestricted && !isVerified) {
      safeHaptic('notification', { type: 'warning' });
      safeAlert("Identity Verification Required to access this feature.");
      setKycStep(1);
      setView('KYC_FORM');
      return;
    }

    setViewStack(prev => [...prev, view]);
    setView(newView);
    window.scrollTo(0, 0);
  };

  const handleBack = useCallback(() => {
    if (cameraActive) { stopCamera(); return; }
    if (viewStack.length > 0) {
      const newStack = [...viewStack];
      const prevView = newStack.pop();
      setViewStack(newStack);
      if (prevView) setView(prevView);
    } else { 
      setView('DASHBOARD'); 
    }
  }, [viewStack, cameraActive]);

  const startCamera = async (mode: 'front' | 'back' | 'selfie') => {
    setCameraActive(mode);
    try {
      const constraints = { video: { facingMode: (mode === 'selfie') ? 'user' : 'environment' } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current?.play().catch(console.error);
      }
    } catch (err) {
      safeAlert("Camera access denied.");
      setCameraActive(null);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      setProcessingImage(true);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setTimeout(() => {
        setCapturedImages(prev => ({ ...prev, [cameraActive]: dataUrl }));
        setProcessingImage(false);
        stopCamera();
        safeHaptic('notification', { type: 'success' });
      }, 1000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: 'front' | 'back' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessingImage(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImages(prev => ({ ...prev, [mode]: dataUrl }));
        setProcessingImage(false);
        safeHaptic('notification', { type: 'success' });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = (mode: 'front' | 'back' | 'selfie') => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-mode', mode);
      fileInputRef.current.click();
    }
  };

  const handleAdminLogin = async () => {
    if (authEmail === 'ethiopian@payment.com' && authPassword === 'Payment2025') {
      setActionLoading('login');
      safeStorage.set('stro_admin_logged_in', 'true');
      await loadAdminData();
      setView('ADMIN_DASHBOARD');
      setActionLoading(null);
      safeHaptic('notification', { type: 'success' });
    } else {
      safeAlert("Invalid Admin Credentials.");
    }
  };

  const handleKycSubmit = async () => {
    setActionLoading('kyc');
    await new Promise(r => setTimeout(r, 2000));
    safeStorage.set('kyc_status', 'PENDING');
    if (profile) setProfile({ ...profile, kycStatus: 'PENDING' });
    setView('KYC_SUBMITTED');
    setActionLoading(null);
  };

  const toggleLinkStatus = () => {
    if (profile) {
      const newStatus = profile.kycStatus === 'APPROVED' ? 'NONE' : 'APPROVED';
      setProfile({ ...profile, kycStatus: newStatus as KycStatus });
      safeStorage.set('kyc_status', newStatus);
    }
  };

  const isVerified = profile?.kycStatus === 'APPROVED';

  // Admin Module Handlers
  const handleAdminUserAction = async (userId: number, action: 'SUSPEND' | 'ACTIVATE') => {
    setActionLoading(userId.toString());
    await apiService.updateUserStatus(userId, action === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE');
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, status: action === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE' } : u));
    setActionLoading(null);
  };

  const handleAdminKycAction = async (appId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(appId);
    await apiService.updateKycStatus(appId, status);
    setAdminKyc(prev => prev.filter(a => a.id !== appId));
    setActionLoading(null);
  };

  const handleAdminCardAction = async (cardId: string, action: CardStatus) => {
    setActionLoading(cardId);
    await apiService.updateCardStatus(cardId, action);
    setAdminCards(prev => prev.map(c => c.id === cardId ? { ...c, status: action } : c));
    setActionLoading(null);
  };

  // --- ADMIN UI COMPONENTS ---

  const AdminSidebar = () => (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-50 px-2 sm:relative sm:h-screen sm:w-20 sm:flex-col sm:border-r sm:border-t-0">
      <button onClick={() => setView('ADMIN_DASHBOARD')} className={`p-3 rounded-xl transition-all ${view === 'ADMIN_DASHBOARD' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>
        <LayoutDashboard size={20} />
      </button>
      <button onClick={() => setView('ADMIN_USERS')} className={`p-3 rounded-xl transition-all ${view === 'ADMIN_USERS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>
        <Users size={20} />
      </button>
      <button onClick={() => setView('ADMIN_KYC')} className={`p-3 rounded-xl transition-all ${view === 'ADMIN_KYC' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>
        <ShieldCheck size={20} />
      </button>
      <button onClick={() => setView('ADMIN_FINANCIALS')} className={`p-3 rounded-xl transition-all ${view === 'ADMIN_FINANCIALS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>
        <Banknote size={20} />
      </button>
      <button onClick={() => setView('ADMIN_SETTINGS')} className={`p-3 rounded-xl transition-all ${view === 'ADMIN_SETTINGS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>
        <Sliders size={20} />
      </button>
    </div>
  );

  const AdminHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <header className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-white">{title}</h2>
        {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        <button onClick={() => loadAdminData()} className="p-3 bg-slate-900 text-slate-400 rounded-2xl border border-slate-800 hover:text-white transition-colors">
          <RefreshCcw size={18} className={actionLoading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => { safeStorage.clear(); setView('SPLASH'); }} className="p-3 bg-slate-900 text-red-400 rounded-2xl border border-slate-800 hover:bg-red-500/10 transition-colors">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );

  const MetricCard = ({ label, value, icon, color, trend }: { label: string, value: string | number, icon: React.ReactNode, color: string, trend?: { type: 'up' | 'down', value: string } }) => (
    <div className="p-6 bg-slate-900 rounded-[32px] border border-slate-800 space-y-4 hover:border-slate-700 transition-colors group">
      <div className="flex justify-between items-start">
        <div className={`p-4 bg-slate-950 rounded-2xl ${color} shadow-inner group-hover:scale-110 transition-transform`}>{icon}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${trend.type === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {trend.type === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend.value}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-white mt-1">{value}</p>
      </div>
    </div>
  );

  // --- RENDERING VIEWS ---

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <RefreshCcw className="animate-spin text-indigo-600 mb-4" size={48} />
      <p className="font-black text-[10px] text-indigo-600 uppercase tracking-widest">Encrypting Session...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Hidden File Input for Gallery Uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => {
          const mode = fileInputRef.current?.getAttribute('data-mode') as 'front' | 'back' | 'selfie';
          if (mode) handleFileUpload(e, mode);
        }}
      />

      <div className="view-transition">
        {view === 'SPLASH' && (
          <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900 text-white flex flex-col p-10 justify-between text-center">
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="p-6 bg-white/10 backdrop-blur-2xl rounded-[40px] shadow-2xl rotate-6 animate-pulse"><Wallet size={64} /></div>
              <h1 className="text-5xl font-black tracking-tighter">StroWallet</h1>
              <p className="opacity-60 font-medium">Global Virtual Payment Infrastructure</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => setView('LOGIN')} className="w-full py-5 bg-white text-indigo-700 rounded-3xl font-black shadow-xl active:scale-95 transition-all">Sign In</button>
              <button onClick={() => setView('SIGNUP')} className="w-full py-5 bg-indigo-500/30 border border-indigo-400/50 text-white rounded-3xl font-black active:scale-95 transition-all">Register Node</button>
              <button onClick={() => setView('ADMIN_LOGIN')} className="w-full py-4 text-white/40 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                <Shield size={14} /> Admin Gateway
              </button>
            </div>
          </div>
        )}

        {view === 'LOGIN' && (
          <Layout title="Sign In" currentView={view} onBack={() => setView('SPLASH')}>
            <div className="pt-10 space-y-6 animate-view-entry">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-5 top-5 text-gray-400" size={18} />
                  <input type="email" placeholder="Email Address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-5 text-gray-400" size={18} />
                  <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold" />
                </div>
              </div>
              <button onClick={() => { safeStorage.set('stro_logged_in', 'true'); loadData(); }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all">Authenticate</button>
            </div>
          </Layout>
        )}

        {view === 'SIGNUP' && (
          <Layout title="Register Node" currentView={view} onBack={() => setView('SPLASH')}>
            <div className="pt-10 space-y-6 animate-view-entry">
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-5 top-5 text-gray-400" size={18} />
                  <input type="text" placeholder="Legal Full Name" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-5 top-5 text-gray-400" size={18} />
                  <input type="email" placeholder="Email Address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-5 text-gray-400" size={18} />
                  <input type="password" placeholder="Choose Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold" />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-medium text-center px-4">By registering, you agree to our terms of global infrastructure usage.</p>
              <button onClick={() => { safeStorage.set('stro_logged_in', 'true'); loadData(); }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all">Create Account</button>
            </div>
          </Layout>
        )}

        {view === 'ADMIN_LOGIN' && (
          <Layout title="Admin Auth" currentView={view} onBack={() => setView('SPLASH')}>
            <div className="pt-10 space-y-6 animate-view-entry">
              <div className="p-6 bg-slate-900 rounded-3xl border border-slate-700 text-slate-400 text-xs font-bold leading-relaxed shadow-2xl">
                <Terminal size={24} className="text-emerald-400 mb-3" />
                Terminal identification required for root access. Credentials are encrypted at rest with AES-256.
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-5 top-5 text-slate-400" size={18} />
                  <input type="email" placeholder="Admin Terminal Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold transition-all" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-5 text-slate-400" size={18} />
                  <input type="password" placeholder="Root Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold transition-all" />
                </div>
              </div>
              <button onClick={handleAdminLogin} disabled={!!actionLoading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                {actionLoading === 'login' ? <RefreshCcw className="animate-spin" size={20} /> : <Zap size={20} className="text-amber-400" />}
                Access Master Node
              </button>
            </div>
          </Layout>
        )}

        {/* --- ADMIN DASHBOARD --- */}
        {view === 'ADMIN_DASHBOARD' && (
          <div className="min-h-screen bg-slate-950 text-white flex sm:flex-row flex-col">
            <AdminSidebar />
            <div className="flex-1 p-6 pb-24 sm:pb-6 overflow-y-auto animate-view-entry max-w-5xl mx-auto w-full">
              <AdminHeader title="Command Center" subtitle="Master Infrastructure Health: Stable" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricCard label="Global Users" value={adminUsers.length} icon={<Users size={24} />} color="text-indigo-400" trend={{ type: 'up', value: '12%' }} />
                <MetricCard label="KYC Backlog" value={adminKyc.length} icon={<ShieldAlert size={24} />} color="text-amber-400" trend={{ type: 'down', value: '4%' }} />
                <MetricCard label="Active Cards" value={adminCards.length} icon={<CreditCard size={24} />} color="text-emerald-400" trend={{ type: 'up', value: '28%' }} />
                <MetricCard label="System Total" value="$1.2M" icon={<Briefcase size={24} />} color="text-blue-400" />
              </div>
            </div>
          </div>
        )}

        {/* --- USER DASHBOARD --- */}
        {view === 'DASHBOARD' && (
          <div className="p-6 space-y-6 animate-view-entry max-w-md mx-auto">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg uppercase">{profile?.firstName?.charAt(0)}</div>
                <div>
                  <h1 className="text-xl font-black">Hi, {profile?.firstName}</h1>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status: {isVerified ? 'VERIFIED ✅' : 'PENDING 🔒'}</p>
                </div>
              </div>
              <button onClick={() => setView('SETTINGS')} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-indigo-600 active:scale-90 transition-all"><Settings size={20} /></button>
            </header>
            
            {!isVerified && (
              <div className="p-5 bg-amber-50 border border-amber-100 rounded-[32px] flex items-start gap-4 animate-view-entry">
                <ShieldAlert className="text-amber-500 mt-1" />
                <div className="flex-1">
                  <h4 className="font-black text-sm text-amber-900 leading-none mb-1">Identity Verification</h4>
                  <p className="text-xs text-amber-700 font-medium mb-3">Please verify your ID to unlock card features.</p>
                  <button onClick={() => { setKycStep(1); setView('KYC_FORM'); }} className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg">Verify ID</button>
                </div>
              </div>
            )}

            <div className={`space-y-4 ${!isVerified ? 'grayscale opacity-40 blur-[1px]' : ''}`}>
              <VirtualCard card={cards[0] || {id:'mock', balance:0, currency:'USD', status:CardStatus.PENDING, lastFour:'0000', expiry:'00/00', email:'', cvv:''}} onClick={() => isVerified && navigateTo('CARD_DETAILS')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'CREATE_CARD', icon: <PlusCircle size={24} />, label: 'Create Card', color: 'text-indigo-600' },
                { id: 'FUND_CARD', icon: <Banknote size={24} />, label: 'Fund Card', color: 'text-emerald-600' },
                { id: 'CARD_DETAILS', icon: <Info size={24} />, label: 'Details', color: 'text-purple-600' },
                { id: 'TRANSACTIONS', icon: <History size={24} />, label: 'History', color: 'text-slate-600' }
              ].map(btn => (
                <button 
                  key={btn.id}
                  onClick={() => navigateTo(btn.id as AppView)}
                  className={`relative py-6 rounded-[32px] border font-black uppercase text-[10px] flex flex-col items-center gap-2 transition-all ${!isVerified ? 'bg-gray-50 text-gray-300' : 'bg-white shadow-sm active:scale-95'}`}
                >
                  {!isVerified && <Lock size={12} className="absolute top-4 right-4" />}
                  <div className={isVerified ? btn.color : ''}>{btn.icon}</div>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- KYC VIEWS --- */}
        {view === 'KYC_FORM' && (
          <Layout title="ID Verification" currentView={view} onBack={handleBack}>
            <div className="space-y-8 animate-view-entry">
              <div className="flex justify-center gap-4">
                {[1,2,3,4].map(s => <div key={s} className={`w-3 h-3 rounded-full ${kycStep === s ? 'bg-indigo-600' : 'bg-gray-200'}`} />)}
              </div>
              
              {/* Step 1: Legal Details */}
              {kycStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-sm font-black text-gray-900 ml-1">Personal Identity Details</p>
                    <input type="text" placeholder="Full Legal Name" value={kycFullName} onChange={e => setKycFullName(e.target.value)} className="w-full p-5 rounded-2xl bg-gray-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" />
                    <input type="email" placeholder="Email for verification" value={kycEmail} onChange={e => setKycEmail(e.target.value)} className="w-full p-5 rounded-2xl bg-gray-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100" />
                  </div>
                  <button onClick={() => setKycStep(2)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all">Next: ID Front</button>
                </div>
              )}

              {/* Step 2: ID Front */}
              {kycStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-sm font-black text-gray-900 ml-1">Scan Government ID Front</p>
                    <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-3 overflow-hidden relative">
                      {capturedImages.front ? (
                        <img src={capturedImages.front} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-6">
                          <ImageIcon className="text-gray-300 mx-auto mb-2" size={48} />
                          <span className="text-xs font-bold text-gray-400 block uppercase">No Image Captured</span>
                        </div>
                      )}
                      {processingImage && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                          <RefreshCcw className="animate-spin text-indigo-600" size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => startCamera('front')} className="py-4 bg-white border-2 border-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                      <Camera size={16} /> Use Camera
                    </button>
                    <button onClick={() => triggerFileUpload('front')} className="py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">
                      <Upload size={16} /> From Library
                    </button>
                  </div>
                  <button onClick={() => setKycStep(3)} disabled={!capturedImages.front} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all disabled:opacity-50">Continue to ID Back</button>
                </div>
              )}

              {/* Step 3: ID Back */}
              {kycStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-sm font-black text-gray-900 ml-1">Scan Government ID Back</p>
                    <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-3 overflow-hidden relative">
                      {capturedImages.back ? (
                        <img src={capturedImages.back} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-6">
                          <ImageIcon className="text-gray-300 mx-auto mb-2" size={48} />
                          <span className="text-xs font-bold text-gray-400 block uppercase">No Image Captured</span>
                        </div>
                      )}
                      {processingImage && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                          <RefreshCcw className="animate-spin text-indigo-600" size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => startCamera('back')} className="py-4 bg-white border-2 border-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                      <Camera size={16} /> Use Camera
                    </button>
                    <button onClick={() => triggerFileUpload('back')} className="py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">
                      <Upload size={16} /> From Library
                    </button>
                  </div>
                  <button onClick={() => setKycStep(4)} disabled={!capturedImages.back} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all disabled:opacity-50">Continue to Selfie</button>
                </div>
              )}

              {/* Step 4: Selfie */}
              {kycStep === 4 && (
                <div className="space-y-8 text-center">
                  <div className="space-y-4">
                    <p className="text-sm font-black text-gray-900">Biometric Live Scan</p>
                    <div className="w-48 h-48 rounded-full bg-indigo-50 border-2 border-dashed border-indigo-200 mx-auto flex items-center justify-center overflow-hidden relative group">
                      {capturedImages.selfie ? (
                        <img src={capturedImages.selfie} className="w-full h-full object-cover" />
                      ) : (
                        <UserRound size={64} className="text-indigo-200" />
                      )}
                      {processingImage && (
                        <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-sm flex items-center justify-center">
                          <RefreshCcw className="animate-spin text-indigo-600" size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => startCamera('selfie')} className="py-4 bg-white border-2 border-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                      <Camera size={16} /> Live Scan
                    </button>
                    <button onClick={() => triggerFileUpload('selfie')} className="py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 transition-all">
                      <Upload size={16} /> Upload Photo
                    </button>
                  </div>
                  
                  <button onClick={handleKycSubmit} disabled={!capturedImages.selfie || !!actionLoading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all disabled:opacity-50">
                    {actionLoading ? <RefreshCcw className="animate-spin mx-auto"/> : 'Finalize Identity Vault'}
                  </button>
                </div>
              )}
            </div>
          </Layout>
        )}

        {view === 'KYC_SUBMITTED' && (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center space-y-6">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[32px] flex items-center justify-center shadow-xl animate-check"><ShieldCheck size={48} /></div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900">Encrypted Submit</h2>
            <p className="text-sm text-gray-400 font-medium">Processing identity node. This usually takes 3-5 minutes. We'll notify you.</p>
            <button onClick={() => setView('DASHBOARD')} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all">Back to Dashboard</button>
          </div>
        )}

        {/* --- OTHER VIEWS --- */}
        {view === 'CREATE_CARD' && (
          <Layout title="New Virtual Card" currentView={view} onBack={() => setView('DASHBOARD')}>
            <div className="space-y-8 animate-view-entry">
               <div className="aspect-[1.6/1] bg-slate-900 rounded-[32px] p-8 text-white flex flex-col justify-between border-2 border-indigo-500/20">
                  <div className="flex justify-between items-center">
                    <Zap className="text-amber-400" size={32} />
                    <span className="text-[10px] font-black uppercase bg-white/10 px-3 py-1 rounded-full">Pro Edition</span>
                  </div>
                  <div>
                    <p className="text-2xl font-black tracking-tighter">Issue Mastercard</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Instant Activation Enabled</p>
                  </div>
               </div>
               <div className="p-6 bg-indigo-50 rounded-[32px] space-y-4">
                  <div className="flex justify-between text-sm font-bold"><span>Setup Fee</span><span className="text-indigo-600">$5.00</span></div>
                  <div className="flex justify-between text-sm font-bold"><span>Maintenance</span><span className="text-indigo-600">$0.00 / mo</span></div>
                  <hr className="border-indigo-100"/>
                  <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all">Proceed to Issue</button>
               </div>
            </div>
          </Layout>
        )}

        {view === 'FUND_CARD' && (
          <Layout title="Add Funds" currentView={view} onBack={() => setView('DASHBOARD')}>
            <div className="space-y-8 animate-view-entry">
               <div className="p-8 bg-gray-50 rounded-[40px] text-center space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Balance</p>
                  <p className="text-4xl font-black text-gray-900">${profile?.id ? '150.50' : '0.00'}</p>
               </div>
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Select Amount</p>
                  <div className="grid grid-cols-3 gap-3">
                     {['10', '50', '100'].map(amt => (
                       <button key={amt} className="py-4 bg-white border border-gray-100 rounded-2xl font-black text-sm hover:border-indigo-600 transition-colors">${amt}</button>
                     ))}
                  </div>
                  <div className="relative pt-2">
                    <DollarSign className="absolute left-5 top-7 text-gray-400" size={20} />
                    <input type="number" placeholder="Other amount" className="w-full pl-12 p-5 bg-gray-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-100" />
                  </div>
               </div>
               <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                 <ArrowDownCircle size={20} /> Fund Card
               </button>
            </div>
          </Layout>
        )}

        {view === 'TRANSACTIONS' && (
          <Layout title="Activities" currentView={view} onBack={() => setView('DASHBOARD')}>
            <div className="space-y-4 animate-view-entry">
               {transactions.map(tx => (
                 <div key={tx.id} className="p-5 bg-white border border-gray-50 rounded-[32px] flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-2xl ${tx.type === 'DEBIT' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          {tx.type === 'DEBIT' ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}
                       </div>
                       <div>
                          <p className="text-sm font-black">{tx.description}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{tx.date.split('T')[0]}</p>
                       </div>
                    </div>
                    <p className={`font-black ${tx.type === 'DEBIT' ? 'text-gray-900' : 'text-emerald-500'}`}>
                       {tx.type === 'DEBIT' ? '-' : '+'}${tx.amount.toFixed(2)}
                    </p>
                 </div>
               ))}
            </div>
          </Layout>
        )}

        {view === 'CARD_DETAILS' && (
          <Layout title="Card Ledger" currentView={view} onBack={() => setView('DASHBOARD')}>
             <div className="space-y-8 animate-view-entry">
                {selectedCard && <VirtualCard card={selectedCard} />}
                <div className="p-8 bg-gray-50 rounded-[40px] space-y-6">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Technical data</p>
                   <div className="space-y-4 font-mono text-sm">
                      <div className="flex justify-between border-b border-gray-100 pb-2"><span>CARD ID</span><span className="font-bold">{selectedCard?.id}</span></div>
                      <div className="flex justify-between border-b border-gray-100 pb-2"><span>CVV</span><span className="font-bold">{selectedCard?.cvv}</span></div>
                      <div className="flex justify-between border-b border-gray-100 pb-2"><span>CURRENCY</span><span className="font-bold">{selectedCard?.currency}</span></div>
                      <div className="flex justify-between border-b border-gray-100 pb-2"><span>STATUS</span><span className="font-bold text-indigo-600">{selectedCard?.status}</span></div>
                   </div>
                </div>
                <button className="w-full py-5 border-2 border-red-100 text-red-500 rounded-2xl font-black active:bg-red-50">Block Card</button>
             </div>
          </Layout>
        )}

        {view === 'SETTINGS' && (
          <Layout title="Account Node" currentView={view} onBack={() => setView('DASHBOARD')}>
            <div className="space-y-6 animate-view-entry">
              <div className="p-8 bg-gray-50 rounded-[40px] text-center space-y-4 border border-gray-100">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-2xl font-black mx-auto shadow-xl">
                  {profile?.firstName?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">@{profile?.username || 'user_9921'}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Node ID: {profile?.id || '12345'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <button onClick={toggleLinkStatus} className="w-full p-6 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Fingerprint size={20} /></div>
                    <div className="text-left">
                      <p className="text-sm font-black text-gray-900">Verification</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{isVerified ? 'APPROVED' : 'NONE'}</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isVerified ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isVerified ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </button>
                <button onClick={() => { safeStorage.clear(); setView('SPLASH'); }} className="w-full p-6 bg-red-50 text-red-600 rounded-[32px] flex items-center gap-4 font-black text-sm active:scale-[0.98] transition-all">
                  <LogOut size={20} /> Terminate Node Session
                </button>
              </div>
            </div>
          </Layout>
        )}
      </div>

      {/* --- CAMERA OVERLAY (Persistent) --- */}
      {cameraActive && (
        <div className="fixed inset-0 bg-black z-[3000] flex flex-col animate-fade-in">
          <div className="p-6 flex justify-between items-center text-white z-10">
            <button onClick={stopCamera} className="p-2 bg-white/10 rounded-full active:scale-90"><X size={24} /></button>
            <span className="font-black uppercase tracking-widest text-[10px]">{cameraActive} Scan Active</span>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover absolute" />
            <div className={`relative border-2 border-indigo-500 shadow-[0_0_0_2000px_rgba(0,0,0,0.8)] ${cameraActive === 'selfie' ? 'w-64 h-64 rounded-full' : 'w-80 h-48 rounded-2xl'}`}>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl animate-pulse"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl animate-pulse"></div>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_3s_linear_infinite]"></div>
            </div>
          </div>
          <div className="p-10 flex flex-col items-center bg-black gap-6">
             <button onClick={capturePhoto} disabled={processingImage} className="w-20 h-20 bg-white rounded-full flex items-center justify-center active:scale-90 transition-all border-[6px] border-white/20">
               <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                 {processingImage ? <RefreshCcw className="animate-spin" size={24} /> : <Camera size={24} />}
               </div>
             </button>
             <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Hold steady for biometric identification</p>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default App;

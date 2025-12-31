import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTelegram } from "./hooks/useTelegram";
import {
  AppView,
  Card,
  UserProfile,
  Transaction,
  CardStatus,
  KycStatus,
  KycApplication,
  DepositRequest,
  WithdrawalRequest,
  SystemSettings,
  CardRequest,
} from "./types";
import { apiService } from "./services/api";

import Layout from "./components/Layout";
import VirtualCard from "./components/VirtualCard";
import Modal from "./components/Modal";
import {
  Plus,
  History,
  User,
  AlertCircle,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Check,
  X,
  Zap,
  HelpCircle,
  ShieldQuestion,
  RefreshCcw,
  WifiOff,
  Link2,
  Settings,
  PlusCircle,
  BarChart3,
  Clock,
  ShieldCheck,
  Globe,
  Phone,
  Mail,
  UserCheck,
  QrCode,
  Lock,
  LayoutDashboard,
  Users,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
  FileText,
  Save,
  Trash2,
  Search,
  ExternalLink,
  MoreVertical,
  LogOut,
  Sliders,
  Terminal,
  ShieldAlert,
  CheckCircle2,
  Camera,
  Scan,
  UserRound,
  FileBadge,
  Menu,
  RotateCcw,
  Sparkles,
  Smartphone,
  Eye,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  CreditCard as CardIcon,
  Shield,
  Briefcase,
  ListFilter,
  Trash,
  TrendingUp,
  TrendingDown,
  Layers,
  HardDrive,
  DollarSign,
  CheckCircle,
  Fingerprint,
  Image as ImageIcon,
  Upload,
  Snowflake,
  Flame,
  Send,
  Image,
  Ban,
  CheckSquare,
  XSquare,
  BadgeCheck,
  FileSearch,
  LayoutTemplate,
} from "lucide-react";

const safeStorage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch (e) {}
  },
};

const App: React.FC = () => {
  const { tg, user: tgUser, safeHaptic, safeAlert } = useTelegram();
  const [view, setView] = useState<AppView>("SPLASH");
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
  const [adminCardRequests, setAdminCardRequests] = useState<CardRequest[]>([]);
  const [adminCards, setAdminCards] = useState<Card[]>([]);
  const [adminDeposits, setAdminDeposits] = useState<DepositRequest[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<WithdrawalRequest[]>(
    []
  );
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(
    null
  );
  const [selectedAdminUser, setSelectedAdminUser] =
    useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "ACTIVE" | "SUSPENDED"
  >("ALL");
  const [isReviewingKyc, setIsReviewingKyc] = useState(false);

  // Form States
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payRecipient, setPayRecipient] = useState("");

  // KYC Form
  const [kycStep, setKycStep] = useState(1);
  const [kycFullName, setKycFullName] = useState("");
  const [kycEmail, setKycEmail] = useState("");
  const [capturedImages, setCapturedImages] = useState<{
    front?: string;
    back?: string;
    selfie?: string;
  }>({});
  const [cameraActive, setCameraActive] = useState<
    null | "front" | "back" | "selfie" | "qr"
  >(null);
  const [processingImage, setProcessingImage] = useState(false);

  // Modals
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAdminData = useCallback(async () => {
    setActionLoading("admin_sync");
    const [users, kyc, cardReqs, cards, deposits, withdrawals, settings] =
      await Promise.all([
        apiService.getAdminUsers(),
        apiService.getAdminKycApplications(),
        apiService.getAdminCardRequests(),
        apiService.getAllCards(),
        apiService.getAdminDepositRequests(),
        apiService.getAdminWithdrawalRequests(),
        apiService.getSystemSettings(),
      ]);
    setAdminUsers(users);
    setAdminKyc(kyc);
    setAdminCardRequests(cardReqs);
    setAdminCards(cards);
    setAdminDeposits(deposits);
    setAdminWithdrawals(withdrawals);
    setSystemSettings(settings);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const isAdminLoggedIn =
        safeStorage.get("addispay_admin_logged_in") === "true";
      if (isAdminLoggedIn) {
        await loadAdminData();
        setView("ADMIN_DASHBOARD");
        setLoading(false);
        return;
      }

      const isLoggedIn = safeStorage.get("addispay_logged_in") === "true";
      if (!isLoggedIn) {
        setView("SPLASH");
        setLoading(false);
        return;
      }

      const userProfile = await apiService.getProfile();
      const savedKyc = safeStorage.get("kyc_status") as KycStatus;
      if (savedKyc) userProfile.kycStatus = savedKyc;
      setProfile(userProfile);

      const userCards = await apiService.getCards();
      setCards(userCards);
      if (userCards.length > 0) {
        const txs = await apiService.getTransactions(userCards[0].id);
        setTransactions(txs);
        setSelectedCard(userCards[0]);
      }

      setView("DASHBOARD");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loadAdminData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateTo = (newView: AppView) => {
    const isRestricted = [
      "CREATE_CARD",
      "FUND_CARD",
      "CARD_DETAILS",
      "TRANSACTIONS",
      "PAY",
    ].includes(newView);
    const isVerified = profile?.kycStatus === "APPROVED";

    if (isRestricted && !isVerified) {
      safeHaptic("notification", { type: "warning" });
      safeAlert("Identity Verification Required to access this feature.");
      setKycStep(1);
      setView("KYC_FORM");
      return;
    }

    setViewStack((prev) => [...prev, view]);
    setView(newView);
    window.scrollTo(0, 0);
  };

  const handleBack = useCallback(() => {
    tg?.MainButton.hide();
    if (cameraActive) {
      stopCamera();
      return;
    }
    if (viewStack.length > 0) {
      const newStack = [...viewStack];
      const prevView = newStack.pop();
      setViewStack(newStack);
      if (prevView) setView(prevView);
    } else {
      setView("DASHBOARD");
    }
  }, [viewStack, cameraActive, tg]);

  const handleFreezeToggle = async () => {
    if (!selectedCard) return;
    const newStatus =
      selectedCard.status === CardStatus.ACTIVE
        ? CardStatus.FROZEN
        : CardStatus.ACTIVE;
    setActionLoading("card_status");
    await new Promise((r) => setTimeout(r, 800));
    const updatedCard = { ...selectedCard, status: newStatus };
    setSelectedCard(updatedCard);
    setCards((prev) =>
      prev.map((c) => (c.id === selectedCard.id ? updatedCard : c))
    );
    setActionLoading(null);
    setIsFreezeModalOpen(false);
    safeHaptic("notification", { type: "success" });
  };

  const handleIssueCard = async () => {
    setActionLoading("issue");
    await new Promise((r) => setTimeout(r, 2000));
    // Simulate card request creation instead of instant issuance
    const requestPayload = {
      id: `creq_${Date.now()}`,
      userId: profile?.id || 0,
      userName: `${profile?.firstName || "User"} ${
        profile?.lastName || profile?.username || ""
      }`.trim(),
      email: profile?.email || "user@example.com",
      date: new Date().toISOString(),
      status: "PENDING" as const,
    };
    setAdminCardRequests((prev) => [requestPayload, ...prev]);
    setView("DASHBOARD");
    setActionLoading(null);
    safeAlert("Card Request Submitted! Admin will review your node shortly.");
    safeHaptic("notification", { type: "success" });
  };

  const handleFundCard = async () => {
    if (!fundAmount) {
      safeAlert("Please enter or select an amount.");
      return;
    }
    setActionLoading("fund");
    await new Promise((r) => setTimeout(r, 1500));
    if (selectedCard) {
      const updatedCard = {
        ...selectedCard,
        balance: selectedCard.balance + parseFloat(fundAmount),
      };
      setSelectedCard(updatedCard);
      setCards((prev) =>
        prev.map((c) => (c.id === selectedCard.id ? updatedCard : c))
      );

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        amount: parseFloat(fundAmount),
        type: "CREDIT",
        status: "COMPLETED",
        description: "Manual Node Funding",
        date: new Date().toISOString(),
      };
      setTransactions([newTx, ...transactions]);
    }
    setFundAmount("");
    setView("DASHBOARD");
    setActionLoading(null);
    safeAlert("Card Funded Successfully!");
    safeHaptic("notification", { type: "success" });
  };

  const handlePay = async () => {
    if (!payAmount || !payRecipient) {
      safeAlert("Please enter recipient and amount.");
      return;
    }
    if (selectedCard && selectedCard.balance < parseFloat(payAmount)) {
      safeAlert("Insufficient node balance.");
      return;
    }
    setActionLoading("pay");
    await new Promise((r) => setTimeout(r, 1500));
    if (selectedCard) {
      const updatedCard = {
        ...selectedCard,
        balance: selectedCard.balance - parseFloat(payAmount),
      };
      setSelectedCard(updatedCard);
      setCards((prev) =>
        prev.map((c) => (c.id === selectedCard.id ? updatedCard : c))
      );

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        amount: parseFloat(payAmount),
        type: "DEBIT",
        status: "COMPLETED",
        description: `Payment to ${payRecipient}`,
        date: new Date().toISOString(),
      };
      setTransactions([newTx, ...transactions]);
    }
    setPayAmount("");
    setPayRecipient("");
    tg?.MainButton.hide();
    setView("PAY_SUCCESS");
    setActionLoading(null);
    safeHaptic("notification", { type: "success" });
  };

  const handleAdminUpdateUserStatus = async (
    userId: number,
    status: "ACTIVE" | "SUSPENDED"
  ) => {
    setActionLoading("update_user");
    await apiService.updateUserStatus(userId, status);
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status } : u))
    );
    if (selectedAdminUser && selectedAdminUser.id === userId) {
      setSelectedAdminUser({ ...selectedAdminUser, status });
    }
    setActionLoading(null);
    safeHaptic("notification", { type: "success" });
  };

  const handleAdminUpdateKycStatus = async (
    userId: number,
    status: KycStatus
  ) => {
    setActionLoading("update_kyc");
    const kycApp = adminKyc.find((k) => k.userId === userId);
    if (kycApp) {
      await apiService.updateKycStatus(kycApp.id, status as any);
      setAdminKyc((prev) =>
        prev.map((k) => (k.id === kycApp.id ? { ...k, status } : k))
      );
    }
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, kycStatus: status } : u))
    );
    if (selectedAdminUser && selectedAdminUser.id === userId) {
      setSelectedAdminUser({ ...selectedAdminUser, kycStatus: status });
    }
    setActionLoading(null);
    setIsReviewingKyc(false);
    safeHaptic("notification", { type: "success" });
  };

  const handleAdminProcessFinance = async (
    id: string,
    type: "DEPOSIT" | "WITHDRAWAL",
    status: "APPROVED" | "REJECTED"
  ) => {
    setActionLoading("process_finance");
    if (type === "DEPOSIT") {
      await apiService.updateDepositStatus(id, status);
      setAdminDeposits((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d))
      );
    } else {
      await apiService.updateWithdrawalStatus(id, status);
      setAdminWithdrawals((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status } : w))
      );
    }
    setActionLoading(null);
    safeHaptic("notification", { type: "success" });
  };

  const handleAdminProcessCardRequest = async (
    requestId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    setActionLoading("process_card_req");
    await apiService.updateCardRequestStatus(requestId, status);
    setAdminCardRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );
    setActionLoading(null);
    safeHaptic("notification", { type: "success" });
  };

  const handleUpdateSettings = async (newSettings: Partial<SystemSettings>) => {
    if (!systemSettings) return;
    const updated = { ...systemSettings, ...newSettings };
    setSystemSettings(updated);
    await apiService.updateSettings(updated);
    safeHaptic("impact", { style: "light" });
  };

  const startCamera = async (mode: "front" | "back" | "selfie" | "qr") => {
    setCameraActive(mode);
    try {
      const constraints = {
        video: { facingMode: mode === "selfie" ? "user" : "environment" },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () =>
          videoRef.current?.play().catch(console.error);
      }
    } catch (err) {
      safeAlert("Camera access denied.");
      setCameraActive(null);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      if (cameraActive === "qr") {
        // Mocking QR Scan Result
        setPayRecipient("qr_node_8812");
        safeHaptic("impact", { style: "heavy" });
        stopCamera();
        return;
      }
      setProcessingImage(true);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setTimeout(() => {
        setCapturedImages((prev) => ({ ...prev, [cameraActive]: dataUrl }));
        setProcessingImage(false);
        stopCamera();
        safeHaptic("notification", { type: "success" });
      }, 1000);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "front" | "back" | "selfie" | "qr"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessingImage(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (mode !== "qr") {
          setCapturedImages((prev) => ({ ...prev, [mode]: dataUrl }));
        }
        setProcessingImage(false);
        safeHaptic("notification", { type: "success" });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = (mode: "front" | "back" | "selfie" | "qr") => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("data-mode", mode);
      fileInputRef.current.click();
    }
  };

  const handleUserLogin = async () => {
    setActionLoading("login");
    if (authEmail === "verified@pay.bot" && authPassword === "paymentbot") {
      safeStorage.set("addispay_logged_in", "true");
      safeStorage.set("kyc_status", "APPROVED");
      await loadData();
      safeHaptic("notification", { type: "success" });
    } else {
      safeStorage.set("addispay_logged_in", "true");
      await loadData();
      safeHaptic("notification", { type: "success" });
    }
    setActionLoading(null);
  };

  const handleAdminLogin = async () => {
    if (
      authEmail === "ethiopian@payment.com" &&
      authPassword === "Payment2025"
    ) {
      setActionLoading("login");
      safeStorage.set("addispay_admin_logged_in", "true");
      await loadAdminData();
      setView("ADMIN_DASHBOARD");
      setActionLoading(null);
      safeHaptic("notification", { type: "success" });
    } else {
      safeAlert("Invalid Admin Credentials.");
    }
  };

  const handleKycSubmit = async () => {
    setActionLoading("kyc");
    await new Promise((r) => setTimeout(r, 2000));
    safeStorage.set("kyc_status", "PENDING");
    if (profile) setProfile({ ...profile, kycStatus: "PENDING" });
    setView("KYC_SUBMITTED");
    setActionLoading(null);
  };

  const toggleLinkStatus = () => {
    if (profile) {
      const newStatus = profile.kycStatus === "APPROVED" ? "NONE" : "APPROVED";
      setProfile({ ...profile, kycStatus: newStatus as KycStatus });
      safeStorage.set("kyc_status", newStatus);
    }
  };

  const isVerified = profile?.kycStatus === "APPROVED";

  // Admin metrics derived from live mock data
  const pendingKyc = adminKyc.filter((k) => k.status === "PENDING");
  const approvedKyc = adminKyc.filter((k) => k.status === "APPROVED");
  const activeCardsCount = adminCards.filter(
    (c) => c.status === CardStatus.ACTIVE
  ).length;
  const frozenCardsCount = adminCards.filter(
    (c) => c.status === CardStatus.FROZEN
  ).length;
  const pendingDeposits = adminDeposits.filter((d) => d.status === "PENDING");
  const pendingWithdrawals = adminWithdrawals.filter(
    (w) => w.status === "PENDING"
  );
  const pendingDepositAmount = pendingDeposits.reduce(
    (sum, d) => sum + d.amount,
    0
  );
  const pendingWithdrawalAmount = pendingWithdrawals.reduce(
    (sum, d) => sum + d.amount,
    0
  );
  const totalCardFloat = adminCards.reduce(
    (sum, card) => sum + card.balance,
    0
  );
  const pendingCardRequests = adminCardRequests.filter(
    (r) => r.status === "PENDING"
  );

  // --- ADMIN UI ---
  const AdminSidebar = () => (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-50 px-2 sm:sticky sm:top-0 sm:left-0 sm:h-screen sm:w-20 sm:flex-col sm:border-r sm:border-t-0 flex-shrink-0">
      <button
        onClick={() => setView("ADMIN_DASHBOARD")}
        className={`p-3 rounded-xl transition-all ${
          view === "ADMIN_DASHBOARD"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            : "text-slate-500 hover:text-white"
        }`}
      >
        <LayoutDashboard size={20} />
      </button>
      <button
        onClick={() => setView("ADMIN_USERS")}
        className={`p-3 rounded-xl transition-all ${
          ["ADMIN_USERS", "ADMIN_USER_DETAIL"].includes(view)
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            : "text-slate-500 hover:text-white"
        }`}
      >
        <Users size={20} />
      </button>
      <button
        onClick={() => setView("ADMIN_KYC")}
        className={`p-3 rounded-xl transition-all ${
          view === "ADMIN_KYC"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            : "text-slate-500 hover:text-white"
        }`}
      >
        <ShieldCheck size={20} />
      </button>
      <button
        onClick={() => setView("ADMIN_CARDS")}
        className={`p-3 rounded-xl transition-all ${
          view === "ADMIN_CARDS"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            : "text-slate-500 hover:text-white"
        }`}
      >
        <CardIcon size={20} />
      </button>
      <button
        onClick={() => setView("ADMIN_FINANCIALS")}
        className={`p-3 rounded-xl transition-all ${
          view === "ADMIN_FINANCIALS"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            : "text-slate-500 hover:text-white"
        }`}
      >
        <Banknote size={20} />
      </button>
      <button
        onClick={() => setView("ADMIN_SETTINGS")}
        className={`p-3 rounded-xl transition-all ${
          view === "ADMIN_SETTINGS"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            : "text-slate-500 hover:text-white"
        }`}
      >
        <Sliders size={20} />
      </button>
    </div>
  );

  const AdminHeader = ({
    title,
    subtitle,
    showBack,
  }: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
  }) => (
    <header className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={() => {
              setView("ADMIN_USERS");
              setIsReviewingKyc(false);
            }}
            className="p-2 bg-slate-900 text-slate-400 rounded-xl hover:text-white border border-slate-800"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => loadAdminData()}
          className="p-2.5 bg-slate-900 text-slate-400 rounded-xl border border-slate-800 hover:text-white transition-colors"
        >
          <RefreshCcw
            size={16}
            className={actionLoading ? "animate-spin" : ""}
          />
        </button>
        <button
          onClick={() => {
            safeStorage.clear();
            setView("SPLASH");
          }}
          className="p-2.5 bg-slate-900 text-red-400 rounded-xl border border-slate-800 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );

  if (loading)
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <RefreshCcw className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="font-black text-[10px] text-indigo-600 uppercase tracking-widest">
          Initialising Session...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const mode = fileInputRef.current?.getAttribute("data-mode") as
            | "front"
            | "back"
            | "selfie"
            | "qr";
          if (mode) handleFileUpload(e, mode);
        }}
      />

      <div className="view-transition">
        {view === "SPLASH" && (
          <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900 text-white flex flex-col p-10 justify-between text-center">
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="p-6 bg-white/10 backdrop-blur-2xl rounded-[40px] shadow-2xl rotate-6 animate-pulse">
                <Wallet size={64} />
              </div>
              <h1 className="text-5xl font-black tracking-tighter">
                Addis Pay
              </h1>
              <p className="opacity-60 font-medium">
                Verified Payment Architecture
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => setView("LOGIN")}
                className="w-full py-5 bg-white text-indigo-700 rounded-3xl font-black shadow-xl active:scale-95 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => setView("SIGNUP")}
                className="w-full py-5 bg-indigo-500/30 border border-indigo-400/50 text-white rounded-3xl font-black active:scale-95 transition-all"
              >
                Create Node
              </button>
              <button
                onClick={() => setView("ADMIN_LOGIN")}
                className="w-full py-4 text-white/40 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Shield size={14} /> Admin Gateway
              </button>
            </div>
          </div>
        )}

        {view === "LOGIN" && (
          <Layout
            title="Sign In"
            currentView={view}
            onBack={() => setView("SPLASH")}
          >
            <div className="pt-10 space-y-6 animate-view-entry">
              <div className="space-y-4">
                <div className="relative">
                  <Mail
                    className="absolute left-5 top-5 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold"
                  />
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-5 top-5 text-gray-400"
                    size={18}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold"
                  />
                </div>
              </div>
              <button
                onClick={handleUserLogin}
                disabled={!!actionLoading}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all"
              >
                {actionLoading === "login" ? (
                  <RefreshCcw className="animate-spin mx-auto" size={24} />
                ) : (
                  "Authenticate"
                )}
              </button>
            </div>
          </Layout>
        )}

        {view === "SIGNUP" && (
          <Layout
            title="New Node"
            currentView={view}
            onBack={() => setView("SPLASH")}
          >
            <div className="pt-10 space-y-6 animate-view-entry">
              <div className="space-y-4">
                <div className="relative">
                  <User
                    className="absolute left-5 top-5 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold"
                  />
                </div>
                <div className="relative">
                  <Mail
                    className="absolute left-5 top-5 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold"
                  />
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-5 top-5 text-gray-400"
                    size={18}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold"
                  />
                </div>
              </div>
              <button
                onClick={handleUserLogin}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl"
              >
                Create Account
              </button>
            </div>
          </Layout>
        )}

        {view === "ADMIN_LOGIN" && (
          <Layout
            title="Admin Auth"
            currentView={view}
            onBack={() => setView("SPLASH")}
          >
            <div className="pt-10 space-y-6 animate-view-entry">
              <div className="p-6 bg-slate-900 rounded-3xl border border-slate-700 text-slate-400 text-xs font-bold leading-relaxed shadow-2xl">
                <Terminal size={24} className="text-emerald-400 mb-3" />
                Root Terminal Identification Required.
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Mail
                    className="absolute left-5 top-5 text-slate-400"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="Terminal Email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold"
                  />
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-5 top-5 text-slate-400"
                    size={18}
                  />
                  <input
                    type="password"
                    placeholder="Root Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-14 p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold"
                  />
                </div>
              </div>
              <button
                onClick={handleAdminLogin}
                disabled={!!actionLoading}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl"
              >
                Access Master Node
              </button>
            </div>
          </Layout>
        )}

        {view === "ADMIN_DASHBOARD" && (
          <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row md:gap-6 lg:gap-8">
            <AdminSidebar />
            <div className="flex-1 p-6 pb-16 md:py-10 md:px-10 lg:py-12 lg:px-12 md:overflow-y-auto w-full mx-auto md:mx-0 space-y-8">
              <AdminHeader
                title="Master Node"
                subtitle="Live Operational View"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-5 bg-slate-900 rounded-[24px] border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Total Users
                    </p>
                    <p className="text-2xl font-black">{adminUsers.length}</p>
                    <p className="text-[10px] text-emerald-400 font-black uppercase mt-1">
                      {approvedKyc.length} verified
                    </p>
                  </div>
                  <Users className="text-indigo-400" size={28} />
                </div>

                <div className="p-5 bg-slate-900 rounded-[24px] border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Pending KYC
                    </p>
                    <p className="text-2xl font-black">{pendingKyc.length}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase mt-1">
                      Queue age: live
                    </p>
                  </div>
                  <ShieldCheck className="text-amber-400" size={28} />
                </div>

                <div className="p-5 bg-slate-900 rounded-[24px] border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Active Cards
                    </p>
                    <p className="text-2xl font-black">{activeCardsCount}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase mt-1">
                      {frozenCardsCount} frozen
                    </p>
                  </div>
                  <CreditCard className="text-indigo-400" size={28} />
                </div>

                <div className="p-5 bg-slate-900 rounded-[24px] border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Card Float
                    </p>
                    <p className="text-2xl font-black">
                      $
                      {totalCardFloat.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-[10px] text-indigo-400 font-black uppercase mt-1">
                      Live balances
                    </p>
                  </div>
                  <BarChart3 className="text-emerald-400" size={28} />
                </div>

                <div className="p-5 bg-slate-900 rounded-[24px] border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Pending Deposits
                    </p>
                    <p className="text-2xl font-black">
                      $
                      {pendingDepositAmount.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-black uppercase mt-1">
                      {pendingDeposits.length} open
                    </p>
                  </div>
                  <TrendingUp className="text-emerald-400" size={28} />
                </div>

                <div className="p-5 bg-slate-900 rounded-[24px] border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Pending Withdrawals
                    </p>
                    <p className="text-2xl font-black">
                      $
                      {pendingWithdrawalAmount.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-[10px] text-red-400 font-black uppercase mt-1">
                      {pendingWithdrawals.length} open
                    </p>
                  </div>
                  <TrendingDown className="text-red-400" size={28} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
                <div className="p-6 bg-slate-900 rounded-[24px] border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Verification Queue
                      </p>
                      <p className="text-lg font-black">
                        {pendingKyc.length} awaiting review
                      </p>
                    </div>
                    <ShieldCheck className="text-amber-400" size={22} />
                  </div>
                  <div className="space-y-3">
                    {pendingKyc.slice(0, 4).map((app) => (
                      <div
                        key={app.id}
                        className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-black text-sm">{app.fullName}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            {app.country}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-300">
                            {new Date(app.date).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-indigo-400 font-black uppercase">
                            User {app.userId}
                          </p>
                        </div>
                      </div>
                    ))}
                    {pendingKyc.length === 0 && (
                      <p className="text-sm text-slate-500 text-center">
                        No pending KYC files.
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-[24px] border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Financial Queue
                      </p>
                      <p className="text-lg font-black">Funding & Payouts</p>
                    </div>
                    <Activity className="text-indigo-400" size={22} />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-emerald-400 font-black uppercase mb-2">
                        Deposits
                      </p>
                      <div className="space-y-2">
                        {pendingDeposits.slice(0, 3).map((req) => (
                          <div
                            key={req.id}
                            className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex justify-between"
                          >
                            <div>
                              <p className="font-black text-sm">
                                {req.userName}
                              </p>
                              <p className="text-[10px] text-emerald-300 uppercase tracking-widest">
                                ${req.amount.toFixed(2)}
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {new Date(req.date).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                        {pendingDeposits.length === 0 && (
                          <p className="text-sm text-slate-500">
                            No pending deposits.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-red-400 font-black uppercase mb-2">
                        Withdrawals
                      </p>
                      <div className="space-y-2">
                        {pendingWithdrawals.slice(0, 3).map((req) => (
                          <div
                            key={req.id}
                            className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex justify-between"
                          >
                            <div>
                              <p className="font-black text-sm">
                                {req.userName}
                              </p>
                              <p className="text-[10px] text-red-300 uppercase tracking-widest">
                                ${req.amount.toFixed(2)}
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {new Date(req.date).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                        {pendingWithdrawals.length === 0 && (
                          <p className="text-sm text-slate-500">
                            No pending withdrawals.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
                <div className="p-6 bg-slate-900 rounded-[24px] border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Card Inventory
                      </p>
                      <p className="text-lg font-black">
                        {adminCards.length} cards live
                      </p>
                    </div>
                    <HardDrive className="text-indigo-400" size={22} />
                  </div>
                  <div className="space-y-3">
                    {adminCards.slice(0, 5).map((card) => (
                      <div
                        key={card.id}
                        className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-black">
                            •••• •••• •••• {card.lastFour}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            {card.userName || card.email}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                            card.status === CardStatus.ACTIVE
                              ? "border-emerald-400 text-emerald-300"
                              : card.status === CardStatus.FROZEN
                              ? "border-amber-400 text-amber-300"
                              : "border-slate-400 text-slate-300"
                          }`}
                        >
                          {card.status}
                        </span>
                      </div>
                    ))}
                    {adminCards.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No cards issued yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-[24px] border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        System Settings
                      </p>
                      <p className="text-lg font-black">Environment Controls</p>
                    </div>
                    <Sliders className="text-indigo-400" size={22} />
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                      <span className="font-black">Max Deposit</span>
                      <span className="text-slate-300">
                        {systemSettings?.maxDeposit?.toLocaleString() ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                      <span className="font-black">Max Withdrawal</span>
                      <span className="text-slate-300">
                        {systemSettings?.maxWithdrawal?.toLocaleString() ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                      <span className="font-black">Issuing</span>
                      <span
                        className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                          systemSettings?.issuingEnabled
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {systemSettings?.issuingEnabled
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                      <span className="font-black">Sandbox</span>
                      <span
                        className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                          systemSettings?.sandboxMode
                            ? "bg-indigo-500/10 text-indigo-200"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {systemSettings?.sandboxMode ? "Sandbox" : "Production"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                      <span className="font-black">Maintenance</span>
                      <span
                        className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                          systemSettings?.maintenanceMode
                            ? "bg-amber-500/10 text-amber-200"
                            : "bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        {systemSettings?.maintenanceMode ? "Enabled" : "Off"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ADMIN USERS LIST --- */}
        {view === "ADMIN_USERS" && (
          <div className="min-h-screen bg-slate-950 text-white flex flex-col sm:flex-row">
            <AdminSidebar />
            <div className="flex-1 p-6 pb-24 w-full animate-view-entry">
              <AdminHeader
                title="User Management"
                subtitle={`${adminUsers.length} Nodes Registered`}
              />

              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search by Node ID or Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 p-4 bg-slate-900 border border-slate-800 rounded-2xl outline-none focus:border-indigo-600 font-bold text-sm"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {["ALL", "ACTIVE", "SUSPENDED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s as any)}
                      className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider whitespace-nowrap border transition-all ${
                        filterStatus === s
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-500"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {adminUsers
                  .filter(
                    (u) =>
                      (filterStatus === "ALL" || u.status === filterStatus) &&
                      (u.firstName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                        (u.email || "")
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()))
                  )
                  .map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        setSelectedAdminUser(user);
                        setView("ADMIN_USER_DETAIL");
                      }}
                      className="p-5 bg-slate-900 border border-slate-800 rounded-[28px] flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 font-black">
                          {user.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {user.email || "No Email"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-[9px] font-black uppercase tracking-widest ${
                            user.status === "ACTIVE"
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {user.status}
                        </p>
                        <p
                          className={`text-[9px] font-bold uppercase mt-1 ${
                            user.kycStatus === "APPROVED"
                              ? "text-indigo-400"
                              : user.kycStatus === "PENDING"
                              ? "text-amber-500"
                              : "text-slate-500"
                          }`}
                        >
                          KYC: {user.kycStatus}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* --- ADMIN KYC CENTER --- */}
        {view === "ADMIN_KYC" && (
          <div className="min-h-screen bg-slate-950 text-white flex flex-col sm:flex-row">
            <AdminSidebar />
            <div className="flex-1 p-6 pb-24 w-full animate-view-entry">
              <AdminHeader
                title="KYC Center"
                subtitle="Identity & Card Provisioning"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-[28px]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Pending Identities
                  </p>
                  <p className="text-2xl font-black mt-1 text-amber-400">
                    {pendingKyc.length}
                  </p>
                </div>
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-[28px]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Card Requests
                  </p>
                  <p className="text-2xl font-black mt-1 text-indigo-400">
                    {pendingCardRequests.length}
                  </p>
                </div>
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-[28px]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Approved Today
                  </p>
                  <p className="text-2xl font-black mt-1 text-emerald-400">
                    {approvedKyc.length}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-[32px] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Identity Reviews
                      </p>
                      <p className="text-sm font-black text-white">
                        {pendingKyc.length} awaiting decision
                      </p>
                    </div>
                    <ShieldCheck className="text-amber-400" size={18} />
                  </div>

                  <div className="space-y-3">
                    {pendingKyc.map((app) => (
                      <div
                        key={app.id}
                        className="p-5 bg-slate-800/60 border border-slate-800 rounded-2xl space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black">
                              {app.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-sm">
                                {app.fullName}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {app.country}
                              </p>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            {app.date.split("T")[0]}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {(["front", "back", "selfie"] as const).map(
                            (side) => (
                              <div
                                key={side}
                                className="aspect-square rounded-xl bg-slate-900 overflow-hidden border border-slate-800"
                              >
                                <img
                                  src={
                                    (app.documents as any)?.[side] ||
                                    "https://via.placeholder.com/200x200?text=Pending"
                                  }
                                  className="w-full h-full object-cover"
                                  alt={`${side} preview`}
                                />
                              </div>
                            )
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleAdminUpdateKycStatus(app.userId, "APPROVED")
                            }
                            className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-[11px] uppercase flex items-center justify-center gap-2 active:scale-95"
                          >
                            <CheckSquare size={16} /> Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAdminUpdateKycStatus(app.userId, "REJECTED")
                            }
                            className="flex-1 py-3 bg-red-600/10 border border-red-600/20 text-red-500 rounded-xl font-black text-[11px] uppercase flex items-center justify-center gap-2 active:scale-95"
                          >
                            <XSquare size={16} /> Reject
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            const user = adminUsers.find(
                              (u) => u.id === app.userId
                            );
                            if (user) {
                              setSelectedAdminUser(user);
                              setIsReviewingKyc(true);
                              setView("ADMIN_USER_DETAIL");
                            }
                          }}
                          className="w-full py-3 bg-slate-900 border border-slate-800 text-white rounded-xl font-black text-[11px] uppercase flex items-center justify-center gap-2 active:scale-95"
                        >
                          <FileSearch size={16} /> Open Full Review
                        </button>
                      </div>
                    ))}
                    {pendingKyc.length === 0 && (
                      <div className="p-10 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                        <ShieldCheck
                          size={32}
                          className="mx-auto mb-2 opacity-30"
                        />
                        <p className="font-black text-[10px] uppercase tracking-widest">
                          No identities awaiting review
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-slate-900 border border-slate-800 rounded-[32px] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Card Provisioning Queue
                      </p>
                      <p className="text-sm font-black text-white">
                        {pendingCardRequests.length} pending issuance
                      </p>
                    </div>
                    <CardIcon className="text-indigo-400" size={18} />
                  </div>

                  <div className="space-y-3">
                    {pendingCardRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-5 bg-slate-800/60 border border-slate-800 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black">
                            {req.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-sm">{req.userName}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              {req.email}
                            </p>
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                              {req.date.split("T")[0]}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleAdminProcessCardRequest(req.id, "APPROVED")
                            }
                            className="p-3 bg-emerald-500 text-white rounded-xl active:scale-90"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleAdminProcessCardRequest(req.id, "REJECTED")
                            }
                            className="p-3 bg-red-500 text-white rounded-xl active:scale-90"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingCardRequests.length === 0 && (
                      <div className="p-10 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                        <CardIcon
                          size={32}
                          className="mx-auto mb-2 opacity-30"
                        />
                        <p className="font-black text-[10px] uppercase tracking-widest">
                          No card requests pending
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ADMIN USER DETAIL --- */}
        {view === "ADMIN_USER_DETAIL" && selectedAdminUser && (
          <div className="min-h-screen bg-slate-950 text-white flex flex-col sm:flex-row">
            <AdminSidebar />
            <div className="flex-1 p-6 pb-24 w-full animate-view-entry">
              <AdminHeader
                title={isReviewingKyc ? "KYC Review Hub" : "User Profile"}
                subtitle={`Node ID: ${selectedAdminUser.id}`}
                showBack
              />

              {!isReviewingKyc ? (
                <div className="space-y-6">
                  <div className="p-8 bg-slate-900 rounded-[40px] border border-slate-800 text-center space-y-4">
                    <div className="w-24 h-24 bg-indigo-600 text-white rounded-[32px] flex items-center justify-center text-3xl font-black mx-auto shadow-2xl shadow-indigo-500/20">
                      {selectedAdminUser.firstName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black">
                        {selectedAdminUser.firstName}{" "}
                        {selectedAdminUser.lastName}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                        @{selectedAdminUser.username || "unknown_node"}
                      </p>
                    </div>
                    <div className="flex justify-center gap-4">
                      <div
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          selectedAdminUser.status === "ACTIVE"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : "bg-red-500/10 border-red-500/20 text-red-500"
                        }`}
                      >
                        {selectedAdminUser.status}
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          selectedAdminUser.kycStatus === "APPROVED"
                            ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        }`}
                      >
                        KYC {selectedAdminUser.kycStatus}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      Administrative Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedAdminUser.status === "ACTIVE" ? (
                        <button
                          onClick={() =>
                            handleAdminUpdateUserStatus(
                              selectedAdminUser.id,
                              "SUSPENDED"
                            )
                          }
                          className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          <Ban size={16} /> Ban Node
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleAdminUpdateUserStatus(
                              selectedAdminUser.id,
                              "ACTIVE"
                            )
                          }
                          className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          <CheckCircle size={16} /> Reactivate
                        </button>
                      )}

                      <button
                        onClick={() => setIsReviewingKyc(true)}
                        className="p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <FileSearch size={16} /> View Docs
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900 rounded-[32px] border border-slate-800 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <FileText size={14} /> Node Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs text-slate-500">Email</span>
                        <span className="text-xs font-bold">
                          {selectedAdminUser.email || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs text-slate-500">Country</span>
                        <span className="text-xs font-bold">
                          {selectedAdminUser.country || "Global"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs text-slate-500">Phone</span>
                        <span className="text-xs font-bold">
                          {selectedAdminUser.phone || "Not Linked"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* KYC Verification Hub */
                <div className="space-y-6 animate-view-entry">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Documents Display */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-500">
                          Document Front
                        </p>
                        <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                          <img
                            src={
                              adminKyc.find(
                                (k) => k.userId === selectedAdminUser.id
                              )?.documents?.front ||
                              "https://via.placeholder.com/400x250?text=No+Front+ID"
                            }
                            className="w-full h-full object-cover"
                            alt="ID Front"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-500">
                          Document Back
                        </p>
                        <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                          <img
                            src={
                              adminKyc.find(
                                (k) => k.userId === selectedAdminUser.id
                              )?.documents?.back ||
                              "https://via.placeholder.com/400x250?text=No+Back+ID"
                            }
                            className="w-full h-full object-cover"
                            alt="ID Back"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-500">
                          Biometric Selfie (Liveness)
                        </p>
                        <div className="aspect-square bg-slate-900 rounded-[32px] overflow-hidden border border-slate-800 relative">
                          <img
                            src={
                              adminKyc.find(
                                (k) => k.userId === selectedAdminUser.id
                              )?.documents?.selfie ||
                              "https://via.placeholder.com/400x400?text=No+Selfie"
                            }
                            className="w-full h-full object-cover"
                            alt="Selfie"
                          />
                          <div className="absolute top-4 right-4 bg-emerald-500 text-white px-2 py-1 rounded-full text-[9px] font-black uppercase">
                            Liveness Verified
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-500">
                          Review Decision
                        </h4>
                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              handleAdminUpdateKycStatus(
                                selectedAdminUser.id,
                                "APPROVED"
                              )
                            }
                            className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                          >
                            <BadgeCheck size={18} /> Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAdminUpdateKycStatus(
                                selectedAdminUser.id,
                                "REJECTED"
                              )
                            }
                            className="flex-1 py-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
                          >
                            <XSquare size={18} /> Decline
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-500 text-center font-bold">
                          Reviewing documents provided on{" "}
                          {
                            adminKyc
                              .find((k) => k.userId === selectedAdminUser.id)
                              ?.date.split("T")[0]
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === "DASHBOARD" && (
          <div className="p-6 space-y-6 animate-view-entry max-w-md mx-auto">
            <header className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg uppercase">
                  {profile?.firstName?.charAt(0) || "U"}
                </div>
                <div>
                  <h1 className="text-xl font-black">
                    Hi, {profile?.firstName || "Ahmed"}
                  </h1>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                    Status: {isVerified ? "Verified ?" : "Pending ??"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setView("SETTINGS")}
                className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-indigo-600 active:scale-90 transition-all"
              >
                <Settings size={20} />
              </button>
            </header>

            {!isVerified && (
              <div className="p-5 bg-amber-50 border border-amber-100 rounded-[32px] flex items-start gap-4 animate-view-entry">
                <ShieldAlert className="text-amber-500 mt-1" />
                <div className="flex-1">
                  <h4 className="font-black text-sm text-amber-900 mb-1">
                    Identity Verification
                  </h4>
                  <p className="text-xs text-amber-700 mb-3">
                    Please verify your ID to unlock card features.
                  </p>
                  <button
                    onClick={() => {
                      setKycStep(1);
                      setView("KYC_FORM");
                    }}
                    className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg"
                  >
                    Verify ID
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {!isVerified ? (
                /* Premium Black Card Placeholder for Unverified Users */
                <div className="relative w-full aspect-[1.6/1] rounded-[32px] bg-slate-900 p-8 text-white shadow-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full"></div>
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center">
                      <Lock className="text-slate-500" size={24} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full">
                      Node Locked
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-lg font-black tracking-tight">
                        Virtual Mastercard
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Verify identity to provision
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setKycStep(1);
                        setView("KYC_FORM");
                      }}
                      className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all"
                    >
                      Apply for Card
                    </button>
                  </div>
                </div>
              ) : cards.length > 0 ? (
                <VirtualCard
                  card={selectedCard || cards[0]}
                  onClick={() => navigateTo("CARD_DETAILS")}
                />
              ) : (
                /* Verified but no card yet */
                <div
                  onClick={() => navigateTo("CREATE_CARD")}
                  className="w-full aspect-[1.6/1] bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-[32px] flex flex-col items-center justify-center gap-4 text-indigo-400 cursor-pointer active:scale-95 transition-all group"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Plus className="text-indigo-600" size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-xs uppercase text-indigo-900">
                      Issue Your First Card
                    </p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                      Ready for provision
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  id: "PAY",
                  icon: <Send size={24} />,
                  label: "Pay",
                  color: "text-indigo-600",
                },
                {
                  id: "FUND_CARD",
                  icon: <Banknote size={24} />,
                  label: "Fund Card",
                  color: "text-emerald-600",
                },
                {
                  id: "CARD_DETAILS",
                  icon: <Info size={24} />,
                  label: "Details",
                  color: "text-purple-600",
                },
                {
                  id: "TRANSACTIONS",
                  icon: <History size={24} />,
                  label: "History",
                  color: "text-slate-600",
                },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => navigateTo(btn.id as AppView)}
                  disabled={!isVerified}
                  className={`relative py-6 rounded-[32px] border font-black uppercase text-[10px] flex flex-col items-center gap-2 transition-all ${
                    !isVerified
                      ? "bg-gray-50 text-gray-300 opacity-60"
                      : "bg-white shadow-sm active:scale-95"
                  }`}
                >
                  <div className={isVerified ? btn.color : ""}>{btn.icon}</div>
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Recent Activity
                </h3>
                <button
                  onClick={() => navigateTo("TRANSACTIONS")}
                  className="text-[10px] font-black text-indigo-600"
                >
                  View All
                </button>
              </div>
              <div className="bg-gray-50 rounded-[32px] overflow-hidden border border-gray-100">
                {transactions.slice(0, 3).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-5 flex items-center justify-between border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-xl ${
                          tx.type === "DEBIT"
                            ? "bg-red-50 text-red-500"
                            : "bg-emerald-50 text-emerald-500"
                        }`}
                      >
                        {tx.type === "DEBIT" ? (
                          <ArrowUpRight size={14} />
                        ) : (
                          <ArrowDownLeft size={14} />
                        )}
                      </div>
                      <div className="text-xs font-bold text-gray-900">
                        {tx.description}
                      </div>
                    </div>
                    <div
                      className={`text-xs font-black ${
                        tx.type === "DEBIT"
                          ? "text-gray-900"
                          : "text-emerald-500"
                      }`}
                    >
                      {tx.type === "DEBIT" ? "-" : "+"}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="p-8 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                    No Node Activity Yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {view === "SETTINGS" && (
          <Layout
            title="Account Node"
            currentView={view}
            onBack={() => setView("DASHBOARD")}
          >
            <div className="space-y-6 animate-view-entry">
              <div className="p-8 bg-gray-50 rounded-[40px] text-center space-y-4 border border-gray-100">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-2xl font-black mx-auto shadow-xl">
                  {profile?.firstName?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    @{profile?.username || "verified_node"}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase">
                    Node ID: {profile?.id || "00921"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <Fingerprint size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">
                        Identity Status
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {profile?.kycStatus || "NONE"}
                      </p>
                    </div>
                  </div>
                  {isVerified && (
                    <CheckCircle className="text-emerald-500" size={24} />
                  )}
                </div>
                <button
                  onClick={() => {
                    safeStorage.clear();
                    setView("SPLASH");
                  }}
                  className="w-full p-6 bg-red-50 text-red-600 rounded-[32px] flex items-center gap-4 font-black text-sm"
                >
                  <LogOut size={20} /> Logout Node Session
                </button>
              </div>
            </div>
          </Layout>
        )}

        {view === "PAY" && (
          <Layout title="Make Payment" currentView={view} onBack={handleBack}>
            <div className="space-y-8 animate-view-entry">
              <div className="p-8 bg-slate-900 rounded-[40px] text-center space-y-2 border-2 border-indigo-500/20 shadow-2xl">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  Available Node Balance
                </p>
                <p className="text-4xl font-black text-white">
                  ${selectedCard?.balance.toFixed(2) || "0.00"}
                </p>
              </div>

              <div className="space-y-6">
                {/* Quick Select Grid for Pay */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Quick Select
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {["5", "25", "50"].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setPayAmount(amt)}
                        className={`py-4 border rounded-2xl font-black text-sm transition-all ${
                          payAmount === amt
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200"
                            : "bg-white border-gray-100"
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center ml-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Recipient Details
                    </p>
                    <button
                      onClick={() => startCamera("qr")}
                      className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase bg-indigo-50 px-3 py-1.5 rounded-full active:scale-95"
                    >
                      <QrCode size={14} /> Scan QR
                    </button>
                  </div>
                  <div className="relative">
                    <User
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Node ID or Wallet Address"
                      value={payRecipient}
                      onChange={(e) => setPayRecipient(e.target.value)}
                      className="w-full pl-12 p-5 bg-gray-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-100"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Payment Amount
                  </p>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="number"
                      placeholder="0.00"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full pl-12 p-5 bg-gray-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-100 text-2xl"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePay}
                  disabled={!!actionLoading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[32px] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {actionLoading === "pay" ? (
                    <RefreshCcw className="animate-spin" size={24} />
                  ) : (
                    <Zap size={24} className="text-amber-400" />
                  )}
                  SEND PAYMENT
                </button>
              </div>
            </div>
          </Layout>
        )}

        {view === "PAY_SUCCESS" && (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center space-y-6">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[32px] flex items-center justify-center shadow-xl animate-check">
              <CheckCircle2 size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">
                Payment Sent!
              </h2>
              <p className="text-sm text-gray-400 mt-2 font-medium">
                Infrastructure node has processed the transaction successfully.
              </p>
            </div>
            <button
              onClick={() => setView("DASHBOARD")}
              className="w-full py-5 bg-slate-900 text-white rounded-[32px] font-black shadow-xl"
            >
              Back Home
            </button>
          </div>
        )}

        {view === "CREATE_CARD" && (
          <Layout title="Issue Card" currentView={view} onBack={handleBack}>
            <div className="space-y-8 animate-view-entry">
              <div className="aspect-[1.6/1] bg-slate-900 rounded-[32px] p-8 text-white flex flex-col justify-between border-2 border-indigo-500/20">
                <div className="flex justify-between items-center">
                  <Zap className="text-amber-400" size={32} />
                  <span className="text-[10px] font-black uppercase bg-white/10 px-3 py-1 rounded-full">
                    Node Exclusive
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tighter">
                    Global Mastercard
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Instant Virtual Provisioning
                  </p>
                </div>
              </div>
              <div className="p-8 bg-indigo-50 rounded-[32px] text-center space-y-2">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  Provisioning Fee
                </p>
                <p className="text-4xl font-black text-indigo-900">$5.00</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleIssueCard}
                  disabled={!!actionLoading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {actionLoading === "issue" ? (
                    <RefreshCcw className="animate-spin" size={24} />
                  ) : (
                    <Zap size={24} className="text-amber-400" />
                  )}
                  ISSUE MASTERCARD
                </button>
                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                  Funds will be deducted from your account
                </p>
              </div>
            </div>
          </Layout>
        )}

        {view === "FUND_CARD" && (
          <Layout title="Fund Node" currentView={view} onBack={handleBack}>
            <div className="space-y-8 animate-view-entry">
              <div className="p-8 bg-gray-50 rounded-[40px] text-center space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Current Balance
                </p>
                <p className="text-4xl font-black text-gray-900">
                  ${selectedCard?.balance.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Quick Select
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {["10", "50", "100"].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setFundAmount(amt)}
                        className={`py-4 border rounded-2xl font-black text-sm transition-all ${
                          fundAmount === amt
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200"
                            : "bg-white border-gray-100"
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <DollarSign
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="number"
                    placeholder="Enter Amount"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full pl-12 p-5 bg-gray-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-100"
                  />
                </div>

                <button
                  onClick={handleFundCard}
                  disabled={!!actionLoading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {actionLoading === "fund" ? (
                    <RefreshCcw className="animate-spin" size={24} />
                  ) : (
                    <ArrowDownCircle size={24} />
                  )}
                  FUND CARD NOW
                </button>
              </div>
            </div>
          </Layout>
        )}

        {view === "TRANSACTIONS" && (
          <Layout title="Activities" currentView={view} onBack={handleBack}>
            <div className="space-y-4 animate-view-entry">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-5 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-2xl ${
                        tx.type === "DEBIT"
                          ? "bg-red-50 text-red-500"
                          : "bg-emerald-50 text-emerald-500"
                      }`}
                    >
                      {tx.type === "DEBIT" ? (
                        <ArrowUpRight size={20} />
                      ) : (
                        <ArrowDownLeft size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black">{tx.description}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        {tx.date.split("T")[0]}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-black ${
                      tx.type === "DEBIT" ? "text-gray-900" : "text-emerald-500"
                    }`}
                  >
                    {tx.type === "DEBIT" ? "-" : "+"}${tx.amount.toFixed(2)}
                  </p>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="p-20 text-center">
                  <History size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-xs font-bold text-gray-400 uppercase">
                    No node history recorded.
                  </p>
                </div>
              )}
            </div>
          </Layout>
        )}

        {view === "CARD_DETAILS" && (
          <Layout title="Manage Card" currentView={view} onBack={handleBack}>
            <div className="space-y-8 animate-view-entry">
              {selectedCard && <VirtualCard card={selectedCard} />}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsFreezeModalOpen(true)}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {selectedCard?.status === CardStatus.FROZEN ? (
                    <Flame size={16} />
                  ) : (
                    <Snowflake size={16} />
                  )}
                  {selectedCard?.status === CardStatus.FROZEN
                    ? "Unfreeze"
                    : "Freeze"}
                </button>
                <button
                  onClick={() => navigateTo("FUND_CARD")}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Plus size={16} /> Add Funds
                </button>
              </div>
              <div className="p-8 bg-gray-50 rounded-[40px] space-y-6">
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span>CARD ID</span>
                    <span className="font-bold">{selectedCard?.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span>CVV</span>
                    <span className="font-bold">{selectedCard?.cvv}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span>STATUS</span>
                    <span className="font-bold text-indigo-600">
                      {selectedCard?.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Layout>
        )}

        {/* --- KYC FLOW --- */}
        {view === "KYC_FORM" && (
          <Layout
            title="ID Verification"
            currentView={view}
            onBack={handleBack}
          >
            <div className="space-y-8 animate-view-entry">
              <div className="flex justify-center gap-4">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`w-3 h-3 rounded-full ${
                      kycStep === s ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              {kycStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-sm font-black text-gray-900 ml-1">
                      Identity Details
                    </p>
                    <input
                      type="text"
                      placeholder="Full Legal Name"
                      value={kycFullName}
                      onChange={(e) => setKycFullName(e.target.value)}
                      className="w-full p-5 rounded-2xl bg-gray-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={kycEmail}
                      onChange={(e) => setKycEmail(e.target.value)}
                      className="w-full p-5 rounded-2xl bg-gray-50 font-bold outline-none border-2 border-transparent focus:border-indigo-100"
                    />
                  </div>
                  <button
                    onClick={() => setKycStep(2)}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl"
                  >
                    Next: ID Front
                  </button>
                </div>
              )}
              {kycStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-sm font-black text-gray-900 ml-1">
                      Scan ID Front
                    </p>
                    <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-3 overflow-hidden relative">
                      {capturedImages.front ? (
                        <img
                          src={capturedImages.front}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-6">
                          <ImageIcon
                            className="text-gray-300 mx-auto mb-2"
                            size={48}
                          />
                          <span className="text-xs font-bold text-gray-400 block uppercase">
                            Capture Required
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => startCamera("front")}
                      className="py-4 bg-white border-2 border-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Camera size={16} /> Camera
                    </button>
                    <button
                      onClick={() => triggerFileUpload("front")}
                      className="py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2"
                    >
                      <Upload size={16} /> Library
                    </button>
                  </div>
                  <button
                    onClick={() => setKycStep(3)}
                    disabled={!capturedImages.front}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              )}
              {kycStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-sm font-black text-gray-900 ml-1">
                      Scan ID Back
                    </p>
                    <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-3 overflow-hidden relative">
                      {capturedImages.back ? (
                        <img
                          src={capturedImages.back}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-6">
                          <ImageIcon
                            className="text-gray-300 mx-auto mb-2"
                            size={48}
                          />
                          <span className="text-xs font-bold text-gray-400 block uppercase">
                            Capture Required
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => startCamera("back")}
                      className="py-4 bg-white border-2 border-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Camera size={16} /> Camera
                    </button>
                    <button
                      onClick={() => triggerFileUpload("back")}
                      className="py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2"
                    >
                      <Upload size={16} /> Library
                    </button>
                  </div>
                  <button
                    onClick={() => setKycStep(4)}
                    disabled={!capturedImages.back}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              )}
              {kycStep === 4 && (
                <div className="space-y-8 text-center">
                  <div className="w-48 h-48 rounded-full bg-indigo-50 border-2 border-dashed border-indigo-200 mx-auto flex items-center justify-center overflow-hidden relative group">
                    {capturedImages.selfie ? (
                      <img
                        src={capturedImages.selfie}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserRound size={64} className="text-indigo-200" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => startCamera("selfie")}
                      className="py-4 bg-white border-2 border-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Camera size={16} /> Biometric
                    </button>
                    <button
                      onClick={() => triggerFileUpload("selfie")}
                      className="py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2"
                    >
                      <Upload size={16} /> Upload
                    </button>
                  </div>
                  <button
                    onClick={handleKycSubmit}
                    disabled={!capturedImages.selfie || !!actionLoading}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl disabled:opacity-50"
                  >
                    Finalise Node
                  </button>
                </div>
              )}
            </div>
          </Layout>
        )}

        {view === "KYC_SUBMITTED" && (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center space-y-6">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[32px] flex items-center justify-center shadow-xl animate-check">
              <ShieldCheck size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900">
              Vaulted Submit
            </h2>
            <p className="text-sm text-gray-400">
              Node identification in progress. Verification usually completes
              within 5 minutes.
            </p>
            <button
              onClick={() => setView("DASHBOARD")}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black"
            >
              Dashboard
            </button>
          </div>
        )}
      </div>

      {/* --- CAMERA OVERLAY --- */}
      {cameraActive && (
        <div className="fixed inset-0 bg-black z-[6000] flex flex-col animate-fade-in">
          <div className="p-6 flex justify-between items-center text-white z-10">
            <button
              onClick={stopCamera}
              className="p-2 bg-white/10 rounded-full active:scale-90"
            >
              <X size={24} />
            </button>
            <span className="font-black uppercase tracking-widest text-[10px]">
              {cameraActive === "qr" ? "QR Scanner" : cameraActive + " Scan"}{" "}
              Active
            </span>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover absolute"
            />

            {cameraActive === "qr" ? (
              <div className="relative w-64 h-64 border-2 border-indigo-500 rounded-3xl overflow-hidden shadow-[0_0_0_2000px_rgba(0,0,0,0.8)]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent animate-[scan_2s_linear_infinite]"></div>
                {/* QR corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400"></div>
              </div>
            ) : (
              <div
                className={`relative border-2 border-indigo-50 shadow-[0_0_0_2000px_rgba(0,0,0,0.8)] ${
                  cameraActive === "selfie"
                    ? "w-64 h-64 rounded-full"
                    : "w-80 h-48 rounded-2xl"
                }`}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_3s_linear_infinite]"></div>
              </div>
            )}
          </div>
          <div className="p-10 flex flex-col items-center bg-black gap-6">
            <button
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-[6px] border-white/20 active:scale-90 transition-all"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                {cameraActive === "qr" ? (
                  <Scan size={24} />
                ) : (
                  <Camera size={24} />
                )}
              </div>
            </button>
            {cameraActive === "qr" && (
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">
                Position QR Code in the frame
              </p>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* --- MODALS --- */}
      <Modal
        isOpen={isFreezeModalOpen}
        title={
          selectedCard?.status === CardStatus.FROZEN
            ? "Unfreeze Node?"
            : "Freeze Node?"
        }
        message={
          selectedCard?.status === CardStatus.FROZEN
            ? "Re-activate your card for global payments. You'll be able to fund and pay instantly."
            : "Freezing will temporarily block all outgoing transactions and funding actions."
        }
        confirmText={
          selectedCard?.status === CardStatus.FROZEN ? "Unfreeze" : "Freeze"
        }
        onConfirm={handleFreezeToggle}
        onCancel={() => setIsFreezeModalOpen(false)}
        isDestructive={selectedCard?.status !== CardStatus.FROZEN}
      />
    </div>
  );
};

export default App;

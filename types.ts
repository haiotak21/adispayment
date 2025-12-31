
// global window augmentation
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    Telegram?: any;
    aistudio?: AIStudio;
  }
}

export enum CardStatus {
  ACTIVE = 'Active',
  FROZEN = 'Frozen',
  PENDING = 'Pending',
  CLOSED = 'Closed'
}

export type KycStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Card {
  id: string;
  lastFour: string;
  balance: number;
  currency: string;
  status: CardStatus;
  expiry: string;
  email: string;
  cvv: string;
  userId?: number;
  userName?: string;
}

export interface CardRequest {
  id: string;
  userId: number;
  userName: string;
  email: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  description: string;
  date: string;
  userId?: number;
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  email?: string;
  linkedCardId?: string;
  kycStatus: KycStatus;
  isAdmin?: boolean;
  phone?: string;
  country?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface KycApplication {
  id: string;
  userId: number;
  fullName: string;
  phone: string;
  country: string;
  email: string;
  date: string;
  status: KycStatus;
  documents?: {
    front: string;
    back: string;
    selfie: string;
  };
}

export interface DepositRequest {
  id: string;
  userId: number;
  userName: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface WithdrawalRequest {
  id: string;
  userId: number;
  userName: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface SystemSettings {
  maxDeposit: number;
  maxWithdrawal: number;
  sandboxMode: boolean;
  issuingEnabled: boolean;
  maintenanceMode: boolean;
}

export type AppView = 
  | 'SPLASH' 
  | 'LOGIN' 
  | 'SIGNUP' 
  | 'DASHBOARD' 
  | 'CREATE_CARD' 
  | 'FUND_CARD' 
  | 'CARD_DETAILS' 
  | 'TRANSACTIONS' 
  | 'SETTINGS' 
  | 'PAY' 
  | 'FUND_SUCCESS' 
  | 'PAY_SUCCESS' 
  | 'KYC_FORM' 
  | 'KYC_SUBMITTED'
  | 'ADMIN_LOGIN'
  | 'ADMIN_DASHBOARD'
  | 'ADMIN_USERS'
  | 'ADMIN_USER_DETAIL'
  | 'ADMIN_KYC'
  | 'ADMIN_CARDS'
  | 'ADMIN_FINANCIALS'
  | 'ADMIN_LOGS'
  | 'ADMIN_SETTINGS';

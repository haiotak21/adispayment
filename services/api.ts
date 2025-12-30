
import { Card, Transaction, UserProfile, CardStatus, KycApplication, DepositRequest, WithdrawalRequest, SystemSettings } from '../types';

export const apiService = {
  getProfile: async (): Promise<UserProfile> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
        resolve({
          id: user?.id || 12345,
          firstName: user?.first_name || 'User',
          lastName: user?.last_name,
          username: user?.username,
          email: 'user@example.com',
          kycStatus: 'NONE',
          status: 'ACTIVE'
        });
      }, 300);
    });
  },

  getCards: async (): Promise<Card[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'card_7721',
            lastFour: '4242',
            balance: 150.50,
            currency: 'USD',
            status: CardStatus.ACTIVE,
            expiry: '12/26',
            email: 'user@example.com',
            cvv: '123'
          }
        ]);
      }, 500);
    });
  },

  getTransactions: async (cardId: string): Promise<Transaction[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: '1', amount: 20.0, type: 'DEBIT', status: 'COMPLETED', description: 'Netflix Subscription', date: '2023-10-24T10:00:00Z' },
          { id: '2', amount: 150.0, type: 'CREDIT', status: 'COMPLETED', description: 'Initial Load', date: '2023-10-20T14:22:00Z' },
          { id: '3', amount: 5.50, type: 'DEBIT', status: 'PENDING', description: 'Starbucks Coffee', date: '2023-10-25T08:15:00Z' },
        ]);
      }, 400);
    });
  },

  // Admin methods
  getAdminKycApplications: async (): Promise<KycApplication[]> => {
    return [
      { id: 'app_1', userId: 9901, fullName: 'Abebe Bikila', phone: '+251911223344', country: 'Ethiopia', email: 'abebe@example.com', date: new Date().toISOString(), status: 'PENDING' },
      { id: 'app_2', userId: 9902, fullName: 'Meseret Defar', phone: '+251911556677', country: 'Ethiopia', email: 'meseret@example.com', date: new Date().toISOString(), status: 'PENDING' },
    ];
  },

  getAdminDepositRequests: async (): Promise<DepositRequest[]> => {
    return [
      { id: 'dep_1', userId: 9901, userName: 'Abebe Bikila', amount: 500.00, date: new Date().toISOString(), status: 'PENDING' },
      { id: 'dep_2', userId: 9903, userName: 'Haile Gebrselassie', amount: 2500.00, date: new Date().toISOString(), status: 'PENDING' },
    ];
  },

  getAdminWithdrawalRequests: async (): Promise<WithdrawalRequest[]> => {
    return [
      { id: 'wth_1', userId: 9904, userName: 'Tirunesh Dibaba', amount: 120.00, date: new Date().toISOString(), status: 'PENDING' },
    ];
  },

  getAdminUsers: async (): Promise<UserProfile[]> => {
    return [
      { id: 9901, firstName: 'Abebe', lastName: 'Bikila', email: 'abebe@example.com', kycStatus: 'APPROVED', status: 'ACTIVE' },
      { id: 9902, firstName: 'Meseret', lastName: 'Defar', email: 'meseret@example.com', kycStatus: 'PENDING', status: 'ACTIVE' },
      { id: 9903, firstName: 'Haile', lastName: 'Gebrselassie', email: 'haile@example.com', kycStatus: 'APPROVED', status: 'ACTIVE' },
      { id: 9904, firstName: 'Tirunesh', lastName: 'Dibaba', email: 'tiru@example.com', kycStatus: 'NONE', status: 'ACTIVE' },
    ];
  },

  getAllCards: async (): Promise<Card[]> => {
    return [
      { id: 'card_1', lastFour: '4242', balance: 1500.00, currency: 'USD', status: CardStatus.ACTIVE, expiry: '12/26', email: 'abebe@example.com', cvv: '123', userName: 'Abebe Bikila' },
      { id: 'card_2', lastFour: '8812', balance: 45.20, currency: 'USD', status: CardStatus.FROZEN, expiry: '05/27', email: 'haile@example.com', cvv: '445', userName: 'Haile Gebrselassie' },
    ];
  },

  getSystemSettings: async (): Promise<SystemSettings> => {
    return {
      maxDeposit: 10000,
      maxWithdrawal: 5000,
      sandboxMode: true,
      issuingEnabled: true,
      maintenanceMode: false
    };
  },

  updateKycStatus: async (appId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> => {
    console.log(`KYC ${appId} updated to ${status}`);
  },

  updateDepositStatus: async (requestId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> => {
    console.log(`Deposit ${requestId} updated to ${status}`);
  },

  updateWithdrawalStatus: async (requestId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> => {
    console.log(`Withdrawal ${requestId} updated to ${status}`);
  },

  updateUserStatus: async (userId: number, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> => {
    console.log(`User ${userId} status updated to ${status}`);
  },

  updateCardStatus: async (cardId: string, status: CardStatus): Promise<void> => {
    console.log(`Card ${cardId} status updated to ${status}`);
  },

  updateSettings: async (settings: SystemSettings): Promise<void> => {
    console.log(`Settings updated:`, settings);
  }
};

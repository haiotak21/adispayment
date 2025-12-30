
import { useEffect, useCallback } from 'react';
// Fix: Import types to ensure global window augmentation is picked up by the compiler
import '../types';

export const useTelegram = () => {
  const tg = window.Telegram?.WebApp;

  const isVersionAtLeast = (version: string) => {
    return tg?.isVersionAtLeast(version) || false;
  };

  const safeHaptic = (type: 'impact' | 'notification', style: any) => {
    try {
      if (isVersionAtLeast('6.1')) {
        if (type === 'impact') tg.HapticFeedback.impactOccurred(style);
        if (type === 'notification') tg.HapticFeedback.notificationOccurred(style);
      }
    } catch (e) {
      console.warn("Haptic feedback error", e);
    }
  };

  const safeAlert = (message: string) => {
    try {
      if (isVersionAtLeast('6.2')) {
        tg.showAlert(message);
      } else {
        alert(message);
      }
    } catch (e) {
      alert(message);
    }
  };

  const onClose = useCallback(() => {
    tg?.close();
  }, [tg]);

  useEffect(() => {
    tg?.ready();
    tg?.expand();
  }, [tg]);

  return {
    onClose,
    tg,
    user: tg?.initDataUnsafe?.user,
    queryId: tg?.initDataUnsafe?.query_id,
    themeParams: tg?.themeParams,
    isVersionAtLeast,
    safeHaptic,
    safeAlert
  };
};

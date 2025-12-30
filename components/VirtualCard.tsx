
import React, { useState } from 'react';
import { Card, CardStatus } from '../types';
import { CreditCard, ShieldCheck, ShieldAlert, Eye, EyeOff } from 'lucide-react';

interface VirtualCardProps {
  card: Card;
  onClick?: () => void;
}

const VirtualCard: React.FC<VirtualCardProps> = ({ card, onClick }) => {
  const [showDetails, setShowDetails] = useState(false);
  const isFrozen = card.status === CardStatus.FROZEN;

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  return (
    <div 
      onClick={onClick}
      className={`relative w-full aspect-[1.6/1] rounded-2xl p-6 text-white shadow-xl overflow-hidden cursor-pointer transition-all duration-300 active:scale-[0.98] ${
        isFrozen ? 'bg-slate-500 grayscale' : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500'
      }`}
    >
      {/* Decorative elements */}
      <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-pink-300 opacity-20 rounded-full blur-2xl"></div>

      <div className="flex justify-between items-start h-full flex-col z-10 relative">
        <div className="flex justify-between w-full items-center">
          <CreditCard className="w-10 h-10 opacity-80" />
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleDetails}
              className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {isFrozen ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
              {card.status}
            </div>
          </div>
        </div>

        <div className="mt-auto w-full animate-fade-in">
          <p className="text-sm opacity-70 mb-1">Balance</p>
          <p className="text-3xl font-bold tracking-tight">
            {card.currency} {card.balance.toFixed(2)}
          </p>
          
          <div className="flex justify-between items-end mt-4">
            <div>
              <p className="text-xs opacity-60 uppercase">Card Number</p>
              <p className="text-lg font-mono tracking-widest">
                {showDetails ? `4242 4242 4242 ${card.lastFour}` : `•••• •••• •••• ${card.lastFour}`}
              </p>
            </div>
            <div className="text-right">
              {showDetails && (
                <div className="mb-2">
                  <p className="text-[10px] opacity-60 uppercase">CVV</p>
                  <p className="font-mono text-sm">{card.cvv}</p>
                </div>
              )}
              <p className="text-xs opacity-60 uppercase">Expiry</p>
              <p className="font-mono">{card.expiry}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualCard;


import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isDestructive = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10 sm:items-center sm:p-0">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      ></div>

      <div className="relative transform overflow-hidden rounded-3xl bg-[var(--tg-theme-bg-color, #ffffff)] p-6 text-left shadow-2xl transition-all w-full max-w-sm border border-gray-100/10">
        <div className="text-center">
          <h3 className="text-lg font-bold leading-6 text-[var(--tg-theme-text-color)] mb-2">
            {title}
          </h3>
          <p className="text-sm opacity-60 mb-8">
            {message}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className={`w-full py-4 rounded-2xl font-bold text-white transition-transform active:scale-95 shadow-lg ${
              isDestructive ? 'bg-red-500 shadow-red-200' : 'bg-indigo-600 shadow-indigo-200'
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="w-full py-4 rounded-2xl font-bold opacity-50 active:bg-black/5"
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;

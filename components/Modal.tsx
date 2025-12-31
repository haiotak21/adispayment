import React from "react";

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
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
      {/* Enhanced Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onCancel}
      ></div>

      {/* Modal Container */}
      <div className="relative transform overflow-hidden rounded-[40px] bg-white p-8 text-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] transition-all w-full max-w-sm border border-gray-100 animate-scale-in">
        <div className="mb-6">
          <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">
            {title}
          </h3>
          <p className="text-sm font-medium text-gray-500 leading-relaxed px-4">
            {message}
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-wider text-white transition-all active:scale-95 shadow-xl ${
              isDestructive
                ? "bg-red-500 shadow-red-200 hover:bg-red-600"
                : "bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700"
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-wider text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
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

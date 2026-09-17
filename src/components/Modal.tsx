import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  buttonText: string;
  onAction: () => void;
  icon?: ReactNode;
}

export function Modal({ isOpen, title, children, buttonText, onAction, icon }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/20 max-w-sm w-full text-center flex flex-col items-center"
          >
            {icon && <div className="mb-4">{icon}</div>}
            <h2 className="text-3xl font-black text-white mb-2">{title}</h2>
            <div className="text-white/80 mb-8 w-full text-lg">
              {children}
            </div>
            <button
              onClick={onAction}
              className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-400 hover:to-orange-300 active:scale-95 transition-all rounded-xl text-white font-bold text-xl shadow-[0_0_20px_rgba(236,72,153,0.5)]"
            >
              {buttonText}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

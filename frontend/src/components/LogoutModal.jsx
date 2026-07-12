'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="relative glass-input p-6 rounded-2xl shadow-2xl flex flex-col max-w-sm w-full mx-4 z-10 bg-[#09090b]/90"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Sign out</h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">Are you sure you want to log out of your account?</p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors shadow-lg"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

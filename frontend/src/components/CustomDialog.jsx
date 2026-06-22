import React from 'react';
import { AlertTriangle, Trash2, CheckCircle } from 'lucide-react';

const CustomDialog = ({ isOpen, type, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div 
        className={`card max-w-sm w-full mx-4 animate-fade-in text-center p-6 shadow-xl ${type === 'delete' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : ''}`} 
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 ${
          type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' :
          type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' :
          type === 'delete' ? 'bg-red-100 text-red-600 dark:bg-red-800/50 dark:text-red-400' :
          'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
        }`}>
          {type === 'error' ? <AlertTriangle size={24} /> : 
           type === 'success' ? <CheckCircle size={24} /> : 
           type === 'delete' ? <Trash2 size={24} /> :
           <CheckCircle size={24} />}
        </div>
        
        <h3 className={`text-lg font-bold mb-2 ${type === 'delete' ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
          {title}
        </h3>
        
        <p className={`mb-6 ${type === 'delete' ? 'text-red-600/80 dark:text-red-300' : 'text-slate-500'}`}>
          {message}
        </p>
        
        {type === 'delete' || type === 'confirm' ? (
          <div className="flex gap-2">
            <button 
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
                type === 'delete' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`} 
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button 
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
                type === 'delete'
                  ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
              }`} 
              onClick={onCancel}
            >
              {cancelText}
            </button>
          </div>
        ) : (
          <button className="btn-primary w-full justify-center" onClick={onCancel}>
            {confirmText}
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomDialog;

import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { X } from 'lucide-react';

export function PWAInstallPrompt() {
  const { canInstall, install, isIOSStandalone } = usePWAInstall();
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible || !canInstall || isIOSStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Instalar MobiMap
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Baixe o app e acesse offline
            </p>
            <button
              onClick={() => {
                install();
                setIsVisible(false);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Instalar
            </button>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

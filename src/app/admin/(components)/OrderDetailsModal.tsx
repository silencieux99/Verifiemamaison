'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EnvelopeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface Order {
  id: string;
  customerEmail?: string;
  customerUid?: string;
  amount?: number;
  status?: string;
  sku?: string;
  productName?: string;
  creditsAdded?: number;
  reportId?: string;
  createdAt?: number;
  houseData?: {
    address?: string;
    postalCode?: string;
    city?: string;
  };
  paymentIntentId?: string;
  pdfUrl?: string;
  [key: string]: any;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!order) return null;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendEmail = () => {
    if (order.customerEmail) {
      window.location.href = `mailto:${order.customerEmail}?subject=Commande ${order.id}`;
    }
  };

  const handleViewReport = () => {
    if (order.reportId) {
      window.open(`/report/${order.reportId}`, '_blank');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                    Détails de la commande
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Informations principales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">ID Commande</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{order.id}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Statut</label>
                      <p className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'paid' || order.status === 'COMPLETE' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : order.status === 'pending' || order.status === 'PROCESSING'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {order.status || 'N/A'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email client</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{order.customerEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Montant</label>
                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {order.amount ? `${(order.amount / 100).toFixed(2)}€` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Produit</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{order.productName || order.sku || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Crédits ajoutés</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{order.creditsAdded || 0}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Date de création</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(order.createdAt)}</p>
                    </div>
                    {order.paymentIntentId && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Payment Intent ID</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono text-xs break-all">
                          {order.paymentIntentId}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Adresse du bien */}
                  {order.houseData && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Adresse analysée</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {order.houseData.address || ''} {order.houseData.postalCode || ''} {order.houseData.city || ''}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {order.reportId && (
                      <button
                        onClick={handleViewReport}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        Voir le rapport
                      </button>
                    )}
                    {order.customerEmail && (
                      <button
                        onClick={handleSendEmail}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        <EnvelopeIcon className="w-4 h-4" />
                        Envoyer un email
                      </button>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}



import React from "react";
import { UserNotification, PaymentTransaction } from "../types";
import { RoomDatabaseRepository } from "../data/roomStorage";
import { Bell, X, Check, FileText, CheckCircle2, Clock, AlertCircle, Trash2 } from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userUid?: string;
  onSelectTransactionForReceipt?: (tx: PaymentTransaction) => void;
  onOpenReceipt?: (tx: PaymentTransaction) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  userUid = "user_massaw_01",
  onSelectTransactionForReceipt,
  onOpenReceipt,
}) => {
  const roomRepo = RoomDatabaseRepository.getInstance();
  const notifications = roomRepo.getNotificationsByUser(userUid);
  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    roomRepo.markAllNotificationsAsRead(userUid);
  };

  const handleDeleteNotification = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    roomRepo.deleteNotification(notifId);
  };

  const handleClearAll = () => {
    if (window.confirm("Voulez-vous effacer toutes vos notifications ?")) {
      notifications.forEach((n) => roomRepo.deleteNotification(n.id));
    }
  };

  const handleNotificationClick = (notif: UserNotification) => {
    if (notif.status === "unread") {
      roomRepo.markNotificationAsRead(notif.id);
    }
    if (notif.transactionId) {
      const allTxs = roomRepo.getAllTransactions();
      const tx = allTxs.find((t) => t.id === notif.transactionId);
      if (tx) {
        if (onSelectTransactionForReceipt) {
          onSelectTransactionForReceipt(tx);
        } else if (onOpenReceipt) {
          onOpenReceipt(tx);
        }
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 my-auto relative animate-in zoom-in-95 border border-slate-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-[#1A237E] flex items-center justify-center relative font-bold shadow-xs">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Centre de Notifications
              </h3>
              <p className="text-xs text-slate-500">
                Statuts des paiements & Alertes opérationnelles
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action bar */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between shrink-0 text-xs">
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Check size={14} />
                <span>Tout marquer comme lu</span>
              </button>
            ) : <span />}

            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ml-auto"
            >
              <Trash2 size={13} />
              <span>Tout effacer</span>
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Bell size={32} className="mx-auto opacity-40" />
              <p className="text-xs font-semibold">Aucune notification pour le moment.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = notif.status === "unread";
              const isApproved = notif.title.includes("Validé");
              const isRejected = notif.title.includes("Rejeté");

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 relative group ${
                    isUnread
                      ? "bg-indigo-50/70 border-indigo-200 shadow-xs hover:bg-indigo-100/70"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-1 pr-4">
                      {isApproved && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
                      {isRejected && <AlertCircle size={16} className="text-rose-600 shrink-0" />}
                      {!isApproved && !isRejected && (
                        <Clock size={16} className="text-amber-600 shrink-0 animate-spin" />
                      )}
                      <h4
                        className={`text-xs font-bold leading-tight ${
                          isUnread ? "text-indigo-950 font-black" : "text-slate-800"
                        }`}
                      >
                        {notif.title}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {isUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(e, notif.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100/80 rounded-md transition-colors cursor-pointer"
                        title="Supprimer la notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>{notif.dateFormatted}</span>

                    {notif.transactionId && (
                      <span className="text-[#1A237E] font-extrabold flex items-center space-x-1 hover:underline">
                        <FileText size={12} />
                        <span>Voir Reçu</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-[#1A237E] hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer shrink-0"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

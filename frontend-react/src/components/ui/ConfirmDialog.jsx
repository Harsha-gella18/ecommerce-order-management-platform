import { Modal } from './Modal.jsx';

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${
            danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-blue hover:bg-blue-600'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

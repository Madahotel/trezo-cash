// Composant Modal de Confirmation simple et réutilisable
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  confirmColor = "bg-red-600 hover:bg-red-700",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Content */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-lg animate-scaleIn">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-gray-500 mt-2">{description}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md ${confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ConfirmationModal;

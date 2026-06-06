import React from "react";

function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "ℹ "}
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default Toast;

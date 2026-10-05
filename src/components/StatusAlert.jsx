import React from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function StatusAlert({ status }) {
  if (!status.text) return null;

  const icons = {
    loading: <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 flex-shrink-0" />,
  };

  return (
    <div
      className={`alert-panel ${status.type}`}
      role={status.type === "error" ? "alert" : "status"}
      aria-live={status.type === "error" ? "assertive" : "polite"}
    >
      {icons[status.type] || <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span>{status.text}</span>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import { db } from "../db/dexie";
import {
  HardDrive,
  RefreshCw,
  CheckCircle,
  Trash2,
  MapPin,
  WifiOff,
} from "lucide-react";

export default function VaultTab({ isOnline, onManualSync, isSyncing }) {
  const [records, setRecords] = useState([]);

  const loadRecords = useCallback(async () => {
    const data = await db.outbox.toArray();
    setRecords(data);
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [isSyncing, loadRecords]);

  const clearItem = async (id) => {
    await db.outbox.delete(id);
    await loadRecords();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4" data-tour="offline-vault">
      <div className="glass-panel p-5 rounded-2xl shadow-2xl">
        <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-sky-400" />
              Offline audit vault
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Field records are stored in this browser and remain here until
              successfully synchronized.
            </p>
          </div>
          <button
            onClick={onManualSync}
            disabled={!isOnline || records.length === 0 || isSyncing}
            className="button-primary disabled:opacity-50"
            data-tour="vault-sync"
          >
            <RefreshCw className={isSyncing ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
            {isSyncing ? "Syncing records…" : `Sync ${records.length} record(s)`}
          </button>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <CheckCircle className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">You’re all caught up</p>
            <p className="mt-1 text-slate-500">
              New offline audits will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 mt-3">
            {!isOnline && (
              <div className="flex items-center gap-2 py-3 text-[11px] text-amber-300">
                <WifiOff className="w-4 h-4" />
                Your records are safe on this device and can sync when you’re
                back online.
              </div>
            )}
            {records.map((r) => (
              <div
                key={r.id}
                className="py-3 flex flex-wrap justify-between items-center gap-3 text-xs"
              >
                <div>
                  <div className="text-slate-200 font-bold flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    {Number(r.lat).toFixed(5)}° N, {Number(r.lon).toFixed(5)}° E
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Saved {new Date(r.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px]">
                    Pending sync
                  </span>
                  <button
                    onClick={() => clearItem(r.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    aria-label={`Remove offline audit at ${r.lat}, ${r.lon}`}
                    title="Remove saved record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Smartphone, CheckCircle, AlertCircle, RefreshCw, LogOut, WifiOff, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectionStatus = "disconnected" | "connecting" | "qr" | "connected";

interface StatusData {
  status: ConnectionStatus;
  phone?: string;
  name?: string;
  qrDataUrl?: string;
}

interface StaffAccount {
  id: string;
  name: string;
  phone?: string;
  status: ConnectionStatus;
}

// Mock staff accounts (in a real app these come from your team/auth system)
const STAFF_ACCOUNTS: StaffAccount[] = [
  { id: "jordan", name: "Reuben Brunton", status: "disconnected" },
  { id: "oliver", name: "Oliver Brunton", status: "disconnected" },
  { id: "matt", name: "Matt Trust", status: "disconnected" },
];

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const config = {
    disconnected: { label: "Disconnected", color: "text-white/40 bg-white/[0.06]", dot: "bg-white/30" },
    connecting: { label: "Connecting…", color: "text-yellow-400 bg-yellow-400/10", dot: "bg-yellow-400 animate-pulse" },
    qr: { label: "Scan QR", color: "text-blue-400 bg-blue-400/10", dot: "bg-blue-400 animate-pulse" },
    connected: { label: "Connected", color: "text-emerald-400 bg-emerald-400/10", dot: "bg-emerald-400" },
  };
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", c.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

function QRCard({ qrDataUrl, onRefresh }: { qrDataUrl: string; onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div
        className="rounded-2xl p-4 border border-white/[0.1]"
        style={{ background: "rgba(255,255,255,0.95)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="WhatsApp QR code" className="w-52 h-52 block" />
      </div>

      <div className="text-center space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-white">Scan with WhatsApp</p>
        <ol className="text-xs text-white/45 space-y-0.5 text-left list-decimal list-inside">
          <li>Open WhatsApp on your phone</li>
          <li>Tap Menu or Settings → Linked Devices</li>
          <li>Tap Link a Device and scan this code</li>
        </ol>
      </div>

      <button
        onClick={onRefresh}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh QR code
      </button>
    </div>
  );
}

function ConnectedCard({
  name,
  phone,
  onDisconnect,
  loading,
}: {
  name?: string;
  phone?: string;
  onDisconnect: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="w-20 h-20 rounded-full bg-emerald-400/10 border-2 border-emerald-400/30 flex items-center justify-center">
        <CheckCircle className="h-9 w-9 text-emerald-400" />
      </div>

      <div className="text-center">
        <p className="text-base font-semibold text-white">{name ?? "Your WhatsApp"}</p>
        {phone && <p className="text-sm text-white/40 mt-0.5">+{phone}</p>}
        <p className="text-xs text-emerald-400 mt-2">WhatsApp connected successfully</p>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <span className="text-xs text-white/50">Messages sync</span>
          <span className="text-xs font-medium text-emerald-400">Active</span>
        </div>
        <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <span className="text-xs text-white/50">Group chats</span>
          <span className="text-xs font-medium text-emerald-400">Enabled</span>
        </div>
        <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <span className="text-xs text-white/50">Send from Zipline</span>
          <span className="text-xs font-medium text-emerald-400">Enabled</span>
        </div>
      </div>

      <button
        onClick={onDisconnect}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-all disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {loading ? "Disconnecting…" : "Disconnect WhatsApp"}
      </button>
    </div>
  );
}

function DisconnectedCard({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="w-20 h-20 rounded-full bg-white/[0.05] border border-white/[0.09] flex items-center justify-center">
        <Smartphone className="h-9 w-9 text-white/25" />
      </div>

      <div className="text-center max-w-xs">
        <p className="text-base font-semibold text-white">Connect Personal WhatsApp</p>
        <p className="text-sm text-white/40 mt-1.5 leading-relaxed">
          Link your personal WhatsApp number to send and receive messages directly from Zipline. No business account required.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2.5">
        {[
          { icon: "💬", label: "Chat with clients from your own number" },
          { icon: "👥", label: "Access your WhatsApp group chats" },
          { icon: "📱", label: "Messages sync in real time" },
        ].map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-3 text-sm text-white/55">
            <span className="text-base w-6 text-center">{icon}</span>
            {label}
          </div>
        ))}
      </div>

      <button
        onClick={onConnect}
        className="gradient-button text-white font-semibold px-8 py-3 rounded-xl text-sm"
      >
        Connect WhatsApp
      </button>
    </div>
  );
}

export default function WhatsAppSettingsPage() {
  const [statusData, setStatusData] = useState<StatusData>({ status: "disconnected" });
  const [loading, setLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"connect" | "team">("connect");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
      setStatusData({ status: "disconnected" });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll for status updates (especially for QR → connected transition)
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch("/api/whatsapp/disconnect", { method: "POST" });
      await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">WhatsApp Integration</h1>
        <p className="text-sm text-white/40 mt-1">
          Connect personal WhatsApp numbers to chat with clients directly from Zipline.
        </p>
      </div>

      {/* Server status banner */}
      {serverOnline === false && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
          <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-400">WhatsApp server offline</p>
            <p className="text-xs text-white/40 mt-0.5">
              Start the bridge server:{" "}
              <code className="font-mono bg-white/[0.06] px-1.5 py-0.5 rounded text-white/60">
                cd server && npm run dev
              </code>
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] w-fit">
        {(["connect", "team"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-white/[0.1] text-white"
                : "text-white/40 hover:text-white/70"
            )}
          >
            {tab === "connect" ? (
              <span className="flex items-center gap-2"><Smartphone className="h-3.5 w-3.5" /> My Account</span>
            ) : (
              <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Team Accounts</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "connect" && (
        <div
          className="rounded-2xl border"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <WhatsAppLogo className="h-5 w-5" />
              <span className="text-sm font-semibold text-white">Personal WhatsApp</span>
            </div>
            <StatusBadge status={statusData.status} />
          </div>

          {/* Card body */}
          <div className="px-5">
            {statusData.status === "disconnected" && (
              <DisconnectedCard onConnect={fetchStatus} />
            )}
            {(statusData.status === "connecting") && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#FF4533] animate-spin" />
                <p className="text-sm text-white/40">Connecting to WhatsApp…</p>
              </div>
            )}
            {statusData.status === "qr" && statusData.qrDataUrl && (
              <QRCard qrDataUrl={statusData.qrDataUrl} onRefresh={fetchStatus} />
            )}
            {statusData.status === "connected" && (
              <ConnectedCard
                name={statusData.name}
                phone={statusData.phone}
                onDisconnect={handleDisconnect}
                loading={loading}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "team" && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-sm font-semibold text-white">Staff WhatsApp Accounts</p>
            <p className="text-xs text-white/40 mt-0.5">
              Each team member can connect their own personal number.
            </p>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {STAFF_ACCOUNTS.map((account) => (
              <div key={account.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: "#FF4533" }}
                  >
                    {account.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{account.name}</p>
                    {account.phone && (
                      <p className="text-xs text-white/40">{account.phone}</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={account.id === "jordan" ? statusData.status : "disconnected"} />
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-white/[0.06]">
            <p className="text-xs text-white/30">
              Team members connect their own WhatsApp by visiting Settings → WhatsApp on their account.
            </p>
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="mt-0.5">
          <WifiOff className="h-4 w-4 text-white/25" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-white/50">Uses Baileys (open source)</p>
          <p className="text-xs text-white/30 leading-relaxed">
            This uses an unofficial WhatsApp Web API. No business account or phone number needed.
            Baileys mirrors your existing WhatsApp — everything works: groups, media, read receipts.
          </p>
        </div>
      </div>
    </div>
  );
}

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="#25D366" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

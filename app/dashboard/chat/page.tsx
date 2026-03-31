"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Hash,
  Lock,
  Plus,
  Search,
  Send,
  Smile,
  Paperclip,
  Phone,
  Video,
  MoreHorizontal,
  Users,
  Crown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  conversations,
  messageThreads,
  type Conversation,
  type Message,
  type GroupParticipant,
} from "@/lib/chat-data";

// ─── WhatsApp Icon ────────────────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  initials,
  color,
  size = "md",
  online,
}: {
  initials: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg";
  online?: boolean;
}) {
  const sizes = {
    xs: "w-6 h-6 text-[9px]",
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-10 h-10 text-sm",
  };
  return (
    <div className="relative flex-shrink-0">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold text-white",
          sizes[size]
        )}
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#07070e]",
            online ? "bg-emerald-400" : "bg-white/20"
          )}
        />
      )}
    </div>
  );
}

// ─── Conversation Item ────────────────────────────────────────────────────────
function ConversationItem({
  convo,
  isActive,
  onClick,
}: {
  convo: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group",
        isActive ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          initials={convo.initials!}
          color={convo.avatarColor!}
          size="md"
          online={convo.online}
        />
        {(convo.type === "whatsapp" || convo.type === "whatsapp-group") && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#25D366] flex items-center justify-center">
            <WhatsAppIcon className="w-2.5 h-2.5 text-white" />
          </span>
        )}
        {convo.type === "channel" && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#1a1a2e] border border-white/10 flex items-center justify-center">
            {convo.isPrivate ? (
              <Lock className="w-2 h-2 text-white/50" />
            ) : (
              <Hash className="w-2 h-2 text-white/50" />
            )}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "text-sm font-semibold truncate",
              isActive ? "text-white" : "text-white/90"
            )}
          >
            {convo.name}
          </span>
          <span className="text-[10px] text-white/30 flex-shrink-0">{convo.time}</span>
        </div>
        <p className="text-xs text-white/40 truncate mt-0.5">
          {convo.lastSender && (
            <span className="text-white/55">{convo.lastSender}: </span>
          )}
          {convo.lastMessage}
        </p>
      </div>

      {!!convo.unread && (
        <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#FF4533] text-white text-[10px] font-bold flex items-center justify-center px-1">
          {convo.unread}
        </span>
      )}
    </button>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  message,
  showSender,
}: {
  message: Message;
  showSender: boolean;
}) {
  if (message.isOwn) {
    return (
      <div className="flex items-end gap-2.5 justify-end">
        <div className="max-w-[70%]">
          <div
            className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white leading-relaxed"
            style={{ background: "linear-gradient(135deg, #cc2010, #ff4533)" }}
          >
            {message.content}
          </div>
          <p className="text-[10px] text-white/25 mt-1 text-right">{message.time}</p>
        </div>
        <Avatar
          initials={message.senderInitials}
          color={message.senderColor}
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2.5">
      <Avatar
        initials={message.senderInitials}
        color={message.senderColor}
        size="sm"
      />
      <div className="max-w-[70%]">
        {showSender && (
          <p
            className="text-[11px] font-medium mb-1 ml-1"
            style={{ color: message.senderColor }}
          >
            {message.senderName}
          </p>
        )}
        <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/[0.08] text-sm text-white leading-relaxed">
          {message.content}
        </div>
        <p className="text-[10px] text-white/25 mt-1 ml-1">{message.time}</p>
      </div>
    </div>
  );
}

// ─── Participants Panel ───────────────────────────────────────────────────────
function ParticipantsPanel({
  participants,
  count,
  onClose,
}: {
  participants: GroupParticipant[];
  count?: number;
  onClose: () => void;
}) {
  return (
    <div
      className="w-[240px] flex-shrink-0 flex flex-col border-l border-white/[0.06]"
      style={{ background: "rgba(7,7,14,0.5)" }}
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-white/40" />
          <span className="text-xs font-semibold text-white/70">
            Members ({count ?? participants.length})
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Admins first */}
        {participants.filter((p) => p.isAdmin).length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider px-4 mb-1">
              Admins
            </p>
            {participants
              .filter((p) => p.isAdmin)
              .map((p) => (
                <ParticipantRow key={p.phone} participant={p} />
              ))}
          </div>
        )}
        {/* Others */}
        <div>
          {participants.filter((p) => !p.isAdmin).length > 0 && (
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider px-4 mb-1">
              Members
            </p>
          )}
          {participants
            .filter((p) => !p.isAdmin)
            .map((p) => (
              <ParticipantRow key={p.phone} participant={p} />
            ))}
        </div>
      </div>
    </div>
  );
}

function ParticipantRow({ participant: p }: { participant: GroupParticipant }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.03] rounded-lg mx-1 transition-colors">
      <div className="relative flex-shrink-0">
        <Avatar initials={p.initials} color={p.color} size="xs" online={p.isOnline} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-white/80 truncate">{p.name}</p>
          {p.isAdmin && (
            <Crown className="h-2.5 w-2.5 text-yellow-400/70 flex-shrink-0" />
          )}
        </div>
        <p className="text-[10px] text-white/30 truncate">{p.phone}</p>
      </div>
    </div>
  );
}

// ─── Live WhatsApp hook ───────────────────────────────────────────────────────
interface WAMessage {
  id: string;
  jid: string;
  fromMe: boolean;
  senderName: string;
  senderJid: string;
  content: string;
  timestamp: number;
  type: string;
}

interface WAChat {
  jid: string;
  name: string;
  phone: string;
  isGroup: boolean;
  lastMessage?: string;
  lastSender?: string;
  lastMessageTime?: number;
  unreadCount?: number;
  participants?: Array<{
    jid: string;
    name: string;
    phone: string;
    isAdmin: boolean;
  }>;
}

type WAStatus = "disconnected" | "connecting" | "qr" | "connected";

function useWhatsApp() {
  const [waStatus, setWaStatus] = useState<WAStatus>("disconnected");
  const [waChats, setWaChats] = useState<WAChat[]>([]);

  useEffect(() => {
    let es: EventSource | null = null;

    const connect = () => {
      try {
        es = new EventSource("http://localhost:3001/events");

        es.addEventListener("status", (e) => {
          const data = JSON.parse(e.data);
          setWaStatus(data.status);
        });

        es.addEventListener("message", () => {
          // Refresh chats when new message arrives
          fetchChats();
        });

        es.onerror = () => {
          setWaStatus("disconnected");
          es?.close();
          // Retry after 5s
          setTimeout(connect, 5000);
        };
      } catch {
        setWaStatus("disconnected");
      }
    };

    const fetchChats = async () => {
      try {
        const res = await fetch("/api/whatsapp/chats");
        if (res.ok) {
          const data = await res.json();
          setWaChats(data);
        }
      } catch {
        // server offline
      }
    };

    // Initial status check
    fetch("/api/whatsapp/status")
      .then((r) => r.json())
      .then((d) => {
        setWaStatus(d.status);
        if (d.status === "connected") fetchChats();
      })
      .catch(() => {});

    connect();
    return () => es?.close();
  }, []);

  const fetchMessages = useCallback(async (jid: string): Promise<WAMessage[]> => {
    try {
      const res = await fetch(`/api/whatsapp/messages?jid=${encodeURIComponent(jid)}`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  }, []);

  const sendMessage = useCallback(async (jid: string, text: string) => {
    await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jid, text }),
    });
  }, []);

  return { waStatus, waChats, fetchMessages, sendMessage };
}

// ─── Convert WA message to display format ─────────────────────────────────────
function waMessageToDisplay(msg: WAMessage): Message {
  const senderColor = msg.fromMe ? "#FF4533" : stringToColor(msg.senderJid);
  const initials = msg.senderName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return {
    id: msg.id,
    senderId: msg.senderJid,
    senderName: msg.senderName,
    senderInitials: initials || "?",
    senderColor,
    content: msg.content,
    time: new Date(msg.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    isOwn: msg.fromMe,
  };
}

function stringToColor(str: string): string {
  const colors = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#0EA5E9", "#14B8A6"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ─── Data setup ───────────────────────────────────────────────────────────────
const teamChannels = conversations.filter((c) => c.type === "channel");
const directMessages = conversations.filter((c) => c.type === "dm");
const whatsappDMs = conversations.filter((c) => c.type === "whatsapp");
const whatsappGroups = conversations.filter((c) => c.type === "whatsapp-group");

// ─── Main Chat Page ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const [activeId, setActiveId] = useState<string | null>("general");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showParticipants, setShowParticipants] = useState(false);
  const [liveMessages, setLiveMessages] = useState<Message[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { waStatus, waChats, fetchMessages, sendMessage } = useWhatsApp();

  const activeConvo = conversations.find((c) => c.id === activeId) ?? null;
  const isWhatsAppConvo =
    activeConvo?.type === "whatsapp" || activeConvo?.type === "whatsapp-group";

  // Fetch live WA messages when switching to a WA conversation
  useEffect(() => {
    if (!isWhatsAppConvo || waStatus !== "connected") {
      setLiveMessages(null);
      return;
    }
    // Find matching WA chat by name
    const waChat = waChats.find(
      (c) => c.name === activeConvo?.name || c.jid === activeId
    );
    if (!waChat) {
      setLiveMessages(null);
      return;
    }
    fetchMessages(waChat.jid).then((msgs) => {
      setLiveMessages(msgs.map(waMessageToDisplay));
    });
  }, [activeId, isWhatsAppConvo, waStatus, waChats, fetchMessages, activeConvo]);

  const messages: Message[] =
    liveMessages ?? (activeId ? (messageThreads[activeId] ?? []) : []);

  const isGroup =
    activeConvo?.type === "whatsapp-group" ||
    activeConvo?.type === "channel";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, messages.length]);

  // Close participants panel when switching away from a group
  useEffect(() => {
    if (!isGroup) setShowParticipants(false);
  }, [isGroup]);

  const filteredConvos = search
    ? conversations.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const handleSend = async () => {
    if (!input.trim() || !activeId) return;
    const text = input.trim();
    setInput("");

    if (isWhatsAppConvo && waStatus === "connected") {
      const waChat = waChats.find(
        (c) => c.name === activeConvo?.name || c.jid === activeId
      );
      if (waChat) {
        await sendMessage(waChat.jid, text);
        // Refetch messages
        const msgs = await fetchMessages(waChat.jid);
        setLiveMessages(msgs.map(waMessageToDisplay));
      }
    }
    // For mock conversations, just clear input (no optimistic update for demo)
  };

  const waConnected = waStatus === "connected";

  return (
    <div
      className="-m-5 lg:-m-6 flex overflow-hidden"
      style={{ height: "calc(100vh - 56px)" }}
    >
      {/* ── Conversation sidebar ─────────────────────────────────────── */}
      <div
        className="w-[280px] flex-shrink-0 flex flex-col border-r border-white/[0.06]"
        style={{ background: "rgba(7,7,14,0.4)" }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">Chat</h2>
            <button className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/60 hover:text-white transition-all">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-white/[0.05] border border-white/[0.07] text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
          {filteredConvos ? (
            <div className="space-y-0.5">
              {filteredConvos.map((c) => (
                <ConversationItem
                  key={c.id}
                  convo={c}
                  isActive={activeId === c.id}
                  onClick={() => {
                    setActiveId(c.id);
                    setSearch("");
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              {/* Team Channels */}
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider px-3 mb-1">
                  Team Channels
                </p>
                <div className="space-y-0.5">
                  {teamChannels.map((c) => (
                    <ConversationItem
                      key={c.id}
                      convo={c}
                      isActive={activeId === c.id}
                      onClick={() => setActiveId(c.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Direct Messages */}
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider px-3 mb-1">
                  Direct Messages
                </p>
                <div className="space-y-0.5">
                  {directMessages.map((c) => (
                    <ConversationItem
                      key={c.id}
                      convo={c}
                      isActive={activeId === c.id}
                      onClick={() => setActiveId(c.id)}
                    />
                  ))}
                </div>
              </div>

              {/* WhatsApp DMs */}
              <div>
                <div className="flex items-center justify-between px-3 mb-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
                      WhatsApp
                    </p>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                        waConnected
                          ? "text-[#25D366] bg-[#25D366]/10"
                          : "text-white/30 bg-white/[0.06]"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          waConnected ? "bg-[#25D366]" : "bg-white/20"
                        )}
                      />
                      {waConnected ? "Live" : "Demo"}
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {whatsappDMs.map((c) => (
                    <ConversationItem
                      key={c.id}
                      convo={c}
                      isActive={activeId === c.id}
                      onClick={() => setActiveId(c.id)}
                    />
                  ))}
                </div>
              </div>

              {/* WhatsApp Group Chats */}
              <div>
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider px-3 mb-1">
                  Group Chats
                </p>
                <div className="space-y-0.5">
                  {whatsappGroups.map((c) => (
                    <ConversationItem
                      key={c.id}
                      convo={c}
                      isActive={activeId === c.id}
                      onClick={() => {
                        setActiveId(c.id);
                        setShowParticipants(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Main chat area ───────────────────────────────────────────── */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {activeConvo ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header */}
            <div className="h-14 flex-shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar
                    initials={activeConvo.initials!}
                    color={activeConvo.avatarColor!}
                    size="md"
                    online={activeConvo.online}
                  />
                  {(activeConvo.type === "whatsapp" ||
                    activeConvo.type === "whatsapp-group") && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#25D366] flex items-center justify-center">
                      <WhatsAppIcon className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white leading-none">
                      {activeConvo.name}
                    </p>
                    {(activeConvo.type === "whatsapp" ||
                      activeConvo.type === "whatsapp-group") && (
                      <span
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                          waConnected && liveMessages
                            ? "text-[#25D366] bg-[#25D366]/10"
                            : "text-white/30 bg-white/[0.06]"
                        )}
                      >
                        {waConnected && liveMessages ? "Live" : "Demo"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/35 mt-0.5">
                    {activeConvo.type === "whatsapp"
                      ? activeConvo.phone
                      : activeConvo.type === "whatsapp-group"
                      ? `${activeConvo.participantCount ?? activeConvo.participants?.length ?? 0} members`
                      : activeConvo.online
                      ? "Online"
                      : activeConvo.type === "channel"
                      ? "Team channel"
                      : "Offline"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isGroup && (
                  <button
                    onClick={() => setShowParticipants((v) => !v)}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                      showParticipants
                        ? "bg-white/[0.1] text-white"
                        : "hover:bg-white/[0.05] text-white/40 hover:text-white/70"
                    )}
                    title="View members"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                )}
                <button className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-white/70 transition-all">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-white/70 transition-all">
                  <Video className="h-4 w-4" />
                </button>
                <button className="w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-white/70 transition-all">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-4"
                    style={{ backgroundColor: activeConvo.avatarColor }}
                  >
                    {activeConvo.initials}
                  </div>
                  <p className="text-white font-semibold">{activeConvo.name}</p>
                  <p className="text-white/35 text-sm mt-1">Start the conversation</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const prevMsg = messages[i - 1];
                  const showSender: boolean =
                    isGroup &&
                    !msg.isOwn &&
                    (!prevMsg ||
                      prevMsg.senderId !== msg.senderId ||
                      !!prevMsg.isOwn);
                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      showSender={showSender}
                    />
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose */}
            <div className="flex-shrink-0 px-4 pb-4">
              <div
                className="flex items-end gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <button className="text-white/35 hover:text-white/60 transition-colors flex-shrink-0 pb-0.5">
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Message ${activeConvo.name}…`}
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 resize-none focus:outline-none leading-relaxed min-h-[22px] max-h-[120px]"
                  style={{ scrollbarWidth: "none" }}
                />
                <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
                  <button className="text-white/35 hover:text-white/60 transition-colors">
                    <Smile className="h-4 w-4" />
                  </button>
                  <button
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all ml-1",
                      input.trim()
                        ? "bg-[#FF4533] text-white hover:bg-[#e03020]"
                        : "bg-white/[0.06] text-white/25"
                    )}
                    onClick={handleSend}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-white/20" />
            </div>
            <p className="text-white font-semibold text-lg">Select a conversation</p>
            <p className="text-white/35 text-sm mt-1 max-w-xs">
              Choose a channel, DM, or WhatsApp conversation from the left
            </p>
          </div>
        )}

        {/* ── Participants panel (right side) ─────────────────────── */}
        {showParticipants &&
          isGroup &&
          activeConvo?.participants &&
          activeConvo.participants.length > 0 && (
            <ParticipantsPanel
              participants={activeConvo.participants}
              count={activeConvo.participantCount}
              onClose={() => setShowParticipants(false)}
            />
          )}
      </div>
    </div>
  );
}

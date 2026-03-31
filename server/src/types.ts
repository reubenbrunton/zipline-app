export type ConnectionStatus = 'disconnected' | 'connecting' | 'qr' | 'connected';

export interface WhatsAppContact {
  jid: string;
  name: string;
  phone: string;
  pushName?: string;
  isGroup: boolean;
  participants?: GroupParticipant[];
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: number;
  lastSender?: string;
  profilePicUrl?: string;
}

export interface GroupParticipant {
  jid: string;
  name: string;
  phone: string;
  isAdmin: boolean;
}

export interface ChatMessage {
  id: string;
  jid: string;
  fromMe: boolean;
  senderJid: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker';
  mediaUrl?: string;
  quoted?: {
    content: string;
    senderName: string;
  };
}

export interface StatusResponse {
  status: ConnectionStatus;
  phone?: string;
  name?: string;
  qrDataUrl?: string;
}

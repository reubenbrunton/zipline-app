import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
  WAMessage,
  WASocket,
  BaileysEventEmitter,
  jidNormalizedUser,
  isJidGroup,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
import qrcode from 'qrcode';
import path from 'path';
import { EventEmitter } from 'events';
import {
  ConnectionStatus,
  WhatsAppContact,
  ChatMessage,
  GroupParticipant,
  StatusResponse,
} from './types';

const logger = P({ level: 'silent' });
const AUTH_PATH = path.join(__dirname, '../../auth_info_baileys');
const MAX_MESSAGES_PER_CHAT = 100;

export class WhatsAppClient extends EventEmitter {
  private sock: WASocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private qrDataUrl: string | null = null;
  private connectedPhone: string | null = null;
  private connectedName: string | null = null;

  // In-memory store
  private contacts: Map<string, WhatsAppContact> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();

  async connect() {
    this.status = 'connecting';
    this.emit('status', this.getStatus());

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: false,
      browser: ['Zipline', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.status = 'qr';
        try {
          this.qrDataUrl = await qrcode.toDataURL(qr, { width: 256, margin: 2 });
        } catch {
          this.qrDataUrl = null;
        }
        this.emit('status', this.getStatus());
        console.log('[WhatsApp] QR code ready — scan with WhatsApp');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log('[WhatsApp] Connection closed. Reconnect:', shouldReconnect);

        this.status = 'disconnected';
        this.qrDataUrl = null;
        this.connectedPhone = null;
        this.connectedName = null;
        this.emit('status', this.getStatus());

        if (shouldReconnect) {
          setTimeout(() => this.connect(), 3000);
        }
      }

      if (connection === 'open') {
        this.status = 'connected';
        this.qrDataUrl = null;
        const me = this.sock!.user;
        this.connectedPhone = me?.id?.split(':')[0] ?? null;
        this.connectedName = me?.name ?? null;
        this.emit('status', this.getStatus());
        console.log('[WhatsApp] Connected as', this.connectedName, this.connectedPhone);
      }
    });

    // Sync contacts
    this.sock.ev.on('contacts.upsert', (contacts) => {
      for (const contact of contacts) {
        const jid = jidNormalizedUser(contact.id);
        const existing = this.contacts.get(jid) ?? {};
        this.contacts.set(jid, {
          ...existing as any,
          jid,
          name: contact.name ?? contact.notify ?? this.phoneFromJid(jid),
          phone: this.phoneFromJid(jid),
          pushName: contact.notify,
          isGroup: isJidGroup(jid),
        });
      }
    });

    // Sync chats (for last message, unread count)
    this.sock.ev.on('chats.upsert', (chats) => {
      for (const chat of chats) {
        const jid = chat.id;
        const existing = this.contacts.get(jid) ?? {};
        this.contacts.set(jid, {
          ...existing as any,
          jid,
          name: (existing as any).name ?? this.phoneFromJid(jid),
          phone: this.phoneFromJid(jid),
          isGroup: isJidGroup(jid),
          unreadCount: chat.unreadCount ?? 0,
        });
      }
    });

    // Sync group metadata
    this.sock.ev.on('groups.upsert', async (groups) => {
      for (const group of groups) {
        const participants: GroupParticipant[] = group.participants.map((p) => ({
          jid: p.id,
          name: this.contacts.get(jidNormalizedUser(p.id))?.name ?? this.phoneFromJid(p.id),
          phone: this.phoneFromJid(p.id),
          isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
        }));

        this.contacts.set(group.id, {
          jid: group.id,
          name: group.subject,
          phone: '',
          isGroup: true,
          participants,
        });
      }
    });

    // Incoming messages
    this.sock.ev.on('messages.upsert', async ({ messages: msgs, type }) => {
      for (const msg of msgs) {
        if (!msg.message) continue;

        const jid = msg.key.remoteJid!;
        const normalizedJid = jid;
        const chatMessage = this.parseMessage(msg);
        if (!chatMessage) continue;

        // Ensure contact exists
        if (!this.contacts.has(normalizedJid)) {
          this.contacts.set(normalizedJid, {
            jid: normalizedJid,
            name: msg.pushName ?? this.phoneFromJid(normalizedJid),
            phone: this.phoneFromJid(normalizedJid),
            isGroup: !!isJidGroup(normalizedJid),
          });
        }

        // Update last message on contact
        const contact = this.contacts.get(normalizedJid)!;
        contact.lastMessage = chatMessage.content;
        contact.lastMessageTime = chatMessage.timestamp;
        contact.lastSender = chatMessage.fromMe ? 'You' : chatMessage.senderName;
        if (!chatMessage.fromMe && type === 'notify') {
          contact.unreadCount = (contact.unreadCount ?? 0) + 1;
        }

        // Store message
        if (!this.messages.has(normalizedJid)) {
          this.messages.set(normalizedJid, []);
        }
        const thread = this.messages.get(normalizedJid)!;
        thread.push(chatMessage);
        if (thread.length > MAX_MESSAGES_PER_CHAT) {
          thread.splice(0, thread.length - MAX_MESSAGES_PER_CHAT);
        }

        this.emit('message', { jid: normalizedJid, message: chatMessage });
      }
    });
  }

  private parseMessage(msg: WAMessage): ChatMessage | null {
    const jid = msg.key.remoteJid!;
    const isGroup = isJidGroup(jid);
    const fromMe = msg.key.fromMe ?? false;

    const senderJid = isGroup
      ? (msg.key.participant ?? msg.participant ?? jid)
      : (fromMe ? (this.sock?.user?.id ?? '') : jid);

    const senderName = fromMe
      ? (this.connectedName ?? 'You')
      : (msg.pushName ?? this.contacts.get(jidNormalizedUser(senderJid))?.name ?? this.phoneFromJid(senderJid));

    let content = '';
    let type: ChatMessage['type'] = 'text';

    if (msg.message?.conversation) {
      content = msg.message.conversation;
    } else if (msg.message?.extendedTextMessage?.text) {
      content = msg.message.extendedTextMessage.text;
    } else if (msg.message?.imageMessage) {
      content = msg.message.imageMessage.caption ?? '[Image]';
      type = 'image';
    } else if (msg.message?.videoMessage) {
      content = msg.message.videoMessage.caption ?? '[Video]';
      type = 'video';
    } else if (msg.message?.audioMessage) {
      content = '[Voice message]';
      type = 'audio';
    } else if (msg.message?.documentMessage) {
      content = msg.message.documentMessage.fileName ?? '[Document]';
      type = 'document';
    } else if (msg.message?.stickerMessage) {
      content = '[Sticker]';
      type = 'sticker';
    } else {
      return null; // Unsupported type
    }

    return {
      id: msg.key.id!,
      jid,
      fromMe,
      senderJid,
      senderName,
      content,
      timestamp: (msg.messageTimestamp as number) * 1000,
      type,
    };
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    if (!this.sock || this.status !== 'connected') {
      throw new Error('WhatsApp not connected');
    }
    await this.sock.sendMessage(jid, { text });
  }

  async getGroupMetadata(jid: string) {
    if (!this.sock || this.status !== 'connected') return null;
    try {
      const meta = await this.sock.groupMetadata(jid);
      return meta;
    } catch {
      return null;
    }
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.status = 'disconnected';
      this.connectedPhone = null;
      this.connectedName = null;
      this.emit('status', this.getStatus());
    }
  }

  getStatus(): StatusResponse {
    return {
      status: this.status,
      phone: this.connectedPhone ?? undefined,
      name: this.connectedName ?? undefined,
      qrDataUrl: this.qrDataUrl ?? undefined,
    };
  }

  getChats(): WhatsAppContact[] {
    return Array.from(this.contacts.values())
      .filter((c) => c.lastMessage !== undefined || c.isGroup)
      .sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0));
  }

  getMessages(jid: string): ChatMessage[] {
    return this.messages.get(jid) ?? [];
  }

  markRead(jid: string) {
    const contact = this.contacts.get(jid);
    if (contact) contact.unreadCount = 0;
  }

  private phoneFromJid(jid: string): string {
    return '+' + (jid.split('@')[0] ?? jid).replace(/[^0-9]/g, '');
  }
}

export const whatsapp = new WhatsAppClient();

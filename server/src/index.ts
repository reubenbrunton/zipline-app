import express, { Request, Response } from 'express';
import cors from 'cors';
import { whatsapp } from './whatsapp-client';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ─── SSE clients for real-time updates ───────────────────────────────────────
const sseClients: Set<Response> = new Set();

function broadcastSSE(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => res.write(payload));
}

whatsapp.on('status', (data) => broadcastSSE('status', data));
whatsapp.on('message', (data) => broadcastSSE('message', data));

// ─── Routes ──────────────────────────────────────────────────────────────────

// SSE stream for real-time updates
app.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current status immediately
  res.write(`event: status\ndata: ${JSON.stringify(whatsapp.getStatus())}\n\n`);

  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// Connection status + QR code
app.get('/status', (req: Request, res: Response) => {
  res.json(whatsapp.getStatus());
});

// Disconnect / logout
app.post('/disconnect', async (req: Request, res: Response) => {
  try {
    await whatsapp.disconnect();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// List all chats
app.get('/chats', (req: Request, res: Response) => {
  const chats = whatsapp.getChats();
  res.json(chats);
});

// Get messages for a specific chat
app.get('/messages/:jid', (req: Request, res: Response) => {
  const { jid } = req.params;
  const decodedJid = decodeURIComponent(jid);
  const messages = whatsapp.getMessages(decodedJid);
  whatsapp.markRead(decodedJid);
  res.json(messages);
});

// Send a message
app.post('/send', async (req: Request, res: Response) => {
  const { jid, text } = req.body as { jid: string; text: string };
  if (!jid || !text) {
    res.status(400).json({ error: 'jid and text are required' });
    return;
  }
  try {
    await whatsapp.sendMessage(jid, text);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get group metadata
app.get('/group/:jid', async (req: Request, res: Response) => {
  const { jid } = req.params;
  const decodedJid = decodeURIComponent(jid);
  try {
    const meta = await whatsapp.getGroupMetadata(decodedJid);
    res.json(meta ?? {});
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] WhatsApp bridge running on http://localhost:${PORT}`);
  console.log('[Server] Starting WhatsApp client...');
  whatsapp.connect().catch(console.error);
});

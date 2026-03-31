export type ConversationType = "channel" | "dm" | "whatsapp" | "whatsapp-group";

export interface GroupParticipant {
  name: string;
  phone: string;
  initials: string;
  color: string;
  isAdmin?: boolean;
  isOnline?: boolean;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  avatar?: string;
  initials?: string;
  avatarColor?: string;
  isPrivate?: boolean;
  lastMessage: string;
  lastSender?: string;
  time: string;
  unread?: number;
  online?: boolean;
  phone?: string;
  participants?: GroupParticipant[];
  participantCount?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  senderColor: string;
  content: string;
  time: string;
  isOwn?: boolean;
}

export const conversations: Conversation[] = [
  // Internal channels
  {
    id: "general",
    type: "channel",
    name: "General",
    initials: "G",
    avatarColor: "#6366F1",
    lastMessage: "Just pushed the new landing page, looks 🔥",
    lastSender: "Oliver B.",
    time: "2m ago",
    unread: 3,
  },
  {
    id: "projects",
    type: "channel",
    name: "Projects",
    initials: "P",
    avatarColor: "#10B981",
    isPrivate: true,
    lastMessage: "Phase 2 scope confirmed for Nexus",
    lastSender: "Reuben B.",
    time: "1h ago",
    unread: 0,
  },
  // Direct messages
  {
    id: "dm-matt",
    type: "dm",
    name: "Matt Trust",
    initials: "MT",
    avatarColor: "#F59E0B",
    lastMessage: "Hey, can you send over the brand kit?",
    time: "Jan 25",
    unread: 1,
    online: true,
  },
  {
    id: "dm-oliver",
    type: "dm",
    name: "Oliver Brunton",
    initials: "OB",
    avatarColor: "#8B5CF6",
    lastMessage: "yo",
    time: "Jan 18",
    unread: 0,
    online: false,
  },
  {
    id: "dm-sarah",
    type: "dm",
    name: "Sarah Kim",
    initials: "SK",
    avatarColor: "#EC4899",
    lastMessage: "Invoice approved ✓",
    time: "Jan 14",
    unread: 0,
    online: true,
  },
  // WhatsApp clients
  {
    id: "wa-nexus",
    type: "whatsapp",
    name: "Nexus Digital",
    initials: "ND",
    avatarColor: "#FF4533",
    phone: "+44 7700 900123",
    lastMessage: "Can we get an update on the timeline?",
    lastSender: "Jamie (Nexus)",
    time: "Feb 24",
    unread: 1,
  },
  {
    id: "wa-apex",
    type: "whatsapp",
    name: "Apex Ventures",
    initials: "AV",
    avatarColor: "#0EA5E9",
    phone: "+44 7700 900456",
    lastMessage: "Love the new designs 👌",
    lastSender: "Rachel (Apex)",
    time: "Feb 20",
    unread: 0,
  },
  {
    id: "wa-kova",
    type: "whatsapp",
    name: "Kova Labs",
    initials: "KL",
    avatarColor: "#14B8A6",
    phone: "+44 7700 900789",
    lastMessage: "When does the campaign go live?",
    lastSender: "Tom (Kova)",
    time: "Feb 18",
    unread: 0,
  },
  // WhatsApp Group Chats
  {
    id: "wag-nexus-project",
    type: "whatsapp-group",
    name: "Nexus Project 🚀",
    initials: "NP",
    avatarColor: "#7C3AED",
    lastMessage: "Just shared the revised mockups in the drive",
    lastSender: "Reuben",
    time: "10:42 AM",
    unread: 5,
    participantCount: 6,
    participants: [
      { name: "Reuben Brunton", phone: "+44 7700 100001", initials: "RB", color: "#FF4533", isAdmin: true, isOnline: true },
      { name: "Jamie Chen", phone: "+44 7700 900123", initials: "JC", color: "#6366F1", isOnline: true },
      { name: "Oliver Brunton", phone: "+44 7700 100002", initials: "OB", color: "#8B5CF6" },
      { name: "Rachel (Nexus)", phone: "+44 7700 900124", initials: "RN", color: "#EC4899" },
      { name: "Tom (Nexus)", phone: "+44 7700 900125", initials: "TN", color: "#F59E0B" },
      { name: "Sarah Kim", phone: "+44 7700 100003", initials: "SK", color: "#10B981", isAdmin: true },
    ],
  },
  {
    id: "wag-apex-team",
    type: "whatsapp-group",
    name: "Apex × Zipline",
    initials: "AZ",
    avatarColor: "#0EA5E9",
    lastMessage: "Can we push the launch to next Thursday?",
    lastSender: "Rachel (Apex)",
    time: "Yesterday",
    unread: 2,
    participantCount: 4,
    participants: [
      { name: "Reuben Brunton", phone: "+44 7700 100001", initials: "RB", color: "#FF4533", isAdmin: true, isOnline: true },
      { name: "Rachel (Apex)", phone: "+44 7700 900456", initials: "RA", color: "#0EA5E9", isOnline: true },
      { name: "Matt Trust", phone: "+44 7700 100004", initials: "MT", color: "#F59E0B" },
      { name: "Ben (Apex)", phone: "+44 7700 900457", initials: "BA", color: "#14B8A6" },
    ],
  },
];

export const messageThreads: Record<string, Message[]> = {
  general: [
    {
      id: "1",
      senderId: "oliver",
      senderName: "Oliver Brunton",
      senderInitials: "OB",
      senderColor: "#8B5CF6",
      content: "Morning all — quick update, the Nexus project is officially in phase 2 🚀",
      time: "9:02 AM",
    },
    {
      id: "2",
      senderId: "matt",
      senderName: "Matt Trust",
      senderInitials: "MT",
      senderColor: "#F59E0B",
      content: "Brilliant. Do we have the full brief confirmed?",
      time: "9:08 AM",
    },
    {
      id: "3",
      senderId: "jordan",
      senderName: "Reuben Brunton",
      senderInitials: "RB",
      senderColor: "#FF4533",
      content: "Yes — just shared it in #projects. Scope locked, timeline starts Monday.",
      time: "9:11 AM",
      isOwn: true,
    },
    {
      id: "4",
      senderId: "oliver",
      senderName: "Oliver Brunton",
      senderInitials: "OB",
      senderColor: "#8B5CF6",
      content: "Just pushed the new landing page, looks 🔥",
      time: "10:34 AM",
    },
  ],
  "dm-matt": [
    {
      id: "1",
      senderId: "matt",
      senderName: "Matt Trust",
      senderInitials: "MT",
      senderColor: "#F59E0B",
      content: "Hey! Hope the week's going well.",
      time: "Jan 25 · 2:15 PM",
    },
    {
      id: "2",
      senderId: "jordan",
      senderName: "Reuben Brunton",
      senderInitials: "RB",
      senderColor: "#FF4533",
      content: "All good here! What's up?",
      time: "Jan 25 · 2:17 PM",
      isOwn: true,
    },
    {
      id: "3",
      senderId: "matt",
      senderName: "Matt Trust",
      senderInitials: "MT",
      senderColor: "#F59E0B",
      content: "Hey, can you send over the brand kit? Apex asked for it.",
      time: "Jan 25 · 2:18 PM",
    },
  ],
  "wag-nexus-project": [
    {
      id: "1",
      senderId: "jamie",
      senderName: "Jamie Chen",
      senderInitials: "JC",
      senderColor: "#6366F1",
      content: "Morning everyone! Client signed off on the wireframes 🎉",
      time: "9:15 AM",
    },
    {
      id: "2",
      senderId: "jordan",
      senderName: "Reuben Brunton",
      senderInitials: "RB",
      senderColor: "#FF4533",
      content: "Amazing! Let's move straight to hi-fi designs then",
      time: "9:17 AM",
      isOwn: true,
    },
    {
      id: "3",
      senderId: "rachel",
      senderName: "Rachel (Nexus)",
      senderInitials: "RN",
      senderColor: "#EC4899",
      content: "Can we keep the hero section simple? The stakeholders prefer minimal",
      time: "9:24 AM",
    },
    {
      id: "4",
      senderId: "oliver",
      senderName: "Oliver Brunton",
      senderInitials: "OB",
      senderColor: "#8B5CF6",
      content: "Agreed — I'll strip it back. Will have a draft by EOD",
      time: "9:45 AM",
    },
    {
      id: "5",
      senderId: "jordan",
      senderName: "Reuben Brunton",
      senderInitials: "RB",
      senderColor: "#FF4533",
      content: "Just shared the revised mockups in the drive",
      time: "10:42 AM",
      isOwn: true,
    },
  ],
  "wag-apex-team": [
    {
      id: "1",
      senderId: "matt",
      senderName: "Matt Trust",
      senderInitials: "MT",
      senderColor: "#F59E0B",
      content: "Apex team — launch checklist is in the shared doc. Please review by Friday",
      time: "Feb 28 · 2:10 PM",
    },
    {
      id: "2",
      senderId: "rachel-apex",
      senderName: "Rachel (Apex)",
      senderInitials: "RA",
      senderColor: "#0EA5E9",
      content: "Reviewed! One thing — the CTA copy needs to change. 'Get Started' feels generic",
      time: "Feb 28 · 3:30 PM",
    },
    {
      id: "3",
      senderId: "jordan",
      senderName: "Reuben Brunton",
      senderInitials: "RB",
      senderColor: "#FF4533",
      content: "Noted. How about 'Start your free trial'?",
      time: "Feb 28 · 3:45 PM",
      isOwn: true,
    },
    {
      id: "4",
      senderId: "rachel-apex",
      senderName: "Rachel (Apex)",
      senderInitials: "RA",
      senderColor: "#0EA5E9",
      content: "Can we push the launch to next Thursday?",
      time: "Yesterday · 11:20 AM",
    },
  ],
  "wa-nexus": [
    {
      id: "1",
      senderId: "jamie",
      senderName: "Jamie (Nexus)",
      senderInitials: "JN",
      senderColor: "#FF4533",
      content: "Hi! Just checking in — how's everything tracking for the launch?",
      time: "Feb 24 · 11:00 AM",
    },
    {
      id: "2",
      senderId: "jordan",
      senderName: "Reuben Brunton",
      senderInitials: "RB",
      senderColor: "#FF4533",
      content: "Hey Jamie! All on track. Design approval is the last step — should have that to you by EOD.",
      time: "Feb 24 · 11:15 AM",
      isOwn: true,
    },
    {
      id: "3",
      senderId: "jamie",
      senderName: "Jamie (Nexus)",
      senderInitials: "JN",
      senderColor: "#FF4533",
      content: "Can we get an update on the timeline?",
      time: "Feb 24 · 3:42 PM",
    },
  ],
};

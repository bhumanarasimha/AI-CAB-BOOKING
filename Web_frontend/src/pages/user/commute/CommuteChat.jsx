import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Video, Send, 
  MapPin, Plus, Mic,
  Sparkles, CheckCheck
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { createChatSession, subscribeToChat, sendChatMessage } from '../../../lib/firestore';

const CommuteChat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const chatScrollRef = useRef(null);

  const aiSuggestions = [
    "Confirm 8:30 AM pickup",
    "Share my live location",
    "Request pickup point change"
  ];

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000) 
      : (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (!user) return;

    // Load or create a unique real-time chat session for this match
    const initChat = async () => {
      try {
        const id = await createChatSession(user.uid, 'sarah_chen_uid');
        setChatId(id);
      } catch (err) {
        console.error("Failed to initialize chat session:", err);
      }
    };
    initChat();
  }, [user]);

  // Subscribe to real-time updates in Firestore
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToChat(chatId, (chatData) => {
      if (chatData && chatData.messages) {
        setMessages(chatData.messages);
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !chatId || !user) return;
    const text = message.trim();
    setMessage('');

    try {
      await sendChatMessage(chatId, user.uid, text);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div style={{ height: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '60px 20px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-ui)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ color: 'var(--text-main)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div style={{ position: 'relative' }}>
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" style={{ width: '40px', height: '40px', borderRadius: '14px', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', background: '#10B981', borderRadius: '50%', border: '2px solid var(--bg-surface)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Sarah Chen</h3>
            <p style={{ fontSize: '0.7rem', color: '#10B981' }}>Online · Commuter Match</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Phone size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
          <Video size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={chatScrollRef}
        className="no-scrollbar"
        style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        {messages.map((msg, index) => {
          const isMe = msg.senderId === user?.uid;
          const msgTime = formatTime(msg.timestamp);
          return (
            <div 
              key={index} 
              style={{ 
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}
            >
              <div style={{ 
                background: isMe ? 'var(--brand-indigo)' : 'var(--bg-surface)',
                padding: '12px 16px',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                color: isMe ? 'white' : 'var(--text-main)',
                fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: isMe ? 'none' : '1px solid var(--border-ui)'
              }}>
                {msg.text}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '4px' }}>
                {msgTime} {isMe && <CheckCheck size={12} color="var(--brand-cyan)" />}
              </div>
            </div>
          );
        })}
        
        {/* Coordination Card in Chat */}
        <div style={{ alignSelf: 'center', width: '100%', maxWidth: '280px', margin: '10px 0' }}>
          <div style={{ background: 'rgba(var(--brand-cyan-rgb), 0.05)', border: '1px dashed rgba(var(--brand-cyan-rgb), 0.3)', borderRadius: '20px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--brand-cyan)', fontWeight: 700, marginBottom: '12px' }}>PROPOSED PICKUP</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
              <MapPin size={16} color="var(--brand-cyan)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>Central Park Gate 4</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ flex: 1, padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Modify</button>
              <button 
                onClick={() => {
                  if (chatId && user) {
                    sendChatMessage(chatId, user.uid, "Central Park Gate 4 Pickup confirmed! See you tomorrow.");
                  }
                }}
                style={{ flex: 1, padding: '8px', background: 'var(--brand-cyan)', border: 'none', borderRadius: '10px', color: 'black', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestions Bar */}
      <div style={{ padding: '0 20px 12px', display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0 }} className="no-scrollbar">
        {aiSuggestions.map((text, i) => (
          <button 
            key={i} 
            onClick={() => {
              if (chatId && user) {
                sendChatMessage(chatId, user.uid, text);
              }
            }}
            style={{ 
              whiteSpace: 'nowrap', padding: '8px 16px', background: 'rgba(var(--brand-indigo-rgb), 0.1)', 
              border: '1px solid rgba(var(--brand-indigo-rgb), 0.2)', borderRadius: '12px', 
              color: 'var(--brand-indigo)', fontSize: '0.75rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
            }}
          >
            <Sparkles size={12} /> {text}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ padding: '0 20px 40px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button style={{ width: '48px', height: '48px', background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '16px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Plus size={24} />
        </button>
        <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-ui)', borderRadius: '16px', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '14px 0', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}
          />
          <Mic size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
        </div>
        <button 
          onClick={handleSend}
          style={{ width: '48px', height: '48px', background: 'var(--brand-indigo)', border: 'none', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', cursor: 'pointer' }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default CommuteChat;

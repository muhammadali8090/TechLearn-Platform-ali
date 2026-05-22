import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ArrowLeft, Send, Sparkles, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendChatMessage } from '../services/aiService';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const MAX_MESSAGES = 20;

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'ai',
  text: "Hello! 👋 I'm your AI study assistant. I can help you with course questions, study tips, quiz prep, learning strategies, and more. What would you like to know?",
  suggestions: [
    'How do I improve my quiz scores?',
    'Give me a study tip',
    'What courses should I take next?',
  ],
  timestamp: new Date(),
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-400"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatText(text) {
  // Convert **bold** to strong, and \n to <br>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split('\n').map((line, j) => (
      <span key={`${i}-${j}`}>{line}{j < part.split('\n').length - 1 && <br />}</span>
    ));
  });
}

function ChatMessage({ msg, isLatest }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-indigo-500 to-violet-500'
          : 'bg-gradient-to-br from-indigo-500 to-violet-500'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
      </div>

      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-br-sm'
            : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-sm'
        }`}>
          {formatText(msg.text)}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-[var(--text-muted)] px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        {/* Suggestion chips — only on AI messages */}
        {!isUser && isLatest && msg.suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {msg.suggestions.map((s) => (
              <button
                key={s}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-700/50 px-3 py-1.5 rounded-full transition-colors"
                data-suggestion={s}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg].slice(-MAX_MESSAGES));
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(msg, {});
      const { reply, suggestions } = res.data.data;
      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: reply,
        suggestions,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg].slice(-MAX_MESSAGES));
    } catch {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Delegate chip clicks via bubbling
  const handleMessageAreaClick = (e) => {
    const suggestion = e.target.closest('[data-suggestion]')?.dataset.suggestion;
    if (suggestion) handleSend(suggestion);
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col transition-colors duration-300">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 flex-shrink-0">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/ai" className="inline-flex items-center gap-2 text-emerald-200 hover:text-white transition-colors mb-3 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to AI Hub
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">AI Study Assistant</h1>
              <p className="text-emerald-200 text-sm">Ask me anything about your courses or learning</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-sm text-white font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Messages */}
        <div
          className="flex-1 space-y-6 overflow-y-auto mb-6 min-h-0"
          style={{ maxHeight: 'calc(100vh - 340px)' }}
          onClick={handleMessageAreaClick}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                isLatest={idx === messages.length - 1}
              />
            ))}
          </AnimatePresence>

          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-3 shadow-sm">
          <div className="flex items-end gap-3">
            {/* User avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
              {initials}
            </div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your studies... (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm resize-none focus:outline-none max-h-32 leading-relaxed"
              style={{ lineHeight: '1.6' }}
            />

            <motion.button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              whileTap={{ scale: 0.92 }}
              className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2 ml-11">
            Press <kbd className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">Enter</kbd> to send •{' '}
            <kbd className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}

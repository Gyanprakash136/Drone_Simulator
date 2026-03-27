import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatUI({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: 'OrbitX System Online. I am your expert drone engineer. How can I assist your engineering today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input.trim();
    setInput('');
    
    // Optimistic UI update
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Format history to send to backend (exclude the very first greeting if desired, or keep it)
      const historyPayload = newMessages.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: historyPayload })
      });

      const data = await res.json();
      
      if (res.ok && data.answer) {
        setMessages(prev => [...prev, { role: 'model', text: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: `*[System Error]* Failed to retrieve telemetry: ${data.error || 'Unknown error'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: `*[Offline]* Connection to engineering core lost: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '400px',
            maxWidth: '100vw',
            height: '100vh',
            zIndex: 999, // Overlay above all Canvas elements
            pointerEvents: 'auto',
            background: 'rgba(2, 1, 8, 0.85)',
            borderLeft: '1px solid rgba(0, 255, 204, 0.2)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '-10px 0 50px rgba(0, 255, 204, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid rgba(0, 255, 204, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 255, 204, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot color="#00ffcc" size={24} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f8f9fa', margin: 0 }}>OrbitX Assistant</h2>
            </div>
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#8d95a0', cursor: 'pointer', display: 'flex' }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Chat History */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0, 255, 204, 0.3) transparent'
          }}>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#8d95a0', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {msg.role === 'user' ? <><User size={12}/> YOU</> : <><Bot size={12}/> AI</>}
                </div>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: msg.role === 'user' ? 'rgba(0, 255, 204, 0.15)' : 'rgba(157, 78, 221, 0.15)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(0, 255, 204, 0.3)' : 'rgba(157, 78, 221, 0.3)'}`,
                  color: '#fff',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  {msg.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#e0aaff',
                  fontSize: '0.8rem',
                  padding: '10px'
                }}
              >
                <Loader2 size={16} className="lucide-spin" style={{ animation: 'spin 2s linear infinite' }} />
                <span>Processing telemetry...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid rgba(0, 255, 204, 0.2)',
            background: 'rgba(2, 1, 8, 0.95)'
          }}>
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px'
            }}>
              <textarea 
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about fixed-wing dynamics..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  padding: '8px',
                  minHeight: '44px',
                  maxHeight: '120px'
                }}
                rows={1}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{
                  background: isLoading || !input.trim() ? 'rgba(0, 255, 204, 0.1)' : '#00ffcc',
                  color: isLoading || !input.trim() ? 'rgba(255, 255, 255, 0.3)' : '#020108',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={18} />
              </button>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8d95a0', textAlign: 'center', marginTop: '8px' }}>
              Press Enter to send, Shift+Enter for new line.
            </div>
          </div>
          
          {/* Inject basic markdown CSS here to avoid polluting global scope too much */}
          <style dangerouslySetInnerHTML={{__html: `
            .markdown-content p { margin-bottom: 0.5rem; margin-top: 0; }
            .markdown-content p:last-child { margin-bottom: 0; }
            .markdown-content pre { background: rgba(0,0,0,0.5); padding: 10px; border-radius: 6px; overflow-x: auto; margin: 8px 0; border: 1px solid rgba(255,255,255,0.1); }
            .markdown-content code { font-family: monospace; background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px; }
            .markdown-content pre code { background: transparent; padding: 0; }
            .markdown-content ul, .markdown-content ol { padding-left: 20px; margin: 8px 0; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

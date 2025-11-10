import React, { useState, useRef, useEffect } from 'react';
import axios from '../services/api';

// axios instance is configured with baseURL
const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your recipe assistant. Ask me anything about cooking!", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await axios.post(`/chatbot/`, { message: input });
      const botMessage = { text: response.data.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error?.response?.data || error.message);
      const errorMessage = { text: 'Sorry, I encountered an error. Please try again.', sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        className="chatbot-toggle-btn"
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '2em', right: '2em', zIndex: 1100,
          padding: '0.5em 1.2em', borderRadius: '6px',
          background: '#ffc600', color: '#333', fontWeight: 'bold',
          border: 'none', boxShadow: '0 0 10px #ffc60066'
        }}
      >
        {isOpen ? 'Close Chatbot' : 'Ask Recipe Bot'}
      </button>
      {isOpen && (
        <div
          className="chatbot-popup"
          style={{
            position: 'fixed', bottom: '4.5em', right: '2em', width: '355px',
            background: 'white', borderRadius: '16px', boxShadow: '0 4px 24px #6666',
            zIndex: 1101, overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}
        >
          <div
            className="chatbot-header"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#ffc600', padding: '1em', color: '#222'
            }}
          >
            <span>🍳 Recipe Assistant</span>
            <button onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', fontSize: '1.3em', cursor: 'pointer' }}>✕</button>
          </div>
          <div
            className="chatbot-messages"
            style={{
              flex: '1 1 auto', padding: '1em', overflowY: 'auto', fontSize: '1em',
              maxHeight: '325px'
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-message ${msg.sender}`}
                style={{
                  margin: '0.6em 0',
                  textAlign: msg.sender === 'bot' ? 'left' : 'right',
                  color: msg.sender === 'bot' ? '#333' : '#096',
                  fontWeight: msg.sender === 'bot' ? 'normal' : 'bold'
                }}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form
            className="chatbot-form"
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            style={{ display: 'flex', gap: '0.5em', padding: '1em' }}
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your recipe question..."
              rows={2}
              disabled={loading}
              style={{
                flex: 1, borderRadius: '5px', resize: 'none', padding: '0.5em', border: '1px solid #ffc600'
              }}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={loading || !input.trim()}
              style={{
                background: '#ffc600', color: '#222', borderRadius: '5px',
                fontWeight: 'bold', border: 'none', padding: '0.5em 1em'
              }}
            >
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;

import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom"; 
import api from "../api";

function Chatbot() {
    const location = useLocation(); 
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hi! I am GohanBot. Ask me anything about cooking!' }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // ✅ Hooks must always run, so keep useEffect here
    useEffect(scrollToBottom, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await api.post("chat/", { message: userMsg.text });
            const botMsg = { sender: 'bot', text: res.data.response };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I'm having trouble thinking right now." }]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Helper style for brand color matching
    const brandStyle = { backgroundColor: 'var(--brand-color)', borderColor: 'var(--brand-color)', color: 'white' };

    // 🛑 MOVED LOGIC HERE: Check location AFTER all hooks are declared
    const hideOnPages = ["/login", "/register", "/forgot-password"];
    if (hideOnPages.includes(location.pathname)) {
        return null; // Render nothing if on these pages
    }

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
            
            {/* Chat Window */}
            {isOpen && (
                <div className="card shadow mb-3" style={{ width: '400px', height: '500px', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div className="card-header text-white d-flex justify-content-between align-items-center"
                         style={{ backgroundColor: 'var(--brand-color)' }}>
                        <strong><i className="bi bi-robot me-2"></i>GohanBot</strong>
                        <button onClick={() => setIsOpen(false)} className="btn btn-sm text-white">
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                    
                    {/* Body */}
                    <div className="card-body p-2" style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-body)' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'} mb-2`}>
                                <div 
                                    className={`p-2 rounded text-white`} 
                                    style={{ 
                                        maxWidth: '80%', 
                                        fontSize: '0.9rem',
                                        backgroundColor: msg.sender === 'user' ? 'var(--brand-color)' : '#6c757d'
                                    }}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && <div className="text-center small text-muted">Cooking up an answer...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer */}
                    <div className="card-footer p-2">
                        <form onSubmit={handleSend} className="d-flex gap-2">
                            <input 
                                type="text" 
                                className="form-control form-control-sm" 
                                placeholder="Ask a question..."
                                value={input} 
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
                                <i className="bi bi-send"></i>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                    style={{ width: '60px', height: '60px', ...brandStyle }} 
                >
                    <i className="bi bi-robot" style={{ fontSize: '1.8rem' }}></i>
                </button>
            )}
        </div>
    );
}

export default Chatbot;
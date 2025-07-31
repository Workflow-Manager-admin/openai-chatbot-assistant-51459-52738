import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const MODEL = "gpt-3.5-turbo"; // You can change model here

// PUBLIC_INTERFACE
function App() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light');
  const inputRef = useRef();

  // Keep chat scrolled to the latest message
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  async function sendMessage(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const newUserMsg = { sender: 'user', text: trimmed };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setLoading(true);

    try {
      const apiKey = OPENAI_API_KEY;
      if (!apiKey) {
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: 'OpenAI API key is not set. Please configure it in environment variables.' }
        ]);
        setLoading(false);
        return;
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            ...messages
              .filter(m => m.sender === 'user')
              .map(m => ({ role: 'user', content: m.text })),
            { role: 'user', content: trimmed }
          ],
          temperature: 0.7
        })
      });

      if (!res.ok) {
        let errorMessage = 'Error connecting to OpenAI API';
        try {
          const errorData = await res.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (err) { /* ignore JSON parse errors */ }
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: errorMessage }
        ]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const botReply = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content.trim()
        : "Hmm, I couldn't understand that. Try again?";

      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: botReply }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: "Failed to reach OpenAI. Please check your connection and API key." }
      ]);
    }
    setLoading(false);
  }

  // Convenient: allow pressing Enter to send message
  // PUBLIC_INTERFACE
  function handleInputKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }

  // PUBLIC_INTERFACE
  function handleChange(e) {
    setInput(e.target.value);
  }

  // UI Element: chat bubble
  function ChatBubble({ sender, text }) {
    const isUser = sender === 'user';
    return (
      <div
        className={`chat-bubble ${isUser ? 'chat-user' : 'chat-bot'}`}
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          background: isUser ? 'var(--button-bg)' : 'var(--bg-secondary)',
          color: isUser ? 'var(--button-text)' : 'var(--text-primary)',
          borderRadius: isUser
            ? '16px 16px 4px 16px'
            : '16px 16px 16px 4px',
          marginBottom: '8px',
          maxWidth: '80%',
          padding: '10px 16px',
          fontSize: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {text}
      </div>
    );
  }

  return (
    <div className="App" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <header className="App-header"
        style={{
          minHeight: '70px',
          padding: '0 0 10px 0',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          justifyContent: 'space-between',
          width: '100%',
          boxSizing: 'border-box',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 20 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: '1.35rem',
              letterSpacing: '1px',
              color: 'var(--text-primary)',
            }}
          >🤖 Chatbot Assistant</span>
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>

      <main
        style={{
          flex: 1,
          minHeight: 'calc(100vh - 140px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-end',
          background: 'var(--bg-primary)',
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 0 12px 0',
            maxHeight: 'calc(100vh - 170px)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 650,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
            data-testid="chat-history"
          >
            {messages.map((msg, idx) => (
              <ChatBubble
                key={idx}
                sender={msg.sender}
                text={msg.text}
              />
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', marginLeft: 5, marginTop: 4 }}>
                <LoadingDots />
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>
        </div>
        <form
          style={{
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-color)',
            padding: '16px 0',
            position: 'sticky',
            bottom: 0,
            width: '100%',
          }}
          onSubmit={sendMessage}
        >
          <div style={{
            maxWidth: 650,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <textarea
              ref={inputRef}
              required
              disabled={loading}
              aria-label="Type your message"
              placeholder="Type your message..."
              value={input}
              onChange={handleChange}
              onKeyDown={handleInputKeyDown}
              style={{
                flex: 1,
                borderRadius: 8,
                border: `1.5px solid var(--border-color)`,
                padding: '12px 14px',
                fontSize: '1rem',
                minHeight: '36px',
                maxHeight: '110px',
                resize: 'vertical',
                outline: 'none',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
              rows={1}
              autoFocus
            />
            <button
              aria-label="Send"
              type="submit"
              style={{
                padding: '0 22px',
                fontWeight: '600',
                fontSize: '1rem',
                borderRadius: 8,
                backgroundColor: 'var(--button-bg)',
                color: 'var(--button-text)',
                border: 'none',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                minHeight: 44,
                transition: 'all 0.18s',
                boxShadow: loading ? 'none' : '0 2px 6px rgba(30,64,175,0.04)',
              }}
              disabled={loading || input.trim() === ''}
            >
              ➤
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

// Simple animated loading indicator
function LoadingDots() {
  return (
    <span className="loading-dots" style={{
      display: 'inline-block',
      marginLeft: 8,
      fontSize: '1.20rem',
      color: 'var(--text-secondary)',
      letterSpacing: 0
    }}>
      <span style={{ animation: 'loading-anim 1s infinite' }}>.</span>
      <span style={{ animation: 'loading-anim 1s 0.19s infinite' }}>.</span>
      <span style={{ animation: 'loading-anim 1s 0.38s infinite' }}>.</span>
      <style>
        {`
        @keyframes loading-anim {
          0% { opacity: 0.1; }
          30% { opacity: 1; }
          100% { opacity: 0.1; }
        }
        `}
      </style>
    </span>
  );
}

export default App;

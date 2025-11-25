/**
 * Widget Styles
 * Exported as a string for Shadow DOM injection
 */

export const widgetStyles = `
/* Widget Base Styles */
:host {
  --primary-color: #3B82F6;
  --bg-color: #ffffff;
  --text-color: #1f2937;
  --border-color: #e5e7eb;
  --user-message-bg: var(--primary-color);
  --user-message-text: #ffffff;
  --bot-message-bg: #f3f4f6;
  --bot-message-text: #1f2937;
  --input-bg: #ffffff;
  --input-border: #d1d5db;
  --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

/* Dark theme */
:host([theme="dark"]) {
  --bg-color: #1f2937;
  --text-color: #f9fafb;
  --border-color: #374151;
  --bot-message-bg: #374151;
  --bot-message-text: #f9fafb;
  --input-bg: #374151;
  --input-border: #4b5563;
}

/* Container */
.chatbot-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  width: 380px;
  height: 600px;
  max-height: 90vh;
  background-color: var(--bg-color);
  border-radius: 12px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

/* Position variants */
.chatbot-container.bottom-right {
  bottom: 20px;
  right: 20px;
}

.chatbot-container.bottom-left {
  bottom: 20px;
  left: 20px;
}

.chatbot-container.top-right {
  top: 20px;
  right: 20px;
}

.chatbot-container.top-left {
  top: 20px;
  left: 20px;
}

/* Mobile responsive */
@media (max-width: 480px) {
  .chatbot-container {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    bottom: 0 !important;
    right: 0 !important;
    left: 0 !important;
    top: 0 !important;
  }
}

/* Header */
.chatbot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: var(--primary-color);
  color: white;
}

.chatbot-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.close-button:hover {
  opacity: 1;
}

/* Messages Container */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: var(--input-border);
}

/* Message Bubble */
.message {
  display: flex;
  margin-bottom: 8px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  justify-content: flex-end;
}

.message.bot {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 18px;
  word-wrap: break-word;
}

.message.user .message-bubble {
  background-color: var(--user-message-bg);
  color: var(--user-message-text);
  border-bottom-right-radius: 4px;
}

.message.bot .message-bubble {
  background-color: var(--bot-message-bg);
  color: var(--bot-message-text);
  border-bottom-left-radius: 4px;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background-color: var(--bot-message-bg);
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  max-width: 60px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background-color: var(--text-color);
  border-radius: 50%;
  opacity: 0.4;
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  30% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* Input Container */
.input-container {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-color);
}

.message-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--input-border);
  border-radius: 20px;
  background-color: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: var(--primary-color);
}

.message-input::placeholder {
  color: #9ca3af;
}

.send-button {
  padding: 10px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.send-button:hover:not(:disabled) {
  opacity: 0.9;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Toggle Button */
.toggle-button {
  position: fixed;
  z-index: 9998;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: transform 0.2s, opacity 0.2s;
}

.toggle-button:hover {
  transform: scale(1.05);
}

.toggle-button.bottom-right {
  bottom: 20px;
  right: 20px;
}

.toggle-button.bottom-left {
  bottom: 20px;
  left: 20px;
}

.toggle-button.top-right {
  top: 20px;
  right: 20px;
}

.toggle-button.top-left {
  top: 20px;
  left: 20px;
}

/* Hidden state */
.hidden {
  display: none;
}

/* Welcome message */
.welcome-message {
  text-align: center;
  padding: 20px;
  color: var(--text-color);
  opacity: 0.7;
}
`;

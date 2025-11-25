var ChatbotWidget=function(a){"use strict";class n{constructor(e){this.apiUrl=e.replace(/\/$/,"")}async sendMessage(e){const t=await fetch(`${this.apiUrl}/widget/message`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`Failed to send message: ${t.statusText}`);return t.json()}async getConfig(e){const t=await fetch(`${this.apiUrl}/widget/config/${e}`);if(!t.ok)throw new Error(`Failed to get config: ${t.statusText}`);return t.json()}}class r{constructor(e){this.storageKey=`chatbot_conversation_${e}`}getConversationId(){try{return localStorage.getItem(this.storageKey)}catch(e){return console.error("Failed to get conversation ID from localStorage:",e),null}}setConversationId(e){try{localStorage.setItem(this.storageKey,e)}catch(t){console.error("Failed to set conversation ID in localStorage:",t)}}clearConversationId(){try{localStorage.removeItem(this.storageKey)}catch(e){console.error("Failed to clear conversation ID from localStorage:",e)}}}const d=`
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
`;class l extends HTMLElement{constructor(){super(),this.botId="",this.apiUrl="",this.theme="light",this.position="bottom-right",this.primaryColor="#3B82F6",this.welcomeMessage="Hello! How can I help you today?",this.placeholder="Type a message...",this.messages=[],this.conversationId=null,this.isOpen=!1,this.isTyping=!1,this.container=null,this.toggleButton=null,this.messagesContainer=null,this.messageInput=null,this.sendButton=null,this.shadow=this.attachShadow({mode:"open"}),this.apiClient=new n(""),this.storage=new r("")}static get observedAttributes(){return["bot-id","api-url","theme","position","primary-color","welcome-message","placeholder"]}attributeChangedCallback(e,t,s){if(t!==s)switch(e){case"bot-id":this.botId=s,this.storage=new r(s);break;case"api-url":this.apiUrl=s,this.apiClient=new n(s);break;case"theme":this.theme=s;break;case"position":this.position=s;break;case"primary-color":this.primaryColor=s;break;case"welcome-message":this.welcomeMessage=s;break;case"placeholder":this.placeholder=s;break}}async connectedCallback(){this.render(),await this.initialize()}async initialize(){this.conversationId=this.storage.getConversationId();try{const e=await this.apiClient.getConfig(this.botId);e.welcomeMessage&&(this.welcomeMessage=e.welcomeMessage),e.placeholder&&(this.placeholder=e.placeholder),e.theme&&(this.theme=e.theme),e.primaryColor&&(this.primaryColor=e.primaryColor),this.render()}catch(e){console.error("Failed to load widget config:",e)}this.messages.length===0&&this.addMessage({id:"welcome",content:this.welcomeMessage,role:"bot",timestamp:new Date})}render(){const e=document.createElement("style");if(e.textContent=d,this.shadow.innerHTML="",this.shadow.appendChild(e),this.primaryColor){const o=document.createElement("style");o.textContent=`:host { --primary-color: ${this.primaryColor}; }`,this.shadow.appendChild(o)}this.toggleButton=document.createElement("button"),this.toggleButton.className=`toggle-button ${this.position}`,this.toggleButton.innerHTML="💬",this.toggleButton.addEventListener("click",()=>this.toggle()),this.shadow.appendChild(this.toggleButton),this.container=document.createElement("div"),this.container.className=`chatbot-container ${this.position} hidden`,this.theme&&this.container.setAttribute("theme",this.theme);const t=document.createElement("div");t.className="chatbot-header",t.innerHTML=`
      <h3 class="chatbot-title">Chat</h3>
      <button class="close-button">×</button>
    `;const s=t.querySelector(".close-button");s==null||s.addEventListener("click",()=>this.close()),this.container.appendChild(t),this.messagesContainer=document.createElement("div"),this.messagesContainer.className="messages-container",this.container.appendChild(this.messagesContainer);const i=document.createElement("div");i.className="input-container",this.messageInput=document.createElement("input"),this.messageInput.type="text",this.messageInput.className="message-input",this.messageInput.placeholder=this.placeholder,this.messageInput.addEventListener("keypress",o=>{o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),this.sendMessage())}),this.sendButton=document.createElement("button"),this.sendButton.className="send-button",this.sendButton.textContent="Send",this.sendButton.addEventListener("click",()=>this.sendMessage()),i.appendChild(this.messageInput),i.appendChild(this.sendButton),this.container.appendChild(i),this.shadow.appendChild(this.container),this.renderMessages()}toggle(){this.isOpen?this.close():this.open()}open(){var e,t,s;this.isOpen=!0,(e=this.container)==null||e.classList.remove("hidden"),(t=this.toggleButton)==null||t.classList.add("hidden"),(s=this.messageInput)==null||s.focus()}close(){var e,t;this.isOpen=!1,(e=this.container)==null||e.classList.add("hidden"),(t=this.toggleButton)==null||t.classList.remove("hidden")}addMessage(e){this.messages.push(e),this.renderMessages()}renderMessages(){if(this.messagesContainer){if(this.messagesContainer.innerHTML="",this.messages.forEach(e=>{const t=document.createElement("div");t.className=`message ${e.role}`;const s=document.createElement("div");s.className="message-bubble",s.textContent=e.content,t.appendChild(s),this.messagesContainer.appendChild(t)}),this.isTyping){const e=document.createElement("div");e.className="message bot",e.innerHTML=`
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `,this.messagesContainer.appendChild(e)}this.messagesContainer.scrollTop=this.messagesContainer.scrollHeight}}async sendMessage(){var s,i;const e=(s=this.messageInput)==null?void 0:s.value.trim();if(!e||this.isTyping)return;const t={id:`user-${Date.now()}`,content:e,role:"user",timestamp:new Date};this.addMessage(t),this.messageInput&&(this.messageInput.value=""),this.setInputEnabled(!1),this.isTyping=!0,this.renderMessages();try{const o=await this.apiClient.sendMessage({botId:this.botId,conversationId:this.conversationId||void 0,message:e});o.conversationId&&!this.conversationId&&(this.conversationId=o.conversationId,this.storage.setConversationId(o.conversationId)),await this.simulateBotResponse(e)}catch(o){console.error("Failed to send message:",o);const h={id:`error-${Date.now()}`,content:"Sorry, I encountered an error. Please try again.",role:"bot",timestamp:new Date};this.addMessage(h)}finally{this.isTyping=!1,this.setInputEnabled(!0),this.renderMessages(),(i=this.messageInput)==null||i.focus()}}async simulateBotResponse(e){await new Promise(s=>setTimeout(s,1e3+Math.random()*1e3));const t={id:`bot-${Date.now()}`,content:`I received your message: "${e}". This is a simulated response. In production, the actual AI response would be delivered via WebSocket or polling.`,role:"bot",timestamp:new Date};this.addMessage(t)}setInputEnabled(e){this.messageInput&&(this.messageInput.disabled=!e),this.sendButton&&(this.sendButton.disabled=!e)}}return customElements.get("chatbot-widget")||customElements.define("chatbot-widget",l),a.ChatbotWidget=l,Object.defineProperty(a,Symbol.toStringTag,{value:"Module"}),a}({});

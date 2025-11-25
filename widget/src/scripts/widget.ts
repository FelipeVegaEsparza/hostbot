/**
 * Chatbot Widget Web Component
 * Embeddable chat widget with Shadow DOM
 */

import { APIClient } from './api-client';
import { StorageManager } from './storage';
import { widgetStyles } from './styles';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
}

export class ChatbotWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private apiClient: APIClient;
  private storage: StorageManager;
  
  // Configuration
  private botId: string = '';
  private apiUrl: string = '';
  private theme: string = 'light';
  private position: string = 'bottom-right';
  private primaryColor: string = '#3B82F6';
  private welcomeMessage: string = 'Hello! How can I help you today?';
  private placeholder: string = 'Type a message...';
  
  // State
  private messages: Message[] = [];
  private conversationId: string | null = null;
  private isOpen: boolean = false;
  private isTyping: boolean = false;
  
  // DOM Elements
  private container: HTMLElement | null = null;
  private toggleButton: HTMLElement | null = null;
  private messagesContainer: HTMLElement | null = null;
  private messageInput: HTMLInputElement | null = null;
  private sendButton: HTMLButtonElement | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.apiClient = new APIClient('');
    this.storage = new StorageManager('');
  }

  static get observedAttributes() {
    return ['bot-id', 'api-url', 'theme', 'position', 'primary-color', 'welcome-message', 'placeholder'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'bot-id':
        this.botId = newValue;
        this.storage = new StorageManager(newValue);
        break;
      case 'api-url':
        this.apiUrl = newValue;
        this.apiClient = new APIClient(newValue);
        break;
      case 'theme':
        this.theme = newValue;
        break;
      case 'position':
        this.position = newValue;
        break;
      case 'primary-color':
        this.primaryColor = newValue;
        break;
      case 'welcome-message':
        this.welcomeMessage = newValue;
        break;
      case 'placeholder':
        this.placeholder = newValue;
        break;
    }
  }

  async connectedCallback() {
    this.render();
    await this.initialize();
  }

  private async initialize() {
    // Load conversation ID from localStorage
    this.conversationId = this.storage.getConversationId();
    
    // Load configuration from API
    try {
      const config = await this.apiClient.getConfig(this.botId);
      if (config.welcomeMessage) this.welcomeMessage = config.welcomeMessage;
      if (config.placeholder) this.placeholder = config.placeholder;
      if (config.theme) this.theme = config.theme;
      if (config.primaryColor) this.primaryColor = config.primaryColor;
      
      // Re-render with updated config
      this.render();
    } catch (error) {
      console.error('Failed to load widget config:', error);
    }
    
    // Show welcome message
    if (this.messages.length === 0) {
      this.addMessage({
        id: 'welcome',
        content: this.welcomeMessage,
        role: 'bot',
        timestamp: new Date(),
      });
    }
  }

  private render() {
    const style = document.createElement('style');
    style.textContent = widgetStyles;
    
    this.shadow.innerHTML = '';
    this.shadow.appendChild(style);
    
    // Apply custom primary color
    if (this.primaryColor) {
      const customStyle = document.createElement('style');
      customStyle.textContent = `:host { --primary-color: ${this.primaryColor}; }`;
      this.shadow.appendChild(customStyle);
    }
    
    // Create toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = `toggle-button ${this.position}`;
    this.toggleButton.innerHTML = '💬';
    this.toggleButton.addEventListener('click', () => this.toggle());
    this.shadow.appendChild(this.toggleButton);
    
    // Create chat container
    this.container = document.createElement('div');
    this.container.className = `chatbot-container ${this.position} hidden`;
    if (this.theme) {
      this.container.setAttribute('theme', this.theme);
    }
    
    // Header
    const header = document.createElement('div');
    header.className = 'chatbot-header';
    header.innerHTML = `
      <h3 class="chatbot-title">Chat</h3>
      <button class="close-button">×</button>
    `;
    const closeButton = header.querySelector('.close-button');
    closeButton?.addEventListener('click', () => this.close());
    this.container.appendChild(header);
    
    // Messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'messages-container';
    this.container.appendChild(this.messagesContainer);
    
    // Input container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';
    
    this.messageInput = document.createElement('input');
    this.messageInput.type = 'text';
    this.messageInput.className = 'message-input';
    this.messageInput.placeholder = this.placeholder;
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    this.sendButton = document.createElement('button');
    this.sendButton.className = 'send-button';
    this.sendButton.textContent = 'Send';
    this.sendButton.addEventListener('click', () => this.sendMessage());
    
    inputContainer.appendChild(this.messageInput);
    inputContainer.appendChild(this.sendButton);
    this.container.appendChild(inputContainer);
    
    this.shadow.appendChild(this.container);
    
    // Render existing messages
    this.renderMessages();
  }

  private toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private open() {
    this.isOpen = true;
    this.container?.classList.remove('hidden');
    this.toggleButton?.classList.add('hidden');
    this.messageInput?.focus();
  }

  private close() {
    this.isOpen = false;
    this.container?.classList.add('hidden');
    this.toggleButton?.classList.remove('hidden');
  }

  private addMessage(message: Message) {
    this.messages.push(message);
    this.renderMessages();
  }

  private renderMessages() {
    if (!this.messagesContainer) return;
    
    this.messagesContainer.innerHTML = '';
    
    this.messages.forEach((message) => {
      const messageEl = document.createElement('div');
      messageEl.className = `message ${message.role}`;
      
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.textContent = message.content;
      
      messageEl.appendChild(bubble);
      this.messagesContainer!.appendChild(messageEl);
    });
    
    // Add typing indicator if bot is typing
    if (this.isTyping) {
      const typingEl = document.createElement('div');
      typingEl.className = 'message bot';
      typingEl.innerHTML = `
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;
      this.messagesContainer!.appendChild(typingEl);
    }
    
    // Scroll to bottom
    this.messagesContainer!.scrollTop = this.messagesContainer!.scrollHeight;
  }

  private async sendMessage() {
    const text = this.messageInput?.value.trim();
    if (!text || this.isTyping) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: text,
      role: 'user',
      timestamp: new Date(),
    };
    this.addMessage(userMessage);
    
    // Clear input
    if (this.messageInput) {
      this.messageInput.value = '';
    }
    
    // Disable input while processing
    this.setInputEnabled(false);
    this.isTyping = true;
    this.renderMessages();
    
    try {
      // Send message to API
      const response = await this.apiClient.sendMessage({
        botId: this.botId,
        conversationId: this.conversationId || undefined,
        message: text,
      });
      
      // Store conversation ID
      if (response.conversationId && !this.conversationId) {
        this.conversationId = response.conversationId;
        this.storage.setConversationId(response.conversationId);
      }
      
      // Simulate delay for bot response (since API returns 202 Accepted)
      // In a real implementation, you would use WebSocket or polling
      await this.simulateBotResponse(text);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'bot',
        timestamp: new Date(),
      };
      this.addMessage(errorMessage);
    } finally {
      this.isTyping = false;
      this.setInputEnabled(true);
      this.renderMessages();
      this.messageInput?.focus();
    }
  }

  private async simulateBotResponse(userMessage: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Add bot response
    // In production, this would come from WebSocket or polling
    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      content: `I received your message: "${userMessage}". This is a simulated response. In production, the actual AI response would be delivered via WebSocket or polling.`,
      role: 'bot',
      timestamp: new Date(),
    };
    this.addMessage(botMessage);
  }

  private setInputEnabled(enabled: boolean) {
    if (this.messageInput) {
      this.messageInput.disabled = !enabled;
    }
    if (this.sendButton) {
      this.sendButton.disabled = !enabled;
    }
  }
}

// Register the custom element
if (!customElements.get('chatbot-widget')) {
  customElements.define('chatbot-widget', ChatbotWidget);
}

/**
 * Widget Entry Point
 * This file is the main entry point that will be built into widget.js
 */

// Import the widget component
import './scripts/widget.ts';

// Export for module usage
export { ChatbotWidget } from './scripts/widget';

// Auto-initialize if script is loaded directly
if (typeof window !== 'undefined') {
  console.log('Chatbot Widget loaded successfully');
}

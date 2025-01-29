// chatbot.js
document.addEventListener("DOMContentLoaded", () => {
    class ChatBot {
      constructor() {
        this.config = window.ChatBotConfig || {};
        this.secret = document.querySelector(
          'meta[name="chatbot-secret"]'
        )?.content;
        this.isExpanded = true;
        this.init();
      }
  
      async init() {
        this.createContainer();
        this.setupEventListeners();
  
        // Load saved state
        const savedState = localStorage.getItem('chatbotState');
        if (savedState === 'collapsed') {
          this.collapse();
        }
  
        // Simulate authentication
        try {
          await this.authenticate();
          this.showChat();
          this.addMessage("Hello! How can I help you today?", "bot");
        } catch (error) {
          console.error("ChatBot initialization failed:", error);
        }
      }
  
      createContainer() {
        this.container = document.createElement("div");
        this.container.className = "chatbot-container";
  
        this.container.innerHTML = `
                  <div class="chatbot-header">
                      <span>Chat Assistant</span>
                      <button class="chatbot-toggle">−</button>
                  </div>
                  <div class="chatbot-body"></div>
                  <div class="chatbot-input-container">
                      <input class="chatbot-input" placeholder="Type your message...">
                      <button class="chatbot-button">Send</button>
                  </div>
              `;
  
        document.body.appendChild(this.container);
        this.body = this.container.querySelector(".chatbot-body");
        this.input = this.container.querySelector(".chatbot-input");
        this.button = this.container.querySelector(".chatbot-button");
        this.toggleButton = this.container.querySelector(".chatbot-toggle");
      }
  
      setupEventListeners() {
        this.button.addEventListener("click", () => this.handleSend());
        this.input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") this.handleSend();
        });
        
        this.toggleButton.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleCollapse();
        });
      }
  
      toggleCollapse() {
        if (this.isExpanded) {
          this.collapse();
        } else {
          this.expand();
        }
      }
  
      collapse() {
        this.container.classList.add("collapsed");
        this.toggleButton.textContent = "+";
        this.isExpanded = false;
        localStorage.setItem('chatbotState', 'collapsed');
      }
  
      expand() {
        this.container.classList.remove("collapsed");
        this.toggleButton.textContent = "−";
        this.isExpanded = true;
        localStorage.setItem('chatbotState', 'expanded');
      }
  
      async authenticate() {
        // Simulated authentication
        return new Promise((resolve) => {
          setTimeout(() => {
            if (!this.config.apiKey || !this.secret) {
              throw new Error("Invalid credentials");
            }
            resolve({ token: "mock_token" });
          }, 500);
        });
      }
  
      showChat() {
        this.container.classList.add("visible");
      }
  
      handleSend() {
        const message = this.input.value.trim();
        if (!message) return;
  
        this.addMessage(message, "user");
        this.input.value = "";
  
        // Simulate bot response
        setTimeout(() => {
          this.addMessage(
            "This is a mock response. For real integration, connect to an API.",
            "bot"
          );
        }, 1000);
      }
  
      addMessage(content, sender) {
        const message = document.createElement("div");
        message.className = `chatbot-message ${sender}-message`;
        message.textContent = content;
        this.body.appendChild(message);
        this.body.scrollTop = this.body.scrollHeight;
      }
    }
  
    // Initialize chatbot
    new ChatBot();
  });
  
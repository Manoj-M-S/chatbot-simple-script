// chatbot.js
document.addEventListener("DOMContentLoaded", () => {
  class ChatBot {
    constructor() {
      this.config = {
        // Default values
        themeColor: "#2563eb",
        logoURL: "",
        chatHeaderText: "Chat Assistant",
        inputPlaceholder: "Type your message...",
        buttonText: "Send",
        botWelcomeText: "Hello! How can I help you today?",
        // Merge with provided config
        ...window.ChatBotConfig
      };
      
      // Set theme color CSS variable
      document.documentElement.style.setProperty('--chatbot-theme-color', this.config.themeColor);
      
      this.secret = document.querySelector('meta[name="chatbot-secret"]')?.content;
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
        this.addMessage(this.config.botWelcomeText, "bot");
      } catch (error) {
        console.error("ChatBot initialization failed:", error);
      }
    }

    createContainer() {
      this.container = document.createElement("div");
      this.container.className = "chatbot-container";

      this.container.innerHTML = `
                <div class="chatbot-header">
                    <div class="header-content">
                        ${this.config.logoURL ? `<img src="${this.config.logoURL}" alt="Chat Logo" class="chatbot-logo">` : ''}
                        <span>${this.config.chatHeaderText}</span>
                    </div>
                    <button class="chatbot-toggle">−</button>
                </div>
                <div class="chatbot-body"></div>
                <div class="chatbot-input-container">
                    <input class="chatbot-input" placeholder="${this.config.inputPlaceholder}">
                    <button class="chatbot-button">${this.config.buttonText}</button>
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
      if (!this.config.apiKey || !this.config.resourceId) {
        return Promise.reject(new Error("Missing API key or resource ID"));
      }
      // Here you could add a real check against your BE if needed.
      return Promise.resolve({ token: "authenticated" });
    }

    showChat() {
      this.container.classList.add("visible");
    }

    async handleSend() {
      const userMessage = this.input.value.trim();
      if (!userMessage) return;

      // Display the user message.
      this.addMessage(userMessage, "user");
      this.input.value = "";

      // Create a placeholder element for the bot's streaming response.
      const botMessageElement = document.createElement("div");
      botMessageElement.className = "chatbot-message bot-message";
      botMessageElement.textContent = "";
      this.body.appendChild(botMessageElement);
      this.body.scrollTop = this.body.scrollHeight;

      // Generate a session id to allow the BE to track the conversation.
      const sessionId = `session_${Date.now()}`;

      // Build the payload following the pattern defined in your chat/index.ts:
      const payload = {
        infer_type: "chat",
        resourceId: this.config.resourceId,
        infer_params: {
          chat_session_id: sessionId,
          user_message: userMessage
        }
      };

      try {
        // Make the request to BE. Use the baseURL provided in the configuration if available.
        const response = await fetch(
          `https://api.aeldris.ai/v1/infer`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": this.config.apiKey
            },
            body: JSON.stringify(payload)
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        // Process the streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const startTime = Date.now();
        let firstTokenTime = null;
        let fullResponse = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(line => line.trim() !== "");
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (!firstTokenTime && data.key === "assistant_response") {
                firstTokenTime = Date.now();
              }
              if (data.key === "assistant_response") {
                fullResponse += data.value;
                // Use marked to parse markdown
                botMessageElement.innerHTML = marked.parse(fullResponse, {
                  breaks: true,
                  gfm: true
                });
                this.body.scrollTop = this.body.scrollHeight;
              }
            } catch (err) {
              console.error("Error parsing stream chunk", err);
            }
          }
        }

        const totalTime = (Date.now() - startTime) / 1000;
        console.log(
          "Chat response received. Total time:",
          totalTime,
          "s. Time to first token:",
          firstTokenTime ? (firstTokenTime - startTime) / 1000 : null
        );
      } catch (error) {
        console.error("Error during chat fetch:", error);
        this.addMessage("Sorry, there was an error processing your request.", "bot");
      }
    }

    addMessage(content, sender) {
      const messageElement = document.createElement("div");
      messageElement.className = `chatbot-message ${sender}-message`;
      
      if (sender === 'bot') {
        // Parse markdown for bot messages
        messageElement.innerHTML = marked.parse(content, {
          breaks: true,
          gfm: true
        });
      } else {
        // Keep user messages as plain text
        messageElement.textContent = content;
      }
      
      this.body.appendChild(messageElement);
      this.body.scrollTop = this.body.scrollHeight;
    }
  }

  // Initialize chatbot
  new ChatBot();
});

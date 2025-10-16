
            
/*
 * Advanced Chef Assistant Chat UI for ChopSmo
 * - Modern, floating, draggable chat widget
 * - Message history, typing indicator, error handling
 * - Responsive and mobile-friendly
 * - Integrates with /api/chef-assistant/
 */

(function() {
    // Inject styles
    const style = document.createElement('style');
    style.innerHTML = `
    #chefAssistantWidget {
        position: fixed; bottom: 32px; right: 32px; width: 370px; max-width: 98vw; z-index: 99999;
        font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        border-radius: 18px; overflow: hidden; background: #fff; display: flex; flex-direction: column;
        border: 1.5px solid #4CAF50; min-height: 420px; max-height: 80vh;
    }
    #chefAssistantHeader {
        background: linear-gradient(90deg,#4CAF50 60%,#2196F3 100%); color: #fff;
        padding: 16px 18px; font-size: 18px; font-weight: 600; letter-spacing: 0.5px;
        display: flex; align-items: center; justify-content: space-between; cursor: move;
    }
    #chefAssistantHeader .close-btn {
        background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; margin-left: 8px;
        transition: color 0.2s; opacity: 0.8;
    }
    #chefAssistantHeader .close-btn:hover { color: #ff6b35; opacity: 1; }
    #chefAssistantMessages {
        flex: 1; overflow-y: auto; background: #f8f8f8; padding: 18px 14px 12px 14px;
        font-size: 15px; line-height: 1.6; min-height: 120px;
    }
    .chef-msg, .user-msg {
        margin-bottom: 14px; display: flex; align-items: flex-end;
    }
    .chef-msg .bubble {
        background: linear-gradient(90deg,#e8f5e9 80%,#e3f2fd 100%); color: #222;
        border-radius: 16px 16px 16px 4px; padding: 10px 16px; max-width: 80%; box-shadow: 0 2px 8px rgba(76,175,80,0.07);
        border: 1px solid #c8e6c9; margin-right: auto;
    }
    .user-msg .bubble {
        background: #4CAF50; color: #fff; border-radius: 16px 16px 4px 16px;
        padding: 10px 16px; max-width: 80%; margin-left: auto; box-shadow: 0 2px 8px rgba(33,150,243,0.07);
        border: 1px solid #2196F3;
    }
    .msg-meta { font-size: 12px; color: #888; margin-top: 2px; }
    #chefAssistantForm {
        display: flex; border-top: 1px solid #e0e0e0; background: #fafafa;
        padding: 10px 10px 10px 14px; align-items: center;
    }
    #chefAssistantInput {
        flex: 1; padding: 10px 12px; border: 1px solid #c8e6c9; border-radius: 8px;
        font-size: 15px; outline: none; margin-right: 10px; background: #fff;
    }
    #chefAssistantInput:focus { border-color: #4CAF50; }
    #chefAssistantSendBtn {
        background: linear-gradient(90deg,#4CAF50 60%,#2196F3 100%); color: #fff;
        border: none; border-radius: 8px; padding: 0 22px; font-size: 16px; font-weight: 500;
        height: 40px; cursor: pointer; transition: background 0.2s;
    }
    #chefAssistantSendBtn:disabled { opacity: 0.6; cursor: not-allowed; }
    #chefAssistantTyping { color: #888; font-size: 14px; margin-bottom: 8px; }
    @media (max-width: 600px) {
        #chefAssistantWidget { right: 2vw; left: 2vw; width: 96vw; min-width: 0; }
    }
    `;
    document.head.appendChild(style);

    // Widget HTML
    const widget = document.createElement('div');
    widget.id = 'chefAssistantWidget';
    widget.innerHTML = `
        <div id="chefAssistantHeader">
            <span><i class="fas fa-hat-chef" style="margin-right:8px;"></i>Chef Assistant</span>
            <button class="close-btn" title="Close">&times;</button>
        </div>
        <div id="chefAssistantMessages"></div>
        <form id="chefAssistantForm" autocomplete="off">
            <input id="chefAssistantInput" type="text" placeholder="Ask a cooking question..." maxlength="300" />
            <button id="chefAssistantSendBtn" type="submit">Send</button>
        </form>
    `;
    document.body.appendChild(widget);
    widget.style.display = 'none'; // Hide by default

    // Show widget when navbar button is clicked
    function showWidget() {
        widget.style.display = 'flex';
        setTimeout(() => input.focus(), 200);
    }
    // Listen for nav button
    document.addEventListener('DOMContentLoaded', function() {
        const navBtn = document.getElementById('chefAssistantNavBtn');
        if (navBtn) {
            navBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showWidget();
            });
        }
    });

    // Draggable logic
    let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
    const header = widget.querySelector('#chefAssistantHeader');
    header.addEventListener('mousedown', function(e) {
        isDragging = true;
        dragOffsetX = e.clientX - widget.getBoundingClientRect().left;
        dragOffsetY = e.clientY - widget.getBoundingClientRect().top;
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        widget.style.left = (e.clientX - dragOffsetX) + 'px';
        widget.style.top = (e.clientY - dragOffsetY) + 'px';
        widget.style.right = 'auto';
        widget.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', function() {
        isDragging = false;
        document.body.style.userSelect = '';
    });

    // Close button
    header.querySelector('.close-btn').onclick = () => widget.style.display = 'none';

    // Chat logic
    const messages = widget.querySelector('#chefAssistantMessages');
    const form = widget.querySelector('#chefAssistantForm');
    const input = widget.querySelector('#chefAssistantInput');
    const sendBtn = widget.querySelector('#chefAssistantSendBtn');

    // Message history with conversation tracking
    let chatHistory = [];
    let currentConversationId = localStorage.getItem('chef_conversation_id');

    const resolveApiBaseUrl = () => {
        if (typeof window !== 'undefined') {
            if (typeof window.getChopsmoApiBaseUrl === 'function') {
                const value = window.getChopsmoApiBaseUrl();
                if (value) return value;
            }
            if (typeof window.buildChopsmoUrl === 'function') {
                return window.buildChopsmoUrl();
            }
            if (window.CHOPSMO_CONFIG && window.CHOPSMO_CONFIG.API_BASE_URL) {
                return window.CHOPSMO_CONFIG.API_BASE_URL;
            }
        }
    return 'https://api.chopsmo.site';
    };

    const API_BASE_URL = resolveApiBaseUrl();
    const NORMALIZED_API_BASE = API_BASE_URL.replace(/\/$/, '');
    const API_ROOT = `${NORMALIZED_API_BASE}/api`;

    // Recipe social features utilities
    const recipeSocial = {
        // Base API URL
        baseUrl: API_ROOT,
        
        // Get authorization headers
        getAuthHeaders() {
            return window.authHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
        },
        
        // Get ratings for a recipe
        async getRecipeRatings(recipeId) {
            try {
                const response = await fetch(`${this.baseUrl}/recipes/ratings/?recipe_id=${recipeId}`, {
                    method: 'GET',
                    headers: this.getAuthHeaders()
                });
                if (!response.ok) return null;
                return await response.json();
            } catch (error) {
                console.error('Error fetching recipe ratings:', error);
                return null;
            }
        },
        
        // Get recipe details with social counts
        async getRecipeDetails(recipeId) {
            try {
                const response = await fetch(`${this.baseUrl}/recipes/${recipeId}/`, {
                    method: 'GET',
                    headers: this.getAuthHeaders()
                });
                if (!response.ok) return null;
                return await response.json();
            } catch (error) {
                console.error('Error fetching recipe details:', error);
                return null;
            }
        },
        
        // Format recipe social info for display in chat
        async getFormattedRecipeSocialInfo(recipeId) {
            const details = await this.getRecipeDetails(recipeId);
            if (!details) return "I couldn't find information for this recipe.";
            
            const ratings = await this.getRecipeRatings(recipeId);
            
            let result = `Recipe: ${details.title || `#${recipeId}`}\n\n`;
            
            if (details.average_rating) {
                result += `⭐ Average Rating: ${details.average_rating.toFixed(1)}/5 (${details.rating_count} ratings)\n`;
            } else {
                result += "⭐ No ratings yet\n";
            }
            
            result += `❤️ ${details.like_count || 0} people liked this recipe\n`;
            result += `💬 ${details.comment_count || 0} comments\n\n`;
            
            if (ratings && ratings.length > 0) {
                result += "Recent reviews:\n";
                const topReviews = ratings
                    .filter(r => r.review && r.review.trim() !== '')
                    .slice(0, 2);
                    
                topReviews.forEach(r => {
                    result += `- "${r.review.substring(0, 100)}${r.review.length > 100 ? '...' : ''}" - ${r.user.username}\n`;
                });
                
                if (ratings.length > 2) {
                    result += `\n(${ratings.length - 2} more reviews not shown)`;
                }
            }
            
            return result;
        }
    };
    
    function renderMessages() {
        messages.innerHTML = '';
        chatHistory.forEach(msg => {
            if (msg.type === 'user') {
                messages.innerHTML += `<div class="user-msg"><div class="bubble">${msg.text}</div></div>`;
            } else {
                messages.innerHTML += `<div class="chef-msg"><div class="bubble">${msg.text}</div></div>`;
            }
        });
        messages.scrollTop = messages.scrollHeight;
    }

    // Typing indicator
    function showTyping() {
        const typing = document.createElement('div');
        typing.id = 'chefAssistantTyping';
        typing.innerHTML = '<i class="fas fa-ellipsis-h fa-bounce"></i> Chef Assistant is typing...';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;
    }
    function hideTyping() {
        const typing = document.getElementById('chefAssistantTyping');
        if (typing) typing.remove();
    }

    // API call with improved error handling
    async function askChefAssistant(prompt) {
        try {
            // Build headers using auth helper
            const headers = window.authHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' });

            // Debug: Log full request details
            const apiUrl = `${API_ROOT}/chef-assistant/`;  // Derived from config
            console.log('Sending request to:', apiUrl);
            console.log('Request headers:', headers);
            // Parse stored preferences (they might be JSON strings)
            let dietary_preferences = [];
            let favorite_cuisines = [];
            let allergies = [];
            
            try {
                const storedDietary = localStorage.getItem('dietary_preferences');
                const storedCuisines = localStorage.getItem('favorite_cuisines');
                const storedAllergies = localStorage.getItem('allergies');
                
                dietary_preferences = storedDietary ? JSON.parse(storedDietary) : [];
                favorite_cuisines = storedCuisines ? JSON.parse(storedCuisines) : [];
                allergies = storedAllergies ? JSON.parse(storedAllergies) : [];
            } catch (e) {
                console.log('Error parsing preferences:', e);
            }

            // Simplify request structure to exactly match API expectations
            const requestBody = { 
                prompt: prompt
            };
            
            // Only add conversation_id if it exists
            const conversationId = localStorage.getItem('chef_conversation_id');
            if (conversationId && conversationId !== 'null' && conversationId !== 'undefined') {
                requestBody.conversation_id = conversationId;
            }
            console.log('Request body:', requestBody);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            
            // Detailed debugging
            console.log('Raw request sent:', JSON.stringify(requestBody));

            console.log('Response status:', response.status);
            
            // Debug: Log full response details
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                // Get response as text first for debugging
                const responseText = await response.text();
                console.log('Error response text:', responseText);
                console.log('Response status:', response.status);
                console.log('Response status text:', response.statusText);
                
                let errorData = {};
                try {
                    errorData = JSON.parse(responseText);
                    console.log('Parsed error data:', errorData);
                } catch (e) {
                    console.log('Failed to parse error response as JSON:', e.message);
                }
                
                const errorMsg = errorData.detail || errorData.message || 'Error communicating with Chef Assistant';
                
                // Enhanced error handling with fallbacks
                if (response.status === 400) {
                    console.error('Request format error:', errorData);
                    return 'I had trouble understanding your request. Try rephrasing your question about cooking or recipes.';
                } else if (response.status === 401) {
                    return 'Please log in to use the Chef Assistant. This will help me provide personalized cooking suggestions based on your preferences.';
                } else if (response.status === 429) {
                    return 'I\'m getting a lot of requests right now. While you wait, here\'s a tip: For Cameroonian dishes, freshly ground spices like pebe (African white pepper) and garlic make a huge difference in flavor.';
                } else if (response.status === 503) {
                    return 'The Chef Assistant is taking a short break. While you wait, remember that the key to perfect Ndolé is to blanch the leaves twice to remove bitterness.';
                } else if (response.status === 500) {
                    return 'I encountered a technical issue. While our team fixes it, here\'s a tip: When making Achu soup, use limestone (kanwa) to achieve that perfect smooth texture.';
                }
                
                // If we have fallback suggestions in the error response, use them
                if (errorData.fallback_suggestion) {
                    return `${errorMsg}\n\nIn the meantime, here's a helpful tip: ${errorData.fallback_suggestion}`;
                }
                
                throw new Error(`${errorMsg} (Status: ${response.status})`);
            }

            // Get response text first to avoid JSON parsing errors
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            // Parse JSON manually after logging the raw text
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed response data:', data);
            } catch (e) {
                console.error('Error parsing JSON response:', e);
                throw new Error('Invalid JSON response from Chef Assistant');
            }
            
            // Store conversation ID for context
            if (data.conversation_id) {
                localStorage.setItem('chef_conversation_id', data.conversation_id);
                console.log('Stored conversation ID:', data.conversation_id);
            }

            // Enhanced response handling
            if (data.error) {
                console.error('Chef Assistant API error:', data.error);
                if (data.fallback_suggestion) {
                    return `${data.error}\n\nHere's a helpful suggestion: ${data.fallback_suggestion}`;
                }
                throw new Error(data.error);
            }

            return data.suggestion || data.response;
        } catch (err) {
            console.error('Chef Assistant error:', err);
            // More user-friendly error message
            if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                return 'Sorry, I cannot connect to the server right now. Please check your internet connection and try again.';
            }
            return `Sorry, I could not process your request. ${err.message}`;
        }
    }

    // Form submit with recipe social features integration
    form.onsubmit = async function(e) {
        e.preventDefault();
        const userMsg = input.value.trim();
        if (!userMsg) return;
        
        chatHistory.push({ type: 'user', text: userMsg });
        renderMessages();
        input.value = '';
        sendBtn.disabled = true;
        showTyping();
        
        // Check if the message is asking about recipe ratings, likes or comments
        let answer;
        
        // Look for recipe ID in the query
        // Match patterns like: "show ratings for recipe 5" or "what do people think of recipe 12"
        const recipeIdMatch = userMsg.match(/recipe\s+#?(\d+)/i) || 
                             userMsg.match(/ratings? for (?:recipe)?\s*#?(\d+)/i) || 
                             userMsg.match(/reviews? (?:for|of) (?:recipe)?\s*#?(\d+)/i);
                             
        if (recipeIdMatch) {
            // Extract recipe ID
            const recipeId = recipeIdMatch[1];
            
            // Handle social feature request
            try {
                const socialInfo = await recipeSocial.getFormattedRecipeSocialInfo(recipeId);
                answer = socialInfo;
                
                // Add a prompt to tell the user they can ask the Chef Assistant about the recipe
                answer += "\n\nYou can ask me for cooking tips related to this recipe or how to modify it for different dietary needs!";
            } catch (error) {
                console.error('Error getting recipe social info:', error);
                // Fall back to normal Chef Assistant
                answer = await askChefAssistant(userMsg);
            }
        } else {
            // Regular Chef Assistant query
            answer = await askChefAssistant(userMsg);
        }
        
        hideTyping();
        chatHistory.push({ type: 'chef', text: answer });
        renderMessages();
        sendBtn.disabled = false;
        input.focus();
    };

    // Keyboard shortcut: open with Ctrl+Shift+C
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
            widget.style.display = 'flex';
            input.focus();
        }
    });

    // Start with a contextual welcome message including social feature info
    let welcomeMessage = window.getAuthToken && window.getAuthToken()
        ? '👋 Welcome back! I remember your preferences and our previous conversations. Ask me anything about cooking, especially Cameroonian cuisine!' 
        : '👋 Hi! I am your Chef Assistant, specializing in Cameroonian and international cuisine. Log in to get personalized cooking tips!';
    
    // Add info about recipe social features
    welcomeMessage += '\n\nNew feature: You can now ask me about recipe ratings and reviews! Try "Show ratings for recipe 5" or "What do people think of recipe 12"';
    
    chatHistory.push({ type: 'chef', text: welcomeMessage });
    renderMessages();
})();

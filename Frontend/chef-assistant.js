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

    // Message history
    let chatHistory = [];
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
            // Get auth token if user is logged in
            const authToken = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            if (authToken) {
                headers['Authorization'] = `Token ${authToken}`;
            }

            // Debug: Log full request details
            const apiUrl = 'https://njoya.pythonanywhere.com/api/chef-assistant/';  // Original endpoint path
            console.log('Sending request to:', apiUrl);
            console.log('Request headers:', headers);
            const requestBody = { 
                prompt,
                conversation_id: localStorage.getItem('chef_conversation_id'),
                user_preferences: {
                    dietary_preferences: localStorage.getItem('dietary_preferences'),
                    favorite_cuisines: localStorage.getItem('favorite_cuisines'),
                    allergies: localStorage.getItem('allergies')
                }
            };
            console.log('Request body:', requestBody);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            
            // Debug: Log full response details
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
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
                if (response.status === 401) {
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

            const data = await response.json();
            
            // Store conversation ID for context
            if (data.conversation_id) {
                localStorage.setItem('chef_conversation_id', data.conversation_id);
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

    // Form submit
    form.onsubmit = async function(e) {
        e.preventDefault();
        const userMsg = input.value.trim();
        if (!userMsg) return;
        chatHistory.push({ type: 'user', text: userMsg });
        renderMessages();
        input.value = '';
        sendBtn.disabled = true;
        showTyping();
        const answer = await askChefAssistant(userMsg);
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

    // Start with a contextual welcome message
    const welcomeMessage = localStorage.getItem('authToken') 
        ? '👋 Welcome back! I remember your preferences and our previous conversations. Ask me anything about cooking, especially Cameroonian cuisine!' 
        : '👋 Hi! I am your Chef Assistant, specializing in Cameroonian and international cuisine. Log in to get personalized cooking tips!';
    chatHistory.push({ type: 'chef', text: welcomeMessage });
    renderMessages();
})();

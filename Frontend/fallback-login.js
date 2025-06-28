// Fallback Login System for ChopSmo
// This is an alternative login implementation that can be used if the main one fails

class FallbackLogin {
    constructor() {
        this.baseUrl = 'https://njoya.pythonanywhere.com';
        this.retryCount = 3;
        this.retryDelay = 1000;
    }

    async login(email, password) {
        console.log('🔄 Starting fallback login process...');
        
        const strategies = [
            () => this.loginWithFetch(email, password),
            () => this.loginWithXHR(email, password),
            () => this.loginWithRetry(email, password)
        ];

        for (let i = 0; i < strategies.length; i++) {
            try {
                console.log(`🧪 Trying strategy ${i + 1}...`);
                const result = await strategies[i]();
                console.log('✅ Fallback login successful!');
                return result;
            } catch (error) {
                console.error(`❌ Strategy ${i + 1} failed:`, error);
                if (i === strategies.length - 1) {
                    throw error;
                }
                await this.delay(500);
            }
        }
    }

    async loginWithFetch(email, password) {
        const response = await fetch(`${this.baseUrl}/api/users/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    async loginWithXHR(email, password) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${this.baseUrl}/api/users/login/`, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Accept', 'application/json');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    try {
                        const data = JSON.parse(xhr.responseText || '{}');
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(data);
                        } else {
                            reject(new Error(data.detail || data.message || `HTTP ${xhr.status}`));
                        }
                    } catch (e) {
                        reject(new Error('Invalid response format'));
                    }
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.ontimeout = () => reject(new Error('Request timeout'));
            xhr.timeout = 10000; // 10 seconds

            xhr.send(JSON.stringify({ email, password }));
        });
    }

    async loginWithRetry(email, password) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryCount; attempt++) {
            try {
                console.log(`🔄 Retry attempt ${attempt}/${this.retryCount}`);
                return await this.loginWithFetch(email, password);
            } catch (error) {
                lastError = error;
                if (attempt < this.retryCount) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        
        throw lastError;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in Login.js
window.FallbackLogin = FallbackLogin;

// Akiyy Hub Client Script - Login/Register

const API_URL = `${window.location.origin}/api`;

// Utility Functions
// =================

/**
 * Get token from localStorage
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Get user from localStorage
 */
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Store authentication data
 */
function storeAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Clear authentication data
 */
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Make authenticated API request
 */
async function authenticatedFetch(url, options = {}) {
    const token = getToken();
    if (!token) {
        throw new Error('未登录');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    const data = await response.json();

    // Handle token expiration
    if (response.status === 401) {
        clearAuth();
        window.location.href = 'index.html';
        throw new Error('登录已过期，请重新登录');
    }

    return { response, data };
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 z-50 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    }`;
    toast.textContent = message;
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

/**
 * Display message in element
 */
function displayMessage(element, message, isSuccess = true) {
    if (isSuccess) {
        element.className = 'p-3 rounded-lg text-sm bg-green-100 border border-green-400 text-green-700';
    } else {
        element.className = 'p-3 rounded-lg text-sm bg-red-100 border border-red-400 text-red-700';
    }
    element.textContent = message;
    element.classList.remove('hidden');
}

// Player API Functions
// ====================

/**
 * Set player nickname
 */
async function setNickname(nickname) {
    try {
        const { data } = await authenticatedFetch(`${API_URL}/player/nickname`, {
            method: 'POST',
            body: JSON.stringify({ nickname })
        });
        return data;
    } catch (error) {
        console.error('Set nickname error:', error);
        throw error;
    }
}

/**
 * Set player skin
 */
async function setSkin(type, value) {
    try {
        const { data } = await authenticatedFetch(`${API_URL}/player/skin`, {
            method: 'POST',
            body: JSON.stringify({ type, value })
        });
        return data;
    } catch (error) {
        console.error('Set skin error:', error);
        throw error;
    }
}

/**
 * Upload skin file
 */
async function uploadSkin(file) {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('未登录');
        }

        const formData = new FormData();
        formData.append('skin', file);

        const response = await fetch(`${API_URL}/player/skin/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        // Handle token expiration
        if (response.status === 401) {
            clearAuth();
            window.location.href = 'index.html';
            throw new Error('登录已过期，请重新登录');
        }

        return data;
    } catch (error) {
        console.error('Upload skin error:', error);
        throw error;
    }
}

// Login/Register Page Logic
// ==========================

// DOM Elements
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Only redirect on the login/register page to avoid refresh loop on dashboard
    if (loginTab && registerTab && isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    setupEventListeners();
});

function setupEventListeners() {
    if (!loginTab || !registerTab) return; // Not on login page

    // Tab switching
    loginTab.addEventListener('click', () => switchTab('login'));
    registerTab.addEventListener('click', () => switchTab('register'));

    // Form submissions
    loginFormElement.addEventListener('submit', handleLogin);
    registerFormElement.addEventListener('submit', handleRegister);
}

function switchTab(tab) {
    if (tab === 'login') {
        // Update tabs
        loginTab.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        loginTab.classList.remove('text-gray-500');
        registerTab.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600');
        registerTab.classList.add('text-gray-500');

        // Show/hide forms
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        // Update tabs
        registerTab.classList.add('text-purple-600', 'border-b-2', 'border-purple-600');
        registerTab.classList.remove('text-gray-500');
        loginTab.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        loginTab.classList.add('text-gray-500');

        // Show/hide forms
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    // Hide previous errors
    errorDiv.classList.add('hidden');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Store token and user info
            storeAuth(data.token, data.user);
            
            // Show success toast
            showToast('登录成功！', 'success');

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            // Show error
            displayMessage(errorDiv, data.message || '登录失败', false);
        }
    } catch (error) {
        console.error('Login error:', error);
        displayMessage(errorDiv, '网络错误，请稍后重试', false);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const minecraftId = document.getElementById('registerMinecraftId').value.trim();
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');

    // Hide previous messages
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');

    // Validate password length
    if (password.length < 6) {
        displayMessage(errorDiv, '密码至少需要6个字符', false);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, minecraftId })
        });

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            console.log('Response text:', await response.text());
            displayMessage(errorDiv, '服务器响应错误，请检查网络连接', false);
            return;
        }

        if (data.success) {
            // Show success message
            displayMessage(successDiv, '注册成功！正在跳转到登录...', true);

            // Clear form
            registerFormElement.reset();

            // Switch to login tab after 2 seconds
            setTimeout(() => {
                switchTab('login');
                successDiv.classList.add('hidden');
            }, 2000);
        } else {
            // Show error
            displayMessage(errorDiv, data.message || '注册失败', false);
        }
    } catch (error) {
        console.error('Register error:', error);
        console.error('Error stack:', error.stack);
        displayMessage(errorDiv, '网络错误，请稍后重试', false);
    }
}

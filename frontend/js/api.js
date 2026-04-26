const BASE_URL = "http://localhost:5000/api";

export async function apiFetch(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    const token = getToken();
    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(BASE_URL + endpoint, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong");
        }

        return data;
    } catch (error) {
        throw error;
    }
}

export function getToken() {
    return localStorage.getItem("token");
}

export function getUserData() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
}

export function setToken(token) {
    localStorage.setItem("token", token);
}

export function setUserData(user) {
    localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}

export function showToast(message, type = "success") {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export const SOCKET_URL = "http://localhost:5000";
export function setupDashboardUI() {
  // Profile Dropdown
  const profileAvatar = document.getElementById('profileAvatar');
  const profileDropdown = document.getElementById('profileDropdown');
  if (profileAvatar && profileDropdown) {
    profileAvatar.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('active');
    });
  }

  // Notification Dropdown
  const notifBell = document.getElementById('notificationBell');
  const notifDropdown = document.getElementById('notificationDropdown');
  if (notifBell && notifDropdown) {
    notifBell.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('active');
      const badge = document.getElementById('notifBadge');
      if(badge) badge.style.display = 'none';
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    if (profileDropdown) profileDropdown.classList.remove('active');
    if (notifDropdown) notifDropdown.classList.remove('active');
  });

  // Mobile Menu
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('.sidebar');
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });
  }

  // Global Logout
  const handleLogout = (e) => {
    if(e) e.preventDefault();
    clearAuth();
    showToast('Logged out successfully', 'success');
    setTimeout(() => window.location.href = 'login.html', 1000);
  };

  const navLogout = document.getElementById('nav-logout');
  const topLogoutBtn = document.getElementById('topLogoutBtn');
  if (navLogout) navLogout.addEventListener('click', handleLogout);
  if (topLogoutBtn) topLogoutBtn.addEventListener('click', handleLogout);
}


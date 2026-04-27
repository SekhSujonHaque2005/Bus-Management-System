const API_URL = "http://localhost:5001/api";
export const SOCKET_URL = "http://localhost:5001";

/* ===============================
   GENERIC API CALL
=============================== */
export async function apiFetch(endpoint, method = "GET", data = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };

  const token = localStorage.getItem("token");

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Request failed");
    }

    return result;

  } catch (error) {
    throw new Error(error.message || "Network error");
  }
}

/* ===============================
   TOKEN STORAGE
=============================== */
export function setToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function clearToken() {
  localStorage.removeItem("token");
}

/* ===============================
   USER STORAGE
=============================== */
export function setUserData(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUserData() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function clearUserData() {
  localStorage.removeItem("user");
}

/* ===============================
   LOGOUT
=============================== */
export function logout() {
  clearToken();
  clearUserData();
  window.location.href = "login.html";
}

/* ===============================
   MODERN TOAST
=============================== */
export function showToast(message, type = "info") {
  let toastContainer =
    document.getElementById("toastContainer");

  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.style.position = "fixed";
    toastContainer.style.top = "20px";
    toastContainer.style.right = "20px";
    toastContainer.style.zIndex = "9999";
    toastContainer.style.display = "flex";
    toastContainer.style.flexDirection = "column";
    toastContainer.style.gap = "10px";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");

  toast.textContent = message;
  toast.style.padding = "12px 18px";
  toast.style.borderRadius = "8px";
  toast.style.color = "#fff";
  toast.style.fontWeight = "600";
  toast.style.minWidth = "220px";
  toast.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(-10px)";
  toast.style.transition = "all 0.3s ease";

  if (type === "success") {
    toast.style.background = "#16a34a";
  } else if (type === "error") {
    toast.style.background = "#dc2626";
  } else if (type === "warning") {
    toast.style.background = "#f59e0b";
  } else {
    toast.style.background = "#2563eb";
  }

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
  }, 2800);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}

/* ===============================
   DASHBOARD COMMON UI
=============================== */
export function setupDashboardUI() {
  console.log("Dashboard UI Ready");

  const logoutBtn =
    document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
}
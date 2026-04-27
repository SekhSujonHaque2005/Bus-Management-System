import {
  apiFetch,
  getUserData,
  getToken,
  showToast,
  setupDashboardUI,
  SOCKET_URL
} from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  /* ===============================
     AUTH CHECK
  =============================== */
  const token = getToken();
  const user = getUserData();

  if (!token || !user || user.role !== 'admin') {
    window.location.href = 'login.html';
    return;
  }

  setupDashboardUI();

  /* ===============================
     LIVE SOCKET
  =============================== */
  const socket = io(SOCKET_URL);

  socket.on("connect", () => {
    console.log("✅ Admin connected to live server");
  });

  socket.on("live-location", (data) => {
    console.log("📍 Live Bus:", data);
  });

  socket.on("emergency-alert", (data) => {
    showToast("🚨 EMERGENCY: " + data.driverName, "error");
  });

  socket.on("delay-report", (data) => {
    showToast("⚠ Delay Report: " + data.reason, "warning");
  });

  /* ===============================
     PROFILE
  =============================== */
  const nameEl = document.getElementById('adminName');
  const initialEl = document.getElementById('profileInitials');

  if (nameEl) nameEl.textContent = user.name || "Admin";
  if (initialEl) initialEl.textContent = (user.name || "A").charAt(0).toUpperCase();

  let chartInstance = null;
  let allUsers = [];

  /* ===============================
     LOAD DATA
  =============================== */
  const loadData = async () => {
    try {
      const buses = await apiFetch('/buses');
      const routes = await apiFetch('/routes');
      const stats = await apiFetch('/admin/stats');
      const usersRes = await apiFetch('/auth/users');

      allUsers = usersRes.users || usersRes;

      document.getElementById('totalBuses').textContent =
        stats.totalBuses || buses.length;

      document.getElementById('totalRoutes').textContent =
        stats.totalRoutes || routes.length;

      document.getElementById('totalBookings').textContent =
        stats.totalBookings || 0;

      renderBusTable(buses);
      renderUsers(allUsers);
      renderChart(buses);

    } catch (error) {
      console.error(error);
      showToast("Failed to load admin data", "error");
    }
  };

  /* ===============================
     BUS TABLE
  =============================== */
  function renderBusTable(buses) {
    const tbody = document.getElementById('busesTableBody');
    if (!tbody) return;

    if (!buses.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">No buses found</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = buses.map(bus => `
      <tr>
        <td>${bus.busNumber}</td>
        <td>${bus.capacity}</td>
        <td>${bus.seatsAvailable}</td>
        <td>${bus.status}</td>
        <td>
          <button class="edit-bus-btn" data-id="${bus._id}">
            Edit
          </button>

          <button class="delete-bus-btn" data-id="${bus._id}">
            Delete
          </button>
        </td>
      </tr>
    `).join("");

    document.querySelectorAll(".delete-bus-btn").forEach(btn => {
      btn.addEventListener("click", deleteBus);
    });

    document.querySelectorAll(".edit-bus-btn").forEach(btn => {
      btn.addEventListener("click", editBus);
    });
  }

  /* ===============================
     USERS TABLE
  =============================== */
  function renderUsers(users) {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>
          <button class="delete-user-btn" data-id="${u._id}">
            Delete
          </button>
        </td>
      </tr>
    `).join("");

    document.querySelectorAll(".delete-user-btn").forEach(btn => {
      btn.addEventListener("click", deleteUser);
    });
  }

  /* ===============================
     CHART
  =============================== */
  function renderChart(buses) {
    const chartEl = document.getElementById("utilizationChart");
    if (!chartEl || typeof Chart === "undefined") return;

    const ctx = chartEl.getContext("2d");

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: buses.map(b => b.busNumber),
        datasets: [
          {
            label: "Booked",
            data: buses.map(b => b.capacity - b.seatsAvailable)
          },
          {
            label: "Available",
            data: buses.map(b => b.seatsAvailable)
          }
        ]
      },
      options: {
        responsive: true
      }
    });
  }

  /* ===============================
     ADD BUS
  =============================== */
  document.getElementById("addBusForm")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const busNumber =
        document.getElementById("busNumber").value.trim();

      const capacity =
        parseInt(document.getElementById("capacity").value);

      try {
        await apiFetch("/buses", "POST", {
          busNumber,
          capacity,
          status: "inactive"
        });

        showToast("Bus Added", "success");
        e.target.reset();
        loadData();

      } catch (error) {
        showToast(error.message, "error");
      }
    });

  /* ===============================
     ADD ROUTE
  =============================== */
  document.getElementById("addRouteForm")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const source =
        document.getElementById("routeSource").value.trim();

      const destination =
        document.getElementById("routeDest").value.trim();

      try {
        await apiFetch("/routes", "POST", {
          source,
          destination,
          stops: []
        });

        showToast("Route Added", "success");
        e.target.reset();
        loadData();

      } catch (error) {
        showToast(error.message, "error");
      }
    });

  /* ===============================
     DELETE BUS
  =============================== */
  async function deleteBus(e) {
    try {
      await apiFetch(`/buses/${e.target.dataset.id}`, "DELETE");
      showToast("Bus Deleted", "success");
      loadData();

    } catch (error) {
      showToast(error.message, "error");
    }
  }

  /* ===============================
     EDIT BUS
  =============================== */
  async function editBus(e) {
    const status = prompt(
      "Enter status: active / inactive / maintenance"
    );

    if (!status) return;

    try {
      await apiFetch(`/buses/${e.target.dataset.id}`, "PUT", {
        status
      });

      showToast("Bus Updated", "success");
      loadData();

    } catch (error) {
      showToast(error.message, "error");
    }
  }

  /* ===============================
     DELETE USER
  =============================== */
  async function deleteUser(e) {
    try {
      await apiFetch(`/auth/users/${e.target.dataset.id}`, "DELETE");

      showToast("User Deleted", "success");
      loadData();

    } catch (error) {
      showToast(error.message, "error");
    }
  }

  /* ===============================
     SEARCH USERS
  =============================== */
  document.getElementById("searchUsers")
    ?.addEventListener("input", (e) => {
      const val = e.target.value.toLowerCase();

      const filtered = allUsers.filter(u =>
        u.name.toLowerCase().includes(val) ||
        u.email.toLowerCase().includes(val)
      );

      renderUsers(filtered);
    });

  /* ===============================
     EXPORT CSV
  =============================== */
  document.getElementById("exportCsvBtn")
    ?.addEventListener("click", async () => {
      const buses = await apiFetch("/buses");

      let csv =
        "Bus Number,Capacity,Seats Available,Status\n";

      buses.forEach(bus => {
        csv += `${bus.busNumber},${bus.capacity},${bus.seatsAvailable},${bus.status}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "fleet.csv";
      a.click();
    });

  /* ===============================
     AUTO REFRESH
  =============================== */
  setInterval(loadData, 30000);

  /* ===============================
     INITIAL LOAD
  =============================== */
  loadData();
});

/* ===============================
   SIDEBAR LINKS
=============================== */
const sidebarLinks = document.querySelectorAll('.sidebar ul li a');

if (sidebarLinks.length >= 4) {
  sidebarLinks[0].addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  sidebarLinks[1].addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('addBusForm')
      ?.scrollIntoView({ behavior: 'smooth' });
  });

  sidebarLinks[2].addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('addRouteForm')
      ?.scrollIntoView({ behavior: 'smooth' });
  });

  sidebarLinks[3].addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('usersSection')
      ?.scrollIntoView({ behavior: 'smooth' });
  });
}
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // LOGOUT BUTTONS
  // ===============================
  document.getElementById("nav-logout")
  ?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
  });

  document.getElementById("topLogoutBtn")
  ?.addEventListener("click", () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
  });

  // ===============================
  // PROFILE DROPDOWN
  // ===============================
  const profileAvatar =
    document.getElementById("profileAvatar");

  const profileDropdown =
    document.getElementById("profileDropdown");

  profileAvatar?.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("active");
  });

  // ===============================
  // NOTIFICATION DROPDOWN
  // ===============================
  const bell =
    document.getElementById("notificationBell");

  const notifDropdown =
    document.getElementById("notificationDropdown");

  bell?.addEventListener("click", (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle("active");
  });

  // ===============================
  // MARK ALL READ
  // ===============================
  document.getElementById("markReadBtn")
  ?.addEventListener("click", () => {

    const badge =
      document.getElementById("notifBadge");

    if (badge) badge.style.display = "none";

    const list =
      document.getElementById("notifList");

    if (list) {
      list.innerHTML = `
        <div style="padding:1rem;text-align:center;color:gray;">
          No new notifications
        </div>
      `;
    }
  });

  // ===============================
  // CLOSE DROPDOWNS OUTSIDE CLICK
  // ===============================
  document.addEventListener("click", (e) => {

    if (
      profileDropdown &&
      !profileDropdown.contains(e.target)
    ) {
      profileDropdown.classList.remove("active");
    }

    if (
      notifDropdown &&
      !notifDropdown.contains(e.target)
    ) {
      notifDropdown.classList.remove("active");
    }

  });

});

// ===============================
// PROFILE DROPDOWN
// ===============================
const profileAvatar =
  document.getElementById("profileAvatar");

const profileDropdown =
  document.getElementById("profileDropdown");

profileAvatar?.addEventListener("click", () => {
  profileDropdown.classList.toggle("active");
});

// ===============================
// NOTIFICATION DROPDOWN
// ===============================
const bell =
  document.getElementById("notificationBell");

const notifDropdown =
  document.getElementById("notificationDropdown");

bell?.addEventListener("click", () => {
  notifDropdown.classList.toggle("active");
});

// ===============================
// MARK ALL READ
// ===============================
document.getElementById("markReadBtn")
?.addEventListener("click", () => {
  document.getElementById("notifBadge").style.display = "none";

  document.getElementById("notifList").innerHTML = `
    <div style="padding:1rem;text-align:center;color:gray;">
      No new notifications
    </div>
  `;
});

// ===============================
// CLOSE DROPDOWNS OUTSIDE CLICK
// ===============================
document.addEventListener("click", (e) => {
  if (!profileDropdown.contains(e.target)) {
    profileDropdown.classList.remove("active");
  }

  if (!notifDropdown.contains(e.target)) {
    notifDropdown.classList.remove("active");
  }
});
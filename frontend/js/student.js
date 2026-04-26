import {
  apiFetch,
  getUserData,
  getToken,
  showToast,
  SOCKET_URL,
  setupDashboardUI
} from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  /* ===============================
     AUTH CHECK
  =============================== */
  const token = getToken();
  const user = getUserData();

  if (!token || !user || user.role !== "student") {
    window.location.href = "login.html";
    return;
  }

  setupDashboardUI();

  /* ===============================
     ELEMENTS
  =============================== */
  const nameEl = document.getElementById("studentName");
  const initialEl = document.getElementById("profileInitials");
  const routesTableBody = document.getElementById("routesTableBody");
  const bookingsTableBody = document.getElementById("bookingsTableBody");

  if (nameEl) nameEl.textContent = user.name;
  if (initialEl) initialEl.textContent = user.name.charAt(0).toUpperCase();

  let allRoutes = [];
  let allBuses = [];
  let selectedRouteId = null;
  let selectedBus = null;

  /* ===============================
     LOAD DATA
  =============================== */
  async function loadData() {
    try {
      // BUSES
      const buses = await apiFetch("/buses");
      allBuses = Array.isArray(buses) ? buses : [];

      const activeBuses = allBuses.filter(
        bus => bus.status?.toLowerCase() === "active"
      );

      const activeCount = document.getElementById("activeBusesCount");
      if (activeCount) activeCount.textContent = activeBuses.length;

      // BOOKINGS
      const bookings = await apiFetch("/bookings/my-bookings");

      const bookingCount = document.getElementById("myBookingsCount");
      if (bookingCount) {
        bookingCount.textContent = bookings.length;
      }

      renderBookings(bookings);

      // ROUTES
      const routes = await apiFetch("/routes");
      allRoutes = Array.isArray(routes) ? routes : [];

      renderRoutes(allRoutes);

    } catch (error) {
      console.error(error);
      showToast("Dashboard data load failed", "error");
    }
  }

  /* ===============================
     RENDER ROUTES
  =============================== */
  function renderRoutes(routes) {
    if (!routesTableBody) return;

    if (!routes.length) {
      routesTableBody.innerHTML = `
        <tr>
          <td colspan="4">No Routes Available</td>
        </tr>
      `;
      return;
    }

    routesTableBody.innerHTML = routes
      .map(
        route => `
      <tr>
        <td>${route.source || "N/A"}</td>
        <td>${route.destination || "N/A"}</td>
        <td>${route.stops?.join(", ") || "Direct"}</td>
        <td>
          <button class="book-btn" data-id="${route._id}">
            Book Seat
          </button>
        </td>
      </tr>
    `
      )
      .join("");

    document.querySelectorAll(".book-btn").forEach(btn => {
      btn.addEventListener("click", handleBookSeat);
    });
  }

  /* ===============================
     RENDER BOOKINGS
  =============================== */
  function renderBookings(bookings) {
    if (!bookingsTableBody) return;

    if (!bookings.length) {
      bookingsTableBody.innerHTML = `
        <tr>
          <td colspan="5">No Bookings Found</td>
        </tr>
      `;
      return;
    }

    bookingsTableBody.innerHTML = bookings
      .map(
        booking => `
      <tr>
        <td>${booking.busId?.busNumber || "N/A"}</td>
        <td>${booking.routeId?.destination || "N/A"}</td>
        <td>${booking.seatNumber}</td>
        <td>${booking.status}</td>
        <td>
          ${
            booking.status === "confirmed"
              ? `<button class="cancel-btn" data-id="${booking._id}">
                   Cancel
                 </button>`
              : "-"
          }
        </td>
      </tr>
    `
      )
      .join("");

    document.querySelectorAll(".cancel-btn").forEach(btn => {
      btn.addEventListener("click", cancelBooking);
    });
  }

  /* ===============================
     BOOK SEAT
  =============================== */
  function handleBookSeat(e) {
    selectedRouteId = e.target.dataset.id;

    const activeBus = allBuses.find(
      bus =>
        bus.status?.toLowerCase() === "active" &&
        bus.seatsAvailable > 0
    );

    if (!activeBus) {
      showToast("No Active Bus Available", "error");
      return;
    }

    selectedBus = activeBus;

    const modal = document.getElementById("bookingModal");
    if (modal) modal.classList.add("active");
  }

  document
    .getElementById("confirmBookBtn")
    ?.addEventListener("click", async () => {
      try {
        await apiFetch("/bookings", "POST", {
          busId: selectedBus._id,
          routeId: selectedRouteId,
          seatNumber:
            Math.floor(Math.random() * selectedBus.capacity) + 1
        });

        showToast("Seat Booked Successfully", "success");

        document
          .getElementById("bookingModal")
          ?.classList.remove("active");

        loadData();

      } catch (error) {
        showToast(error.message, "error");
      }
    });

  /* ===============================
     CANCEL BOOKING
  =============================== */
  async function cancelBooking(e) {
    const bookingId = e.target.dataset.id;

    try {
      await apiFetch(`/bookings/${bookingId}`, "DELETE");

      showToast("Booking Cancelled", "success");

      loadData();

    } catch (error) {
      showToast(error.message, "error");
    }
  }

  /* ===============================
     SEARCH ROUTES
  =============================== */
  document
    .getElementById("searchInput")
    ?.addEventListener("input", e => {
      const value = e.target.value.toLowerCase();

      const filtered = allRoutes.filter(route =>
        route.source?.toLowerCase().includes(value) ||
        route.destination?.toLowerCase().includes(value)
      );

      renderRoutes(filtered);
    });

  /* ===============================
     REFRESH
  =============================== */
  document
    .getElementById("refreshBusesBtn")
    ?.addEventListener("click", () => {
      loadData();
      showToast("Data Refreshed", "success");
    });

  /* ===============================
     SOCKET TRACKING
  =============================== */
  try {
    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      console.log("Socket Connected");
    });

    socket.on("live-location", data => {
      console.log("Bus Live Location:", data);
    });

  } catch (error) {
    console.log("Socket Not Running");
  }

  /* ===============================
     INITIAL LOAD
  =============================== */
  loadData();
});
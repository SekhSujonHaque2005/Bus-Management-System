import {
  apiFetch,
  getUserData,
  getToken,
  showToast,
  SOCKET_URL,
  setupDashboardUI
} from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {

  const token = getToken();
  const user = getUserData();

  if (!token || !user || user.role !== "student") {
    window.location.href = "login.html";
    return;
  }

  setupDashboardUI();

  const socket = io(SOCKET_URL);

  const userName = user.name || "Student";

  document.getElementById("studentName").textContent = userName;
  document.getElementById("profileInitials").textContent =
    userName.charAt(0).toUpperCase();

  // ===============================
  // LOGOUT
  // ===============================
  function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
  }

  document.getElementById("nav-logout")
    ?.addEventListener("click", logout);

  document.getElementById("topLogoutBtn")
    ?.addEventListener("click", logout);

  // ===============================
  // DROPDOWNS
  // ===============================
  document.getElementById("profileAvatar")
    ?.addEventListener("click", () => {
      document.getElementById("profileDropdown")
        .classList.toggle("active");
    });

  document.getElementById("notificationBell")
    ?.addEventListener("click", () => {
      document.getElementById("notificationDropdown")
        .classList.toggle("active");
    });

  document.getElementById("markReadBtn")
    ?.addEventListener("click", () => {
      document.getElementById("notifBadge").style.display =
        "none";
    });

  // ===============================
  // MAP
  // ===============================
  let map = null;
  let marker = null;

  if (document.getElementById("liveMap") &&
      typeof L !== "undefined") {

    map = L.map("liveMap")
      .setView([31.2536, 75.7033], 15);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    ).addTo(map);

    marker = L.marker([31.2536, 75.7033])
      .addTo(map)
      .bindPopup("Waiting for driver...");
  }

  let allRoutes = [];
  let myBookings = [];
  let selectedRoute = null;

  // ===============================
  // RENDER ROUTES
  // ===============================
  function renderRoutes(routes) {

    const body =
      document.getElementById("routesTableBody");

    body.innerHTML = "";

    if (!routes.length) {
      body.innerHTML =
        `<tr><td colspan="4">No Routes Found</td></tr>`;
      return;
    }

    routes.forEach(route => {

      body.innerHTML += `
      <tr>
        <td>${route.source}</td>
        <td>${route.destination}</td>
        <td>${route.stops?.join(", ") || "-"}</td>
        <td>
          <button class="btn bookBtn"
          data-id="${route._id}">
          Book Seat
          </button>
        </td>
      </tr>
      `;
    });

    document
      .querySelectorAll(".bookBtn")
      .forEach(btn => {

        btn.addEventListener("click", () => {

          selectedRoute =
            btn.dataset.id;

          document
            .getElementById("bookingModal")
            .classList.add("active");

          const route =
            allRoutes.find(
              r => r._id === selectedRoute
            );

          document
            .getElementById("modalDestination")
            .textContent =
            route.destination;

          document
            .getElementById("modalBuses")
            .textContent =
            "Available";
        });
      });
  }

  // ===============================
  // RENDER BOOKINGS
  // ===============================
  function renderBookings() {

    const body =
      document.getElementById("bookingsTableBody");

    body.innerHTML = "";

    if (!myBookings.length) {
      body.innerHTML =
        `<tr><td colspan="5">No Bookings Yet</td></tr>`;
      return;
    }

    myBookings.forEach(booking => {

      body.innerHTML += `
      <tr>
        <td>${booking.busId?.busNumber || "-"}</td>
        <td>${booking.routeId?.destination || "-"}</td>
        <td>${booking.seatNumber}</td>
        <td>${booking.status}</td>
        <td>
          <button class="btn cancelBtn"
          data-id="${booking._id}">
          Cancel
          </button>
        </td>
      </tr>
      `;
    });

    document
      .querySelectorAll(".cancelBtn")
      .forEach(btn => {

        btn.addEventListener("click",
        async () => {

          await apiFetch(
            `/bookings/${btn.dataset.id}`,
            "DELETE"
          );

          showToast(
            "Booking Cancelled",
            "success"
          );

          loadData();
        });
      });
  }

  // ===============================
  // LOAD DATA
  // ===============================
  async function loadData() {

    try {

      const buses =
        await apiFetch("/buses");

      const active =
        buses.filter(
          b => b.status === "active"
        ).length;

      document
        .getElementById(
          "activeBusesCount"
        ).textContent = active;

      myBookings =
        await apiFetch(
          "/bookings/my-bookings"
        );

      document
        .getElementById(
          "myBookingsCount"
        ).textContent =
        myBookings.length;

      allRoutes =
        await apiFetch("/routes");

      renderRoutes(allRoutes);
      renderBookings();

    } catch (error) {

      showToast(
        "Dashboard load failed",
        "error"
      );
    }
  }

  // ===============================
  // BOOK CONFIRM
  // ===============================
  document
    .getElementById("confirmBookBtn")
    ?.addEventListener("click",
    async () => {

      try {

        const buses = await apiFetch("/buses");

const activeBus = buses.find(
  bus => bus.status === "active"
);

await apiFetch(
  "/bookings",
  "POST",
  {
    busId: activeBus?._id,
    routeId: selectedRoute,
    seatNumber: 1
  }
);

        document
          .getElementById(
            "bookingModal"
          )
          .classList.remove("active");

        showToast(
          "Seat Booked",
          "success"
        );

        loadData();

      } catch (error) {
  console.log(error);
  alert(error.message);
}
    });

  // ===============================
  // SEARCH
  // ===============================
  document
    .getElementById("searchInput")
    ?.addEventListener("input",
    e => {

      const val =
        e.target.value.toLowerCase();

      const filtered =
        allRoutes.filter(route =>
          route.destination
          .toLowerCase()
          .includes(val)
        );

      renderRoutes(filtered);
    });

  // ===============================
  // REFRESH
  // ===============================
  document
    .getElementById("refreshBusesBtn")
    ?.addEventListener("click",
    () => {
      loadData();
      showToast("Refreshed");
    });

  // ===============================
  // SOCKET
  // ===============================
  socket.on("live-location",
  data => {

    if (marker && map) {

      marker.setLatLng([
        data.lat,
        data.lng
      ]);

      marker.bindPopup(
        `${data.driverName}`
      );

      map.panTo([
        data.lat,
        data.lng
      ]);
    }

    document
      .getElementById("liveStatus")
      .textContent =
      "Driver Live Now";
  });

  loadData();

});
import {
  getUserData,
  getToken,
  showToast,
  SOCKET_URL,
  setupDashboardUI
} from "./api.js";

document.addEventListener("DOMContentLoaded", () => {

  const token = getToken();
  const user = getUserData();

  if (!token || !user || user.role !== "driver") {
    window.location.href = "login.html";
    return;
  }

  setupDashboardUI();

  const socket = io(SOCKET_URL);

  const driverName = user.name || "Driver";

  // ===============================
  // PROFILE
  // ===============================
  document.getElementById("driverName").textContent = driverName;
  document.getElementById("profileInitials").textContent =
    driverName.charAt(0).toUpperCase();

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

  // ===============================
  // TRIP
  // ===============================
  const startBtn =
    document.getElementById("startTripBtn");

  const endBtn =
    document.getElementById("endTripBtn");

  const activeTrip =
    document.getElementById("activeTripDetails");

  const timerEl =
    document.getElementById("tripTimer");

  let seats = 50;
  let watchId = null;
  let timer = null;
  let startTime = null;

  function updateTimer() {
    if (!startTime) return;

    const diff = Date.now() - startTime;

    const hrs = String(
      Math.floor(diff / 3600000)
    ).padStart(2, "0");

    const mins = String(
      Math.floor((diff % 3600000) / 60000)
    ).padStart(2, "0");

    const secs = String(
      Math.floor((diff % 60000) / 1000)
    ).padStart(2, "0");

    timerEl.textContent =
      `${hrs}:${mins}:${secs}`;
  }

  startBtn?.addEventListener("click", () => {

    if (!navigator.geolocation) {
      showToast("GPS not supported", "error");
      return;
    }

    startBtn.disabled = true;
    endBtn.disabled = false;
    activeTrip.style.display = "block";

    startTime = Date.now();

    timer = setInterval(updateTimer, 1000);

    showToast("Trip Started", "success");

    watchId =
      navigator.geolocation.watchPosition(

        (pos) => {

          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          socket.emit("driver-location", {
            driverId: user._id,
            driverName,
            lat,
            lng,
            availableSeats: seats
          });

          console.log("Live:", lat, lng);
        },

        () => {
          showToast(
            "Failed to share live location",
            "error"
          );
        },

        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      );
  });

  endBtn?.addEventListener("click", () => {

    startBtn.disabled = false;
    endBtn.disabled = true;

    activeTrip.style.display = "none";

    clearInterval(timer);

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    showToast("Trip Ended", "success");
  });

  // ===============================
  // SEATS
  // ===============================
  const seatEl =
    document.getElementById("seatCount");

  seatEl.textContent = seats;

  document.getElementById("decSeats")
  ?.addEventListener("click", () => {
    if (seats > 0) seats--;
    seatEl.textContent = seats;
  });

  document.getElementById("incSeats")
  ?.addEventListener("click", () => {
    seats++;
    seatEl.textContent = seats;
  });

  // ===============================
  // DELAY
  // ===============================
  document.getElementById("delayBtn")
  ?.addEventListener("click", () => {

    const reason =
      prompt("Enter delay reason");

    if (!reason) return;

    socket.emit("delay-report", {
      driverName,
      reason
    });

    showToast("Delay Report Sent");
  });

  // ===============================
  // EMERGENCY
  // ===============================
  document.getElementById("emergencyBtn")
  ?.addEventListener("click", () => {

    socket.emit("emergency-alert", {
      driverName
    });

    showToast("Emergency Sent", "error");
  });

});
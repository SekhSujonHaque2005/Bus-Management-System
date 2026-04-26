import { getUserData, getToken, showToast, SOCKET_URL, setupDashboardUI } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const token = getToken();
    const user = getUserData();
    if (!token || !user || user.role !== 'driver') {
        window.location.href = 'login.html';
        return;
    }

    setupDashboardUI();
    const nameEl = document.getElementById('driverName');
    if (nameEl) nameEl.textContent = user.name;
    const initialEl = document.getElementById('profileInitials');
    if (initialEl) initialEl.textContent = user.name.charAt(0).toUpperCase();

    const startBtn = document.getElementById('startTripBtn');
    const endBtn = document.getElementById('endTripBtn');
    const activeTripDetails = document.getElementById('activeTripDetails');
    const tripTimerDisplay = document.getElementById('tripTimer');
    const emergencyBtn = document.getElementById('emergencyBtn');
    const delayBtn = document.getElementById('delayBtn');
    
    const decSeats = document.getElementById('decSeats');
    const incSeats = document.getElementById('incSeats');
    const seatCountDisplay = document.getElementById('seatCount');
    let currentSeats = 50;
    
    let locationInterval;
    let timerInterval;
    let tripStartTime;
    let isTripActive = false;
    
    const socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
    });

    const updateTimer = () => {
        if (!isTripActive) return;
        const now = new Date();
        const diff = now - tripStartTime;
        const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        tripTimerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    };

    // Seat Controls
    if (decSeats) {
        decSeats.addEventListener('click', () => {
            if (currentSeats > 0) {
                currentSeats--;
                seatCountDisplay.textContent = currentSeats;
            }
        });
    }

    if (incSeats) {
        incSeats.addEventListener('click', () => {
            currentSeats++;
            seatCountDisplay.textContent = currentSeats;
        });
    }

    // Start Trip
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            try {
                startBtn.disabled = true;
                endBtn.disabled = false;
                activeTripDetails.style.display = 'block';
                isTripActive = true;

                tripStartTime = new Date();
                timerInterval = setInterval(updateTimer, 1000);
                updateTimer(); // Initial call

                // Simulate GPS location updates every 3 seconds
                let currentLat = 31.2560;
                let currentLng = 75.7051;

                locationInterval = setInterval(() => {
                    // Slightly modify location (simulate movement)
                    currentLat += (Math.random() - 0.5) * 0.001;
                    currentLng += (Math.random() - 0.5) * 0.001;

                    // Emit location to all connected clients
                    socket.emit('update-location', {
                        busId: user._id, // Using driver ID as identifier
                        driverName: user.name,
                        lat: currentLat,
                        lng: currentLng,
                        availableSeats: currentSeats,
                        speed: Math.floor(Math.random() * 40) + 20 + ' km/h',
                        timestamp: new Date().toLocaleTimeString()
                    });

                    console.log('📍 Location broadcast:', { lat: currentLat.toFixed(5), lng: currentLng.toFixed(5) });
                }, 3000);

                showToast('Trip started! Broadcasting live location...', 'success');
            } catch (error) {
                showToast('Error starting trip: ' + error.message, 'error');
                startBtn.disabled = false;
                endBtn.disabled = true;
                isTripActive = false;
            }
        });
    }

    // End Trip
    if (endBtn) {
        endBtn.addEventListener('click', () => {
            startBtn.disabled = false;
            endBtn.disabled = true;
            activeTripDetails.style.display = 'none';
            isTripActive = false;
            
            clearInterval(locationInterval);
            clearInterval(timerInterval);
            tripTimerDisplay.textContent = '00:00:00';

            showToast('Trip ended. Data saved.', 'success');
        });
    }

    // Emergency Button
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', () => {
            // Emit emergency alert
            socket.emit('emergency-alert', {
                driverId: user._id,
                driverName: user.name,
                timestamp: new Date(),
                message: 'EMERGENCY ALERT from driver'
            });
            
            showToast('🚨 EMERGENCY ALERT SENT to Administration!', 'error');
        });
    }

    // Delay Button
    if (delayBtn) {
        delayBtn.addEventListener('click', () => {
            const delayReason = prompt("Please enter the reason for the delay (e.g. Traffic, Breakdown):");
            if (delayReason) {
                socket.emit('delay-report', {
                    driverId: user._id,
                    driverName: user.name,
                    timestamp: new Date(),
                    reason: delayReason
                });
                showToast(`Delay reported: ${delayReason}`, 'warning');
            }
        });
    }

    // Socket Events
    socket.on('connect', () => {
        console.log('✅ Connected to socket server as driver');
        showToast('Connected to server', 'success');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        showToast('Connection error. Will retry automatically.', 'error');
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from socket server');
        if (isTripActive) {
            showToast('Lost connection! Please check your internet.', 'error');
        }
    });

    // Listen for student tracking requests
    socket.on('student-tracking', (data) => {
        console.log('Student tracking request received:', data);
    });

    // Listen for admin messages
    socket.on('admin-message', (data) => {
        console.log('Message from admin:', data);
        showToast(data.message, 'warning');
    });

    // Add CSS animation if not present
    if (!document.querySelector('style[data-driver-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-driver-styles', 'true');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            .trip-active {
                animation: pulse 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }

    console.log('🚐 Driver dashboard loaded successfully');
});

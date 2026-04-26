import { apiFetch, getUserData, getToken, showToast, SOCKET_URL, setupDashboardUI } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const token = getToken();
    const user = getUserData();
    if (!token || !user || user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    setupDashboardUI();

    // Set UI Data
    const nameEl = document.getElementById('studentName');
    if (nameEl) nameEl.textContent = user.name;
    const initialEl = document.getElementById('profileInitials');
    if (initialEl) initialEl.textContent = user.name.charAt(0).toUpperCase();
    const routesTableBody = document.getElementById('routesTableBody');
    let allRoutes = [];
    let availableBuses = [];

    // Load Initial Data
    const loadData = async () => {
        routesTableBody.innerHTML = '<tr><td colspan="4"><div style="text-align: center; padding: 2rem;"><div style="display: inline-block; width: 30px; height: 30px; border: 3px solid #E2E8F0; border-top-color: #4F46E5; border-radius: 50%; animation: spin 1s linear infinite;"></div></div></td></tr>';
        
        try {
            // Load buses and get active count
            const buses = await apiFetch('/buses');
            availableBuses = buses;
            const activeBuses = buses.filter(b => b.status === 'active');
            document.getElementById('activeBusesCount').textContent = activeBuses.length;
            
            // Load user's bookings
            const myBookings = await apiFetch('/bookings/my-bookings');
            document.getElementById('myBookingsCount').textContent = myBookings.filter(b => b.status === 'confirmed').length;

            // Load routes
            allRoutes = await apiFetch('/buses/routes');
            renderRoutes(allRoutes);
            
            // Render My Bookings
            renderBookings(myBookings);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            routesTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#EF4444; padding: 2rem;">Failed to load routes. ${error.message}</td></tr>`;
            showToast('Error loading data from server: ' + error.message, 'error');
        }
    };

    const renderRoutes = (routes) => {
        if (routes.length === 0) {
            routesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #94A3B8; padding: 2rem;">No routes available.</td></tr>';
            return;
        }

        routesTableBody.innerHTML = routes.map(route => `
            <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="font-weight: 500; padding: 1rem;">${route.source || 'N/A'}</td>
                <td style="font-weight: 500; color: #4F46E5; padding: 1rem;">${route.destination || 'N/A'}</td>
                <td style="color: #64748B; font-size: 0.9rem; padding: 1rem;">${route.stops && route.stops.length > 0 ? route.stops.join(', ') : 'Direct'}</td>
                <td style="padding: 1rem;">
                    <button class="btn book-btn" data-route-id="${route._id}" style="padding: 0.4rem 1rem; font-size: 0.85rem; background: #4F46E5; color: white; border: none; border-radius: 0.4rem; cursor: pointer;">Book Seat</button>
                </td>
            </tr>
        `).join('');

        // Attach event listeners to new buttons
        document.querySelectorAll('.book-btn').forEach(btn => {
            btn.addEventListener('click', handleBooking);
        });
    };

    const renderBookings = (bookings) => {
        const bookingsTableBody = document.getElementById('bookingsTableBody');
        if (!bookingsTableBody) return;
        
        if (bookings.length === 0) {
            bookingsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94A3B8; padding: 2rem;">You have no recent bookings.</td></tr>';
            return;
        }

        bookingsTableBody.innerHTML = bookings.map(booking => `
            <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="font-weight: 500; padding: 1rem;">${booking.busId?.busNumber || 'N/A'}</td>
                <td style="font-weight: 500; color: #4F46E5; padding: 1rem;">${booking.routeId?.destination || 'N/A'}</td>
                <td style="padding: 1rem;">Seat ${booking.seatNumber}</td>
                <td style="padding: 1rem;">
                    <span style="display: inline-block; padding: 0.3rem 0.8rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; ${
                        booking.status === 'confirmed' 
                            ? 'background: #DCFCE7; color: #166534;' 
                            : 'background: #FEE2E2; color: #991B1B;'
                    }">
                        ${booking.status.toUpperCase()}
                    </span>
                </td>
                <td style="padding: 1rem;">
                    ${booking.status === 'confirmed' ? `<button class="btn btn-secondary cancel-btn" data-booking-id="${booking._id}" style="padding: 0.4rem 1rem; font-size: 0.85rem; border-color: #EF4444; color: #EF4444; cursor: pointer;">Cancel</button>` : '<span style="color: #94A3B8; font-size: 0.85rem;">-</span>'}
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', handleCancelBooking);
        });
    };

    const handleCancelBooking = async (e) => {
        const bookingId = e.target.getAttribute('data-booking-id');
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        
        try {
            e.target.disabled = true;
            e.target.textContent = 'Canceling...';
            await apiFetch(`/bookings/${bookingId}`, 'DELETE');
            showToast('Booking cancelled successfully', 'success');
            loadData();
        } catch (error) {
            showToast('Failed to cancel booking: ' + error.message, 'error');
            e.target.disabled = false;
            e.target.textContent = 'Cancel';
        }
    };

    // Modal State
    let selectedRouteId = null;
    let selectedActiveBus = null;

    // Booking Logic
    const handleBooking = (e) => {
        const routeId = e.target.getAttribute('data-route-id');
        const route = allRoutes.find(r => r._id === routeId);
        const activeBuses = availableBuses.filter(b => b.status === 'active' && b.seatsAvailable > 0);

        if (!activeBuses || activeBuses.length === 0) {
            showToast('No active buses available with empty seats. Please wait for a bus to arrive.', 'error');
            return;
        }

        // Pick first available bus (you could implement bus selection here)
        selectedActiveBus = activeBuses[0];
        selectedRouteId = routeId;
        
        document.getElementById('modalDestination').textContent = route.destination || 'Unknown';
        document.getElementById('modalBuses').textContent = `${selectedActiveBus.busNumber} (${selectedActiveBus.seatsAvailable} seats available)`;
        document.getElementById('bookingModal').classList.add('active');
    };

    document.getElementById('confirmBookBtn').addEventListener('click', async (e) => {
        if (!selectedRouteId || !selectedActiveBus) return;
        
        const btn = e.target;
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            const result = await apiFetch('/bookings', 'POST', {
                busId: selectedActiveBus._id,
                routeId: selectedRouteId,
                seatNumber: Math.floor(Math.random() * selectedActiveBus.capacity) + 1
            });
            showToast('Seat successfully reserved!', 'success');
            
            // Extra WOW: Confetti
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            document.getElementById('bookingModal').classList.remove('active');
            loadData(); // Reload to update counts
        } catch (error) {
            showToast(error.message || 'Failed to book seat', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Confirm Booking';
        }
    });

    // Close modal
    document.querySelector('.modal-close')?.addEventListener('click', () => {
        document.getElementById('bookingModal').classList.remove('active');
    });

    // Search Logic
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allRoutes.filter(route => 
                (route.destination && route.destination.toLowerCase().includes(searchTerm)) || 
                (route.source && route.source.toLowerCase().includes(searchTerm))
            );
            renderRoutes(filtered);
        });
    }

    const refreshBusesBtn = document.getElementById('refreshBusesBtn');
    if (refreshBusesBtn) {
        refreshBusesBtn.addEventListener('click', () => {
            const originalHtml = refreshBusesBtn.innerHTML;
            refreshBusesBtn.innerHTML = '...';
            refreshBusesBtn.disabled = true;
            loadData().then(() => {
                refreshBusesBtn.innerHTML = originalHtml;
                refreshBusesBtn.disabled = false;
                showToast('Bus data refreshed', 'success');
            });
        });
    }

    loadData();

    // Add CSS for spinner animation
    if (!document.querySelector('style[data-student-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-student-styles', 'true');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Socket.IO and Leaflet Logic for Live Tracking
    let map = null;
    let busMarkers = {};

    // Initialize Map
    const initMap = () => {
        const liveMapEl = document.getElementById('liveMap');
        if (liveMapEl && !map) {
            // LPU coordinates approx
            map = L.map('liveMap').setView([31.2560, 75.7051], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            liveMapEl.style.color = 'transparent'; // Hide placeholder text
        }
    };

    initMap();

    // Custom bus icon
    const busIcon = L.divIcon({
        className: 'custom-bus-icon',
        html: '<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); transform: translateY(-50%);">🚌</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    try {
        const socket = io(SOCKET_URL);
        
        socket.on('connect', () => {
            console.log('Connected to socket server for live tracking');
        });

        socket.on('live-location', (data) => {
            const liveStatus = document.getElementById('liveStatus');
            
            if (liveStatus && map) {
                liveStatus.innerHTML = '<span style="display: inline-block; width: 8px; height: 8px; background: #10B981; border-radius: 50%; margin-right: 6px; box-shadow: 0 0 5px #10B981;"></span>Live updates from bus';
                liveStatus.style.color = '#10B981';
                
                const lat = parseFloat(data.lat);
                const lng = parseFloat(data.lng);
                const busId = data.busId || 'unknown';

                if (!isNaN(lat) && !isNaN(lng)) {
                    if (busMarkers[busId]) {
                        busMarkers[busId].setLatLng([lat, lng]);
                    } else {
                        busMarkers[busId] = L.marker([lat, lng], { icon: busIcon })
                            .addTo(map)
                            .bindPopup(`<strong>Bus ${data.busNumber || busId}</strong><br>Seats: ${data.availableSeats || 'N/A'}`);
                    }
                    map.panTo([lat, lng]); // Center map on the latest update
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });
    } catch (err) {
        console.log('Socket.io not available or server not running');
    }
});


// Sidebar Navigation
const navOverview = document.getElementById('nav-overview');
const navBook = document.getElementById('nav-book');
const navMyBookings = document.getElementById('nav-my-bookings');

const overviewSections = [document.querySelector('.stats-grid'), document.querySelector('.table-container')]; // stats and live tracking
const routesSection = document.getElementById('routesSection');
const bookingsSection = document.getElementById('bookingsSection');

const setActiveNav = (nav) => {
    [navOverview, navBook, navMyBookings].forEach(n => n?.classList.remove('active'));
    if(nav) nav.classList.add('active');
};

if (navOverview) {
    navOverview.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navOverview);
        overviewSections.forEach(s => s.style.display = '');
        if(routesSection) routesSection.style.display = 'none';
        if(bookingsSection) bookingsSection.style.display = 'none';
    });
}

if (navBook) {
    navBook.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navBook);
        overviewSections.forEach(s => s.style.display = 'none');
        if(routesSection) routesSection.style.display = '';
        if(bookingsSection) bookingsSection.style.display = 'none';
    });
}

if (navMyBookings) {
    navMyBookings.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navMyBookings);
        overviewSections.forEach(s => s.style.display = 'none');
        if(routesSection) routesSection.style.display = 'none';
        if(bookingsSection) bookingsSection.style.display = '';
    });
}

// Initial state
if(routesSection) routesSection.style.display = 'none';
if(bookingsSection) bookingsSection.style.display = 'none';


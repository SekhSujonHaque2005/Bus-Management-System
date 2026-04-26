import { apiFetch, getUserData, getToken, showToast, setupDashboardUI } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const token = getToken();
    const user = getUserData();
    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    setupDashboardUI();
    const nameEl = document.getElementById('adminName');
    if (nameEl) nameEl.textContent = user.name;
    const initialEl = document.getElementById('profileInitials');
    if (initialEl) initialEl.textContent = user.name.charAt(0).toUpperCase();

    let chartInstance = null;
    let allUsers = [];

    const loadData = async () => {
        try {
            const buses = await apiFetch('/buses');
            // keep compatibility: existing endpoint + new spec endpoint
            const routes = await apiFetch('/routes').catch(() => apiFetch('/buses/routes'));
            const stats = await apiFetch('/admin/stats').catch(() => apiFetch('/buses/stats'));
            const users = await apiFetch('/auth/users');
            allUsers = users;

            document.getElementById('totalBuses').textContent = stats.totalBuses || buses.length;
            document.getElementById('totalRoutes').textContent = stats.totalRoutes || routes.length;
            document.getElementById('totalBookings').textContent = stats.totalBookings || 0;

            const tbody = document.getElementById('busesTableBody');
            
            if (buses.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #94A3B8; padding: 2rem;">No buses in fleet. Add your first bus to get started.</td></tr>';
            } else {
                tbody.innerHTML = buses.map(bus => `
                    <tr style="border-bottom: 1px solid #E2E8F0;">
                        <td style="font-weight: 500; padding: 1rem;">${bus.busNumber}</td>
                        <td style="padding: 1rem;">${bus.capacity}</td>
                        <td style="color: #4F46E5; font-weight: 600; padding: 1rem;">${bus.seatsAvailable}</td>
                        <td style="padding: 1rem;">
                            <span style="display: inline-block; padding: 0.3rem 0.8rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; ${
                                bus.status === 'active' 
                                    ? 'background: #DCFCE7; color: #166534;' 
                                    : 'background: #FEE2E2; color: #991B1B;'
                            }">
                                ${bus.status.toUpperCase()}
                            </span>
                        </td>
                        <td style="padding: 1rem; display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary edit-bus-btn" data-id="${bus._id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-color: var(--primary-color); color: var(--primary-color);">Edit</button>
                            <button class="btn btn-secondary delete-bus-btn" data-id="${bus._id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-color: var(--danger); color: var(--danger);">Delete</button>
                        </td>
                    </tr>
                `).join('');

                // Attach event listeners
                document.querySelectorAll('.delete-bus-btn').forEach(btn => {
                    btn.addEventListener('click', handleDeleteBus);
                });
                
                document.querySelectorAll('.edit-bus-btn').forEach(btn => {
                    btn.addEventListener('click', handleEditBus);
                });
            }

            renderChart(buses);
            renderUsers(allUsers);
        } catch (error) {
            console.error('Error loading admin data:', error);
            showToast('Failed to load admin data: ' + error.message, 'error');
        }
    };

    const renderUsers = (users) => {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #94A3B8; padding: 2rem;">No users found.</td></tr>';
        } else {
            tbody.innerHTML = users.map(user => `
                <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="font-weight: 500; padding: 1rem;">${user.name}</td>
                    <td style="padding: 1rem; color: var(--text-muted);">${user.email}</td>
                    <td style="padding: 1rem;">
                        <span style="display: inline-block; padding: 0.3rem 0.8rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; ${
                            user.role === 'admin' ? 'background: #FEF3C7; color: #92400E;' : 
                            user.role === 'driver' ? 'background: #E0E7FF; color: #3730A3;' :
                            'background: #F1F5F9; color: var(--text-main);'
                        }">
                            ${user.role.toUpperCase()}
                        </span>
                    </td>
                    <td style="padding: 1rem;">
                        <button class="btn btn-secondary delete-user-btn" data-id="${user._id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-color: var(--danger); color: var(--danger);">Delete</button>
                    </td>
                </tr>
            `).join('');

            document.querySelectorAll('.delete-user-btn').forEach(btn => {
                btn.addEventListener('click', handleDeleteUser);
            });
        }
    };

    const renderChart = (buses) => {
        const ctx = document.getElementById('utilizationChart').getContext('2d');
        
        const labels = buses.length ? buses.map(b => b.busNumber) : ['No Data'];
        const bookedData = buses.length ? buses.map(b => b.capacity - b.seatsAvailable) : [0];
        const availableData = buses.length ? buses.map(b => b.seatsAvailable) : [0];

        if (chartInstance) {
            chartInstance.destroy();
        }

        try {
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Seats Booked',
                            data: bookedData,
                            backgroundColor: '#4F46E5',
                            borderRadius: 4,
                            borderSkipped: false
                        },
                        {
                            label: 'Seats Available',
                            data: availableData,
                            backgroundColor: '#E2E8F0',
                            borderRadius: 4,
                            borderSkipped: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { 
                            stacked: true, 
                            grid: { display: false } 
                        },
                        y: { 
                            stacked: true, 
                            beginAtZero: true, 
                            border: { display: false } 
                        }
                    },
                    plugins: {
                        legend: { 
                            position: 'top', 
                            align: 'end', 
                            labels: { usePointStyle: true, boxWidth: 8 } 
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Chart error:', err);
        }
    };

    const handleDeleteBus = async (e) => {
        const busId = e.target.getAttribute('data-id');
        if (confirm('Are you sure you want to completely delete this bus from the fleet?')) {
            try {
                e.target.disabled = true;
                e.target.textContent = '...';
                await apiFetch(`/buses/${busId}`, 'DELETE');
                showToast('Bus deleted successfully', 'success');
                loadData();
            } catch (error) {
                showToast('Failed to delete bus: ' + error.message, 'error');
                e.target.disabled = false;
                e.target.textContent = 'Delete';
            }
        }
    };

    const handleDeleteUser = async (e) => {
        const userId = e.target.getAttribute('data-id');
        if (confirm('Are you sure you want to completely delete this user?')) {
            try {
                e.target.disabled = true;
                e.target.textContent = '...';
                await apiFetch(`/auth/users/${userId}`, 'DELETE');
                showToast('User deleted successfully', 'success');
                loadData();
            } catch (error) {
                showToast('Failed to delete user: ' + error.message, 'error');
                e.target.disabled = false;
                e.target.textContent = 'Delete';
            }
        }
    };

    const handleEditBus = async (e) => {
        const busId = e.target.getAttribute('data-id');
        const newStatus = prompt('Enter new status (active/inactive/maintenance):');
        if (newStatus && ['active', 'inactive', 'maintenance'].includes(newStatus.toLowerCase())) {
            try {
                await apiFetch(`/buses/${busId}`, 'PUT', { status: newStatus.toLowerCase() });
                showToast('Bus status updated!', 'success');
                loadData();
            } catch (error) {
                showToast('Failed to update bus: ' + error.message, 'error');
            }
        } else if (newStatus) {
            showToast('Invalid status. Use active, inactive, or maintenance.', 'error');
        }
    };

    // User Search Logic
    const searchUsersInput = document.getElementById('searchUsers');
    if (searchUsersInput) {
        searchUsersInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allUsers.filter(u => 
                u.name.toLowerCase().includes(searchTerm) || 
                u.email.toLowerCase().includes(searchTerm)
            );
            renderUsers(filtered);
        });
    }

    // Initial Load
    loadData();

    // Add Bus Form
    const addBusForm = document.getElementById('addBusForm');
    if (addBusForm) {
        addBusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = addBusForm.querySelector('button');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Adding...';

            const busNumber = document.getElementById('busNumber').value.trim();
            const capacity = parseInt(document.getElementById('capacity').value);

            if (!busNumber) {
                showToast('Please enter a bus number', 'error');
                btn.disabled = false;
                btn.textContent = originalText;
                return;
            }

            if (capacity < 1) {
                showToast('Capacity must be at least 1', 'error');
                btn.disabled = false;
                btn.textContent = originalText;
                return;
            }

            try {
                await apiFetch('/buses', 'POST', { busNumber, capacity });
                showToast('Bus added successfully!', 'success');
                addBusForm.reset();
                loadData(); // Reload table and chart
            } catch (error) {
                showToast(error.message || 'Error adding bus', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }

    // Add Route Form
    const addRouteForm = document.getElementById('addRouteForm');
    if (addRouteForm) {
        addRouteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = addRouteForm.querySelector('button');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Adding...';

            const source = document.getElementById('routeSource').value.trim();
            const destination = document.getElementById('routeDest').value.trim();

            if (!source || !destination) {
                showToast('Please fill in all route details', 'error');
                btn.disabled = false;
                btn.textContent = originalText;
                return;
            }

            try {
                await apiFetch('/buses/routes', 'POST', { source, destination, stops: [] });
                showToast('Route added successfully!', 'success');
                addRouteForm.reset();
                loadData();
            } catch (error) {
                showToast(error.message || 'Error adding route', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }

    // Export CSV
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', async () => {
            try {
                const buses = await apiFetch('/buses');
                if (!buses.length) {
                    showToast('No data to export', 'error');
                    return;
                }
                
                const headers = ['Bus Number', 'Capacity', 'Available Seats', 'Status'];
                const csvRows = [headers.join(',')];
                
                buses.forEach(bus => {
                    csvRows.push(`"${bus.busNumber}",${bus.capacity},${bus.seatsAvailable},"${bus.status}"`);
                });

                const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "smart_bus_fleet_" + new Date().toISOString().split('T')[0] + ".csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showToast('Fleet data exported successfully!', 'success');
            } catch (error) {
                showToast('Failed to export data: ' + error.message, 'error');
            }
        });
    }

    // Refresh data every 30 seconds
    setInterval(loadData, 30000);
});

// Sidebar Scrolling Navigation
const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
if(sidebarLinks.length >= 4) {
  sidebarLinks[0].addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); });
  sidebarLinks[1].addEventListener('click', (e) => { e.preventDefault(); document.getElementById('addBusForm')?.scrollIntoView({behavior: 'smooth'}); });
  sidebarLinks[2].addEventListener('click', (e) => { e.preventDefault(); document.getElementById('addRouteForm')?.scrollIntoView({behavior: 'smooth'}); });
  sidebarLinks[3].addEventListener('click', (e) => { e.preventDefault(); document.getElementById('usersSection')?.scrollIntoView({behavior: 'smooth'}); });
}


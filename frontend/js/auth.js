import { apiFetch, setToken, setUserData, showToast } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');

    function showErrorMessage(message) {
        if (errorMessage) {
            errorMessage.innerText = message;
            errorMessage.style.display = 'block';
        }
        showToast(message, 'error');
    }

    function redirectBasedOnRole(role) {
        setTimeout(() => {
            if (role === 'student') {
                window.location.href = 'student-dashboard.html';
            } else if (role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (role === 'driver') {
                window.location.href = 'driver-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 500);
    }

    // ================= LOGIN =================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            try {
                const data = await apiFetch('/auth/login', 'POST', {
                    email,
                    password
                });

                setToken(data.token);
                setUserData(data);

                showToast('Login Successful!', 'success');
                redirectBasedOnRole(data.role);

            } catch (error) {
                showErrorMessage(error.message);
            }
        });
    }

    // ================= REGISTER =================
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            try {
                const data = await apiFetch('/auth/register', 'POST', {
                    name,
                    email,
                    password,
                    role
                });

                setToken(data.token);
                setUserData(data);

                showToast('Account Created Successfully!', 'success');
                redirectBasedOnRole(data.role);

            } catch (error) {
                showErrorMessage(error.message);
            }
        });
    }
});
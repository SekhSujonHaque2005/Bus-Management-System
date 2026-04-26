import { apiFetch, setToken, setUserData, showToast } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');

    // Hide error message on input
    const emailInputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
    emailInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            if (!email || !password) {
                showErrorMessage('Please enter both email and password');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
            
            try {
                const data = await apiFetch('/auth/login', 'POST', { email, password });
                
                // Store auth info
                setToken(data.token);
                setUserData({ 
                    _id: data._id, 
                    id: data._id,
                    name: data.name, 
                    email: data.email, 
                    role: data.role 
                });
                
                showToast(`Welcome back, ${data.name}!`, 'success');
                
                // Redirect based on role
                redirectBasedOnRole(data.role);
            } catch (error) {
                showErrorMessage(error.message || 'Login failed. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;
            const role = document.getElementById('role')?.value || 'student';
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Validation
            if (!name || !email || !password) {
                showErrorMessage('Please fill in all required fields');
                return;
            }

            if (password.length < 6) {
                showErrorMessage('Password must be at least 6 characters');
                return;
            }

            if (confirmPassword && password !== confirmPassword) {
                showErrorMessage('Passwords do not match');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
            
            try {
                const data = await apiFetch('/auth/register', 'POST', { name, email, password, role });
                
                // Store auth info
                setToken(data.token);
                setUserData({ 
                    _id: data._id, 
                    id: data._id,
                    name: data.name, 
                    email: data.email, 
                    role: data.role 
                });
                
                showToast(`Account created! Welcome ${data.name}!`, 'success');
                
                // Redirect based on role
                redirectBasedOnRole(data.role);
            } catch (error) {
                if (error.message === 'User already exists') {
                    showToast('Account already exists. Please login.', 'warning');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showErrorMessage(error.message || 'Registration failed. Please try again.');
                }
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    function showErrorMessage(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
        showToast(message, 'error');
    }
});

function redirectBasedOnRole(role) {
    setTimeout(() => {
        if (role === 'student') window.location.href = 'student-dashboard.html';
        else if (role === 'admin') window.location.href = 'admin-dashboard.html';
        else if (role === 'driver') window.location.href = 'driver-dashboard.html';
        else window.location.href = 'index.html';
    }, 500); // Small delay to let toast show
}

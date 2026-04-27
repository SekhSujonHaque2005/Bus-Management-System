// Theme Toggle Logic
export function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateToggleIcons(savedTheme);

    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleIcons(newTheme);
        });
    }
}

function updateToggleIcons(theme) {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    
    // Smooth transition for icon rotation
    toggleBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        toggleBtn.style.transform = 'rotate(0deg)';
    }, 400);
}

// Auto-init on script load if not imported
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

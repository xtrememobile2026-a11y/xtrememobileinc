/**
 * XTREM MOBILE - Login Page Controller
 * Maneja el formulario de acceso y la redirección al panel
 */

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 800);

    // If already logged in, go straight to the panel
    if (Auth.init()) {
        window.location.href = 'panel.html';
        return;
    }

    // Toggle password visibility
    document.getElementById('togglePassword').addEventListener('click', () => {
        const input = document.getElementById('loginPassword');
        const icon = document.querySelector('#togglePassword i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('bi-eye', 'bi-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('bi-eye-slash', 'bi-eye');
        }
    });

    // Login form submit
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        const result = Auth.login(username, password);
        if (result.success) {
            DataStore.addHistoryEntry({
                user: result.user.fullName,
                action: 'Inicio de sesión',
                detail: `El usuario "${username}" inició sesión correctamente`
            });
            window.location.href = 'panel.html';
        } else {
            const errorEl = document.getElementById('loginError');
            errorEl.textContent = result.message;
            errorEl.classList.remove('d-none');
        }
    });
});

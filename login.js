// ==========================================
// LOGIN JÚ MORALES
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {

    const form = document.getElementById("loginForm");

    if (!form) return;

    // Si ya hay una sesión activa,
    // comprobamos si es la dueña.
    await checkExistingSession();

    form.addEventListener("submit", handleLogin);

});


// ==========================================
// COMPROBAR SESIÓN EXISTENTE
// ==========================================

async function checkExistingSession() {

    try {

        const {
            data: { session }
        } = await db.auth.getSession();


        if (!session) {
            return;
        }


        const isOwner =
            await checkOwner(session.user.id);


        if (isOwner) {

            window.location.href =
                "admin.html";

        } else {

            await db.auth.signOut();

        }

    } catch (error) {

        console.error(
            "Error comprobando sesión:",
            error
        );

    }

}


// ==========================================
// LOGIN
// ==========================================

async function handleLogin(event) {

    event.preventDefault();


    const email =
        document
            .getElementById("email")
            .value
            .trim();

    const password =
        document
            .getElementById("password")
            .value;


    const button =
        document.getElementById("loginButton");

    const message =
        document.getElementById("loginMessage");


    if (!email || !password) {

        showLoginMessage(
            "Completa el correo y la contraseña.",
            true
        );

        return;
    }


    button.disabled = true;

    button.textContent =
        "Verificando...";

    message.textContent = "";


    try {

        // ==================================
        // AUTENTICAR CON SUPABASE
        // ==================================

        const {
            data,
            error
        } = await db.auth.signInWithPassword({
            email,
            password
        });


        if (error) {

            console.error(
                "Error de autenticación:",
                error
            );

            showLoginMessage(
                getAuthErrorMessage(error),
                true
            );

            button.disabled = false;

            button.textContent =
                "Entrar al panel";

            return;
        }


        if (!data.user) {

            showLoginMessage(
                "No se pudo iniciar la sesión.",
                true
            );

            button.disabled = false;

            button.textContent =
                "Entrar al panel";

            return;
        }


        // ==================================
        // COMPROBAR ROL
        // ==================================

        const isOwner =
            await checkOwner(data.user.id);


            console.log("USUARIO LOGUEADO:", data.user.id);
console.log("¿ES OWNER?:", isOwner);


        if (!isOwner) {

            await db.auth.signOut();

            showLoginMessage(
                "Esta cuenta no tiene permiso para acceder al panel.",
                true
            );

            button.disabled = false;

            button.textContent =
                "Entrar al panel";

            return;
        }


        // ==================================
        // ACCESO CONCEDIDO
        // ==================================

        showLoginMessage(
            "Acceso autorizado. Entrando...",
            false
        );


        setTimeout(() => {

            window.location.href =
                "admin.html";

        }, 500);


    } catch (error) {

        console.error(
            "Error inesperado:",
            error
        );

        showLoginMessage(
            "Ocurrió un error. Inténtalo nuevamente.",
            true
        );

        button.disabled = false;

        button.textContent =
            "Entrar al panel";
    }

}


// ==========================================
// COMPROBAR SI ES OWNER
// ==========================================

async function checkOwner(userId) {

    try {

        const {
            data,
            error
        } = await db
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();


        if (error) {

            console.error(
                "Error consultando perfil:",
                error
            );

            return false;
        }


        return data?.role === "owner";

    } catch (error) {

        console.error(
            "Error comprobando propietario:",
            error
        );

        return false;
    }

}


// ==========================================
// MENSAJES
// ==========================================

function showLoginMessage(
    text,
    isError
) {

    const message =
        document.getElementById(
            "loginMessage"
        );

    if (!message) return;


    message.textContent =
        text;


    message.style.color =
        isError
            ? "#d98d8d"
            : "#b9c9a9";
}


// ==========================================
// ERRORES DE AUTENTICACIÓN
// ==========================================

function getAuthErrorMessage(error) {

    const message =
        `${error?.message || ""}`
            .toLowerCase();


    if (
        message.includes("invalid login") ||
        message.includes("invalid credentials")
    ) {

        return "Correo o contraseña incorrectos.";
    }


    if (
        message.includes("email not confirmed")
    ) {

        return "Debes confirmar el correo de tu cuenta antes de entrar.";
    }


    if (
        message.includes("too many requests")
    ) {

        return "Demasiados intentos. Espera un momento e inténtalo nuevamente.";
    }


    return "No se pudo iniciar sesión. Revisa tus datos.";
}
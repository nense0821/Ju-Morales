document.addEventListener("DOMContentLoaded", () => {
    initWebsite();
});


// ===============================
// VARIABLES
// ===============================

let services = [];


// ===============================
// INICIALIZAR SITIO
// ===============================

async function initWebsite() {

    try {

        await loadBusinessSettings();
        await loadServices();
        await loadGallery();

        setupBookingForm();
        setupDateRestrictions();

    } catch (error) {

        console.error(
            "Error inicializando el sitio:",
            error
        );

    }
}


// ===============================
// CONFIGURACIÓN DEL NEGOCIO
// ===============================

async function loadBusinessSettings() {

    const { data, error } = await db
        .from("business_settings")
        .select("*")
        .eq("id", true)
        .single();

    if (error) {

        console.error(
            "Error cargando configuración:",
            error
        );

        return;
    }

    if (!data) return;


   // ===============================
// WHATSAPP
// ===============================

const whatsappNumber = "573007595977";

const whatsappUrl =
    `https://wa.me/${whatsappNumber}`;

setLink(
    "whatsappLink",
    whatsappUrl
);

setLink(
    "footerWhatsapp",
    whatsappUrl
);


// ===============================
// INSTAGRAM
// ===============================

const instagramUrl =
    "https://www.instagram.com/TU_USUARIO/";

setLink(
    "instagramLink",
    instagramUrl
);

setLink(
    "footerInstagram",
    instagramUrl
);


    // ===============================
    // DIRECCIÓN
    // ===============================

    const addressElement =
        document.getElementById(
            "businessAddress"
        );

    if (addressElement) {

        if (
            data.address &&
            data.city
        ) {

            addressElement.textContent =
                `${data.address}, ${data.city}`;

        } else if (data.city) {

            addressElement.textContent =
                data.city;

        } else {

            addressElement.textContent =
                "Bogota-Ciudad Montes";
        }
    }
}


// ===============================
// CARGAR SERVICIOS
// ===============================

async function loadServices() {

    const {
        data,
        error
    } = await db
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order", {
            ascending: true
        });

    if (error) {

        console.error(
            "Error cargando servicios:",
            error
        );

        showServiceError();

        return;
    }

    services = data || [];

    renderServices();
    renderServiceSelect();
}


// ===============================
// MOSTRAR SERVICIOS
// ===============================

function renderServices() {

    const container =
        document.getElementById(
            "servicesGrid"
        );

    if (!container) return;


    if (!services.length) {

        container.innerHTML = `
            <div class="loading-card">
                No hay servicios disponibles.
            </div>
        `;

        return;
    }


    container.innerHTML =
        services
            .map((service, index) => {

                return `
                    <article class="service-card">

                        ${
                            service.image_url
                                ? `
                                    <div
                                        class="service-image"
                                        style="
                                            width:100%;
                                            aspect-ratio:4 / 3;
                                            overflow:hidden;
                                            margin-bottom:22px;
                                            background:#eee8df;
                                        "
                                    >

                                        <img
                                            src="${escapeAttribute(service.image_url)}"
                                            alt="${escapeAttribute(service.name)}"
                                            loading="lazy"
                                            style="
                                                width:100%;
                                                height:100%;
                                                object-fit:cover;
                                                display:block;
                                            "
                                            onerror="
                                                this.parentElement.style.display='none';
                                            "
                                        >

                                    </div>
                                `
                                : ""
                        }


                        <div>

                            <span class="service-number">
                                ${String(index + 1).padStart(2, "0")}
                            </span>

                            <h3>
                                ${escapeHtml(service.name)}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    service.description ||
                                    "Servicio personalizado."
                                )}
                            </p>

                        </div>


                        <div class="service-bottom">

                            <span class="service-price">
                                ${formatCurrency(service.price)}
                            </span>

                            <span class="service-duration">
                                ${service.duration_minutes}
                                min
                            </span>

                        </div>

                    </article>
                `;

            })
            .join("");
}


// ===============================
// SELECT DE SERVICIOS
// ===============================

function renderServiceSelect() {

    const select =
        document.getElementById("service");

    if (!select) return;


    select.innerHTML = `
        <option value="">
            Selecciona un servicio
        </option>
    `;


    services.forEach(service => {

        const option =
            document.createElement("option");

        option.value =
            service.id;

        option.textContent =
            `${service.name} — ${formatCurrency(service.price)}`;

        select.appendChild(option);

    });
}


// ===============================
// GALERÍA
// ===============================

async function loadGallery() {

    const container =
        document.getElementById(
            "galleryGrid"
        );

    if (!container) return;


    container.innerHTML = `
        <div class="loading-card">
            <p>
                Cargando nuestros trabajos...
            </p>
        </div>
    `;


    try {

        const {
            data,
            error
        } = await db
            .from("gallery")
            .select(`
                id,
                image_url,
                title,
                description,
                active,
                sort_order,
                service_id
            `)
            .eq("active", true)
            .order("sort_order", {
                ascending: true
            })
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "ERROR GALERÍA SUPABASE:",
                error
            );

            container.innerHTML = `
                <div class="loading-card">
                    <p>
                        No pudimos cargar
                        nuestros trabajos.
                    </p>
                </div>
            `;

            return;
        }


        if (!data || data.length === 0) {

            container.innerHTML = `
                <div class="loading-card">
                    <p>
                        Nuestro portafolio estará
                        disponible próximamente.
                    </p>
                </div>
            `;

            return;
        }


        container.innerHTML =
            data
                .map(item => {

                    const imageUrl =
                        item.image_url || "";


                    // Buscar el servicio relacionado
                    const relatedService =
                        services.find(
                            service =>
                                service.id === item.service_id
                        );


                    // Si tiene servicio, toda la tarjeta será clickeable
                    const clickable =
                        !!relatedService;


                    return `
                        <article
                            class="gallery-item"
                            ${
                                clickable
                                    ? `
                                        data-gallery-service="${escapeAttribute(
                                            relatedService.id
                                        )}"
                                    `
                                    : ""
                            }
                            style="
                                ${
                                    clickable
                                        ? `
                                            cursor:pointer;
                                        `
                                        : ""
                                }
                            "
                            ${
                                clickable
                                    ? `
                                        title="Reservar este diseño"
                                    `
                                    : ""
                            }
                        >

                            <img
                                src="${escapeAttribute(imageUrl)}"
                                alt="${escapeAttribute(
                                    item.title ||
                                    "Trabajo de uñas JÚ MORALES"
                                )}"
                                loading="lazy"
                                onerror="
                                    this.style.display='none';
                                "
                            >


                            <div class="gallery-overlay">

                                ${
                                    item.title
                                        ? `
                                            <h3>
                                                ${escapeHtml(
                                                    item.title
                                                )}
                                            </h3>
                                        `
                                        : ""
                                }


                                ${
                                    item.description
                                        ? `
                                            <p>
                                                ${escapeHtml(
                                                    item.description
                                                )}
                                            </p>
                                        `
                                        : ""
                                }


                                ${
                                    relatedService
                                        ? `
                                            <span
                                                style="
                                                    display:block;
                                                    margin-top:10px;
                                                    font-size:12px;
                                                    opacity:.8;
                                                "
                                            >
                                                Disponible con:
                                                ${escapeHtml(
                                                    relatedService.name
                                                )}
                                            </span>

                                            <span
                                                class="gallery-book-button"
                                                style="
                                                    display:inline-block;
                                                    margin-top:14px;
                                                    font-size:12px;
                                                    text-transform:uppercase;
                                                    letter-spacing:1px;
                                                "
                                            >
                                                Quiero este diseño →
                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                        </article>
                    `;

                })
                .join("");


        setupGalleryButtons();


    } catch (error) {

        console.error(
            "ERROR INESPERADO EN GALERÍA:",
            error
        );

        container.innerHTML = `
            <div class="loading-card">
                <p>
                    Ocurrió un error al cargar
                    nuestros trabajos.
                </p>
            </div>
        `;
    }
}


// ===============================
// BOTONES / TARJETAS DE GALERÍA
// ===============================

function setupGalleryButtons() {

    const gallery =
        document.getElementById(
            "galleryGrid"
        );

    if (!gallery) return;


    gallery.addEventListener(
        "click",
        event => {

            const card =
                event.target.closest(
                    "[data-gallery-service]"
                );

            if (!card) return;


            const serviceId =
                card.dataset.galleryService;


            selectGalleryService(
                serviceId
            );

        }
    );
}


// ===============================
// SELECCIONAR SERVICIO DESDE GALERÍA
// ===============================

function selectGalleryService(
    serviceId
) {

    const select =
        document.getElementById(
            "service"
        );

    if (!select) return;


    // Comprobar que el servicio existe
    const serviceExists =
        services.some(
            service =>
                service.id === serviceId
        );


    if (!serviceExists) {

        console.warn(
            "El servicio relacionado no está disponible:",
            serviceId
        );

        return;
    }


    // ===============================
    // SELECCIONAR SERVICIO
    // ===============================

    select.value =
        serviceId;


    // Disparar evento de cambio
    select.dispatchEvent(
        new Event(
            "change",
            {
                bubbles: true
            }
        )
    );


    // ===============================
    // IR A RESERVA
    // ===============================

    const bookingSection =
        document.getElementById(
            "reserva"
        );


    if (bookingSection) {

        bookingSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } else {

        // Por si el ID no existe,
        // buscar directamente el formulario

        const bookingForm =
            document.getElementById(
                "bookingForm"
            );

        if (bookingForm) {

            bookingForm.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }
}


// ===============================
// FORMULARIO DE RESERVA
// ===============================

function setupBookingForm() {

    const form =
        document.getElementById(
            "bookingForm"
        );

    if (!form) return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await submitBooking(form);

        }
    );
}


// ===============================
// ENVIAR RESERVA
// ===============================

async function submitBooking(form) {

    const button =
        document.getElementById(
            "bookingSubmit"
        );

    const message =
        document.getElementById(
            "bookingMessage"
        );


    const name =
        document
            .getElementById("clientName")
            .value
            .trim();

    const phone =
        document
            .getElementById("clientPhone")
            .value
            .trim();

    const email =
        document
            .getElementById("clientEmail")
            .value
            .trim();

    const serviceId =
        document
            .getElementById("service")
            .value;

    const date =
        document
            .getElementById("appointmentDate")
            .value;

    const time =
        document
            .getElementById("appointmentTime")
            .value;

    const notes =
        document
            .getElementById("notes")
            .value
            .trim();


    // ===============================
    // VALIDACIÓN
    // ===============================

    if (
        !name ||
        !phone ||
        !serviceId ||
        !date ||
        !time
    ) {

        showMessage(
            "Por favor completa los campos obligatorios.",
            true
        );

        return;
    }


    // ===============================
    // SERVICIO
    // ===============================

    const selectedService =
        services.find(
            service =>
                service.id === serviceId
        );


    if (!selectedService) {

        showMessage(
            "El servicio seleccionado no es válido.",
            true
        );

        return;
    }


    // ===============================
    // FECHA
    // ===============================

    const appointmentDateTime =
        new Date(
            `${date}T${time}:00`
        );


    if (
        Number.isNaN(
            appointmentDateTime.getTime()
        )
    ) {

        showMessage(
            "La fecha u hora no son válidas.",
            true
        );

        return;
    }


    if (
        appointmentDateTime.getTime() <
        Date.now()
    ) {

        showMessage(
            "No puedes solicitar una cita en una fecha pasada.",
            true
        );

        return;
    }


    // ===============================
    // ESTADO DEL BOTÓN
    // ===============================

    button.disabled = true;

    button.textContent =
        "Enviando solicitud...";

    message.textContent = "";


    // ===============================
    // INSERTAR CITA
    // ===============================

    const { error } =
        await db
            .from("appointments")
            .insert({
                client_name: name,
                client_phone: phone,
                client_email:
                    email || null,
                service_id:
                    serviceId,
                appointment_date:
                    date,
                appointment_time:
                    time,
                notes:
                    notes || null
            });


    if (error) {

        console.error(
            "Error creando cita:",
            error
        );

        showMessage(
            getBookingErrorMessage(error),
            true
        );

        button.disabled = false;

        button.textContent =
            "Solicitar cita";

        return;
    }


    // ===============================
    // ÉXITO
    // ===============================

    showMessage(
        "¡Solicitud enviada! Te contactaremos para confirmar tu cita.",
        false
    );


    form.reset();

    button.disabled = false;

    button.textContent =
        "Solicitar cita";
}


// ===============================
// FECHA MÍNIMA
// ===============================

function setupDateRestrictions() {

    const dateInput =
        document.getElementById(
            "appointmentDate"
        );

    if (!dateInput) return;


    const today =
        new Date();


    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    dateInput.min =
        `${year}-${month}-${day}`;
}


// ===============================
// MENSAJES
// ===============================

function showMessage(
    text,
    isError
) {

    const message =
        document.getElementById(
            "bookingMessage"
        );

    if (!message) return;


    message.textContent =
        text;

    message.style.color =
        isError
            ? "#d98d8d"
            : "#b9c9a9";
}


// ===============================
// ERROR DE RESERVA
// ===============================

function getBookingErrorMessage(error) {

    if (!error) {

        return "No pudimos enviar la solicitud.";
    }


    const text =
        `${error.message || ""} ${error.details || ""}`
            .toLowerCase();


    if (
        text.includes("future") ||
        text.includes("past")
    ) {

        return "La fecha seleccionada no es válida.";
    }


    if (
        text.includes("service") ||
        text.includes("active")
    ) {

        return "Ese servicio ya no está disponible.";
    }


    return "No pudimos enviar la solicitud. Inténtalo nuevamente.";
}


// ===============================
// FORMATO DE DINERO
// ===============================

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(value || 0);
}


// ===============================
// ESCAPE HTML
// ===============================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function escapeAttribute(value) {

    return escapeHtml(value);
}


// ===============================
// LINKS
// ===============================

function setLink(id, url) {

    const element =
        document.getElementById(id);

    if (!element || !url) return;

    element.href =
        url;
}


// ===============================
// ERROR DE SERVICIOS
// ===============================

function showServiceError() {

    const container =
        document.getElementById(
            "servicesGrid"
        );

    if (!container) return;


    container.innerHTML = `
        <div class="loading-card">

            <p>
                No pudimos cargar los servicios.
            </p>

        </div>
    `;
}
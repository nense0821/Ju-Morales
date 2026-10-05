// ===============================
// JÚ MORALES — PANEL ADMIN
// ===============================

const state = {
  appointments: [],
  services: [],
  expenses: [],
  gallery: []
};

const $ = (selector) => document.querySelector(selector);

document.addEventListener("DOMContentLoaded", init);


// ===============================
// INICIO
// ===============================

async function init() {
  try {

    const { data: sessionData } =
      await db.auth.getSession();

    if (!sessionData.session) {
      window.location.href = "login.html";
      return;
    }

    const user = sessionData.session.user;

    const {
      data: profile,
      error: profileError
    } = await db
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      profile.role !== "owner"
    ) {
      await db.auth.signOut();
      window.location.href = "login.html";
      return;
    }

    if ($("#ownerEmail")) {
      $("#ownerEmail").textContent =
        user.email || "Propietario";
    }

    if ($("#expenseDate")) {
      $("#expenseDate").value = getToday();
    }

    await loadAll();

    setupEvents();

  } catch (error) {

    console.error(error);

    showToast(
      "No se pudo cargar el panel.",
      "error"
    );
  }
}


// ===============================
// CARGAR TODO
// ===============================

async function loadAll() {

  await Promise.all([
    loadAppointments(),
    loadServices(),
    loadExpenses(),
    loadGallery()
  ]);

  renderEverything();
}


// ===============================
// CITAS
// ===============================

async function loadAppointments() {

  const {
    data,
    error
  } = await db
    .from("appointments")
    .select(`
      *,
      services (
        name
      )
    `)
    .order("appointment_date", {
      ascending: true
    })
    .order("appointment_time", {
      ascending: true
    });

  if (error) {

    console.error(
      "Error cargando citas:",
      error
    );

    showToast(
      "Error cargando las citas.",
      "error"
    );

    return;
  }

  state.appointments = data || [];
}


// ===============================
// SERVICIOS
// ===============================

async function loadServices() {

  const {
    data,
    error
  } = await db
    .from("services")
    .select("*")
    .order("sort_order", {
      ascending: true
    })
    .order("name", {
      ascending: true
    });

  if (error) {

    console.error(
      "Error cargando servicios:",
      error
    );

    showToast(
      "Error cargando servicios.",
      "error"
    );

    return;
  }

  state.services = data || [];
}


// ===============================
// GASTOS
// ===============================

async function loadExpenses() {

  const {
    data,
    error
  } = await db
    .from("expenses")
    .select("*")
    .order("expense_date", {
      ascending: false
    });

  if (error) {

    console.error(
      "Error cargando gastos:",
      error
    );

    showToast(
      "Error cargando gastos.",
      "error"
    );

    return;
  }

  state.expenses = data || [];
}


// ===============================
// GALERÍA
// ===============================

async function loadGallery() {

  const {
    data,
    error
  } = await db
    .from("gallery")
    .select("*")
    .order("sort_order", {
      ascending: true
    })
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(
      "Error cargando galería:",
      error
    );

    showToast(
      "Error cargando la galería.",
      "error"
    );

    return;
  }

  state.gallery = data || [];
}


// ===============================
// RENDER GENERAL
// ===============================

function renderEverything() {

  renderKPIs();

  renderAppointments();

  renderExpenses();

  renderFinance();

  renderServices();

  renderGalleryServiceSelect();

  renderClients();

  renderGallery();
}


// ===============================
// KPIs
// ===============================

function renderKPIs() {

  const pending =
    state.appointments.filter(
      a => a.status === "pending"
    ).length;

  const confirmed =
    state.appointments.filter(
      a => a.status === "confirmed"
    ).length;

  const income =
    state.appointments
      .filter(
        a => a.status === "completed"
      )
      .reduce(
        (sum, a) =>
          sum + Number(a.price || 0),
        0
      );

  const expenses =
    state.expenses.reduce(
      (sum, e) =>
        sum + Number(e.amount || 0),
      0
    );

  const profit =
    income - expenses;

  if ($("#kpiPending")) {
    $("#kpiPending").textContent =
      pending;
  }

  if ($("#kpiConfirmed")) {
    $("#kpiConfirmed").textContent =
      confirmed;
  }

  if ($("#kpiIncome")) {
    $("#kpiIncome").textContent =
      formatCurrency(income);
  }

  if ($("#kpiProfit")) {
    $("#kpiProfit").textContent =
      formatCurrency(profit);
  }
}


// ===============================
// CITAS
// ===============================

function renderAppointments() {

  const container =
    $("#appointmentsBody");

  if (!container) return;

  if (!state.appointments.length) {

    container.innerHTML = `
      <tr>
        <td
          colspan="7"
          style="
            padding:30px;
            text-align:center;
            color:#77736d;
          "
        >
          No hay citas todavía.
        </td>
      </tr>
    `;

    return;
  }

  container.innerHTML =
    state.appointments.map(
      appointment => {

        const serviceName =
          appointment.services?.name ||
          "Servicio";

        return `
          <tr>

            <td>
              <strong>
                ${escapeHtml(
                  appointment.client_name
                )}
              </strong>

              <br>

              <small>
                ${escapeHtml(
                  appointment.client_phone || ""
                )}
              </small>
            </td>

            <td>
              ${escapeHtml(serviceName)}
            </td>

            <td>
              ${formatDate(
                appointment.appointment_date
              )}
            </td>

            <td>
              ${formatTime(
                appointment.appointment_time
              )}
            </td>

            <td>
              ${formatCurrency(
                appointment.price
              )}
            </td>

            <td>

              <select
                class="status-select"
                data-id="${appointment.id}"
              >

                ${statusOption(
                  "pending",
                  appointment.status,
                  "Pendiente"
                )}

                ${statusOption(
                  "confirmed",
                  appointment.status,
                  "Confirmada"
                )}

                ${statusOption(
                  "completed",
                  appointment.status,
                  "Completada"
                )}

                ${statusOption(
                  "cancelled",
                  appointment.status,
                  "Cancelada"
                )}

                ${statusOption(
                  "no_show",
                  appointment.status,
                  "No asistió"
                )}

              </select>

            </td>

            <td>

              <button
                class="danger-button delete-appointment"
                data-id="${appointment.id}"
              >
                Eliminar
              </button>

            </td>

          </tr>
        `;
      }
    ).join("");
}


// ===============================
// GASTOS
// ===============================

function renderExpenses() {

  const container =
    $("#expensesList");

  if (!container) return;

  if (!state.expenses.length) {

    container.innerHTML = `
      <div class="empty-state">

        <strong>
          No hay gastos registrados.
        </strong>

        <span>
          Agrega tu primer gasto
          desde el formulario.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML =
    state.expenses.map(
      expense => `
        <div class="expense-row">

          <div>

            <strong>
              ${escapeHtml(
                expense.description
              )}
            </strong>

            <small>
              ${escapeHtml(
                expense.category ||
                "General"
              )}

              ·

              ${formatDate(
                expense.expense_date
              )}
            </small>

          </div>

          <strong>
            ${formatCurrency(
              expense.amount
            )}
          </strong>

        </div>
      `
    ).join("");
}


// ===============================
// FINANZAS
// ===============================

function renderFinance() {

  const income =
    state.appointments
      .filter(
        a => a.status === "completed"
      )
      .reduce(
        (sum, a) =>
          sum + Number(a.price || 0),
        0
      );

  const expenses =
    state.expenses.reduce(
      (sum, e) =>
        sum + Number(e.amount || 0),
      0
    );

  const profit =
    income - expenses;

  const clients =
    new Set(
      state.appointments.map(
        a =>
          a.client_phone ||
          a.client_email ||
          a.client_name
      )
    );

  if ($("#financeIncome")) {
    $("#financeIncome").textContent =
      formatCurrency(income);
  }

  if ($("#financeExpenses")) {
    $("#financeExpenses").textContent =
      formatCurrency(expenses);
  }

  if ($("#financeProfit")) {
    $("#financeProfit").textContent =
      formatCurrency(profit);
  }

  if ($("#financeClients")) {
    $("#financeClients").textContent =
      clients.size;
  }
}


// ===============================
// SERVICIOS
// ===============================

function renderServices() {

  const container =
    $("#servicesAdminList");

  if (!container) {
    renderGalleryServiceSelect();
    return;
  }

  if (!state.services.length) {

    container.innerHTML = `
      <div class="empty-state">

        <strong>
          No hay servicios.
        </strong>

        <span>
          Crea el primero usando
          el formulario.
        </span>

      </div>
    `;

    renderGalleryServiceSelect();

    return;
  }

  container.innerHTML =
    state.services.map(
      service => `

        <div
          class="service-admin-row"
          style="
            display:flex;
            gap:15px;
            align-items:center;
            padding:18px 25px;
            border-bottom:1px solid #eee9e1;
          "
        >

          ${
            service.image_url
              ? `
                <div
                  style="
                    width:70px;
                    height:70px;
                    flex-shrink:0;
                    overflow:hidden;
                    background:#e9e3da;
                  "
                >

                  <img
                    src="${escapeHtml(
                      service.image_url
                    )}"
                    alt="${escapeHtml(
                      service.name
                    )}"
                    style="
                      width:100%;
                      height:100%;
                      object-fit:cover;
                      display:block;
                    "
                  >

                </div>
              `
              : `
                <div
                  style="
                    width:70px;
                    height:70px;
                    flex-shrink:0;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:#e9e3da;
                    color:#77736d;
                    font-size:11px;
                    text-align:center;
                  "
                >
                  Sin foto
                </div>
              `
          }

          <div style="flex:1;">

            <strong>
              ${escapeHtml(
                service.name
              )}
            </strong>

            <small
              style="
                display:block;
                margin-top:4px;
              "
            >

              ${service.duration_minutes}
              min

              ·

              ${formatCurrency(
                service.price
              )}

            </small>

          </div>

          <div>

            <button
              class="secondary-button toggle-service"
              data-id="${service.id}"
              data-active="${service.active}"
            >

              ${
                service.active
                  ? "Desactivar"
                  : "Activar"
              }

            </button>

          </div>

        </div>
      `
    ).join("");

  renderGalleryServiceSelect();
}


// ===============================
// SELECTOR DE SERVICIO
// PARA NUEVA FOTO
// ===============================

function renderGalleryServiceSelect() {

  const select =
    $("#galleryService");

  if (!select) return;

  const currentValue =
    select.value;

  const activeServices =
    state.services.filter(
      service => service.active
    );

  select.innerHTML = `
    <option value="">
      Sin servicio específico
    </option>

    ${
      activeServices.map(
        service => `
          <option
            value="${escapeHtml(
              service.id
            )}"
          >
            ${escapeHtml(
              service.name
            )}
          </option>
        `
      ).join("")
    }
  `;

  if (
    currentValue &&
    activeServices.some(
      service =>
        service.id === currentValue
    )
  ) {
    select.value =
      currentValue;
  }
}


// ===============================
// CLIENTES
// ===============================

function renderClients() {

  const container =
    $("#clientsGrid");

  if (!container) return;

  const clients =
    new Map();

  state.appointments.forEach(
    appointment => {

      const key =
        appointment.client_phone ||
        appointment.client_email ||
        appointment.client_name;

      if (!key) return;

      if (!clients.has(key)) {

        clients.set(
          key,
          {
            name:
              appointment.client_name,

            phone:
              appointment.client_phone,

            email:
              appointment.client_email,

            appointments: 0,

            spent: 0
          }
        );
      }

      const client =
        clients.get(key);

      client.appointments++;

      if (
        appointment.status ===
        "completed"
      ) {

        client.spent +=
          Number(
            appointment.price || 0
          );
      }
    }
  );

  const list =
    Array.from(
      clients.values()
    );

  if ($("#clientCount")) {
    $("#clientCount").textContent =
      `${list.length} ${
        list.length === 1
          ? "cliente"
          : "clientes"
      }`;
  }

  if (!list.length) {

    container.innerHTML = `
      <div class="empty-state">

        <strong>
          No hay clientes todavía.
        </strong>

        <span>
          Los clientes aparecerán
          automáticamente después
          de reservar.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML =
    list.map(
      client => `

        <div class="client-card">

          <strong>
            ${escapeHtml(
              client.name ||
              "Cliente"
            )}
          </strong>

          <span>
            ${escapeHtml(
              client.phone ||
              "Sin teléfono"
            )}
          </span>

          <span>
            ${escapeHtml(
              client.email ||
              "Sin correo"
            )}
          </span>

          <small>

            ${client.appointments}

            ${
              client.appointments === 1
                ? "cita"
                : "citas"
            }

            ·

            ${formatCurrency(
              client.spent
            )}

          </small>

        </div>
      `
    ).join("");
}


// ===============================
// GALERÍA — ADMIN
// ===============================

function renderGallery() {

  const container =
    $("#galleryAdminGrid");

  if (!container) return;

  const count =
    state.gallery.length;

  if ($("#galleryCount")) {

    $("#galleryCount").textContent =
      `${count} ${
        count === 1
          ? "trabajo"
          : "trabajos"
      }`;
  }

  if (!state.gallery.length) {

    container.innerHTML = `
      <div
        class="empty-state"
        style="
          grid-column:1 / -1;
          background:#f8f5ef;
          padding:40px;
        "
      >

        <strong>
          Todavía no hay trabajos.
        </strong>

        <span>
          Sube la primera fotografía
          de tus uñas.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML =
    state.gallery.map(
      item => {

        const relatedService =
          state.services.find(
            service =>
              service.id ===
              item.service_id
          );

        return `

        <article
          style="
            background:#f8f5ef;
            position:relative;
          "
        >

          <div
            style="
              aspect-ratio:1 / 1;
              overflow:hidden;
              background:#e9e3da;
            "
          >

            <img
              src="${escapeHtml(
                item.image_url
              )}"
              alt="${escapeHtml(
                item.title ||
                "Trabajo de uñas"
              )}"
              style="
                width:100%;
                height:100%;
                object-fit:cover;
                display:block;
              "
              loading="lazy"
            >

          </div>


          <div
            style="
              padding:15px;
            "
          >

            <strong
              style="
                display:block;
                font-size:13px;
                margin-bottom:5px;
              "
            >
              ${escapeHtml(
                item.title ||
                "Trabajo de uñas"
              )}
            </strong>


            ${
              item.description
                ? `
                  <p
                    style="
                      margin:0 0 12px;
                      color:#77736d;
                      font-size:11px;
                      line-height:1.5;
                    "
                  >
                    ${escapeHtml(
                      item.description
                    )}
                  </p>
                `
                : ""
            }


            <!-- SERVICIO RELACIONADO -->

            <div
              style="
                margin-top:12px;
                margin-bottom:12px;
              "
            >

              <label
                style="
                  display:block;
                  color:#77736d;
                  font-size:8px;
                  letter-spacing:1px;
                  text-transform:uppercase;
                  margin-bottom:7px;
                "
              >
                Servicio relacionado
              </label>


              <select
                class="gallery-service-select"
                data-id="${item.id}"
                style="
                  width:100%;
                  padding:9px;
                  border:1px solid #d9d2c8;
                  background:#fffdf9;
                  font-size:10px;
                  color:#171614;
                "
              >

                <option value="">
                  Sin servicio específico
                </option>

                ${
                  state.services.map(
                    service => `
                      <option
                        value="${escapeHtml(
                          service.id
                        )}"
                        ${
                          item.service_id ===
                          service.id
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(
                          service.name
                        )}
                      </option>
                    `
                  ).join("")
                }

              </select>


              <button
                type="button"
                class="small-button save-gallery-service"
                data-id="${item.id}"
                style="
                  margin-top:7px;
                  width:100%;
                "
              >
                Guardar servicio
              </button>

            </div>


            ${
              relatedService
                ? `
                  <div
                    style="
                      margin-bottom:12px;
                      padding:8px;
                      background:#eee9e1;
                      color:#65705A;
                      font-size:9px;
                    "
                  >
                    Reservable como:
                    <strong>
                      ${escapeHtml(
                        relatedService.name
                      )}
                    </strong>
                  </div>
                `
                : ""
            }


            <div
              style="
                display:flex;
                gap:7px;
                flex-wrap:wrap;
              "
            >

              <button
                type="button"
                class="secondary-button toggle-gallery"
                data-id="${item.id}"
                data-active="${item.active}"
              >

                ${
                  item.active
                    ? "Ocultar"
                    : "Mostrar"
                }

              </button>


              <button
                type="button"
                class="danger-button delete-gallery"
                data-id="${item.id}"
              >
                Eliminar
              </button>

            </div>

          </div>

        </article>
      `;
      }
    ).join("");
}


// ===============================
// EVENTOS
// ===============================

function setupEvents() {

  // CERRAR SESIÓN

  $("#logoutButton")?.addEventListener(
    "click",
    async () => {

      await db.auth.signOut();

      window.location.href =
        "login.html";
    }
  );


  // SERVICIO

  $("#serviceForm")?.addEventListener(
    "submit",
    createService
  );

  $("#serviceImage")?.addEventListener(
    "change",
    previewServiceImage
  );


  // GASTO

  $("#expenseForm")?.addEventListener(
    "submit",
    createExpense
  );


  // ACTUALIZAR CITAS

  $("#appointmentsBody")?.addEventListener(
    "change",
    async event => {

      const select =
        event.target.closest(
          ".status-select"
        );

      if (!select) return;

      await updateAppointmentStatus(
        select.dataset.id,
        select.value
      );
    }
  );


  // ELIMINAR CITA

  $("#appointmentsBody")?.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          ".delete-appointment"
        );

      if (!button) return;

      const confirmed =
        confirm(
          "¿Seguro que quieres eliminar esta cita?"
        );

      if (!confirmed) return;

      await deleteAppointment(
        button.dataset.id
      );
    }
  );


  // SERVICIOS

  $("#servicesAdminList")?.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          ".toggle-service"
        );

      if (!button) return;

      const id =
        button.dataset.id;

      const active =
        button.dataset.active ===
        "true";

      await toggleService(
        id,
        !active
      );
    }
  );


  // GALERÍA

  $("#galleryForm")?.addEventListener(
    "submit",
    uploadGalleryImage
  );


  // PREVISUALIZACIÓN GALERÍA

  $("#galleryImage")?.addEventListener(
    "change",
    previewGalleryImage
  );


  // BOTONES GALERÍA

  $("#galleryAdminGrid")?.addEventListener(
    "click",
    async event => {

      // GUARDAR SERVICIO RELACIONADO

      const saveServiceButton =
        event.target.closest(
          ".save-gallery-service"
        );

      if (saveServiceButton) {

        const card =
          saveServiceButton.closest(
            "article"
          );

        const select =
          card?.querySelector(
            ".gallery-service-select"
          );

        if (!select) return;

        await updateGalleryService(
          saveServiceButton.dataset.id,
          select.value
        );

        return;
      }


      // MOSTRAR / OCULTAR

      const toggleButton =
        event.target.closest(
          ".toggle-gallery"
        );

      if (toggleButton) {

        const id =
          toggleButton.dataset.id;

        const active =
          toggleButton.dataset.active ===
          "true";

        await toggleGallery(
          id,
          !active
        );

        return;
      }


      // ELIMINAR

      const deleteButton =
        event.target.closest(
          ".delete-gallery"
        );

      if (deleteButton) {

        const confirmed =
          confirm(
            "¿Seguro que quieres eliminar este trabajo de la galería?"
          );

        if (!confirmed) return;

        await deleteGallery(
          deleteButton.dataset.id
        );
      }
    }
  );


  // ACTUALIZAR GALERÍA

  $("#refreshGallery")?.addEventListener(
    "click",
    async () => {

      await loadGallery();

      renderGallery();

      showToast(
        "Galería actualizada."
      );
    }
  );


  // ACTUALIZAR CITAS

  $("#refreshAppointments")?.addEventListener(
    "click",
    async () => {

      await loadAppointments();

      renderAppointments();

      renderKPIs();

      renderFinance();

      renderClients();

      showToast(
        "Citas actualizadas."
      );
    }
  );
}


// ===============================
// SUBIR FOTO DE GALERÍA
// ===============================

async function uploadGalleryImage(event) {

  event.preventDefault();

  const file =
    $("#galleryImage")?.files?.[0];

  const title =
    $("#galleryTitle")?.value.trim();

  const description =
    $("#galleryDescription")?.value.trim();

  const serviceId =
    $("#galleryService")?.value || null;

  const button =
    $("#gallerySubmit");


  if (!file) {

    showGalleryMessage(
      "Selecciona una fotografía.",
      true
    );

    return;
  }


  if (!title) {

    showGalleryMessage(
      "Escribe el nombre del diseño.",
      true
    );

    return;
  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    showGalleryMessage(
      "Solo puedes subir JPG, PNG o WEBP.",
      true
    );

    return;
  }


  const maxSize =
    8 * 1024 * 1024;


  if (file.size > maxSize) {

    showGalleryMessage(
      "La imagen no puede superar los 8 MB.",
      true
    );

    return;
  }


  try {

    button.disabled = true;

    button.textContent =
      "Subiendo fotografía...";


    const extension =
      getFileExtension(file);


    const filePath =
      `nails/${crypto.randomUUID()}.${extension}`;


    const {
      error: uploadError
    } = await db.storage
      .from("gallery")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        }
      );


    if (uploadError) {

      console.error(
        "Error Storage:",
        uploadError
      );

      throw new Error(
        "No se pudo subir la fotografía."
      );
    }


    const {
      data: publicData
    } = db.storage
      .from("gallery")
      .getPublicUrl(
        filePath
      );


    const imageUrl =
      publicData?.publicUrl;


    if (!imageUrl) {

      await db.storage
        .from("gallery")
        .remove([
          filePath
        ]);

      throw new Error(
        "No se pudo obtener la URL de la imagen."
      );
    }


    button.textContent =
      "Guardando trabajo...";


    const {
      error: databaseError
    } = await db
      .from("gallery")
      .insert({

        image_url:
          imageUrl,

        storage_path:
          filePath,

        title:
          title,

        description:
          description,

        service_id:
          serviceId,

        active:
          true,

        sort_order:
          state.gallery.length
      });


    if (databaseError) {

      console.error(
        "Error base de datos:",
        databaseError
      );


      await db.storage
        .from("gallery")
        .remove([
          filePath
        ]);


      throw new Error(
        "La fotografía se subió, pero no se pudo registrar."
      );
    }


    event.target.reset();


    if ($("#galleryPreview")) {

      $("#galleryPreview").style.display =
        "none";
    }


    if ($("#galleryPreviewImage")) {

      $("#galleryPreviewImage").src =
        "";
    }


    showGalleryMessage(
      "Trabajo agregado correctamente.",
      false
    );


    showToast(
      "Trabajo agregado a la galería."
    );


    await loadGallery();

    renderGallery();


  } catch (error) {

    console.error(error);

    showGalleryMessage(
      error.message ||
      "No se pudo subir la fotografía.",
      true
    );

    showToast(
      "No se pudo subir la fotografía.",
      "error"
    );

  } finally {

    button.disabled = false;

    button.textContent =
      "Subir trabajo";
  }
}


// ===============================
// ACTUALIZAR SERVICIO DE GALERÍA
// ===============================

async function updateGalleryService(
  id,
  serviceId
) {

  const {
    error
  } = await db
    .from("gallery")
    .update({
      service_id:
        serviceId || null
    })
    .eq("id", id);


  if (error) {

    console.error(
      "Error actualizando servicio de galería:",
      error
    );

    showToast(
      "No se pudo guardar el servicio relacionado.",
      "error"
    );

    return;
  }


  showToast(
    serviceId
      ? "Servicio relacionado guardado."
      : "Servicio relacionado eliminado."
  );


  await loadGallery();

  renderGallery();
}


// ===============================
// PREVISUALIZAR FOTO GALERÍA
// ===============================

function previewGalleryImage(event) {

  const file =
    event.target.files?.[0];

  const preview =
    $("#galleryPreview");

  const image =
    $("#galleryPreviewImage");


  if (!file) {

    if (preview) {
      preview.style.display =
        "none";
    }

    return;
  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    showGalleryMessage(
      "Solo puedes usar JPG, PNG o WEBP.",
      true
    );

    event.target.value = "";

    return;
  }


  const maxSize =
    8 * 1024 * 1024;


  if (file.size > maxSize) {

    showGalleryMessage(
      "La imagen no puede superar los 8 MB.",
      true
    );

    event.target.value = "";

    return;
  }


  const objectUrl =
    URL.createObjectURL(file);


  if (image) {
    image.src =
      objectUrl;
  }


  if (preview) {
    preview.style.display =
      "block";
  }
}


// ===============================
// PREVISUALIZAR FOTO SERVICIO
// ===============================

function previewServiceImage(event) {

  const file =
    event.target.files?.[0];

  const preview =
    $("#serviceImagePreview");

  const image =
    $("#serviceImagePreviewImg");


  if (!file) {

    if (preview) {
      preview.style.display =
        "none";
    }

    return;
  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    showToast(
      "La imagen debe ser JPG, PNG o WEBP.",
      "error"
    );

    event.target.value = "";

    if (preview) {
      preview.style.display =
        "none";
    }

    return;
  }


  const maxSize =
    8 * 1024 * 1024;


  if (file.size > maxSize) {

    showToast(
      "La imagen no puede superar los 8 MB.",
      "error"
    );

    event.target.value = "";

    if (preview) {
      preview.style.display =
        "none";
    }

    return;
  }


  const objectUrl =
    URL.createObjectURL(file);


  if (image) {
    image.src =
      objectUrl;
  }


  if (preview) {
    preview.style.display =
      "block";
  }
}


// ===============================
// MOSTRAR / OCULTAR FOTO
// ===============================

async function toggleGallery(
  id,
  active
) {

  const {
    error
  } = await db
    .from("gallery")
    .update({
      active
    })
    .eq("id", id);


  if (error) {

    console.error(error);

    showToast(
      "No se pudo actualizar la fotografía.",
      "error"
    );

    return;
  }


  showToast(
    active
      ? "Trabajo visible en la página."
      : "Trabajo ocultado."
  );


  await loadGallery();

  renderGallery();
}


// ===============================
// ELIMINAR FOTO
// ===============================

async function deleteGallery(id) {

  const item =
    state.gallery.find(
      gallery =>
        gallery.id === id
    );


  if (!item) return;


  try {

    const {
      error: databaseError
    } = await db
      .from("gallery")
      .delete()
      .eq("id", id);


    if (databaseError) {

      console.error(
        databaseError
      );

      throw new Error(
        "No se pudo eliminar el trabajo."
      );
    }


    if (item.storage_path) {

      const {
        error: storageError
      } = await db.storage
        .from("gallery")
        .remove([
          item.storage_path
        ]);


      if (storageError) {

        console.error(
          "Error eliminando archivo:",
          storageError
        );

        showToast(
          "Trabajo eliminado, pero el archivo quedó en Storage.",
          "error"
        );

      } else {

        showToast(
          "Trabajo eliminado correctamente."
        );
      }

    } else {

      showToast(
        "Trabajo eliminado correctamente."
      );
    }


    await loadGallery();

    renderGallery();

  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      "No se pudo eliminar el trabajo.",
      "error"
    );
  }
}


// ===============================
// CREAR SERVICIO CON IMAGEN
// ===============================

async function createService(event) {

  event.preventDefault();


  const name =
    $("#serviceName")?.value.trim();

  const description =
    $("#serviceDescription")?.value.trim();

  const duration =
    Number(
      $("#serviceDuration")?.value
    );

  const price =
    Number(
      $("#servicePrice")?.value
    );

  const imageFile =
    $("#serviceImage")?.files?.[0];

  const button =
    $("#serviceSubmit");


  if (
    !name ||
    !duration ||
    !price
  ) {

    showToast(
      "Completa todos los campos del servicio.",
      "error"
    );

    return;
  }


  if (!imageFile) {

    showToast(
      "Selecciona una imagen para el servicio.",
      "error"
    );

    return;
  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (
    !allowedTypes.includes(
      imageFile.type
    )
  ) {

    showToast(
      "La imagen debe ser JPG, PNG o WEBP.",
      "error"
    );

    return;
  }


  const maxSize =
    8 * 1024 * 1024;


  if (imageFile.size > maxSize) {

    showToast(
      "La imagen no puede superar los 8 MB.",
      "error"
    );

    return;
  }


  try {

    button.disabled = true;

    button.textContent =
      "Subiendo imagen...";


    const extension =
      getFileExtension(imageFile);


    const filePath =
      `services/${crypto.randomUUID()}.${extension}`;


    const {
      error: uploadError
    } = await db.storage
      .from("gallery")
      .upload(
        filePath,
        imageFile,
        {
          cacheControl: "3600",
          upsert: false,
          contentType:
            imageFile.type
        }
      );


    if (uploadError) {

      console.error(
        "Error Storage servicio:",
        uploadError
      );

      throw new Error(
        "No se pudo subir la imagen del servicio."
      );
    }


    const {
      data: publicData
    } = db.storage
      .from("gallery")
      .getPublicUrl(
        filePath
      );


    const imageUrl =
      publicData?.publicUrl;


    if (!imageUrl) {

      await db.storage
        .from("gallery")
        .remove([
          filePath
        ]);

      throw new Error(
        "No se pudo obtener la URL de la imagen."
      );
    }


    button.textContent =
      "Guardando servicio...";


    const {
      error: databaseError
    } = await db
      .from("services")
      .insert({

        name,

        description,

        duration_minutes:
          duration,

        price,

        active:
          true,

        sort_order:
          state.services.length,

        image_url:
          imageUrl,

        storage_path:
          filePath
      });


    if (databaseError) {

      console.error(
        "Error base de datos servicio:",
        databaseError
      );


      await db.storage
        .from("gallery")
        .remove([
          filePath
        ]);


      throw new Error(
        "La imagen se subió, pero no se pudo crear el servicio."
      );
    }


    event.target.reset();


    if ($("#serviceImagePreview")) {

      $("#serviceImagePreview").style.display =
        "none";
    }


    if ($("#serviceImagePreviewImg")) {

      $("#serviceImagePreviewImg").src =
        "";
    }


    showToast(
      "Servicio creado correctamente."
    );


    await loadServices();

    renderServices();

    renderGalleryServiceSelect();


  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      "No se pudo crear el servicio.",
      "error"
    );

  } finally {

    button.disabled = false;

    button.textContent =
      "Crear servicio";
  }
}


// ===============================
// ACTIVAR / DESACTIVAR SERVICIO
// ===============================

async function toggleService(
  id,
  active
) {

  const {
    error
  } = await db
    .from("services")
    .update({
      active
    })
    .eq("id", id);


  if (error) {

    console.error(error);

    showToast(
      "No se pudo actualizar el servicio.",
      "error"
    );

    return;
  }


  showToast(
    active
      ? "Servicio activado."
      : "Servicio desactivado."
  );


  await loadServices();

  renderServices();

  renderGalleryServiceSelect();

  renderGallery();
}


// ===============================
// CREAR GASTO
// ===============================

async function createExpense(event) {

  event.preventDefault();


  const description =
    $("#expenseDescription")
      ?.value.trim();

  const category =
    $("#expenseCategory")
      ?.value.trim();

  const amount =
    Number(
      $("#expenseAmount")?.value
    );

  const date =
    $("#expenseDate")?.value;

  const notes =
    $("#expenseNotes")
      ?.value.trim();


  if (
    !description ||
    !amount ||
    !date
  ) {

    showToast(
      "Completa los datos del gasto.",
      "error"
    );

    return;
  }


  const {
    error
  } = await db
    .from("expenses")
    .insert({

      description,

      category:
        category ||
        "General",

      amount,

      expense_date:
        date,

      notes
    });


  if (error) {

    console.error(error);

    showToast(
      "No se pudo registrar el gasto.",
      "error"
    );

    return;
  }


  event.target.reset();


  if ($("#expenseDate")) {

    $("#expenseDate").value =
      getToday();
  }


  showToast(
    "Gasto registrado correctamente."
  );


  await loadExpenses();

  renderKPIs();

  renderExpenses();

  renderFinance();
}


// ===============================
// ACTUALIZAR CITA
// ===============================

async function updateAppointmentStatus(
  id,
  status
) {

  const {
    error
  } = await db
    .from("appointments")
    .update({
      status
    })
    .eq("id", id);


  if (error) {

    console.error(error);

    showToast(
      "No se pudo actualizar la cita.",
      "error"
    );

    return;
  }


  showToast(
    "Estado de la cita actualizado."
  );


  await loadAppointments();

  renderKPIs();

  renderAppointments();

  renderFinance();

  renderClients();
}


// ===============================
// ELIMINAR CITA
// ===============================

async function deleteAppointment(id) {

  const {
    error
  } = await db
    .from("appointments")
    .delete()
    .eq("id", id);


  if (error) {

    console.error(error);

    showToast(
      "No se pudo eliminar la cita.",
      "error"
    );

    return;
  }


  showToast(
    "Cita eliminada."
  );


  await loadAppointments();

  renderKPIs();

  renderAppointments();

  renderFinance();

  renderClients();
}


// ===============================
// MENSAJE GALERÍA
// ===============================

function showGalleryMessage(
  message,
  isError = false
) {

  const element =
    $("#galleryMessage");

  if (!element) return;

  element.textContent =
    message;

  element.style.color =
    isError
      ? "#b94b4b"
      : "#65705A";
}


// ===============================
// EXTENSIÓN
// ===============================

function getFileExtension(file) {

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

  if (
    extension === "jpeg"
  ) {
    return "jpg";
  }

  return extension;
}


// ===============================
// FORMATO MONEDA
// ===============================

function formatCurrency(value) {

  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }
  ).format(
    Number(value || 0)
  );
}


// ===============================
// FORMATO FECHA
// ===============================

function formatDate(date) {

  if (!date) return "";

  const [
    year,
    month,
    day
  ] = date.split("-");

  const localDate =
    new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

  return localDate.toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}


// ===============================
// FORMATO HORA
// ===============================

function formatTime(time) {

  if (!time) return "";

  const [
    hour,
    minute
  ] = time.split(":");

  const date =
    new Date();

  date.setHours(
    Number(hour),
    Number(minute),
    0,
    0
  );

  return date.toLocaleTimeString(
    "es-CO",
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}


// ===============================
// FECHA ACTUAL
// ===============================

function getToday() {

  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// ===============================
// OPCIONES ESTADO
// ===============================

function statusOption(
  value,
  current,
  label
) {

  return `
    <option
      value="${value}"
      ${
        value === current
          ? "selected"
          : ""
      }
    >
      ${label}
    </option>
  `;
}


// ===============================
// SEGURIDAD HTML
// ===============================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


// ===============================
// TOAST
// ===============================

function showToast(
  message,
  type = "success"
) {

  const toast =
    $("#adminToast");

  if (!toast) return;

  toast.textContent =
    message;

  // Conservamos la clase original
  // para que no pierda el diseño CSS.

  toast.className =
    "admin-toast";

  if (type === "error") {
    toast.style.background =
      "#9d5555";
  } else {
    toast.style.background =
      "#171614";
  }

  toast.classList.add(
    "show"
  );

  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    3000
  );
}
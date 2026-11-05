import './style.css'

const API_URL = 'https://backend-express-vercel-supabase.vercel.app'

// Estructura del dashboard
document.querySelector('#app').innerHTML = `
  <header class="header">
    <div class="brand">
      <span class="brand-icon">💧</span>
      <div>
        <h2>AquaMonitor</h2>
        <small>Sistema de monitoreo de agua</small>
      </div>
    </div>
    <span class="status"><span></span> Sistema activo</span>
  </header>

  <main class="container">

    <section class="welcome">
      <div>
        <h1>Panel de monitoreo</h1>
        <p>Supervisa los sensores y detecta posibles fugas de agua.</p>
      </div>
      <button id="refreshBtn">↻ Actualizar</button>
    </section>

    <section class="stats">
      <article class="card">
        <span>Dispositivos</span>
        <h2 id="devicesCount">--</h2>
        <small>Registrados</small>
      </article>

      <article class="card">
        <span>Mediciones</span>
        <h2 id="measurementsCount">--</h2>
        <small>Registros almacenados</small>
      </article>

      <article class="card">
        <span>Alertas activas</span>
        <h2 id="alertsCount">--</h2>
        <small>Requieren atención</small>
      </article>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Dispositivos</h2>
        <span>Estado de sensores</span>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Dispositivo</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Última conexión</th>
            </tr>
          </thead>
          <tbody id="devicesTable">
            <tr><td colspan="4">Cargando dispositivos...</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Últimas mediciones</h2>
        <span>Lecturas de sensores</span>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Dispositivo</th>
              <th>Presencia de agua</th>
              <th>Flujo de agua</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody id="measurementsTable">
            <tr><td colspan="4">Cargando mediciones...</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Alertas recientes</h2>
        <span>Eventos detectados</span>
      </div>

      <div id="alertsList">
        <p>Cargando alertas...</p>
      </div>
    </section>

  </main>

  <footer>
    AquaMonitor · Sistema de monitoreo y alerta temprana
  </footer>
`

// Formatear fechas
function formatDate(date) {
  if (!date) return 'Sin registro'

  return new Date(date).toLocaleString('es-PE')
}

// Cargar información del dashboard
async function loadDashboard() {

  try {

    const [statusRes, devicesRes, measurementsRes, alertsRes] =
      await Promise.all([
        fetch(`${API_URL}/api/estado`),
        fetch(`${API_URL}/api/devices`),
        fetch(`${API_URL}/api/measurements?limit=10`),
        fetch(`${API_URL}/api/alerts?status=active`)
      ])

    if (!statusRes.ok || !devicesRes.ok || !measurementsRes.ok || !alertsRes.ok) {
      throw new Error('Error al consultar la API')
    }

    const [status, devices, measurements, alerts] = await Promise.all([
      statusRes.json(),
      devicesRes.json(),
      measurementsRes.json(),
      alertsRes.json()
    ])

    // =========================
    // RESUMEN
    // =========================

    document.querySelector('#devicesCount').textContent =
      status.devices ?? devices.length

    document.querySelector('#measurementsCount').textContent =
      status.measurements ?? measurements.length

    document.querySelector('#alertsCount').textContent =
      status.activeAlerts ?? alerts.length

    // =========================
    // DISPOSITIVOS
    // =========================

    document.querySelector('#devicesTable').innerHTML =
      devices.map(device => `
        <tr>
          <td>
            <strong>${device.name || device.device_code}</strong><br>
            <small>${device.device_code}</small>
          </td>

          <td>
            ${device.location || '-'} / ${device.zone || '-'}
          </td>

          <td>
            <span class="badge ${device.status === 'online' ? 'online' : 'offline'}">
              ${device.status || 'Desconocido'}
            </span>
          </td>

          <td>
            ${formatDate(device.last_seen)}
          </td>
        </tr>
      `).join('') || `
        <tr>
          <td colspan="4">No hay dispositivos registrados</td>
        </tr>
      `

    // =========================
    // MEDICIONES
    // =========================

    document.querySelector('#measurementsTable').innerHTML =
      measurements.map(item => `
        <tr>
          <td>
            ${item.devices?.device_code || item.device_code || item.device_id}
          </td>

          <td>
            <span class="badge ${item.water_detected ? 'danger' : 'online'}">
              ${item.water_detected ? 'Detectada' : 'No detectada'}
            </span>
          </td>

          <td>
            ${item.flow_rate} L/min
          </td>

          <td>
            ${formatDate(item.created_at)}
          </td>
        </tr>
      `).join('') || `
        <tr>
          <td colspan="4">No hay mediciones</td>
        </tr>
      `

    // =========================
    // ALERTAS
    // =========================

    document.querySelector('#alertsList').innerHTML =
      alerts.map(alert => `
        <div class="alert-item">
          <div>
            <strong>${alert.alert_type}</strong>
            <p>${alert.description || 'Alerta detectada'}</p>
            <small>${formatDate(alert.created_at)}</small>
          </div>

          <span class="badge danger">Activa</span>
        </div>
      `).join('') || `
        <p>No hay alertas activas.</p>
      `

  } catch (error) {

    console.error('Error:', error)

    document.querySelector('#devicesTable').innerHTML = `
      <tr>
        <td colspan="4">No se pudo conectar con la API.</td>
      </tr>
    `

    document.querySelector('#measurementsTable').innerHTML = `
      <tr>
        <td colspan="4">Error al cargar mediciones.</td>
      </tr>
    `

    document.querySelector('#alertsList').innerHTML = `
      <p>Error al cargar alertas.</p>
    `

  }

}

// Botón actualizar
document.querySelector('#refreshBtn').addEventListener('click', loadDashboard)

// Carga inicial
loadDashboard()

// Actualización automática cada 10 segundos
setInterval(loadDashboard, 10000)
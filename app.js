/* ═══════════════════════════════════════════════════════════════
   PetCare Express – lógica de la aplicación
   ═══════════════════════════════════════════════════════════════ */

// ── Utilidades DOM / texto ──────────────────────────────────────
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// ── Constantes ──────────────────────────────────────────────────
const KEY   = 'pce_v1';
const TIPOS = ['Salud', 'Vacunacion', 'Estetica', 'Entrenamiento', 'Relajacion', 'Funerario'];

// ── Estado global ───────────────────────────────────────────────
let S;
let ui = { rol: 'admin', usr: '', tab: 'planes', edit: null, fm: '', ft: '' };

// ── Persistencia (localStorage) ─────────────────────────────────
const store = {
  get: () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
  set: v  => { try { localStorage.setItem(KEY, v); }    catch (e) {} }
};

// ── Fechas y horas ───────────────────────────────────────────────
const iso  = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const addD = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const m2t  = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const t2m  = t => { const p = t.split(':'); return +p[0] * 60 + +p[1]; };

// ── Helpers varios ───────────────────────────────────────────────
const money = n   => '$ ' + Number(n).toLocaleString('es-CO');
const val   = id  => ($('#' + id) || {}).value || '';
const save  = ()  => store.set(JSON.stringify(S));
const get   = (c, id) => S[c].find(x => x.id === id);
const uid   = p   => p + (++S.n);
const live  = c   => c.estado === 'Programada' || c.estado === 'Confirmada';

// ── Datos de demostración ────────────────────────────────────────
function seed() {
  S = {
    n: 100,
    servicios: [
      { id: 's1', nombre: 'Consulta veterinaria', tipo: 'Salud',          dur: 60 },
      { id: 's2', nombre: 'Vacunación',           tipo: 'Vacunacion',     dur: 30 },
      { id: 's3', nombre: 'Baño y peluquería',    tipo: 'Estetica',       dur: 90 },
      { id: 's4', nombre: 'Entrenamiento básico', tipo: 'Entrenamiento',  dur: 60 },
      { id: 's5', nombre: 'Masaje relajante',     tipo: 'Relajacion',     dur: 45 },
      { id: 's6', nombre: 'Servicio funerario',   tipo: 'Funerario',      dur: 120 }
    ],
    planes: [
      { id: 'pl1', nombre: 'Plan Salud Total',      desc: 'Consulta y vacunación a domicilio.',       precio: 120000, activo: true,  servicios: ['s1', 's2'] },
      { id: 'pl2', nombre: 'Plan Belleza y Calma',  desc: 'Estética y relajación para tu mascota.',  precio: 90000,  activo: true,  servicios: ['s3', 's5'] },
      { id: 'pl3', nombre: 'Plan Entrenamiento',    desc: 'Sesiones de entrenamiento básico.',        precio: 150000, activo: true,  servicios: ['s4'] },
      { id: 'pl4', nombre: 'Plan Despedida Digna',  desc: 'Acompañamiento y servicio funerario.',     precio: 300000, activo: false, servicios: ['s6'] }
    ],
    duenos: [
      { id: 'd1', nombre: 'Laura Gómez',  tel: '3105550101', dir: 'Cra 15 # 100-20, Bogotá' },
      { id: 'd2', nombre: 'Carlos Ruiz',  tel: '3205550102', dir: 'Cl 72 # 10-34, Bogotá' }
    ],
    mascotas: [
      { id: 'm1', nombre: 'Max',   especie: 'Canino', raza: 'Golden Retriever', edad: 5, cond: '',                dueno: 'd1' },
      { id: 'm2', nombre: 'Luna',  especie: 'Felino', raza: 'Criollo',          edad: 3, cond: 'Alergia al pollo', dueno: 'd1' },
      { id: 'm3', nombre: 'Rocky', especie: 'Canino', raza: 'Bulldog',          edad: 2, cond: '',                dueno: 'd2' }
    ],
    personal: [
      { id: 'e1', nombre: 'Dra. Camila Torres', esp: 'Medicina veterinaria',               tarifa: 35000, tipos: ['Salud', 'Vacunacion'] },
      { id: 'e2', nombre: 'Andrés Pérez',        esp: 'Estética y relajación canina',       tarifa: 28000, tipos: ['Estetica', 'Relajacion'] },
      { id: 'e3', nombre: 'Sofía Ramírez',        esp: 'Entrenamiento y servicios funerarios', tarifa: 30000, tipos: ['Entrenamiento', 'Funerario'] }
    ],
    citas: [
      { id: 'c1', mascota: 'm1', servicio: 's1', plan: 'pl1', fecha: addD(1),  ini: 540, fin: 600, personal: 'e1', estado: 'Programada' },
      { id: 'c2', mascota: 'm2', servicio: 's3', plan: 'pl2', fecha: addD(1),  ini: 600, fin: 690, personal: 'e2', estado: 'Confirmada' },
      { id: 'c3', mascota: 'm3', servicio: 's2', plan: 'pl1', fecha: addD(-1), ini: 900, fin: 930, personal: 'e1', estado: 'Atendida' }
    ],
    tratamientos: [
      { id: 't1', cita: 'c3', fecha: addD(-1), desc: 'Vacuna múltiple aplicada.', obs: 'Sin reacciones adversas.' }
    ]
  };
  save();
}

// ── Configuración de tabs por rol ────────────────────────────────
const TABS  = { admin: ['planes', 'mascotas', 'citas', 'tratamientos', 'personal'], dueno: ['planes', 'mascotas', 'citas', 'tratamientos'], personal: ['citas', 'tratamientos', 'personal'] };
const NAMES = { planes: 'Planes y servicios', mascotas: 'Mascotas', citas: 'Citas', tratamientos: 'Tratamientos', personal: 'Personal' };

// ── Filtros por rol ──────────────────────────────────────────────
const defUsr  = r => r === 'dueno' ? S.duenos[0].id : r === 'personal' ? S.personal[0].id : '';
const misMasc = () => ui.rol === 'dueno' ? S.mascotas.filter(m => m.dueno === ui.usr) : S.mascotas;
const misCitas = () => {
  let c = S.citas;
  if (ui.rol === 'dueno') { const ids = misMasc().map(m => m.id); c = c.filter(x => ids.includes(x.mascota)); }
  if (ui.rol === 'personal') c = c.filter(x => x.personal === ui.usr);
  return c.slice().sort((a, b) => (a.fecha + m2t(a.ini)).localeCompare(b.fecha + m2t(b.ini)));
};
const act = c => c.estado !== 'Cancelada';

// ── Disponibilidad ───────────────────────────────────────────────
const libres = (sv, f, i, e, ex) => S.personal.filter(p =>
  p.tipos.includes(sv.tipo) &&
  !S.citas.some(c => c.id !== ex && act(c) && c.personal === p.id && c.fecha === f && i < c.fin && c.ini < e)
);
const mLibre = (mid, f, i, e, ex) =>
  !S.citas.some(c => c.id !== ex && act(c) && c.mascota === mid && c.fecha === f && i < c.fin && c.ini < e);

function sugerir(sv, mid, f, ex) {
  const r = [];
  for (let t = 480; t + sv.dur <= 1080 && r.length < 3; t += 30)
    if (libres(sv, f, t, t + sv.dur, ex).length && mLibre(mid, f, t, t + sv.dur, ex)) r.push(m2t(t));
  return r;
}

function validar(sv, mid, f, ini, ex) {
  const e = ini + sv.dur;
  if (!f || isNaN(ini)) return { msg: 'Complete la fecha y la hora.' };
  if (f < iso(new Date())) return { msg: 'La fecha no puede ser anterior a hoy.' };
  if (ini < 480 || e > 1080) return { msg: 'Horario de atención de 08:00 a 18:00; el servicio dura ' + sv.dur + ' min.' };
  if (!mLibre(mid, f, ini, e, ex)) return { msg: 'La mascota ya tiene una cita en ese horario.' };
  const l = libres(sv, f, ini, e, ex);
  if (!l.length) {
    const s = sugerir(sv, mid, f, ex);
    return { msg: 'Sin disponibilidad de personal en ese horario.' + (s.length ? ' Horarios sugeridos: ' + s.join(', ') + '.' : ' Pruebe otra fecha.') };
  }
  return { ok: 1, l, e };
}

// ── UI helpers ───────────────────────────────────────────────────
function toast(m, t) {
  const x = $('#toast');
  x.textContent = m; x.className = t || ''; x.style.display = 'block';
  clearTimeout(toast.h);
  toast.h = setTimeout(() => x.style.display = 'none', 4200);
}

const opt   = (a, f, s) => a.map(x => `<option value="${esc(x.id)}"${x.id === s ? ' selected' : ''}>${esc(f(x))}</option>`).join('');
const tbl   = (h, r) => `<div class="tw"><table><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${r.length ? r.map(x => `<tr>${x.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${h.length}" class="mu">Sin registros.</td></tr>`}</tbody></table></div>`;
const badge = e => `<span class="b ${{ Programada: 'wa', Confirmada: 'ok', Atendida: 'pr', Cancelada: 'er' }[e]}">${e}</span>`;
const servsDe = pid => pid ? get('planes', pid).servicios.map(i => get('servicios', i)) : S.servicios;
const sopt    = a => opt(a, s => s.nombre + ' (' + s.dur + ' min)');

function dlg(t, b, a) {
  $('#dlg').innerHTML = `<h3>${t}</h3>${b}<div class="row end"><button class="sm" data-a="close">${a ? 'Cancelar' : 'Cerrar'}</button>${a ? `<button class="sm" data-a="${a}">Guardar</button>` : ''}</div>`;
  $('#dlg').showModal();
}

function done(m) { save(); if ($('#dlg').open) $('#dlg').close(); toast(m); render(); }

// ── Vistas ───────────────────────────────────────────────────────
function vPlanes() {
  const adm = ui.rol === 'admin', pl = adm ? S.planes : S.planes.filter(p => p.activo);
  let h = '<h2>Planes de servicio</h2><div class="grid">' + pl.map(p =>
    `<div class="card"><div class="row"><b>${esc(p.nombre)}</b><span class="b ${p.activo ? 'ok' : 'er'}">${p.activo ? 'Activo' : 'Inactivo'}</span></div><p class="mu">${esc(p.desc)}</p><p>${p.servicios.map(i => `<span class="chip">${esc(get('servicios', i).nombre)}</span>`).join('')}</p><div class="row"><b>${money(p.precio)}</b>${adm ? `<button class="sm" data-a="tplan" data-id="${p.id}">${p.activo ? 'Desactivar' : 'Activar'}</button>` : ''}</div></div>`
  ).join('') + '</div>';
  h += '<h2>Catálogo de servicios</h2>' + tbl(['Servicio', 'Tipo', 'Duración'], S.servicios.map(s => [esc(s.nombre), s.tipo, s.dur + ' min']));
  if (adm) h += `<div class="card"><h3>Crear servicio</h3><div class="fg"><label>Nombre*<input id="sn"></label><label>Tipo*<select id="st">${TIPOS.map(t => `<option>${t}</option>`).join('')}</select></label><label>Duración (min)*<input id="sd" type="number" min="10" value="60"></label></div><button data-a="addserv">Crear servicio</button></div>
<div class="card"><h3>Crear plan</h3><div class="fg"><label>Nombre*<input id="pn"></label><label>Descripción<input id="pd"></label><label>Precio (COP)*<input id="pp" type="number" min="0"></label></div><p class="mu">Servicios incluidos*</p><p>${S.servicios.map(s => `<label class="chk"><input type="checkbox" class="ps" value="${s.id}">${esc(s.nombre)}</label>`).join('')}</p><button data-a="addplan">Crear plan</button></div>`;
  return h;
}

function vMascotas() {
  const adm = ui.rol === 'admin', ed = ui.edit ? get('mascotas', ui.edit) : null;
  const own = ui.rol === 'dueno' ? S.duenos.filter(d => d.id === ui.usr) : S.duenos;
  let h = '';
  if (adm) h += '<h2>Dueños</h2>' + tbl(['Nombre', 'Teléfono', 'Dirección', 'Mascotas'], S.duenos.map(d => [esc(d.nombre), esc(d.tel), esc(d.dir), S.mascotas.filter(m => m.dueno === d.id).length]));
  h += `<div class="card"><h3>Registrar dueño</h3><div class="fg"><label>Nombre*<input id="dn"></label><label>Teléfono*<input id="dt" inputmode="tel"></label><label>Dirección*<input id="dd"></label></div><button data-a="adddueno">Registrar dueño</button></div>`;
  h += '<h2>Mascotas</h2>' + tbl(['Nombre', 'Especie', 'Raza', 'Edad', 'Dueño', 'Condiciones', ''], misMasc().map(m => [esc(m.nombre), esc(m.especie), esc(m.raza), m.edad === '' ? '—' : m.edad, esc(get('duenos', m.dueno).nombre), esc(m.cond), `<button class="sm" data-a="editm" data-id="${m.id}">Editar</button>`]));
  h += `<div class="card"><h3>${ed ? 'Editar mascota' : 'Registrar mascota'}</h3><div class="fg"><label>Dueño*<select id="mo"${ed ? ' disabled' : ''}>${opt(own, d => d.nombre, ed ? ed.dueno : ui.usr)}</select></label><label>Nombre*<input id="mn" value="${esc(ed && ed.nombre)}"></label><label>Especie*<input id="me" placeholder="Canino, felino…" value="${esc(ed && ed.especie)}"></label><label>Raza<input id="mr" value="${esc(ed && ed.raza)}"></label><label>Edad (años)<input id="mg" type="number" min="0" value="${esc(ed && ed.edad)}"></label><label>Condiciones especiales<input id="mc" value="${esc(ed && ed.cond)}"></label></div><button data-a="savem">${ed ? 'Guardar cambios' : 'Registrar mascota'}</button>${ed ? ' <button class="sm" data-a="nedit">Cancelar edición</button>' : ''}</div>`;
  return h;
}

function vCitas() {
  const r = ui.rol, ms = misMasc();
  let h = '<h2>Citas</h2>';
  if (r !== 'personal') h += `<div class="card"><h3>Programar cita</h3><div class="fg"><label>Mascota*<select id="cm">${opt(ms, m => m.nombre + ' (' + get('duenos', m.dueno).nombre + ')')}</select></label><label>Plan<select id="cp" data-c="plan"><option value="">Servicio individual</option>${opt(S.planes.filter(p => p.activo), p => p.nombre)}</select></label><label>Servicio*<select id="cs">${sopt(S.servicios)}</select></label><label>Fecha*<input id="cf" type="date" min="${iso(new Date())}" value="${addD(2)}"></label><label>Hora de inicio*<input id="ch" type="time" min="08:00" max="18:00" value="09:00"></label></div><button data-a="addcita"${ms.length ? '' : ' disabled'}>Programar cita</button> <span class="mu">Atención de 08:00 a 18:00. El sistema valida disponibilidad y asigna personal.</span></div>`;
  h += tbl(['Fecha', 'Hora', 'Mascota', 'Servicio', 'Personal', 'Estado', ''], misCitas().map(c => {
    const m = get('mascotas', c.mascota), s = get('servicios', c.servicio), p = c.personal && get('personal', c.personal);
    let a = '';
    if (live(c) && r !== 'personal') a += `<button class="sm" data-a="repro" data-id="${c.id}">Reprogramar</button><button class="sm er" data-a="cancel" data-id="${c.id}">Cancelar</button>`;
    if (live(c) && r === 'admin')    a += `<button class="sm" data-a="asig" data-id="${c.id}">Asignar</button>`;
    if (c.estado === 'Programada' && r !== 'dueno') a += `<button class="sm ok" data-a="conf" data-id="${c.id}">Confirmar</button>`;
    return [c.fecha, m2t(c.ini) + '–' + m2t(c.fin), esc(m.nombre), esc(s.nombre), p ? esc(p.nombre) : '<i class="mu">Sin asignar</i>', badge(c.estado), a];
  }));
  return h;
}

function vTrat() {
  let h = '<h2>Tratamientos</h2>';
  if (ui.rol === 'personal') h += '<h3>Servicios pendientes de registro</h3>' + tbl(['Fecha', 'Hora', 'Mascota', 'Servicio', ''], misCitas().filter(live).map(c => [c.fecha, m2t(c.ini) + '–' + m2t(c.fin), esc(get('mascotas', c.mascota).nombre), esc(get('servicios', c.servicio).nombre), `<button class="sm" data-a="rtrat" data-id="${c.id}">Registrar tratamiento</button>`]));
  else if (ui.rol === 'admin') h += '<p class="mu">Para registrar un tratamiento ingrese como «Personal de servicio».</p>';
  const ms = misMasc();
  h += `<h3>Historial de tratamientos</h3><div class="fg"><label>Mascota<select id="fm" data-c="flt"><option value="">Todas</option>${opt(ms, m => m.nombre, ui.fm)}</select></label><label>Tipo de servicio<select id="ft" data-c="flt"><option value="">Todos</option>${TIPOS.map(t => `<option${t === ui.ft ? ' selected' : ''}>${t}</option>`).join('')}</select></label></div>`;
  const rows = S.tratamientos
    .map(t => ({ t, c: get('citas', t.cita) }))
    .filter(x => ms.some(m => m.id === x.c.mascota) && (!ui.fm || x.c.mascota === ui.fm) && (!ui.ft || get('servicios', x.c.servicio).tipo === ui.ft))
    .sort((a, b) => b.t.fecha.localeCompare(a.t.fecha));
  return h + tbl(['Fecha', 'Mascota', 'Tipo de servicio', 'Tratamiento', 'Observaciones', 'Profesional'], rows.map(x => {
    const s = get('servicios', x.c.servicio), p = get('personal', x.c.personal);
    return [x.t.fecha, esc(get('mascotas', x.c.mascota).nombre), s.tipo, esc(x.t.desc), esc(x.t.obs) || '—', p ? esc(p.nombre) : '—'];
  }));
}

function vPersonal() {
  const adm = ui.rol === 'admin', ps = ui.rol === 'personal' ? S.personal.filter(p => p.id === ui.usr) : S.personal;
  let h = '<h2>Personal de servicio</h2>' + tbl(['Nombre', 'Especialidad', 'Tipos de servicio', 'Tarifa/hora', 'Citas pendientes', 'Carga (h)', ''], ps.map(p => {
    const cs = S.citas.filter(c => c.personal === p.id && live(c));
    return [esc(p.nombre), esc(p.esp), p.tipos.join(', '), money(p.tarifa), cs.length, (cs.reduce((a, c) => a + c.fin - c.ini, 0) / 60).toFixed(1), `<button class="sm" data-a="agenda" data-id="${p.id}">Ver agenda</button>`];
  }));
  if (adm) h += `<div class="card"><h3>Registrar personal</h3><div class="fg"><label>Nombre*<input id="en"></label><label>Especialidad*<input id="ee"></label><label>Tarifa por hora (COP)*<input id="et" type="number" min="1"></label></div><p class="mu">Tipos de servicio que atiende*</p><p>${TIPOS.map(t => `<label class="chk"><input type="checkbox" class="et" value="${t}">${t}</label>`).join('')}</p><button data-a="addpers">Registrar personal</button></div>`;
  return h;
}

// ── Render principal ─────────────────────────────────────────────
function render() {
  const T = TABS[ui.rol];
  if (!T.includes(ui.tab)) ui.tab = T[0];
  $('#rol').value = ui.rol;
  $('#tabs').innerHTML = T.map(t => `<button class="tab${t === ui.tab ? ' on' : ''}" data-a="tab" data-id="${t}">${NAMES[t]}</button>`).join('');
  $('#usrw').innerHTML = ui.rol === 'dueno'
    ? `<select id="usr" data-c="usr">${opt(S.duenos,  d => d.nombre, ui.usr)}</select>`
    : ui.rol === 'personal'
      ? `<select id="usr" data-c="usr">${opt(S.personal, p => p.nombre, ui.usr)}</select>`
      : '';
  $('#view').innerHTML = { planes: vPlanes, mascotas: vMascotas, citas: vCitas, tratamientos: vTrat, personal: vPersonal }[ui.tab]();
}

// ── Acciones ─────────────────────────────────────────────────────
const A = {
  tplan(id)   { const p = get('planes', id); p.activo = !p.activo; done('Plan ' + (p.activo ? 'activado.' : 'desactivado.')); },
  addserv()   { const n = val('sn').trim(), d = +val('sd'); if (!n || !(d >= 10)) return toast('Indique nombre y una duración de al menos 10 min.', 'er'); S.servicios.push({ id: uid('s'), nombre: n, tipo: val('st'), dur: d }); done('Servicio creado.'); },
  addplan()   { const n = val('pn').trim(), sv = [...document.querySelectorAll('.ps:checked')].map(x => x.value); if (!n || val('pp') === '' || +val('pp') < 0) return toast('Nombre y precio son obligatorios.', 'er'); if (!sv.length) return toast('Seleccione al menos un servicio.', 'er'); S.planes.push({ id: uid('pl'), nombre: n, desc: val('pd').trim(), precio: +val('pp'), activo: true, servicios: sv }); done('Plan creado.'); },
  adddueno()  { const n = val('dn').trim(), t = val('dt').trim(), d = val('dd').trim(); if (!n || !t || !d) return toast('Complete nombre, teléfono y dirección.', 'er'); if (!/^\d{7,15}$/.test(t.replace(/\s/g, ''))) return toast('El teléfono debe tener entre 7 y 15 dígitos.', 'er'); const o = { id: uid('d'), nombre: n, tel: t, dir: d }; S.duenos.push(o); if (ui.rol === 'dueno') ui.usr = o.id; done('Dueño registrado.'); },
  savem() {
    const n = val('mn').trim(), e = val('me').trim(), g = val('mg');
    if (!n || !e) return toast('Nombre y especie son obligatorios.', 'er');
    if (g !== '' && +g < 0) return toast('La edad no puede ser negativa.', 'er');
    if (!val('mo')) return toast('Registre primero un dueño.', 'er');
    if (ui.edit) { Object.assign(get('mascotas', ui.edit), { nombre: n, especie: e, raza: val('mr').trim(), edad: g === '' ? '' : +g, cond: val('mc').trim() }); ui.edit = null; done('Mascota actualizada.'); }
    else { S.mascotas.push({ id: uid('m'), nombre: n, especie: e, raza: val('mr').trim(), edad: g === '' ? '' : +g, cond: val('mc').trim(), dueno: val('mo') }); done('Mascota registrada.'); }
  },
  editm(id)   { ui.edit = id; render(); scrollTo(0, document.body.scrollHeight); },
  nedit()     { ui.edit = null; render(); },
  addcita() {
    const mid = val('cm'), sv = get('servicios', val('cs'));
    if (!mid || !sv) return toast('Seleccione mascota y servicio.', 'er');
    const t = val('ch'), v = validar(sv, mid, val('cf'), t ? t2m(t) : NaN);
    if (!v.ok) return toast(v.msg, 'er');
    S.citas.push({ id: uid('c'), mascota: mid, servicio: sv.id, plan: val('cp'), fecha: val('cf'), ini: t2m(t), fin: v.e, personal: v.l[0].id, estado: 'Programada' });
    const d = get('duenos', get('mascotas', mid).dueno);
    done('Cita programada con ' + v.l[0].nombre + '. 📨 Confirmación enviada a ' + d.nombre + ' (' + d.tel + ').');
  },
  cancel(id)  { get('citas', id).estado = 'Cancelada'; done('Cita cancelada.'); },
  conf(id)    { get('citas', id).estado = 'Confirmada'; done('Cita confirmada.'); },
  repro(id)   { const c = get('citas', id); ui.dc = id; dlg('Reprogramar cita', `<div class="fg"><label>Nueva fecha*<input id="rf" type="date" min="${iso(new Date())}" value="${c.fecha}"></label><label>Nueva hora*<input id="rh" type="time" value="${m2t(c.ini)}"></label></div>`, 'saverepro'); },
  saverepro() { const c = get('citas', ui.dc), sv = get('servicios', c.servicio), t = val('rh'), v = validar(sv, c.mascota, val('rf'), t ? t2m(t) : NaN, c.id); if (!v.ok) return toast(v.msg, 'er'); Object.assign(c, { fecha: val('rf'), ini: t2m(t), fin: v.e, estado: 'Programada' }); if (!v.l.some(p => p.id === c.personal)) c.personal = v.l[0].id; done('Cita reprogramada.'); },
  asig(id)    { const c = get('citas', id), sv = get('servicios', c.servicio), l = libres(sv, c.fecha, c.ini, c.fin, c.id); ui.dc = id; dlg('Asignar personal', `<label>Personal disponible*<select id="ap">${opt(l, p => p.nombre, c.personal)}</select></label>${l.length ? '' : '<p class="mu">No hay personal disponible para ese horario.</p>'}`, l.length ? 'saveasig' : null); },
  saveasig()  { get('citas', ui.dc).personal = val('ap'); done('Personal asignado.'); },
  rtrat(id)   { ui.dc = id; dlg('Registrar tratamiento', `<label>Tratamiento realizado*<textarea id="td" rows="3"></textarea></label><br><label>Observaciones del profesional<textarea id="to" rows="2"></textarea></label>`, 'savetrat'); },
  savetrat()  { const d = val('td').trim(); if (!d) return toast('Describa el tratamiento realizado.', 'er'); const c = get('citas', ui.dc); S.tratamientos.push({ id: uid('t'), cita: c.id, fecha: c.fecha, desc: d, obs: val('to').trim() }); c.estado = 'Atendida'; done('Tratamiento registrado; la cita queda Atendida.'); },
  addpers()   { const n = val('en').trim(), e = val('ee').trim(), t = [...document.querySelectorAll('.et:checked')].map(x => x.value); if (!n || !e || !(+val('et') > 0)) return toast('Complete nombre, especialidad y tarifa.', 'er'); if (!t.length) return toast('Seleccione al menos un tipo de servicio.', 'er'); S.personal.push({ id: uid('e'), nombre: n, esp: e, tarifa: +val('et'), tipos: t }); done('Personal registrado.'); },
  agenda(id)  { const p = get('personal', id), cs = S.citas.filter(c => c.personal === id && live(c)).sort((a, b) => (a.fecha + m2t(a.ini)).localeCompare(b.fecha + m2t(b.ini))); dlg('Agenda de ' + esc(p.nombre), tbl(['Fecha', 'Hora', 'Mascota', 'Servicio'], cs.map(c => [c.fecha, m2t(c.ini) + '–' + m2t(c.fin), esc(get('mascotas', c.mascota).nombre), esc(get('servicios', c.servicio).nombre)])), null); },
  reset()     { seed(); ui.usr = defUsr(ui.rol); ui.edit = null; done('Datos de demostración restablecidos.'); }
};

// ── Event listeners ──────────────────────────────────────────────
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (!b) return;
  const a = b.dataset.a;
  if (a === 'tab')   { ui.tab = b.dataset.id; ui.edit = null; render(); }
  else if (a === 'close') $('#dlg').close();
  else if (A[a]) A[a](b.dataset.id);
});

document.addEventListener('change', e => {
  const c = e.target.dataset.c;
  if      (c === 'rol')  { ui.rol = e.target.value; ui.tab = TABS[ui.rol][0]; ui.usr = defUsr(ui.rol); ui.edit = null; render(); }
  else if (c === 'usr')  { ui.usr = e.target.value; render(); }
  else if (c === 'plan') { $('#cs').innerHTML = sopt(servsDe(e.target.value)); }
  else if (c === 'flt')  { ui.fm = val('fm'); ui.ft = val('ft'); render(); }
});

// ── Inicio ───────────────────────────────────────────────────────
try { S = JSON.parse(store.get()); } catch (e) { S = null; }
if (!S || !S.servicios) seed();
render();

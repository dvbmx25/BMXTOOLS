(function () {
  const wrapper     = document.getElementById('imageWrapper');
  const staticImage = document.getElementById('staticImage');
  const mapId       = wrapper.dataset.mapId || 'default';

  const sections = {
    race:     { el: document.getElementById('section-race'),     list: document.getElementById('list-race'),     count: document.getElementById('count-race'),     vis: document.getElementById('vis-race') },
    track:    { el: document.getElementById('section-track'),    list: document.getElementById('list-track'),    count: document.getElementById('count-track'),    vis: document.getElementById('vis-track') },
    dirt:     { el: document.getElementById('section-dirt'),     list: document.getElementById('list-dirt'),     count: document.getElementById('count-dirt'),     vis: document.getElementById('vis-dirt') },
    pump:     { el: document.getElementById('section-pump'),     list: document.getElementById('list-pump'),     count: document.getElementById('count-pump'),     vis: document.getElementById('vis-pump') },
    bikepark: { el: document.getElementById('section-bikepark'), list: document.getElementById('list-bikepark'), count: document.getElementById('count-bikepark'), vis: document.getElementById('vis-bikepark') }
  };

  let pins = [];
  let nextId = 0;
  let activePopupPinId = null;
  let activeSection = 'race';

  const sectionVisibility = {
    race: true,
    track: true,
    dirt: true,
    pump: true,
    bikepark: true
  };

  /* ---------- dropdown option sets (races) ---------- */
  const AGE_OPTIONS_STANDARD = [
    '5 & Under', '6', '7', '8', '9', '10', '11', '12', '13',
    '14', '15', '16', '17-18', '19-27', '28-35',
    '36-40', '41-45', '46 & Over'
  ];

  const AGE_OPTIONS_BOYS_CRUISER = [
    '7 & Under', '8', '9', '10', '11', '12', '13',
    '14', '15', '16', '17-20', '21-25', '26-30',
    '31-35', '36-40', '41-45', '46-50', '51-55',
    '56-60', '61 & Over'
  ];

  const AGE_OPTIONS_GIRLS_CRUISER = [
    '10 & Under', '11-13', '14-16', '17-20', '21-25', '26-30',
    '31-35', '36-40', '41-45', '46-50', '51-55', '56 & Over'
  ];

  function buildOptions(list, selected, placeholder) {
    let html = `<option value="">${placeholder || 'Select…'}</option>`;
    list.forEach(v => {
      const safe = escapeHtml(v);
      html += `<option value="${safe}"${v === selected ? ' selected' : ''}>${safe}</option>`;
    });
    return html;
  }

  /* ---------- helpers ---------- */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /* ---------- pin SVG builder ---------- */
  function pinSvg(kind) {
    const config = {
      race:     { grad: 'pinGradientRed',    stops: '<stop stop-color="#FF7B9C"/><stop offset="1" stop-color="#FF3B6F"/>' },
      track:    { grad: 'pinGradientBlue',   stops: '<stop stop-color="#7CC3FF"/><stop offset="1" stop-color="#1E7BE0"/>' },
      dirt:     { grad: 'pinGradientGreen',  stops: '<stop stop-color="#86EFAC"/><stop offset="1" stop-color="#22C55E"/>' },
      pump:     { grad: 'pinGradientYellow', stops: '<stop stop-color="#FDE68A"/><stop offset="1" stop-color="#EAB308"/>' },
      bikepark: { grad:

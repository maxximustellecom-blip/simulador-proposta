(function () {
  function init() {
  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  function isActive(name) { return page === (name + '.html'); }
  var authRaw = localStorage.getItem('authUser');
  var auth = {};
  try { auth = JSON.parse(authRaw || '{}'); } catch {}
  var isAdmin = String((auth && auth.role) || '').toLowerCase() === 'admin';
  var userName = (auth && auth.name) ? String(auth.name) : 'Usuário';
  var topbar = document.querySelector('.topbar');
  if (topbar && topbar.parentNode) topbar.parentNode.removeChild(topbar);
  var sidebar = document.querySelector('.sidebar');
  if (sidebar && sidebar.parentNode) sidebar.parentNode.removeChild(sidebar);
  var bottomnav = document.querySelector('.bottomnav');
  if (bottomnav && bottomnav.parentNode) bottomnav.parentNode.removeChild(bottomnav);
  var headerHtml =
    '<header class="topbar">' +
      '<div class="topbar-inner">' +
        '<div class="brand">' +
          '<div class="brand-badge"></div>' +
          '<div>MAXXIMUS TELECOM</div>' +
        '</div>' +
        '<button id="themeToggle" class="theme-toggle" type="button" title="Alternar tema"><i class="icon-sun" data-lucide="sun"></i><i class="icon-moon" data-lucide="moon"></i></button>' +
        '<div class="user">' +
          '<button id="userMenuBtn" class="user-btn">' +
            '<span id="userNameLabel">Usuário</span>' +
            '<span>▾</span>' +
          '</button>' +
          '<div id="userMenu" class="user-menu">' +
            '<a id="logoutBtn" href="#">Sair</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</header>';
  var simOpen = isActive('simular') || isActive('historico-simulacoes');
  var sidebarHtml =
    '<nav class="sidebar">' +
      '<div class="sidebar-inner">' +
        '<div class="brand-mini"><i data-lucide="zap"></i><span>Maxximus</span></div>' +
        '<div class="nav-title">Principal</div>' +
        '<div class="nav-group">' +
          '<a href="dashboard.html" class="nav-link' + (isActive('dashboard') ? ' active' : '') + '"><i data-lucide="layout-dashboard"></i><span>Dashboard</span></a>' +
          '<a href="clientes.html" class="nav-link' + (isActive('clientes') ? ' active' : '') + '"><i data-lucide="building-2"></i><span>Clientes</span></a>' +
          '<a href="negociar.html" class="nav-link' + (isActive('negociar') ? ' active' : '') + '"><i data-lucide="handshake"></i><span>Negociação</span></a>' +
        '</div>' +
        '<div class="nav-title">Simulação</div>' +
        '<button id="simulacaoToggle" class="nav-dropdown' + (simOpen ? ' open' : '') + '" type="button">' +
          '<div class="left"><i data-lucide="layers"></i><span>Simulação</span></div>' +
          '<div class="chev"><i data-lucide="chevron-down"></i></div>' +
        '</button>' +
        '<div id="simulacaoMenu" class="nav-subgroup" style="display:' + (simOpen ? 'flex' : 'none') + ';">' +
          '<a href="simular.html" class="nav-sublink' + (isActive('simular') ? ' active' : '') + '"><i data-lucide="calculator"></i><span>Simular</span></a>' +
          '<a href="historico-simulacoes.html" class="nav-sublink' + (isActive('historico-simulacoes') ? ' active' : '') + '"><i data-lucide="list"></i><span>Histórico</span></a>' +
        '</div>' +
        '<div class="nav-title" id="adminTitle" style="display:' + (isAdmin ? 'block' : 'none') + '">Admin</div>' +
        '<a id="navUsers" href="usuarios.html" class="nav-link' + (isActive('usuarios') ? ' active' : '') + '" style="display:' + (isAdmin ? 'flex' : 'none') + '"><i data-lucide="users"></i><span>Usuários</span></a>' +
      '</div>' +
    '</nav>';
  var bottomHtml =
    '<nav class="bottomnav">' +
      '<a href="dashboard.html" class="' + (isActive('dashboard') ? 'active' : '') + '"><i data-lucide="layout-dashboard"></i><span class="label">Dashboard</span></a>' +
      '<a href="historico-simulacoes.html" class="' + (isActive('historico-simulacoes') ? 'active' : '') + '"><i data-lucide="list"></i><span class="label">Histórico</span></a>' +
      '<a href="simular.html" class="' + (isActive('simular') ? 'active' : '') + '"><i data-lucide="calculator"></i><span class="label">Simular</span></a>' +
      '<a href="clientes.html" class="' + (isActive('clientes') ? 'active' : '') + '"><i data-lucide="building-2"></i><span class="label">Clientes</span></a>' +
      '<a id="bottomUsers" href="usuarios.html" style="display:' + (isAdmin ? 'inline-flex' : 'none') + ';" class="' + (isActive('usuarios') ? 'active' : '') + '"><i data-lucide="users"></i><span class="label">Usuários</span></a>' +
    '</nav>';
  var headEl = document.getElementsByTagName('head')[0];
  if (headEl && !document.querySelector('link[href="style.css"]')) {
    var linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'style.css';
    headEl.appendChild(linkEl);
  }
  document.body.insertAdjacentHTML('afterbegin', headerHtml + sidebarHtml);
  document.body.insertAdjacentHTML('beforeend', bottomHtml);
  var nameEl = document.getElementById('userNameLabel');
  if (nameEl) nameEl.textContent = isAdmin ? (userName + ' • Admin') : userName;
  var navUsersEl = document.getElementById('navUsers');
  if (navUsersEl) navUsersEl.style.display = isAdmin ? 'flex' : 'none';
  var bottomUsersEl = document.getElementById('bottomUsers');
  if (bottomUsersEl) bottomUsersEl.style.display = isAdmin ? 'inline-flex' : 'none';
  var menuBtn = document.getElementById('userMenuBtn');
  var menuEl = document.getElementById('userMenu');
  if (menuBtn && menuEl) {
    menuBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var s = window.getComputedStyle(menuEl).display;
      menuEl.style.display = s === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', function (e) {
      if (!menuEl.contains(e.target) && !menuBtn.contains(e.target)) {
        menuEl.style.display = 'none';
      }
    });
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  }
  var saved = localStorage.getItem('theme');
  var prefersLight = false;
  try { prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches; } catch {}
  applyTheme(saved ? saved : (prefersLight ? 'light' : 'dark'));
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('authUser');
    });
  }
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
  var simBtn = document.getElementById('simulacaoToggle');
  var simMenu = document.getElementById('simulacaoMenu');
  if (simBtn && simMenu) {
    simBtn.addEventListener('click', function () {
      var isOpen = simBtn.classList.contains('open');
      if (isOpen) {
        simBtn.classList.remove('open');
        simMenu.style.display = 'none';
      } else {
        simBtn.classList.add('open');
        simMenu.style.display = 'flex';
      }
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    });
  }
  try {
    var tables = document.querySelectorAll('table');
    tables.forEach(function (tbl) {
      var heads = Array.prototype.map.call(tbl.querySelectorAll('thead th'), function (th) {
        return String(th.textContent || '').trim();
      });
      var rows = tbl.querySelectorAll('tbody tr');
      Array.prototype.forEach.call(rows, function (tr) {
        var cells = tr.querySelectorAll('td');
        Array.prototype.forEach.call(cells, function (td, idx) {
          if (!td.getAttribute('data-label')) {
            td.setAttribute('data-label', heads[idx] || '');
          }
        });
      });
    });
  } catch {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

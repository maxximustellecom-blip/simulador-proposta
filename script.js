(function () {
  function init() {
  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  function isActive(name) { return page === (name + '.html'); }
  var authRaw = localStorage.getItem('authUser');
  var auth = {};
  try { auth = JSON.parse(authRaw || '{}'); } catch {}
  try {
    if (auth && auth.remember === false && !sessionStorage.getItem('authUserSessionOnly')) {
      localStorage.removeItem('authUser');
      auth = {};
      authRaw = null;
    }
  } catch {}
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
      '<div style="display:flex; align-items:center; gap:0.75rem;">' +
        '<button id="themeToggle" class="theme-toggle" type="button" title="Alternar tema"><i class="icon-sun" data-lucide="sun"></i><i class="icon-moon" data-lucide="moon"></i></button>' +
        '<button id="notificationDisableBtn" class="btn btn-ghost" type="button" title="Desativar alerta" style="display:none; border-color: rgba(239,68,68,0.35); color:#FCA5A5;"><i data-lucide="bell-off"></i><span>Desativar alerta</span></button>' +
        '<div class="notification-container">' +
          '<button id="notificationBtn" class="notification-btn" type="button" title="Notificações"><i data-lucide="bell"></i></button>' +
          '<div id="notificationMenu" class="notification-menu">' +
            '<div class="notification-header">' +
              '<span>Notificações</span>' +
              '<button id="notificationSoundBtn" class="btn btn-ghost btn-icon" type="button" title="Parar som" style="display:none; padding:0.35rem; border-radius:10px;"><i data-lucide="volume-x"></i></button>' +
            '</div>' +
            '<div id="notificationList" class="notification-list">' +
              '<div style="padding:1rem;text-align:center;color:var(--muted)">Carregando...</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
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
    '</div>' +
  '</header>';
  var simOpen = isActive('simular') || isActive('historico-simulacoes');
  var adminOpen = isActive('usuarios') || isActive('perfis-acesso') || isActive('regioes') || isActive('categorias') || isActive('produtos') || isActive('categoria-customizada') || isActive('produto-customizado');
  var sidebarHtml =
    '<nav class="sidebar">' +
      '<div class="sidebar-inner">' +
        '<div class="sidebar-logo">' +
          '<img class="telecom-logo telecom-logo--light" src="TELECOM%20PRETA.png" alt="TELECOM">' +
          '<img class="telecom-logo telecom-logo--dark" src="TELECOM%20BRANCA.png" alt="TELECOM">' +
          '<div class="sidebar-logo-text">' +
            '<div class="sidebar-logo-title">MAXXIMUS</div>' +
            '<div class="sidebar-logo-subtitle">TELECOM</div>' +
          '</div>' +
        '</div>' +
        '<div class="nav-title" style="display: none;">Principal</div>' +
        '<div class="nav-group">' +
          '<a href="quadro-vendas.html" class="nav-link' + (isActive('quadro-vendas') ? ' active' : '') + '"><i data-lucide="layout-dashboard"></i><span>Quadro de Vendas</span></a>' +
          '<a href="agenda.html" class="nav-link' + (isActive('agenda') ? ' active' : '') + '"><i data-lucide="calendar"></i><span>Agenda</span></a>' +
          '<a href="meus-leads.html" class="nav-link' + (isActive('meus-leads') ? ' active' : '') + '" style="display:' + (isAdmin ? 'none' : 'flex') + '"><i data-lucide="file-text"></i><span>Meus Leads</span></a>' +
          '<a href="pedido-vendas.html" class="nav-link' + (isActive('pedido-vendas') ? ' active' : '') + '" style="display:' + (isAdmin ? 'flex' : 'none') + '"><i data-lucide="shopping-cart"></i><span>Vendas</span></a>' +
          '<a href="leads.html" class="nav-link' + (isActive('leads') ? ' active' : '') + '" style="display:' + (isAdmin ? 'flex' : 'none') + '"><i data-lucide="file-spreadsheet"></i><span>Leads</span></a>' +
          '<a href="clientes.html" class="nav-link' + (isActive('clientes') ? ' active' : '') + '"><i data-lucide="building-2"></i><span>Clientes</span></a>' +
          '<a href="negociar.html" class="nav-link' + (isActive('negociar') ? ' active' : '') + '"><i data-lucide="handshake"></i><span>Propostas</span></a>' +
          '<a href="top-sellers.html" style="display: none;" class="nav-link' + (isActive('top-sellers') ? ' active' : '') + '"><i data-lucide="star"></i><span>Top Sellers</span></a>' +
          '<a href="quadro-vendas.html" style="display: none;" class="nav-link' + (isActive('quadro-vendas') ? ' active' : '') + '"><i data-lucide="bar-chart-3"></i><span>Quadro de Vendas</span></a>' +
          '<a href="agenda.html" style="display: none;" class="nav-link' + (isActive('agenda') ? ' active' : '') + '"><i data-lucide="calendar"></i><span>Agenda</span></a>' +
        '</div>' +
        '<div class="nav-title" style="display: none;">Simulação</div>' +
        '<button id="simulacaoToggle" class="nav-dropdown' + (simOpen ? ' open' : '') + '" type="button" style="display: none;">' +
          '<div class="left"><i data-lucide="layers"></i><span>Simulação</span></div>' +
          '<div class="chev"><i data-lucide="chevron-down"></i></div>' +
        '</button>' +
        '<div id="simulacaoMenu" class="nav-subgroup" style="display:' + (simOpen ? 'flex' : 'none') + ';">' +
          '<a href="simular.html" class="nav-sublink' + (isActive('simular') ? ' active' : '') + '"><i data-lucide="calculator"></i><span>Simular</span></a>' +
          '<a href="historico-simulacoes.html" class="nav-sublink' + (isActive('historico-simulacoes') ? ' active' : '') + '"><i data-lucide="list"></i><span>Histórico</span></a>' +
        '</div>' +
        '<div class="nav-title" id="adminTitle" style="display:' + (isAdmin ? 'none' : 'none') + '">Admin</div>' +
        '<button id="adminToggle" class="nav-dropdown' + (adminOpen ? ' open' : '') + '" type="button" style="display:' + (isAdmin ? 'flex' : 'none') + ';">' +
          '<div class="left"><i data-lucide="shield-check"></i><span>Configurações</span></div>' +
          '<div class="chev"><i data-lucide="chevron-down"></i></div>' +
        '</button>' +
        '<div id="adminMenu" class="nav-subgroup" style="display:' + ((isAdmin && adminOpen) ? 'flex' : 'none') + ';">' +
          '<a href="regioes.html" class="nav-sublink' + (isActive('regioes') ? ' active' : '') + '"><i data-lucide="map"></i><span>Regiões</span></a>' +
          '<a href="categorias.html" class="nav-sublink' + (isActive('categorias') ? ' active' : '') + '"><i data-lucide="tags"></i><span>Padrão • Planos</span></a>' +
          '<a href="produtos.html" class="nav-sublink' + (isActive('produtos') ? ' active' : '') + '"><i data-lucide="shopping-bag"></i><span>Padrão • Ofertas</span></a>' +
          '<a href="categoria-customizada.html" class="nav-sublink' + (isActive('categoria-customizada') ? ' active' : '') + '"><i data-lucide="tag"></i><span>Customizada • Planos</span></a>' +
          '<a href="produto-customizado.html" class="nav-sublink' + (isActive('produto-customizado') ? ' active' : '') + '"><i data-lucide="shopping-cart"></i><span>Customizada • Ofertas</span></a>' +
          '<a href="usuarios.html" class="nav-sublink' + (isActive('usuarios') ? ' active' : '') + '"><i data-lucide="users"></i><span>Usuários</span></a>' +
          '<a href="perfis-acesso.html" class="nav-sublink' + (isActive('perfis-acesso') ? ' active' : '') + '"><i data-lucide="shield"></i><span>Perfis de Acesso</span></a>' +
        '</div>' +
      '</div>' +
    '</nav>';
  var bottomHtml =
    '<nav class="bottomnav">' +
      '<a href="quadro-vendas.html" class="' + (isActive('quadro-vendas') ? 'active' : '') + '"><i data-lucide="layout-dashboard"></i><span class="label">Dashboard</span></a>' +
      '<a href="meus-leads.html" style="display:' + (isAdmin ? 'none' : 'inline-flex') + ';" class="' + (isActive('meus-leads') ? 'active' : '') + '"><i data-lucide="file-text"></i><span class="label">Leads</span></a>' +
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
  var logoutModalHtml =
    '<div id="logoutModal" class="modal">' +
      '<div class="modal-card">' +
        '<div class="modal-header">' +
          '<div class="modal-title">Confirmar saída</div>' +
          '<button id="logoutClose" class="btn btn-ghost btn-icon" type="button" title="Fechar"><i data-lucide="x"></i></button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div style="display:flex; align-items:center; gap:0.6rem;">' +
            '<i data-lucide="power"></i>' +
            '<div>' +
              '<div class="label">Deseja sair da aplicação?</div>' +
              '<div style="color: var(--muted); font-size: 0.9rem;">Você precisará fazer login novamente para retornar.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-actions">' +
          '<button id="logoutCancel" class="btn" type="button">Cancelar</button>' +
          '<button id="logoutConfirm" class="btn btn-primary" type="button">Sair</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.insertAdjacentHTML('beforeend', logoutModalHtml);
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
      var nm = document.getElementById('notificationMenu');
      if (nm) nm.classList.remove('show');
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
  var logoutModal = document.getElementById('logoutModal');
  var logoutClose = document.getElementById('logoutClose');
  var logoutCancel = document.getElementById('logoutCancel');
  var logoutConfirm = document.getElementById('logoutConfirm');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (logoutModal) {
        logoutModal.classList.add('show');
        if (menuEl) menuEl.style.display = 'none';
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      }
    });
  }
  if (logoutClose && logoutModal) {
    logoutClose.addEventListener('click', function () {
      logoutModal.classList.remove('show');
    });
  }
  if (logoutCancel && logoutModal) {
    logoutCancel.addEventListener('click', function () {
      logoutModal.classList.remove('show');
    });
  }
  if (logoutConfirm && logoutModal) {
    logoutConfirm.addEventListener('click', function () {
      logoutModal.classList.remove('show');
      localStorage.removeItem('authUser');
      try { sessionStorage.removeItem('authUserSessionOnly'); } catch {}
      window.location.href = 'login.html';
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
  var adminBtn = document.getElementById('adminToggle');
  var adminMenu = document.getElementById('adminMenu');
  if (adminBtn && adminMenu) {
    adminBtn.addEventListener('click', function () {
      var isOpen = adminBtn.classList.contains('open');
      if (isOpen) {
        adminBtn.classList.remove('open');
        adminMenu.style.display = 'none';
      } else {
        adminBtn.classList.add('open');
        adminMenu.style.display = 'flex';
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

  // Notification Logic
  var notifBtn = document.getElementById('notificationBtn');
  var notifMenu = document.getElementById('notificationMenu');
  var notifList = document.getElementById('notificationList');
  var notifSoundBtn = document.getElementById('notificationSoundBtn');
  var notifDisableBtn = document.getElementById('notificationDisableBtn');
  var notifSound = null;
  var activeAlertKey = null;
  var activeAlertAtMs = null;
  var dismissedAlertKeys = {};
  var soundNeedsGesture = false;
  var soundUnlockBound = false;

  function setDisableButtonVisible(isVisible) {
    if (!notifDisableBtn) return;
    notifDisableBtn.style.display = isVisible ? 'inline-flex' : 'none';
    if (isVisible && window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }

  function setSoundButton(mode) {
    if (!notifSoundBtn) return;
    if (mode === 'hidden') {
      notifSoundBtn.style.display = 'none';
      return;
    }
    notifSoundBtn.style.display = 'inline-flex';
    if (mode === 'enable') {
      notifSoundBtn.title = 'Ativar som';
      notifSoundBtn.innerHTML = '<i data-lucide="volume-2"></i>';
    } else {
      notifSoundBtn.title = 'Parar som';
      notifSoundBtn.innerHTML = '<i data-lucide="volume-x"></i>';
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }

  function getApptMs(item) {
    try {
      var d = String(item && item.date ? item.date : '');
      var tRaw = String(item && item.time ? item.time : '');
      if (!d) return null;
      var t = tRaw ? tRaw.slice(0, 8) : '';
      if (!t) return null;
      if (/^\d{2}:\d{2}$/.test(t)) t = t + ':00';
      var ms = new Date(d + 'T' + t).getTime();
      return isFinite(ms) ? ms : null;
    } catch {
      return null;
    }
  }

  function getAlertCandidate(data) {
    var now = Date.now();
    var best = null;
    var bestDiff = null;
    for (var i = 0; i < (data || []).length; i++) {
      var item = data[i];
      if (item && item.finalizado) continue;
      var ms = getApptMs(item);
      if (!ms) continue;
      var diffMs = ms - now;
      if (diffMs <= 0) continue;
      if (diffMs > 180000) continue;
      var key = String(item.id || (String(item.date || '') + '_' + String(item.time || '') + '_' + String(item.title || '')));
      if (dismissedAlertKeys[key]) continue;
      if (bestDiff === null || diffMs < bestDiff) {
        best = { item: item, key: key, atMs: ms, diffMs: diffMs };
        bestDiff = diffMs;
      }
    }
    return best;
  }

  async function startSoundFor(candidate) {
    if (!candidate) return;
    if (activeAlertKey === candidate.key && notifSound && !notifSound.paused) return;
    activeAlertKey = candidate.key;
    activeAlertAtMs = candidate.atMs;
    setDisableButtonVisible(true);

    if (!notifSound) {
      notifSound = new Audio('som.mp3');
      notifSound.loop = true;
    }
    soundNeedsGesture = false;
    setSoundButton('stop');

    try {
      notifSound.currentTime = 0;
      await notifSound.play();
      setSoundButton('stop');
    } catch (e) {
      soundNeedsGesture = true;
      setSoundButton('enable');
      if (!soundUnlockBound) {
        soundUnlockBound = true;
        var unlock = function () {
          soundUnlockBound = false;
          if (soundNeedsGesture && activeAlertKey && activeAlertAtMs) {
            startSoundFor({ key: activeAlertKey, atMs: activeAlertAtMs });
          }
        };
        try { document.addEventListener('click', unlock, { once: true, capture: true }); } catch {}
        try { document.addEventListener('keydown', unlock, { once: true, capture: true }); } catch {}
      }
    }
  }

  function stopSound(opts) {
    var isManual = opts && opts.manual;
    if (isManual && activeAlertKey) dismissedAlertKeys[activeAlertKey] = true;
    if (notifSound) {
      try { notifSound.pause(); } catch {}
      try { notifSound.currentTime = 0; } catch {}
    }
    activeAlertKey = null;
    activeAlertAtMs = null;
    soundNeedsGesture = false;
    setSoundButton('hidden');
    setDisableButtonVisible(false);
  }

  function tickAlert(data) {
    var now = Date.now();
    if (activeAlertAtMs && now >= activeAlertAtMs) {
      stopSound({ manual: false });
      return;
    }
    var candidate = getAlertCandidate(data || []);
    if (!candidate) return;
    startSoundFor(candidate);
  }

  async function loadNotifications() {
    if (!notifList) return;
    try {
      var today = new Date().toISOString().split('T')[0];
      var response = await fetch('https://others-maxximus-backend.pvuzyy.easypanel.host/appointments?from=' + today + '&to=' + today);
      if (!response.ok) throw new Error('Erro ao buscar');
      var data = await response.json();
      tickAlert(data || []);
      
      if (data.length === 0) {
        notifList.innerHTML = '<div class="notification-empty">Nenhum compromisso para hoje.</div>';
        if (notifBtn) notifBtn.classList.remove('has-new');
      } else {
        if (notifBtn) notifBtn.classList.add('has-new');
        var html = '';
        data.forEach(function(item) {
          var time = item.time ? item.time.substring(0, 5) : '';
          html += '<div class="notification-item">' +
                    '<div class="notif-time">' + time + '</div>' +
                    '<div class="notif-content">' +
                      '<div class="notif-title">' + item.title + '</div>' +
                      '<div class="notif-desc">' + (item.description || '') + '</div>' +
                    '</div>' +
                  '</div>';
        });
        notifList.innerHTML = html;
      }
    } catch (e) {
      if (notifList) notifList.innerHTML = '<div class="notification-empty">Erro ao carregar notificações.</div>';
      console.error(e);
    }
  }

  if (notifBtn && notifMenu) {
    // Load on init
    loadNotifications();
    try {
      setInterval(loadNotifications, 30000);
    } catch {}

    if (notifDisableBtn) {
      notifDisableBtn.addEventListener('click', function (e) {
        e.preventDefault();
        stopSound({ manual: true });
      });
    }

    if (notifSoundBtn) {
      notifSoundBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (soundNeedsGesture) {
          if (activeAlertKey && activeAlertAtMs) {
            startSoundFor({ key: activeAlertKey, atMs: activeAlertAtMs });
          }
          return;
        }
        stopSound({ manual: true });
      });
    }

    notifBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isShow = notifMenu.classList.contains('show');
      if (isShow) {
        notifMenu.classList.remove('show');
      } else {
        // Close other menus
        if (menuEl) menuEl.style.display = 'none';
        notifMenu.classList.add('show');
        loadNotifications(); // Refresh on open
      }
    });

    document.addEventListener('click', function(e) {
      if (!notifMenu.contains(e.target) && !notifBtn.contains(e.target)) {
        notifMenu.classList.remove('show');
      }
    });
  }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

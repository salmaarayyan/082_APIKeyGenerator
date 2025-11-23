(function(){
  // helpers
  function rnd(len=48){
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i=0;i<len;i++) s += chars[Math.floor(Math.random()*chars.length)];
    return s;
  }
  function el(id){ return document.getElementById(id); }
  function fmtDate(d){ if(!d) return '-'; const dt=new Date(d); return dt.toLocaleString(); }
  function token(){ return localStorage.getItem('admin_token'); }
  function setToken(t){ if(t) localStorage.setItem('admin_token', t); else localStorage.removeItem('admin_token'); }

  // BASE for backend
  const _origin = window.location.origin || '';
  const BASE = (_origin === 'null' || _origin.startsWith('file:') || !_origin.includes(':3000')) ? 'http://localhost:3000' : _origin;

  function showModal({ title, expiryText, bodyHtml } = {}) {
    const modal = document.getElementById('modal');
    if (!modal) return;
    const titleEl = document.getElementById('modal_title');
    const expEl = document.getElementById('modal_exp_date');
    const bodyEl = document.getElementById('modal_body');
    if (title && titleEl) titleEl.textContent = title;
    if (expiryText && expEl) expEl.textContent = expiryText;
    if (bodyHtml && bodyEl) bodyEl.innerHTML = bodyHtml;
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    const ok = document.getElementById('modal_ok');
    if (ok) ok.focus();
  }

  function closeModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
  }

  // modal close handlers
  document.addEventListener('click', (e) => {
    if (!e.target) return;
    if (e.target.id === 'modal_backdrop' || e.target.id === 'modal_close' || e.target.id === 'modal_ok') closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  function initUserPage() {
    const genBtn = el('gen'),
          saveBtn = el('save'),
          apitxt = el('apikey'),
          status = el('status'),
          msg = el('msg'),
          copyBtn = el('copy');

    if (!genBtn || !saveBtn || !apitxt) return;

    genBtn.addEventListener('click', () => {
      const k = rnd(48);
      apitxt.value = k;
      status.innerText = 'Status: valid (new key)';
      status.className = 'badge';
      msg.innerText = '';
    });

    copyBtn.addEventListener('click', async () => {
      if (!apitxt.value) return;
      try {
        await navigator.clipboard.writeText(apitxt.value);
        msg.style.color = 'green';
        msg.innerText = 'Copied to clipboard';
      } catch (e) {
        msg.style.color = 'red';
        msg.innerText = 'Copy failed';
      }
      setTimeout(()=>{ msg.innerText=''; }, 1800);
    });

    saveBtn.addEventListener('click', async () => {
      try {
        const firstName = el('first_name').value.trim();
        const lastName = el('last_name').value.trim();
        const email = el('email').value.trim();
        const apikey = apitxt.value.trim();
        if (!firstName || !lastName || !apikey) {
          msg.style.color = 'red';
          msg.innerText = 'first/last/apikey required';
          return;
        }

        const url = BASE + '/api/users';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, email, apikey })
        });

        const body = await res.json().catch(()=>({}));
        if (!res.ok) {
          msg.style.color = 'red';
          msg.innerText = body.message || 'Server error';
          console.error('POST /api/users failed', res.status, body);
          return;
        }

        // compute expiry and show modal (do not change layout)
        const created = body.apikey?.createdAt ? new Date(body.apikey.createdAt) : new Date();
        const exp = new Date(created); exp.setDate(exp.getDate() + 30);

        showModal({
          title: 'API Key berhasil disimpan! ✔',
          expiryText: exp.toLocaleString(),
          bodyHtml:
            '<ul>' +
            '<li>API key valid jika umur &lt; 30 hari dan belum dinonaktifkan oleh admin.</li>' +
            '<li>Admin dapat melihat, menonaktifkan, atau menghapus API key di dashboard.</li>' +
            '</ul>'
        });

        status.innerText = 'Status: ' + (body.apikey?.status || 'valid');
        msg.style.color = 'green';
        msg.innerText = 'Saved. API key tersimpan.';
      } catch (err) {
        msg.style.color = 'red';
        msg.innerText = 'Network error (lihat console)';
        console.error('Network error when POST /api/users', err);
      }
    });
  }

  async function adminLogin(){
    const email = el('admin_email')?.value?.trim() || '';
    const password = el('admin_password')?.value?.trim() || '';
    const msg = el('admin_msg');
    if (!email || !password){ if (msg){ msg.style.color='red'; msg.innerText='email & password required'; } return; }

    const url = BASE + '/api/admin/login';
    try {
      const res = await fetch(url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      });
      const body = await res.json().catch(()=>({}));
      if (!res.ok){
        if (msg){ msg.style.color='red'; msg.innerText = body.message || 'Login failed'; }
        console.error('POST /api/admin/login failed', res.status, body);
        return;
      }
      localStorage.setItem('admin_token', body.token);
      if (msg){ msg.style.color='green'; msg.innerText='Login berhasil'; }
      setTimeout(()=>{ window.location.href = BASE + '/dashboard.html'; },500);
    } catch(e){
      if (msg){ msg.style.color='red'; msg.innerText='Network error (lihat console)'; }
      console.error('Network error when POST /api/admin/login', e);
    }
  }

  async function loadDashboard(){
    const tbl = document.querySelector('#users_table tbody');
    const dashMsg = el('dash_msg');
    if (!tbl) return;
    tbl.innerHTML = '';
    if (dashMsg) dashMsg.innerText = 'Loading...';
    try {
      const t = token();
      if (!t) { if (dashMsg){ dashMsg.style.color='red'; dashMsg.innerText='Not authenticated. Please login.'; } return; }
      const res = await fetch(BASE + '/api/admin/users', { headers: { Authorization: 'Bearer ' + t }});
      const body = await res.json().catch(()=>({}));
      if (!res.ok){ if (dashMsg){ dashMsg.style.color='red'; dashMsg.innerText = body.message || 'Failed to load'; } console.error('GET /api/admin/users failed', res.status, body); return; }
      if (dashMsg) dashMsg.innerText = '';
      body.users.forEach(u => {
        u.apiKeys.forEach(k => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${u.firstName} ${u.lastName}</td>
            <td>${u.email || '-'}</td>
            <td><code class="muted">${k.key}</code></td>
            <td>${fmtDate(k.createdAt)}</td>
            <td class="${k.status === 'valid' ? 'status-valid' : 'status-invalid'}">${k.status}</td>
            <td>
              <button class="btn small ghost" data-action="toggle" data-id="${k.id}" data-active="${k.isActive}">${k.isActive ? 'Deactivate' : 'Activate'}</button>
              <button class="btn small" data-action="delete" data-id="${k.id}">Delete</button>
            </td>
          `;
          tbl.appendChild(tr);
        });
      });
    } catch (err) {
      if (dashMsg){ dashMsg.style.color='red'; dashMsg.innerText='Server error'; }
      console.error(err);
    }
  }

  async function handleDashClick(e){
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const t = token();
    if (!t) { alert('Not authenticated'); return; }
    if (action === 'toggle'){
      const isActive = btn.dataset.active === 'true';
      try {
        const res = await fetch(BASE + '/api/admin/apikeys/' + id, {
          method:'PUT',
          headers:{'Content-Type':'application/json', Authorization:'Bearer ' + t},
          body: JSON.stringify({ isActive: !isActive })
        });
        if (!res.ok) { const b = await res.json().catch(()=>({})); alert(b.message||'Failed'); return; }
        loadDashboard();
      } catch(e){ alert('Network error'); console.error(e); }
    } else if (action === 'delete'){
      if (!confirm('Hapus API key ini?')) return;
      try {
        const res = await fetch(BASE + '/api/admin/apikeys/' + id, { method:'DELETE', headers:{ Authorization:'Bearer ' + t } });
        if (!res.ok){ const b = await res.json().catch(()=>({})); alert(b.message||'Failed'); return; }
        loadDashboard();
      } catch(e){ alert('Network error'); console.error(e); }
    }
  }

  // page init
  document.addEventListener('DOMContentLoaded', () => {
    initUserPage();

    // set admin greeting (uses localStorage 'admin_name' if present)
    const greet = el('admin_greet');
    if (greet) {
      const name = localStorage.getItem('admin_name') || 'Admin';
      greet.textContent = 'Halo ' + name;
      greet.style.marginRight = '12px'; // small spacing before logout
      greet.style.fontWeight = '600';
      greet.style.color = '#0f172a';
    }

    const loginBtn = el('admin_login');
    if (loginBtn) loginBtn.addEventListener('click', adminLogin);
    if (document.querySelector('#users_table')) {
      if (!token()) { window.location.href = BASE + '/login.html'; return; }
      loadDashboard();
      document.querySelector('#users_table').addEventListener('click', handleDashClick);
      const logout = el('logout');
      if (logout) logout.addEventListener('click', () => {
        if (confirm('Logout sekarang? Anda akan keluar dari dashboard.')) {
          setToken(null);
          window.location.href = BASE + '/login.html';
        }
      });
    }
  });
})();
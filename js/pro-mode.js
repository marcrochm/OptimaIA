/*!
 * OptimaIA · Pro Mode (Easter Egg + integración OpenAI)
 * Zero-dependency. Deferred load.
 *
 * Activación: 3 clics rápidos (<800 ms) sobre el logo.
 * Al activar, abre un modal donde el usuario introduce su API key de OpenAI.
 * La key se guarda en localStorage ("optimaia_openai_key").
 *
 * API pública:
 *   window.OptimaIA.isReady()         -> bool (hay key y Pro Mode activo)
 *   window.OptimaIA.run(opts, fb)     -> Promise<string>
 *       opts = { system: string, user: string, model?: string, delay?: ms }
 *       fb   = function () -> string  (fallback local si no hay key o falla la API)
 *   window.OptimaIA.openSettings()    -> abre el modal manualmente
 *   window.OptimaIA.clearKey()        -> borra la key y desactiva Pro Mode
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'optimaia_openai_key';
    var STORAGE_MODEL = 'optimaia_openai_model';
    var DEFAULT_MODEL = 'gpt-4o-mini';
    var WINDOW_MS = 800;

    var clicks = 0;
    var clickTimer = null;
    var pillEl = null;
    var modalEl = null;

    // ---------- API pública (disponible inmediatamente para los generadores) ----------
    window.OptimaIA = {
        isReady: function () { return !!getKey(); },
        getKey: getKey,
        clearKey: clearKey,
        openSettings: openKeyModal,
        run: runOrFallback
    };

    // ---------- Init ----------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    function init() {
        // Bind del logo (header + footer)
        var logos = document.querySelectorAll('a img[alt="Logo de OptimaIA"]');
        logos.forEach(function (img) {
            var link = img.closest('a') || img.parentElement;
            link.addEventListener('click', onLogoClick);
        });

        // Si ya hay key guardada, pintamos la píldora directamente
        if (getKey()) {
            window.isProMode = true;
            showPill();
        }
    }

    // ---------- Detección triple-clic ----------
    function onLogoClick(e) {
        e.preventDefault();
        clicks++;
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(function () { clicks = 0; }, WINDOW_MS);
        if (clicks >= 3) {
            clicks = 0;
            openKeyModal();
        }
    }

    // ---------- Storage ----------
    function getKey() {
        try { return localStorage.getItem(STORAGE_KEY) || ''; } catch (_) { return ''; }
    }
    function setKey(k) {
        try { localStorage.setItem(STORAGE_KEY, k); } catch (_) {}
    }
    function getModel() {
        try { return localStorage.getItem(STORAGE_MODEL) || DEFAULT_MODEL; } catch (_) { return DEFAULT_MODEL; }
    }
    function setModel(m) {
        try { localStorage.setItem(STORAGE_MODEL, m || DEFAULT_MODEL); } catch (_) {}
    }
    function clearKey() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
        window.isProMode = false;
        hidePill();
    }

    // ---------- Píldora "Modo Pro Activo" ----------
    function showPill() {
        if (pillEl) return;
        pillEl = document.createElement('button');
        pillEl.type = 'button';
        pillEl.className = 'pm-pill';
        pillEl.setAttribute('aria-label', 'Configurar Modo Pro');
        pillEl.title = 'Modo Pro activo — clic para configurar';
        pillEl.textContent = '⚡ Modo Pro Activo';
        pillEl.addEventListener('click', openKeyModal);
        document.body.appendChild(pillEl);
    }
    function hidePill() {
        if (pillEl && pillEl.parentNode) pillEl.parentNode.removeChild(pillEl);
        pillEl = null;
    }

    // ---------- Modal API Key ----------
    function openKeyModal() {
        if (modalEl) return;
        var currentKey = getKey();
        var currentModel = getModel();

        modalEl = document.createElement('div');
        modalEl.className = 'pm-overlay';
        modalEl.setAttribute('role', 'dialog');
        modalEl.setAttribute('aria-modal', 'true');
        modalEl.setAttribute('aria-label', 'Configurar API Key de OpenAI');

        var maskedExisting = currentKey ? currentKey.slice(0, 7) + '…' + currentKey.slice(-4) : '';

        modalEl.innerHTML =
            '<div class="pm-card">' +
                '<div class="pm-head">' +
                    '<div>' +
                        '<div class="pm-badge">Modo Pro</div>' +
                        '<h2 class="pm-title">Conecta tu API Key de OpenAI</h2>' +
                        '<p class="pm-sub">Las demos generarán contenido real con tu cuenta. La clave se guarda solo en tu navegador.</p>' +
                    '</div>' +
                    '<button type="button" class="pm-x" data-pm-close aria-label="Cerrar">×</button>' +
                '</div>' +

                '<div class="pm-field">' +
                    '<label class="pm-label" for="pm-key">OpenAI API Key</label>' +
                    '<input id="pm-key" class="pm-input" type="password" autocomplete="off" spellcheck="false" placeholder="sk-..." value="' + escapeAttr(currentKey) + '" />' +
                    (maskedExisting ? '<p class="pm-hint">Clave guardada actualmente: <code class="pm-mono">' + escapeHtml(maskedExisting) + '</code></p>' : '') +
                '</div>' +

                '<div class="pm-field">' +
                    '<label class="pm-label" for="pm-model">Modelo</label>' +
                    '<select id="pm-model" class="pm-select">' +
                        modelOption('gpt-4o-mini', currentModel) +
                        modelOption('gpt-4o', currentModel) +
                        modelOption('gpt-4-turbo', currentModel) +
                        modelOption('gpt-3.5-turbo', currentModel) +
                    '</select>' +
                '</div>' +

                '<p id="pm-status" class="pm-status pm-hide"></p>' +

                '<div class="pm-actions">' +
                    (currentKey ? '<button type="button" class="pm-btn pm-btn-danger" data-pm-clear>Eliminar clave</button>' : '') +
                    '<button type="button" class="pm-btn pm-btn-ghost" data-pm-close>Cancelar</button>' +
                    '<button type="button" class="pm-btn pm-btn-primary" data-pm-save>Guardar y activar</button>' +
                '</div>' +

                '<p class="pm-foot">⚠️ La clave queda en tu <code class="pm-mono">localStorage</code>. No la introduzcas en equipos compartidos. Las llamadas se hacen directamente desde tu navegador a <code class="pm-mono">api.openai.com</code>.</p>' +
            '</div>';

        document.body.appendChild(modalEl);
        modalEl.addEventListener('click', onModalClick);
        document.addEventListener('keydown', onModalKey);
        var input = modalEl.querySelector('#pm-key');
        if (input) input.focus();
    }

    function modelOption(id, current) {
        return '<option value="' + id + '"' + (current === id ? ' selected' : '') + '>' + id + '</option>';
    }

    function closeModal() {
        if (!modalEl) return;
        modalEl.removeEventListener('click', onModalClick);
        document.removeEventListener('keydown', onModalKey);
        if (modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
        modalEl = null;
    }

    function onModalKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
        if (e.key === 'Enter' && modalEl && document.activeElement && document.activeElement.id === 'pm-key') {
            e.preventDefault();
            saveFromModal();
        }
    }

    function onModalClick(e) {
        if (e.target === modalEl) { closeModal(); return; }
        if (e.target.closest('[data-pm-close]')) { closeModal(); return; }
        if (e.target.closest('[data-pm-save]')) { saveFromModal(); return; }
        if (e.target.closest('[data-pm-clear]')) {
            clearKey();
            closeModal();
        }
    }

    function saveFromModal() {
        var input = modalEl.querySelector('#pm-key');
        var modelSel = modalEl.querySelector('#pm-model');
        var status = modalEl.querySelector('#pm-status');
        var key = (input.value || '').trim();
        if (!key || key.length < 20) {
            status.textContent = 'La clave parece inválida. Debería empezar por “sk-” y tener al menos 20 caracteres.';
            status.classList.remove('pm-hide');
            return;
        }
        setKey(key);
        setModel(modelSel ? modelSel.value : DEFAULT_MODEL);
        window.isProMode = true;
        showPill();
        closeModal();
        document.dispatchEvent(new CustomEvent('optimaia:promode'));
    }

    // ---------- OpenAI call + fallback ----------
    function runOrFallback(opts, fallbackFn) {
        var fb = typeof fallbackFn === 'function' ? fallbackFn : function () { return ''; };
        if (!getKey()) {
            // Sin Pro Mode → fallback local con latencia simulada (para mantener UX igual)
            return new Promise(function (resolve) {
                setTimeout(function () { resolve(fb()); }, opts.delay || 600);
            });
        }
        return callOpenAI(opts.system, opts.user, opts.model).catch(function (err) {
            console.error('[OptimaIA] Llamada a OpenAI falló, usando fallback local:', err);
            return fb();
        });
    }

    function callOpenAI(systemPrompt, userPrompt, model) {
        var key = getKey();
        var body = {
            model: model || getModel() || DEFAULT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.6
        };
        return fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + key
            },
            body: JSON.stringify(body)
        }).then(function (r) {
            if (!r.ok) {
                return r.text().then(function (t) {
                    throw new Error('OpenAI ' + r.status + ': ' + t);
                });
            }
            return r.json();
        }).then(function (data) {
            var msg = data && data.choices && data.choices[0] && data.choices[0].message;
            return (msg && msg.content) ? String(msg.content).trim() : '';
        });
    }

    // ---------- Helpers ----------
    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function escapeAttr(s) {
        return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    }
})();

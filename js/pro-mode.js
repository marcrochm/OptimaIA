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

    // ---------- Píldora "Modo Pro Activo" (estilos inline → no depende de Tailwind) ----------
    function showPill() {
        if (pillEl) return;
        pillEl = document.createElement('button');
        pillEl.type = 'button';
        pillEl.setAttribute('aria-label', 'Configurar Modo Pro');
        pillEl.title = 'Modo Pro activo — clic para configurar';
        pillEl.textContent = '⚡ Modo Pro Activo';
        pillEl.style.cssText = [
            'position:fixed', 'top:84px', 'left:50%', 'transform:translateX(-50%)',
            'z-index:9998', 'padding:6px 14px',
            'font:600 12px/1 Inter,system-ui,-apple-system,sans-serif',
            'color:#fff', 'background:#0f172a',
            'border:1px solid rgba(255,255,255,.12)', 'border-radius:9999px',
            'box-shadow:0 10px 25px rgba(0,0,0,.18)', 'cursor:pointer',
            'letter-spacing:.02em', 'user-select:none'
        ].join(';');
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
        modalEl.setAttribute('role', 'dialog');
        modalEl.setAttribute('aria-modal', 'true');
        modalEl.setAttribute('aria-label', 'Configurar API Key de OpenAI');
        modalEl.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:9999',
            'background:rgba(15,23,42,.55)', 'backdrop-filter:blur(4px)',
            '-webkit-backdrop-filter:blur(4px)',
            'display:flex', 'align-items:center', 'justify-content:center',
            'padding:16px',
            'font:14px/1.5 Inter,system-ui,-apple-system,sans-serif',
            'color:#0f172a'
        ].join(';');

        var maskedExisting = currentKey ? currentKey.slice(0, 7) + '…' + currentKey.slice(-4) : '';

        modalEl.innerHTML =
            '<div style="background:#fff;border-radius:18px;max-width:480px;width:100%;padding:24px 24px 20px;box-shadow:0 25px 60px rgba(0,0,0,.25);">' +
                '<div style="display:flex;align-items:start;justify-content:space-between;gap:12px;">' +
                    '<div>' +
                        '<div style="display:inline-block;padding:3px 10px;font-size:11px;font-weight:600;color:#173a8f;background:#eef4ff;border-radius:9999px;letter-spacing:.04em;text-transform:uppercase;">Modo Pro</div>' +
                        '<h2 style="margin:10px 0 4px;font-size:18px;font-weight:700;color:#0f172a;">Conecta tu API Key de OpenAI</h2>' +
                        '<p style="margin:0;color:#475569;font-size:13px;">Las demos generarán contenido real con tu cuenta. La clave se guarda solo en tu navegador.</p>' +
                    '</div>' +
                    '<button type="button" data-pm-close aria-label="Cerrar" style="border:0;background:transparent;color:#64748b;font-size:22px;line-height:1;cursor:pointer;padding:4px;">×</button>' +
                '</div>' +

                '<div style="margin-top:18px;">' +
                    '<label for="pm-key" style="display:block;font-size:12px;font-weight:600;color:#334155;margin-bottom:6px;">OpenAI API Key</label>' +
                    '<input id="pm-key" type="password" autocomplete="off" spellcheck="false" placeholder="sk-..." ' +
                        'value="' + escapeAttr(currentKey) + '" ' +
                        'style="width:100%;box-sizing:border-box;padding:10px 12px;font:13px ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid #cbd5e1;border-radius:10px;outline:none;color:#0f172a;background:#f8fafc;" />' +
                    (maskedExisting ? '<p style="margin:6px 0 0;font-size:11px;color:#64748b;">Clave guardada actualmente: <code style="font-family:ui-monospace,monospace;">' + escapeHtml(maskedExisting) + '</code></p>' : '') +
                '</div>' +

                '<div style="margin-top:14px;">' +
                    '<label for="pm-model" style="display:block;font-size:12px;font-weight:600;color:#334155;margin-bottom:6px;">Modelo</label>' +
                    '<select id="pm-model" style="width:100%;box-sizing:border-box;padding:10px 12px;font:13px Inter,system-ui,sans-serif;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;color:#0f172a;">' +
                        modelOption('gpt-4o-mini', currentModel) +
                        modelOption('gpt-4o', currentModel) +
                        modelOption('gpt-4-turbo', currentModel) +
                        modelOption('gpt-3.5-turbo', currentModel) +
                    '</select>' +
                '</div>' +

                '<p id="pm-status" style="margin:12px 0 0;font-size:12px;color:#dc2626;display:none;"></p>' +

                '<div style="margin-top:18px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">' +
                    (currentKey ? '<button type="button" data-pm-clear style="padding:8px 14px;font:600 13px Inter,system-ui,sans-serif;color:#b91c1c;background:#fff;border:1px solid #fecaca;border-radius:10px;cursor:pointer;margin-right:auto;">Eliminar clave</button>' : '') +
                    '<button type="button" data-pm-close style="padding:8px 14px;font:600 13px Inter,system-ui,sans-serif;color:#334155;background:#fff;border:1px solid #cbd5e1;border-radius:10px;cursor:pointer;">Cancelar</button>' +
                    '<button type="button" data-pm-save style="padding:8px 16px;font:600 13px Inter,system-ui,sans-serif;color:#fff;background:#173a8f;border:1px solid #173a8f;border-radius:10px;cursor:pointer;">Guardar y activar</button>' +
                '</div>' +

                '<p style="margin:16px 0 0;padding-top:12px;border-top:1px solid #f1f5f9;font-size:11px;color:#64748b;line-height:1.5;">' +
                    '⚠️ La clave queda en tu <code>localStorage</code>. No la introduzcas en equipos compartidos. Las llamadas se hacen directamente desde tu navegador a <code>api.openai.com</code>.' +
                '</p>' +
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
            status.style.display = 'block';
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

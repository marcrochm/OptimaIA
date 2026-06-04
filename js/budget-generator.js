/**
 * Generador de Presupuestos (Demo)
 * 100% client-side. Sin llamadas externas. CSP-safe.
 */
(function () {
    'use strict';

    var form = document.getElementById('bg-form');
    if (!form) return;

    var output = document.getElementById('bg-output');
    var outputWrapper = document.getElementById('bg-output-wrapper');
    var submitBtn = document.getElementById('bg-submit');
    var submitLabel = document.getElementById('bg-submit-label');
    var copyBtn = document.getElementById('bg-copy');
    var cta = document.getElementById('bg-cta');

    var lastResult = '';

    // ---- Plantillas según tono ------------------------------------------------
    var TEMPLATES = {
        formal: {
            saludo: 'Estimado/a cliente:',
            intro: 'Tras analizar su solicitud, le remitimos el siguiente presupuesto para el servicio de {servicio}.',
            alcanceLabel: 'Alcance del trabajo',
            condicionesLabel: 'Condiciones',
            cierre: 'Quedamos a su disposición para cualquier aclaración. La presente propuesta tiene una validez de 30 días naturales desde su emisión.',
            firma: 'Atentamente,'
        },
        cercano: {
            saludo: '¡Hola!',
            intro: 'Te paso el presupuesto para {servicio} tal y como hablamos. Cualquier cosa, me dices y lo ajustamos.',
            alcanceLabel: 'Qué incluye',
            condicionesLabel: 'Cómo trabajamos',
            cierre: 'Si te encaja, contéstame y nos ponemos. La oferta es válida durante los próximos 30 días.',
            firma: 'Un saludo,'
        },
        tecnico: {
            saludo: 'Buenos días:',
            intro: 'Adjunto especificación técnica y presupuesto correspondiente al servicio: {servicio}.',
            alcanceLabel: 'Especificación funcional',
            condicionesLabel: 'Términos de ejecución',
            cierre: 'Validez de la oferta: 30 días. Entregables y plazos sujetos a la confirmación formal del alcance.',
            firma: 'Saludos,'
        }
    };

    // ---- Helpers --------------------------------------------------------------
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function toBullets(text) {
        var lines = String(text).split(/[\n;]+/).map(function (l) { return l.trim(); }).filter(Boolean);
        if (lines.length <= 1) return lines[0] || '';
        return lines.map(function (l) { return '• ' + l; }).join('\n');
    }

    function buildBudget(data) {
        var t = TEMPLATES[data.tono] || TEMPLATES.formal;
        var today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
        var ref = 'PRES-' + Date.now().toString().slice(-6);

        var parts = [];
        parts.push('Referencia: ' + ref);
        parts.push('Fecha: ' + today);
        parts.push('');
        parts.push(t.saludo);
        parts.push('');
        parts.push(t.intro.replace('{servicio}', data.servicio));
        parts.push('');
        parts.push(t.alcanceLabel + ':');
        parts.push(toBullets(data.alcance));
        if (data.condiciones && data.condiciones.trim()) {
            parts.push('');
            parts.push(t.condicionesLabel + ':');
            parts.push(toBullets(data.condiciones));
        }
        parts.push('');
        parts.push('Importe: [completar según escandallo]');
        parts.push('');
        parts.push(t.cierre);
        parts.push('');
        parts.push(t.firma);
        parts.push('[Tu nombre / empresa]');

        return parts.join('\n');
    }

    // ---- Render ---------------------------------------------------------------
    function renderSkeleton() {
        output.innerHTML =
            '<div class="space-y-3 animate-pulse" aria-hidden="true">' +
            '<div class="h-3 bg-gray-200 rounded w-1/3"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-1/4"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-2/3 mt-6"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-full"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-11/12"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-1/2 mt-6"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-3/4"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-2/3"></div>' +
            '</div>' +
            '<span class="sr-only">Generando presupuesto…</span>';
    }

    function renderResult(text) {
        output.innerHTML = escapeHtml(text);
        copyBtn.disabled = false;
        cta.classList.remove('hidden');
    }

    function getFormData() {
        var fd = new FormData(form);
        return {
            servicio: String(fd.get('servicio') || '').trim(),
            alcance: String(fd.get('alcance') || '').trim(),
            condiciones: String(fd.get('condiciones') || '').trim(),
            tono: String(fd.get('tono') || 'formal')
        };
    }

    // ---- Eventos --------------------------------------------------------------
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = getFormData();

        if (!data.servicio || !data.alcance) {
            output.innerHTML = '<p class="text-red-600">Completa al menos el tipo de servicio y el alcance.</p>';
            return;
        }

        submitBtn.disabled = true;
        submitLabel.textContent = 'Generando…';
        copyBtn.disabled = true;
        renderSkeleton();

        var finish = function (text) {
            lastResult = text;
            renderResult(text);
            submitBtn.disabled = false;
            submitLabel.textContent = 'Generar de nuevo';
            if (window.matchMedia('(max-width: 1023px)').matches) {
                outputWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

        var systemPrompt =
            'Eres un asistente que redacta presupuestos profesionales en español para autónomos y pequeños negocios. ' +
            'Devuelve SOLO el texto del presupuesto listo para enviar, sin comentarios ni markdown. ' +
            'Incluye saludo, intro, alcance en bullets, condiciones si las hay, importe (puedes dejar [completar]), cierre y firma.';

        var userPrompt =
            'Servicio: ' + data.servicio + '\n' +
            'Alcance: ' + data.alcance + '\n' +
            (data.condiciones ? 'Condiciones: ' + data.condiciones + '\n' : '') +
            'Tono: ' + data.tono;

        var fallback = function () { return buildBudget(data); };

        if (window.OptimaIA && typeof window.OptimaIA.run === 'function') {
            window.OptimaIA.run({ system: systemPrompt, user: userPrompt, delay: 650 }, fallback).then(finish);
        } else {
            setTimeout(function () { finish(fallback()); }, 650);
        }
    });

    copyBtn.addEventListener('click', function () {
        if (!lastResult) return;
        var original = copyBtn.textContent;
        var done = function () {
            copyBtn.textContent = '¡Copiado!';
            setTimeout(function () { copyBtn.textContent = original; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(lastResult).then(done).catch(function () {
                fallbackCopy(lastResult);
                done();
            });
        } else {
            fallbackCopy(lastResult);
            done();
        }
    });

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* noop */ }
        document.body.removeChild(ta);
    }
})();

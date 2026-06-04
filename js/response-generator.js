/**
 * Demo 2: Respuesta Express a clientes
 * 100% client-side, determinístico, namespace propio (respGen*) para no
 * colisionar con el generador de presupuestos.
 */
(function () {
    'use strict';

    var form = document.getElementById('respGen-form');
    if (!form) return;

    var output = document.getElementById('respGen-output');
    var outputWrapper = document.getElementById('respGen-output-wrapper');
    var submitBtn = document.getElementById('respGen-submit');
    var submitLabel = document.getElementById('respGen-submit-label');
    var copyBtn = document.getElementById('respGen-copy');
    var cta = document.getElementById('respGen-cta');

    var lastResult = '';

    // ---- Plantillas por estilo -----------------------------------------------
    var TEMPLATES = {
        profesional: {
            saludo: 'Estimado/a cliente,',
            ack: 'Le agradecemos su mensaje. Hemos tomado nota de su consulta y le respondemos a continuación.',
            ctxLead: 'En relación con su solicitud:',
            cierre: 'Quedamos a su disposición para cualquier aclaración adicional. Le responderemos en un plazo máximo de 24 horas hábiles si necesita más información.',
            firma: 'Atentamente,\n[Tu nombre]'
        },
        cercano: {
            saludo: '¡Hola!',
            ack: 'Gracias por escribirnos, te respondo enseguida.',
            ctxLead: 'Sobre lo que comentas:',
            cierre: 'Si te queda cualquier duda, dímelo y lo vemos. ¡Hablamos!',
            firma: 'Un saludo,\n[Tu nombre]'
        },
        conciso: {
            saludo: 'Hola,',
            ack: 'Gracias por tu mensaje.',
            ctxLead: 'Respuesta:',
            cierre: 'Cualquier duda, aquí estoy.',
            firma: 'Saludos,\n[Tu nombre]'
        }
    };

    // ---- Helpers -------------------------------------------------------------
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function summarize(text, maxLen) {
        var clean = String(text).replace(/\s+/g, ' ').trim();
        if (clean.length <= maxLen) return clean;
        return clean.slice(0, maxLen).replace(/[,.;:\s]\S*$/, '') + '…';
    }

    function detectIntent(mensaje) {
        var m = mensaje.toLowerCase();
        if (/precio|cuánto|cuanto cuesta|tarifa|presupuesto/.test(m)) return 'precio';
        if (/cuando|cuándo|plazo|fecha|disponib/.test(m)) return 'plazo';
        if (/queja|reclamación|reclamacion|problema|mal|no funciona/.test(m)) return 'queja';
        if (/cita|reservar|reserva|agendar/.test(m)) return 'cita';
        return 'general';
    }

    function intentSentence(intent, estilo) {
        var byIntent = {
            precio: {
                profesional: 'Para ofrecerle un presupuesto ajustado, necesitaríamos conocer algunos detalles más sobre el alcance del servicio.',
                cercano: 'Para poder darte un precio justo, necesito que me cuentes un poco más sobre lo que necesitas.',
                conciso: 'Necesito más detalles para darte un precio.'
            },
            plazo: {
                profesional: 'Respecto a los plazos, el tiempo estimado de entrega es de [completar] desde la confirmación del trabajo.',
                cercano: 'Sobre el plazo: normalmente lo tengo listo en [completar] desde que confirmamos.',
                conciso: 'Plazo estimado: [completar].'
            },
            queja: {
                profesional: 'Lamentamos los inconvenientes ocasionados. Vamos a revisar su caso con prioridad y le confirmaremos los pasos a seguir.',
                cercano: 'Siento mucho lo que cuentas. Me pongo con ello ahora mismo y te confirmo cómo lo solucionamos.',
                conciso: 'Lo siento. Reviso el caso y te confirmo solución.'
            },
            cita: {
                profesional: 'Le propongo concertar una cita. ¿Le vendría bien alguno de estos huecos: [completar fechas]?',
                cercano: '¿Quedamos? Te paso huecos: [completar fechas]. Dime cuál te encaja.',
                conciso: 'Disponibilidad: [completar fechas]. ¿Cuál te va bien?'
            },
            general: {
                profesional: 'Procedemos a darle respuesta con la información solicitada a continuación.',
                cercano: 'Aquí te dejo la info que pedías.',
                conciso: 'Aquí va la respuesta:'
            }
        };
        return byIntent[intent][estilo];
    }

    function buildResponse(data) {
        var t = TEMPLATES[data.estilo] || TEMPLATES.profesional;
        var intent = detectIntent(data.mensaje);
        var intentLine = intentSentence(intent, data.estilo);

        var parts = [];
        parts.push(t.saludo);
        parts.push('');
        parts.push(t.ack);
        parts.push('');
        parts.push(intentLine);

        if (data.contexto && data.contexto.trim()) {
            parts.push('');
            parts.push(t.ctxLead);
            parts.push(summarize(data.contexto, 280));
        }

        parts.push('');
        parts.push(t.cierre);
        parts.push('');
        parts.push(t.firma);

        return parts.join('\n');
    }

    // ---- Render --------------------------------------------------------------
    function renderSkeleton() {
        output.innerHTML =
            '<div class="space-y-3 animate-pulse" aria-hidden="true">' +
            '<div class="h-3 bg-gray-200 rounded w-1/4"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-3/4 mt-4"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-full"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-5/6"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-2/3 mt-4"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-1/2"></div>' +
            '</div>' +
            '<span class="sr-only">Generando respuesta…</span>';
    }

    function renderResult(text) {
        output.innerHTML = escapeHtml(text);
        copyBtn.disabled = false;
        cta.classList.remove('hidden');
    }

    function getFormData() {
        var fd = new FormData(form);
        return {
            mensaje: String(fd.get('mensaje') || '').trim(),
            contexto: String(fd.get('contexto') || '').trim(),
            estilo: String(fd.get('estilo') || 'profesional')
        };
    }

    // ---- Eventos -------------------------------------------------------------
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = getFormData();

        if (!data.mensaje) {
            output.innerHTML = '<p class="text-red-600">Pega primero el mensaje que has recibido.</p>';
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
            if (outputWrapper && typeof outputWrapper.scrollIntoView === 'function') {
                outputWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        };

        var systemPrompt =
            'Eres un asistente que redacta respuestas profesionales a mensajes de clientes en español. ' +
            'Devuelve SOLO el texto de la respuesta, sin comentarios ni markdown. ' +
            'Adapta el estilo (profesional, cercano o conciso) y, si el cliente pregunta por precio, plazo, cita o queja, responde de forma útil y empática.';

        var userPrompt =
            'Mensaje recibido del cliente:\n"' + data.mensaje + '"\n\n' +
            (data.contexto ? 'Contexto/notas mías para la respuesta: ' + data.contexto + '\n\n' : '') +
            'Estilo de respuesta: ' + data.estilo;

        var fallback = function () { return buildResponse(data); };

        if (window.OptimaIA && typeof window.OptimaIA.run === 'function') {
            window.OptimaIA.run({ system: systemPrompt, user: userPrompt, delay: 600 }, fallback).then(finish);
        } else {
            setTimeout(function () { finish(fallback()); }, 600);
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
                respGenFallbackCopy(lastResult);
                done();
            });
        } else {
            respGenFallbackCopy(lastResult);
            done();
        }
    });

    function respGenFallbackCopy(text) {
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

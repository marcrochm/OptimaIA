/**
 * Demo 3: Seguimiento Comercial
 * 100% client-side, determinístico, namespace propio `fs-` / `followupGenerator`.
 */
(function followupGeneratorInit() {
    'use strict';

    var form = document.getElementById('fs-form');
    if (!form) return;

    var output = document.getElementById('fs-output');
    var outputWrapper = document.getElementById('fs-output-wrapper');
    var submitBtn = document.getElementById('fs-submit');
    var submitLabel = document.getElementById('fs-submit-label');
    var copyBtn = document.getElementById('fs-copy');
    var cta = document.getElementById('fs-cta');

    var lastResult = '';

    // ---- Plantillas por tono -------------------------------------------------
    var TONES = {
        persuasivo: {
            saludo: 'Hola {nombre},',
            cierre: 'Si te resuelvo cualquier duda en 5 minutos, lo cerramos. ¿Te encaja una llamada breve esta semana?',
            firma: 'Un saludo,\n[Tu nombre]'
        },
        amistoso: {
            saludo: '¡Hola {nombre}!',
            cierre: 'Cualquier duda dímelo sin compromiso, estamos aquí para lo que necesites. ¡Hablamos!',
            firma: 'Un saludo,\n[Tu nombre]'
        },
        directo: {
            saludo: 'Hola {nombre},',
            cierre: '¿Seguimos adelante o lo dejamos aparcado de momento? Cualquier respuesta me sirve.',
            firma: 'Saludos,\n[Tu nombre]'
        }
    };

    // ---- Cuerpo por (contacto, tono) -----------------------------------------
    var BODIES = {
        presupuesto: {
            persuasivo: 'Quería retomar el presupuesto que te envié. Antes de darlo por cerrado, ¿te encajaron los plazos y el alcance, o hay algún punto que quieras ajustar (entregables, condiciones de pago, calendario)?',
            amistoso: 'Quería preguntarte qué tal lo viste todo, sin prisa. Si te quedó alguna duda o quieres que ajustemos algo del presupuesto, lo vemos cuando te venga bien.',
            directo: 'Te escribo para saber si el presupuesto te encaja tal cual o necesitas que cambiemos algo. Si prefieres no avanzar, también me sirve saberlo para no insistir.'
        },
        reunion: {
            persuasivo: 'Después de nuestra reunión, le he dado una vuelta a lo que comentamos y creo que podríamos arrancar con una primera fase pequeña, justo por el punto que más te preocupaba. ¿Te paso una propuesta concreta?',
            amistoso: 'Después de la reunión me quedé con muy buenas sensaciones. ¿Cómo lo viste tú por tu lado? Si quieres, lo retomamos cuando tengas un hueco.',
            directo: 'Tras la reunión, ¿quieres que te pase una propuesta concreta o prefieres esperar? Lo que decidas me sirve para organizarme.'
        },
        consulta: {
            persuasivo: 'Recuerdo tu consulta sobre [tema]. Desde entonces hemos trabajado en casos parecidos al tuyo y podría enseñarte cómo lo resolvimos. ¿Te interesa que te envíe un ejemplo de 1 minuto?',
            amistoso: 'Te escribo por la consulta que me hiciste hace unos días. ¿Sigue siendo algo que te ronda? Si te ayudo a aclarar cualquier cosa, dime.',
            directo: 'Sobre la consulta que me hiciste: ¿quieres avanzar o lo dejamos en stand-by? Sin compromiso, pero me ayuda saberlo.'
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
        if (!clean) return '';
        if (clean.length <= maxLen) return clean;
        return clean.slice(0, maxLen).replace(/[,.;:\s]\S*$/, '') + '…';
    }

    function followupGeneratorBuild(data) {
        var tone = TONES[data.tono] || TONES.persuasivo;
        var body = (BODIES[data.contacto] && BODIES[data.contacto][data.tono])
            || BODIES.presupuesto.persuasivo;

        var nombre = data.nombre || 'cliente';
        var parts = [];
        parts.push(tone.saludo.replace('{nombre}', nombre));
        parts.push('');
        parts.push(body);

        if (data.situacion && data.situacion.trim()) {
            parts.push('');
            parts.push('Como me comentaste: ' + summarize(data.situacion, 220));
        }

        parts.push('');
        parts.push(tone.cierre);
        parts.push('');
        parts.push(tone.firma);
        return parts.join('\n');
    }

    // ---- Render --------------------------------------------------------------
    function followupGeneratorSkeleton() {
        output.innerHTML =
            '<div class="space-y-3 animate-pulse" aria-hidden="true">' +
            '<div class="h-3 bg-gray-200 rounded w-1/4"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-3/4 mt-4"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-full"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-5/6"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-2/3 mt-4"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-1/2"></div>' +
            '</div>' +
            '<span class="sr-only">Generando seguimiento…</span>';
    }

    function followupGeneratorRender(text) {
        output.innerHTML = escapeHtml(text);
        copyBtn.disabled = false;
        cta.classList.remove('hidden');
    }

    function followupGeneratorReadForm() {
        var fd = new FormData(form);
        return {
            nombre: String(fd.get('nombre') || '').trim(),
            contacto: String(fd.get('contacto') || 'presupuesto'),
            situacion: String(fd.get('situacion') || '').trim(),
            tono: String(fd.get('tono') || 'persuasivo')
        };
    }

    // ---- Eventos -------------------------------------------------------------
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = followupGeneratorReadForm();

        if (!data.nombre) {
            output.innerHTML = '<p class="text-red-600">Indica al menos el nombre del cliente.</p>';
            return;
        }

        submitBtn.disabled = true;
        submitLabel.textContent = 'Generando…';
        copyBtn.disabled = true;
        followupGeneratorSkeleton();

        var finish = function (text) {
            lastResult = text;
            followupGeneratorRender(text);
            submitBtn.disabled = false;
            submitLabel.textContent = 'Generar de nuevo';
            if (outputWrapper && typeof outputWrapper.scrollIntoView === 'function') {
                outputWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        };

        var systemPrompt =
            'Eres un asistente comercial que redacta mensajes de seguimiento en español para autónomos y pequeños negocios. ' +
            'Devuelve SOLO el texto del mensaje, sin comentarios ni markdown. ' +
            'Adapta el tono (persuasivo, amistoso o directo) y haz que sea breve, humano y orientado a obtener una respuesta del cliente.';

        var contactoLabel = ({ presupuesto: 'envío de presupuesto', reunion: 'reunión inicial', consulta: 'consulta puntual' })[data.contacto] || data.contacto;
        var userPrompt =
            'Nombre del cliente: ' + data.nombre + '\n' +
            'Último contacto: ' + contactoLabel + '\n' +
            (data.situacion ? 'Situación / notas: ' + data.situacion + '\n' : '') +
            'Tono: ' + data.tono;

        var fallback = function () { return followupGeneratorBuild(data); };

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
                followupGeneratorFallbackCopy(lastResult);
                done();
            });
        } else {
            followupGeneratorFallbackCopy(lastResult);
            done();
        }
    });

    function followupGeneratorFallbackCopy(text) {
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

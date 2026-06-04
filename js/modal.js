/**
 * Sistema de Modales reutilizable
 * Uso: <button data-modal-open="id-del-modal">…</button>
 *      <div id="id-del-modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="...">…</div>
 *
 * También expone window.OptimaModal con .open(id) / .close(id) por si necesitas
 * abrir un modal por código.
 */
(function () {
    'use strict';

    var openModal = null;            // referencia al modal activo
    var lastFocusedEl = null;        // para restaurar el foco al cerrar
    var scrollY = 0;                 // posición de scroll antes de bloquear

    var FOCUSABLE = [
        'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
        'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function lockScroll() {
        scrollY = window.scrollY || window.pageYOffset || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = '-' + scrollY + 'px';
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
    }

    function unlockScroll() {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
    }

    function trapFocus(e) {
        if (!openModal || e.key !== 'Tab') return;
        var nodes = openModal.querySelectorAll(FOCUSABLE);
        if (!nodes.length) return;
        var first = nodes[0];
        var last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function onKeydown(e) {
        if (!openModal) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            close(openModal);
        } else if (e.key === 'Tab') {
            trapFocus(e);
        }
    }

    function open(id) {
        var modal = typeof id === 'string' ? document.getElementById(id) : id;
        if (!modal || modal === openModal) return;
        lastFocusedEl = document.activeElement;
        modal.classList.remove('hidden');
        // Forzamos reflow para que la transición de opacidad se aplique
        // (las clases con opacity-0 → opacity-100 las gestionas en el HTML del modal).
        void modal.offsetWidth;
        modal.classList.add('is-open');
        openModal = modal;
        lockScroll();

        // Foco al primer focusable de dentro
        var firstFocusable = modal.querySelector(FOCUSABLE);
        if (firstFocusable) firstFocusable.focus();
    }

    function close(id) {
        var modal = typeof id === 'string' ? document.getElementById(id) : (id || openModal);
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.classList.add('hidden');
        if (openModal === modal) openModal = null;
        unlockScroll();
        if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
            lastFocusedEl.focus();
        }
    }

    // Delegación global de eventos
    document.addEventListener('click', function (e) {
        // Abrir
        var opener = e.target.closest('[data-modal-open]');
        if (opener) {
            e.preventDefault();
            open(opener.getAttribute('data-modal-open'));
            return;
        }
        // Cerrar por botón
        var closer = e.target.closest('[data-modal-close]');
        if (closer) {
            e.preventDefault();
            close(closer.closest('.modal'));
            return;
        }
        // Cerrar por click en backdrop
        if (e.target.matches('.modal__backdrop')) {
            close(e.target.closest('.modal'));
        }
    });

    document.addEventListener('keydown', onKeydown);

    // API pública opcional
    window.OptimaModal = { open: open, close: close };
})();

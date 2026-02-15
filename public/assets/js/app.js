// Georgian QWERTY keyboard mapping (English key -> Georgian character)
const georgianMap = {
    // Lowercase
    'a': 'ა', 'b': 'ბ', 'g': 'გ', 'd': 'დ', 'e': 'ე', 'v': 'ვ', 'z': 'ზ',
    'i': 'ი', 'k': 'კ', 'l': 'ლ', 'm': 'მ', 'n': 'ნ', 'o': 'ო', 'p': 'პ',
    'r': 'რ', 's': 'ს', 't': 'ტ', 'u': 'უ', 'f': 'ფ', 'q': 'ქ', 'y': 'ყ',
    'c': 'ც', 'w': 'წ', 'x': 'ხ', 'j': 'ჯ', 'h': 'ჰ',
    // Uppercase (Shift) - special characters
    'T': 'თ', 'R': 'ღ', 'S': 'შ', 'C': 'ჩ', 'Z': 'ძ', 'W': 'ჭ', 'J': 'ჟ'
};

// Auto-transliterate Georgian inputs
function initGeorgianInputs() {
    // Select all Georgian inputs by class pattern or data attribute
    const georgianInputs = document.querySelectorAll(
        'input[class*="-ka"], input[data-lang="ka"], textarea[class*="-ka"], textarea[data-lang="ka"], ' +
        'input[name$="_ka"], input[name="name_ka"], textarea[name$="_ka"]'
    );

    georgianInputs.forEach(function(input) {
        // Skip if already initialized
        if (input.dataset.georgianInit) return;
        input.dataset.georgianInit = 'true';

        input.addEventListener('keypress', function(e) {
            const char = e.key;

            // Check if the character has a Georgian mapping
            if (georgianMap[char]) {
                e.preventDefault();

                const start = this.selectionStart;
                const end = this.selectionEnd;
                const value = this.value;

                // Insert Georgian character
                this.value = value.substring(0, start) + georgianMap[char] + value.substring(end);

                // Move cursor after inserted character
                this.selectionStart = this.selectionEnd = start + 1;

                // Trigger input event for any listeners
                this.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });
}

// Sidebar toggle for mobile
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Georgian inputs on page load
    initGeorgianInputs();

    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function(tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl, {
            html: true
        });
    });

    // Re-initialize when new content is added (for dynamically created inputs)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                initGeorgianInputs();
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
            if (overlay) overlay.classList.toggle('show');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }

    // Confirm delete
    document.querySelectorAll('[data-confirm]').forEach(function(el) {
        el.addEventListener('click', function(e) {
            if (!confirm(el.dataset.confirm)) {
                e.preventDefault();
            }
        });
    });

    // Copy to clipboard
    document.querySelectorAll('[data-copy]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var text = btn.dataset.copy;
            var orig = btn.innerHTML;

            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    btn.innerHTML = '<i class="bi bi-check"></i> Copied!';
                    setTimeout(function() { btn.innerHTML = orig; }, 2000);
                }).catch(function() {
                    fallbackCopy(text, btn, orig);
                });
            } else {
                fallbackCopy(text, btn, orig);
            }
        });
    });

    // Fallback copy method for non-HTTPS
    function fallbackCopy(text, btn, orig) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            btn.innerHTML = '<i class="bi bi-check"></i> Copied!';
            setTimeout(function() { btn.innerHTML = orig; }, 2000);
        } catch (e) {
            alert('Copy this link: ' + text);
        }
        document.body.removeChild(textarea);
    }

    // Auto-submit category quick-award forms
    document.querySelectorAll('.quick-award-form').forEach(function(form) {
        form.addEventListener('submit', function() {
            const btn = form.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;
        });
    });
});

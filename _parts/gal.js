<script>
  // Photo row: click a photo to see it large (click, tap or Esc closes)
  (function () {
    document.querySelectorAll('.pgal-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        const img = b.querySelector('img');
        const box = document.createElement('div');
        box.className = 'lb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
        const big = new Image(); big.src = img.src; big.alt = img.alt;
        const cap = document.createElement('p'); cap.textContent = img.alt;
        box.appendChild(big); box.appendChild(cap);
        function close() { box.remove(); document.removeEventListener('keydown', onKey); b.focus(); }
        function onKey(e) { if (e.key === 'Escape') close(); }
        box.addEventListener('click', close);
        document.addEventListener('keydown', onKey);
        document.body.appendChild(box);
      });
    });
  })();
</script>

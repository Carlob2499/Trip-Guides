/* Guided reading chain — the end-of-section "Next: …" cards navigate via the
   real tab buttons, reusing all tab state / scroll / persistence. */

(function () {
  var tabs = document.getElementById("guideTabs");
  if (!tabs) return;
  document.addEventListener("click", function (e) {
    var cta = e.target.closest && e.target.closest("[data-next-tab]");
    if (!cta) return;
    var target = tabs.querySelector('.gtab[data-tab="' + cta.getAttribute("data-next-tab") + '"]');
    if (target) target.click();
  });
})();

/* Phrase-card "Speak" button (docs/FEATURES.md #6) — the free browser TTS (Web Speech
   API), no service, no cost. Feature-detected: on a browser without speechSynthesis the
   buttons simply do nothing when clicked rather than throwing (the phrase text itself,
   already big native-script type on screen, remains fully useful without audio — the
   button is a bonus, not the only way to use a phrase card). */

export function initSpeak() {
  if (!("speechSynthesis" in window)) return;
  var buttons = document.querySelectorAll("[data-speak-text][data-speak-lang]");
  if (!buttons.length) return;

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      try {
        window.speechSynthesis.cancel(); // stop any phrase already speaking
        var u = new SpeechSynthesisUtterance(btn.getAttribute("data-speak-text"));
        u.lang = btn.getAttribute("data-speak-lang");
        window.speechSynthesis.speak(u);
      } catch (e) {
        // Speech synthesis is decoration on top of the always-visible phrase text —
        // never let it break the page.
      }
    });
  });
}

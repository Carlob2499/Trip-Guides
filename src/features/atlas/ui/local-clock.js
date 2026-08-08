// Ticking local-time chip (README §"World view"/§3) — client-enhanced; the server render
// already shows the tz-correct time as of build, this just keeps it live. Shared by the
// table view's quick card and (Stage C.5) the globe's pin cards via the same [data-tick] hook.

import { localClockLabel } from "../model/local-time";

export function startLocalClocks(root = document) {
  const nodes = root.querySelectorAll("[data-tick][data-tz]");
  if (!nodes.length) return;
  const tick = () => {
    const now = new Date();
    nodes.forEach((el) => {
      const label = localClockLabel(el.dataset.tz, now);
      if (label) el.textContent = label;
    });
  };
  tick();
  setInterval(tick, 30_000);
}

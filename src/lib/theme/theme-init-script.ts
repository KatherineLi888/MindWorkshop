/** 在 React hydration 前应用已保存主题，减少首屏闪烁 */
export const themeInitScript = `
(function () {
  try {
    var raw = localStorage.getItem("workshop-theme-prefs");
    if (!raw) return;
    var p = JSON.parse(raw);
    var d = document.documentElement;
    function hex(h) {
      h = (h || "").replace(/^#/, "");
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      if (h.length !== 6) return null;
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    function set(k, v) { if (v) d.style.setProperty(k, v); }
    if (p.background) set("--background", p.background);
    if (p.foreground) set("--foreground", p.foreground);
    if (p.surface) set("--surface", p.surface);
    if (p.border) set("--border", p.border);
    if (p.primary) set("--primary", p.primary);
    if (p.accent) set("--accent", p.accent);
    var rgb = hex(p.primary);
    if (rgb) {
      set("--primary-ring", "rgba(" + rgb.join(",") + ",0.35)");
      set("--primary-ring-soft", "rgba(" + rgb.join(",") + ",0.15)");
    }
  } catch (e) {}
})();
`;

const paths = {
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  search: '<circle cx="10.8" cy="10.8" r="7.3"/><path d="m16.2 16.2 4.5 4.5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  external: '<path d="M14 3h7v7m0-7L10 14"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  play: '<path d="m9 5 11 7-11 7z"/>',
  comment: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
  headphones: '<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="3" y="12" width="4" height="9" rx="2"/><rect x="17" y="12" width="4" height="9" rx="2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H21M6.5 2H21v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 6a8 8 0 0 1 13.2 3M4.7 15A8 8 0 0 0 18 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  heart: '<path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8z"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
};

export function icon(name, size = 18) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({viewBox:'0 0 24 24', width:size, height:size, fill:'none', stroke:'currentColor', 'stroke-width':1.6, 'stroke-linecap':'round', 'stroke-linejoin':'round', 'aria-hidden':'true'})) svg.setAttribute(key, value);
  svg.innerHTML = paths[name] || paths.music;
  return svg;
}

export function mountIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => el.replaceChildren(icon(el.dataset.icon)));
}

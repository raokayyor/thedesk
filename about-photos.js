// Optional approved portraits: missing files keep the supplied initials/current photo.
(() => {
  function useIfPresent(path, apply) {
    const probe = new Image(); probe.onload = () => apply(path); probe.src = path;
  }
  for (const card of document.querySelectorAll('.panel .p')) {
    const name = card.querySelector('h3')?.textContent.trim();
    if (!name || name === 'Kayyor Rao') continue;
    const path = '/assets/people/' + name.toLowerCase().replace(/\s+/g, '-') + '.jpg';
    useIfPresent(path, src => {
      const image = Object.assign(document.createElement('img'), {src, alt: name});
      card.querySelector('.av').replaceChildren(image);
    });
  }
  useIfPresent('/assets/people/kayyor-rao-founder.jpg', src => {
    const portrait = document.querySelector('.founder .portrait'); if (portrait) portrait.src = src;
    const og = document.querySelector('meta[property="og:image"]'); if (og) og.content = new URL(src, 'https://thedesk.vercel.app').href;
  });
})();

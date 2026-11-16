// Staged navigation. Keep false until Rao confirms the About page release checklist.
(() => {
  const approved = false;
  const preview = new URLSearchParams(location.search).get('preview') === '1';
  if (!approved && !preview) return;
  const href = approved ? '/about.html' : '/about.html?preview=1';
  const link = () => Object.assign(document.createElement('a'), {href, textContent: 'About'});
  const membership = [...document.querySelectorAll('header a')].find(a => a.textContent.trim() === 'Membership');
  if (membership) { if (location.pathname !== '/about.html') membership.before(link()); }
  else {
    const header = document.querySelector('header') || document.body.insertBefore(document.createElement('header'), document.body.firstChild);
    const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'About The Desk'); nav.style.cssText = 'display:flex;gap:18px;font-size:14px'; nav.append(link()); header.append(nav);
  }
  const footer = document.querySelector('footer') || document.body.appendChild(document.createElement('footer'));
  const footerLink = link(); footerLink.style.marginInlineStart = '12px'; footer.append(footerLink);
})();

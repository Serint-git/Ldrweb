const header = document.querySelector('[data-header]');
const menu = document.querySelector('[data-menu]');
const menuLabel = document.querySelector('[data-menu-label]');
const nav = document.querySelector('[data-nav]');
const mobileMenuQuery = window.matchMedia('(max-width: 980px)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let menuReturnFocus = null;

function updateHeader(){
  header?.classList.toggle('scrolled', window.scrollY > 24);
}

function syncMenuAccessibility(){
  if(!nav) return;
  const open = menu?.getAttribute('aria-expanded') === 'true';
  const hiddenOnMobile = mobileMenuQuery.matches && !open;
  nav.inert = hiddenOnMobile;
  if(hiddenOnMobile) nav.setAttribute('aria-hidden','true');
  else nav.removeAttribute('aria-hidden');
}

function setMenu(open, restoreFocus = true){
  if(!menu || !nav) return;
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  if(menuLabel) menuLabel.textContent = open ? 'Cerrar menú' : 'Abrir menú';
  syncMenuAccessibility();

  if(open){
    menuReturnFocus = document.activeElement;
    requestAnimationFrame(() => nav.querySelector('a')?.focus());
  }else{
    if(restoreFocus && menuReturnFocus instanceof HTMLElement && document.activeElement !== menu) menuReturnFocus.focus();
    menuReturnFocus = null;
  }
}

function trapMenuFocus(event){
  if(event.key !== 'Tab' || !mobileMenuQuery.matches || menu?.getAttribute('aria-expanded') !== 'true' || !nav || !menu) return;
  const focusables = [menu, ...nav.querySelectorAll('a[href]')];
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if(event.shiftKey && document.activeElement === first){
    event.preventDefault();
    last.focus();
  }else if(!event.shiftKey && document.activeElement === last){
    event.preventDefault();
    first.focus();
  }
}

updateHeader();
syncMenuAccessibility();
window.addEventListener('scroll', updateHeader, {passive:true});
menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false, false)));

window.addEventListener('resize', () => {
  if(!mobileMenuQuery.matches && menu?.getAttribute('aria-expanded') === 'true') setMenu(false, false);
  else syncMenuAccessibility();
}, {passive:true});

// LDR-WEB-002 · B03/B04 — Galerías de proyectos reales
const projectGalleries = {
  'bodegas-las-pintitas': {
    title: 'Bodegas Las Pintitas', type: 'Bodega comercial', area: '2,000 m²',
    images: ['cover.webp','gallery-01.webp','gallery-02.webp','gallery-03.webp','gallery-04.webp','gallery-05.webp']
  },
  'bodega-constitucion-58': {
    title: 'Bodega Constitución 58', type: 'Bodega comercial', area: '500 m²',
    images: ['cover.webp','gallery-01.webp','gallery-02.webp','gallery-03.webp','gallery-04.webp','gallery-05.webp']
  },
  'casa-town-house': {
    title: 'Casa Town House', type: 'Vivienda', area: '380 m²',
    images: ['cover.webp','gallery-01.webp','gallery-02.webp','gallery-03.webp','gallery-04.webp','gallery-05.webp']
  },
  'bodega-artesanos': {
    title: 'Bodega Artesanos', type: 'Bodega comercial', area: '300 m²',
    images: ['cover.webp','gallery-01.webp','gallery-02.webp','gallery-03.webp','gallery-04.webp']
  },
  'bodega-miravalle': {
    title: 'Bodega Miravalle', type: 'Bodega comercial · obra en proceso', area: '250 m²',
    images: ['cover.webp','gallery-01.webp','gallery-02.webp','gallery-03.webp','gallery-04.webp','gallery-05.webp']
  },
  'casa-senderos': {
    title: 'Casa Senderos', type: 'Vivienda', area: '145 m²',
    images: ['cover.webp','gallery-01.webp','gallery-02.webp','gallery-03.webp','gallery-04.webp','gallery-05.webp']
  }
};

const galleryModal = document.querySelector('[data-gallery-modal]');
const galleryDialog = galleryModal?.querySelector('.gallery-dialog');
const galleryStage = galleryModal?.querySelector('.gallery-stage');
const galleryImage = galleryModal?.querySelector('[data-gallery-image]');
const galleryTitle = galleryModal?.querySelector('[data-gallery-title]');
const galleryType = galleryModal?.querySelector('[data-gallery-type]');
const galleryArea = galleryModal?.querySelector('[data-gallery-area]');
const galleryCount = galleryModal?.querySelector('[data-gallery-count]');
const galleryThumbs = galleryModal?.querySelector('[data-gallery-thumbs]');
let activeGallery = null;
let activeProjectSlug = '';
let activeImageIndex = 0;
let galleryTrigger = null;
let touchStartX = null;

function galleryImagePath(slug, file){
  return `assets/img/projects/${slug}/${file}`;
}

function preloadGalleryNeighbors(){
  if(!activeGallery) return;
  const total = activeGallery.images.length;
  [activeImageIndex - 1, activeImageIndex + 1].forEach(index => {
    const normalized = (index + total) % total;
    const preload = new Image();
    preload.src = galleryImagePath(activeProjectSlug, activeGallery.images[normalized]);
  });
}

function renderGalleryImage(index){
  if(!activeGallery || !galleryImage) return;
  const total = activeGallery.images.length;
  activeImageIndex = (index + total) % total;
  const file = activeGallery.images[activeImageIndex];
  galleryImage.src = galleryImagePath(activeProjectSlug, file);
  galleryImage.alt = `${activeGallery.title} — fotografía ${activeImageIndex + 1} de ${total}`;
  if(galleryCount) galleryCount.textContent = `${String(activeImageIndex + 1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
  galleryThumbs?.querySelectorAll('.gallery-thumb').forEach((button, i) => {
    button.classList.toggle('active', i === activeImageIndex);
    button.setAttribute('aria-current', i === activeImageIndex ? 'true' : 'false');
  });
  galleryThumbs?.querySelector('.gallery-thumb.active')?.scrollIntoView({behavior:reduceMotion ? 'auto' : 'smooth',block:'nearest',inline:'nearest'});
  preloadGalleryNeighbors();
}

function openGallery(slug, trigger){
  const gallery = projectGalleries[slug];
  if(!gallery || !galleryModal) return;
  activeGallery = gallery;
  activeProjectSlug = slug;
  activeImageIndex = 0;
  galleryTrigger = trigger || null;
  if(galleryTitle) galleryTitle.textContent = gallery.title;
  if(galleryType) galleryType.textContent = gallery.type;
  if(galleryArea) galleryArea.textContent = gallery.area;
  if(galleryThumbs){
    galleryThumbs.innerHTML = gallery.images.map((file, index) => `
      <button class="gallery-thumb${index === 0 ? ' active' : ''}" type="button" data-gallery-index="${index}" aria-label="Ver fotografía ${index + 1} de ${gallery.images.length}" aria-current="${index === 0 ? 'true' : 'false'}">
        <img src="${galleryImagePath(slug,file)}" alt="" loading="lazy" decoding="async">
      </button>
    `).join('');
  }
  renderGalleryImage(0);
  galleryModal.classList.add('open');
  galleryModal.setAttribute('aria-hidden','false');
  document.body.classList.add('gallery-open');
  requestAnimationFrame(() => galleryModal.querySelector('[data-gallery-close]')?.focus());
}

function closeGallery(){
  if(!galleryModal?.classList.contains('open')) return;
  galleryModal.classList.remove('open');
  galleryModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('gallery-open');
  galleryImage?.removeAttribute('src');
  galleryTrigger?.focus();
  activeGallery = null;
  activeProjectSlug = '';
  touchStartX = null;
}

function trapGalleryFocus(event){
  if(event.key !== 'Tab' || !galleryModal?.classList.contains('open') || !galleryDialog) return;
  const focusables = [...galleryDialog.querySelectorAll('button:not([disabled]),a[href],input,textarea,select,[tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.hasAttribute('hidden'));
  if(!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if(event.shiftKey && document.activeElement === first){
    event.preventDefault();
    last.focus();
  }else if(!event.shiftKey && document.activeElement === last){
    event.preventDefault();
    first.focus();
  }
}

document.querySelectorAll('[data-gallery]').forEach(button => {
  button.addEventListener('click', () => openGallery(button.dataset.gallery, button));
});

galleryModal?.addEventListener('click', event => {
  const closeTarget = event.target.closest('[data-gallery-close]');
  const thumb = event.target.closest('[data-gallery-index]');
  if(closeTarget) closeGallery();
  if(thumb) renderGalleryImage(Number(thumb.dataset.galleryIndex));
});

galleryModal?.querySelector('[data-gallery-prev]')?.addEventListener('click', () => renderGalleryImage(activeImageIndex - 1));
galleryModal?.querySelector('[data-gallery-next]')?.addEventListener('click', () => renderGalleryImage(activeImageIndex + 1));

galleryStage?.addEventListener('touchstart', event => {
  touchStartX = event.changedTouches[0]?.clientX ?? null;
}, {passive:true});

galleryStage?.addEventListener('touchend', event => {
  if(touchStartX === null || !activeGallery) return;
  const endX = event.changedTouches[0]?.clientX ?? touchStartX;
  const distance = endX - touchStartX;
  touchStartX = null;
  if(Math.abs(distance) < 55) return;
  renderGalleryImage(activeImageIndex + (distance < 0 ? 1 : -1));
}, {passive:true});

// Contacto: conserva el alcance estático y construye un correo legible de forma consistente.
const contactForm = document.querySelector('[data-contact-form]');
const formStatus = document.querySelector('[data-form-status]');
contactForm?.addEventListener('submit', event => {
  event.preventDefault();
  if(!contactForm.checkValidity()){
    contactForm.reportValidity();
    return;
  }

  const data = new FormData(contactForm);
  const nombre = String(data.get('Nombre') || '').trim();
  const telefono = String(data.get('Telefono') || '').trim();
  const correo = String(data.get('Correo') || '').trim();
  const empresa = String(data.get('Empresa') || '').trim();
  const mensaje = String(data.get('Mensaje') || '').trim();
  const subject = `Solicitud desde sitio web LDR — ${nombre}`;
  const body = [
    'Nueva solicitud desde el sitio web de LDR Constructora',
    '',
    `Nombre: ${nombre}`,
    `Teléfono: ${telefono}`,
    `Correo: ${correo}`,
    `Empresa: ${empresa || 'No indicada'}`,
    '',
    'Proyecto / mensaje:',
    mensaje
  ].join('\n');

  if(formStatus){
    formStatus.textContent = 'Solicitud preparada. Se abrirá tu aplicación de correo para completar el envío.';
    formStatus.classList.add('is-ready');
  }
  window.location.href = `mailto:ldrconstructora@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

document.addEventListener('keydown', event => {
  if(event.key === 'Escape'){
    if(galleryModal?.classList.contains('open')) closeGallery();
    else if(menu?.getAttribute('aria-expanded') === 'true') setMenu(false);
  }
  if(galleryModal?.classList.contains('open')){
    if(event.key === 'ArrowLeft') renderGalleryImage(activeImageIndex - 1);
    if(event.key === 'ArrowRight') renderGalleryImage(activeImageIndex + 1);
    trapGalleryFocus(event);
  }else{
    trapMenuFocus(event);
  }
});

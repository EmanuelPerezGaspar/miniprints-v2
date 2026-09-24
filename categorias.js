// MiniPrints — categorías de productos (compartido por Inicio, Piezas y Ventas).
// La categoría asignada se guarda en mp_categorias ({ pieza: categoria });
// mientras no se asigne, se deduce por palabras en el nombre del producto.
// Las categorías que agregas tú se guardan en mp_categorias_lista y se sincronizan.
(function () {
  const BASE = [
    { id: 'miniaturas', nombre: 'Miniaturas' },
    { id: 'llaveros',   nombre: 'Llaveros' },
    { id: 'figuras',    nombre: 'Figuras' },
    { id: 'oficina',    nombre: 'Oficina' },
    { id: 'hogar',      nombre: 'Hogar' },
  ];
  const PALABRAS = [
    ['llaveros',   /llaver/i],
    ['miniaturas', /miniatura|\bmini\b|warhammer|d&d|dnd|tabletop/i],
    ['figuras',    /figura|estatua|busto|personaje|funko|anime/i],
    ['oficina',    /oficina|soporte|organizador|porta ?(l[aá]piz|lapices|pluma|celular|tarjeta)|escritorio|lapicero/i],
    ['hogar',      /maceta|hogar|l[aá]mpara|florero|jarr[oó]n|decora|gancho|posavaso|cocina/i],
  ];
  // Íconos (trazos SVG de 24×24) por categoría; las propias usan una etiqueta
  const ICONOS = {
    miniaturas: '<circle cx="12" cy="6.5" r="3"/><path d="M9.5 9.5 8.5 16h7l-1-6.5"/><path d="M6.5 20.5h11M7.5 16h9l1 4.5h-11z"/>',
    llaveros: '<circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8 20 3M16.5 6.5l2.5 2.5M14.5 8.5l2 2"/>',
    figuras: '<path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.5l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
    oficina: '<rect x="3" y="7.5" width="18" height="12" rx="2.5"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 13h18"/>',
    hogar: '<path d="M7 11h10l-1.3 9H8.3z"/><path d="M12 11V7m0 0c0-2.2 1.8-3.5 4-3.5 0 2.2-1.8 3.5-4 3.5zm0 0c0-2.2-1.8-3.5-4-3.5 0 2.2 1.8 3.5 4 3.5z"/>',
  };
  const ICONO_PROPIA = '<path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1.5 1.5 0 0 1 0 2.1l-5.7 5.7a1.5 1.5 0 0 1-2.1 0z"/><circle cx="8" cy="8" r="1.5"/>';
  const LISTA_KEY = 'mp_categorias_lista';
  const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const asignadas = () => leer('mp_categorias', {});
  const propias = () => leer(LISTA_KEY, []).filter(c => c && c.id && c.nombre);
  const sinAcentos = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  window.MP_CAT = {
    // Categorías base + las que agregaste
    get lista() { return [...BASE, ...propias()]; },
    esPropia: id => propias().some(c => c.id === id),
    icono: id => ICONOS[id] || ICONO_PROPIA,
    nombre(id) { return (this.lista.find(c => c.id === id) || {}).nombre || 'Sin categoría'; },
    // Devuelve el id de la categoría o null si no se reconoce
    de(pieza, mapa = asignadas()) {
      if (mapa[pieza]) return mapa[pieza];
      const hit = PALABRAS.find(([, re]) => re.test(pieza || ''));
      return hit ? hit[0] : null;
    },
    // Agrega una categoría nueva (o devuelve la que ya existe con ese nombre)
    agregar(nombre) {
      const limpio = String(nombre || '').replace(/\s+/g, ' ').trim().slice(0, 24);
      if (!limpio) return null;
      const bonito = limpio.charAt(0).toUpperCase() + limpio.slice(1);
      const clave = sinAcentos(bonito);
      if (clave === 'sin categoria') return null;
      const existe = this.lista.find(c => sinAcentos(c.nombre) === clave);
      if (existe) return existe;
      const lista = propias();
      const slug = clave.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let id = 'c-' + (slug || Date.now());
      while (this.lista.some(c => c.id === id)) id += '-2';
      const nueva = { id, nombre: bonito };
      lista.push(nueva);
      localStorage.setItem(LISTA_KEY, JSON.stringify(lista));
      return nueva;
    },
  };
})();

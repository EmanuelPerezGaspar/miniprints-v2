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
  const LISTA_KEY = 'mp_categorias_lista';
  const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const asignadas = () => leer('mp_categorias', {});
  const propias = () => leer(LISTA_KEY, []).filter(c => c && c.id && c.nombre);
  const sinAcentos = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  window.MP_CAT = {
    // Categorías base + las que agregaste
    get lista() { return [...BASE, ...propias()]; },
    esPropia: id => propias().some(c => c.id === id),
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

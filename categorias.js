// MiniPrints — categorías de productos (compartido por Inicio y Ventas).
// La categoría asignada se guarda en mp_categorias ({ pieza: categoria });
// mientras no se asigne, se deduce por palabras en el nombre del producto.
(function () {
  const LISTA = [
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
  function asignadas() {
    try { return JSON.parse(localStorage.getItem('mp_categorias') || '{}') || {}; } catch (e) { return {}; }
  }
  window.MP_CAT = {
    lista: LISTA,
    // Devuelve el id de la categoría o null si no se reconoce
    de(pieza, mapa = asignadas()) {
      if (mapa[pieza]) return mapa[pieza];
      const hit = PALABRAS.find(([, re]) => re.test(pieza || ''));
      return hit ? hit[0] : null;
    },
  };
})();

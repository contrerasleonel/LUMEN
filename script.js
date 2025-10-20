const money = n => n.toLocaleString("es-AR");

// Setear cantidad en la tarjeta (y su estado visual)
function setQty($card, qty) {
  qty = Math.max(0, qty);
  $card.attr("data-qty", qty).data("qty", qty); // sincronizo .attr y .data
  const $badge = $card.find(".qty-badge");
  if (qty > 0) $badge.text(qty).removeClass("hidden").addClass("flex");
  else $badge.addClass("hidden").removeClass("flex");
  $card.toggleClass("bg-black/60 border-cyan/50", qty > 0);
  $card.find(".title").toggleClass("text-cyan", qty > 0);
}

// ===== Eventos de carrito =====
$(document).on("click", ".product-card .btn-agregar", function () {
  const $card = $(this).closest(".product-card");
  setQty($card, Number($card.attr("data-qty")) + 1);
  // Cambio controles a +/-:
  $card.find(".controls").html(`
    <div class="flex items-center gap-2">
      <button class="btn-menos w-12 h-12 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center">
        <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><rect x="5" y="11" width="14" height="2"/></svg>
      </button>
      <div class="qty-display flex-1 h-12 bg-cyan/10 border border-cyan/30 rounded-lg flex items-center justify-center text-xl text-cyan">${$card.attr("data-qty")}</div>
      <button class="btn-mas w-12 h-12 bg-cyan/20 hover:bg-cyan/30 text-cyan rounded-lg border border-cyan/30 flex items-center justify-center">
        <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>
      </button>
    </div>
  `);
  recalcular();
});

$(document).on("click", ".product-card .btn-mas", function () {
  const $card = $(this).closest(".product-card");
  setQty($card, Number($card.attr("data-qty")) + 1);
  $card.find(".qty-display").text($card.attr("data-qty"));
  recalcular();
});

$(document).on("click", ".product-card .btn-menos", function () {
  const $card = $(this).closest(".product-card");
  const next = Number($card.attr("data-qty")) - 1;
  setQty($card, next);
  if (next <= 0) {
    $card.find(".controls").html(`
      <button class="btn-agregar w-full h-12 bg-[var(--brand)]/20 hover:bg-[var(--brand)]/30 text-[var(--brand)] rounded-lg border border-[var(--brand)]/30 flex items-center justify-center gap-2">
        <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 10 19h9v-2h-8.42a.25.25 0 0 1-.22-.37L11.1 15h6.45a2 2 0 0 0 1.79-1.11L23 6H6.42l-.7-2Z"/></svg>
        Agregar al Carrito
      </button>
    `);
  } else {
    $card.find(".qty-display").text($card.attr("data-qty"));
  }
  recalcular();
});

// Eliminar desde resumen
$(document).on("click", ".btn-eliminar", function () {
  const id = $(this).data("id");
  const $card = $(`.product-card[data-id="${id}"]`);
  setQty($card, 0);
  $card.find(".controls").html(`
    <button class="btn-agregar w-full h-12 bg-[var(--brand)]/20 hover:bg-[var(--brand)]/30 text-[var(--brand)] rounded-lg border border-[var(--brand)]/30 flex items-center justify-center gap-2">
      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 10 19h9v-2h-8.42a.25.25 0 0 1-.22-.37L11.1 15h6.45a2 2 0 0 0 1.79-1.11L23 6H6.42l-.7-2Z"/></svg>
      Agregar al Carrito
    </button>
  `);
  recalcular();
});

// ===== Cálculo auto-promos =====
function recalcular() {
  // 1) Leer carrito del DOM
  let subtotal = 0;
  const items = [];
  $(".product-card").each(function () {
    const $p = $(this);
    const qty = Number($p.attr("data-qty"));
    if (!qty) return;
    const id = Number($p.data("id"));
    const nombre = $p.data("nombre");
    const precio = Number($p.data("precio"));
    const smart = String($p.data("smart")) === "true";
    subtotal += precio * qty;
    items.push({ id, nombre, precio, qty, smart });
  });
  const cant = items.reduce((s, i) => s + i.qty, 0);

  // 2) Calcular descuentos (APLICACIÓN AUTOMÁTICA)
  // Promo 1: 50% en el segundo (no Smart)
  let d1 = 0;
  let hayParNoSmart = false;
  items.filter(i => !i.smart).forEach(i => {
    const pares = Math.floor(i.qty / 2);
    if (pares > 0) hayParNoSmart = true;
    d1 += pares * (i.precio * 0.5);
  });

  // Promo 2: 3×2 Smart
  let d2 = 0;
  let hayTrioSmart = false;
  items.filter(i => i.smart).forEach(i => {
    const trios = Math.floor(i.qty / 3);
    if (trios > 0) hayTrioSmart = true;
    d2 += trios * i.precio; // uno gratis por cada 3
  });

  // Promo 3: 10% si subtotal > 30k
  const supera30k = subtotal > 30000;
  const d3 = supera30k ? subtotal * 0.10 : 0;

  const descuentoTotal = d1 + d2 + d3;
  const total = Math.max(0, subtotal - descuentoTotal);

  // 3) Resumen
  $("#resumen-sub").text(
    cant > 0 ? `${cant} ${cant === 1 ? "producto" : "productos"} en carrito` : "Tu carrito está vacío"
  );
  $("#box-resumen").toggleClass("bg-black/60 border-[var(--brand)]/30", cant > 0);

  if (items.length === 0) {
    $("#carrito-items").html(`
      <div class="text-center py-12">
        <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" class="w-8 h-8 text-white/40" fill="currentColor"><path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 10 19h9v-2h-8.42a.25.25 0 0 1-.22-.37L11.1 15h6.45a2 2 0 0 0 1.79-1.11L23 6H6.42l-.7-2Z"/></svg>
        </div>
        <p class="text-white/60 text-sm">Agregá productos para calcular tu ahorro</p>
      </div>
    `);
  } else {
    $("#carrito-items").html(items.map(i => `
      <div class="flex items-start gap-3 p-3 bg-black/40 rounded-lg border border-white/5 hover:border-white/10">
        <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img src="${$(`.product-card[data-id="${i.id}"] img`).attr("src")}" alt="${i.nombre}" class="w-full h-full object-cover">
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white mb-1 truncate">${i.nombre}</p>
          <p class="text-xs text-white/60 mb-1">$${money(i.precio)} × ${i.qty}</p>
          <p class="text-sm text-[var(--brand)]">$${money(i.precio * i.qty)}</p>
        </div>
        <button class="btn-eliminar w-8 h-8 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 rounded-lg flex items-center justify-center" data-id="${i.id}">
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1Z"/></svg>
        </button>
      </div>
    `).join(""));
  }

  // 4) Cálculos mostrados (solo si hay ahorro)
  let calcHtml = `
    <div class="flex justify-between text-sm"><span class="text-white/70">Subtotal</span><span class="text-white">$${money(subtotal)}</span></div>
  `;
  if (d1 > 0) calcHtml += `<div class="flex justify-between text-sm"><span class="text-cyan">50% 2do producto</span><span class="text-cyan">-$${money(d1)}</span></div>`;
  if (d2 > 0) calcHtml += `<div class="flex justify-between text-sm"><span class="text-cyan">3×2 Smart</span><span class="text-cyan">-$${money(d2)}</span></div>`;
  if (d3 > 0) calcHtml += `<div class="flex justify-between text-sm"><span class="text-cyan">10% Off</span><span class="text-cyan">-$${money(d3)}</span></div>`;
  if (descuentoTotal > 0) {
    calcHtml += `<div class="pt-3 mt-3 border-t border-cyan/20">
      <div class="flex justify-between"><span class="text-cyan">Total Ahorro</span><span class="text-cyan">-$${money(descuentoTotal)}</span></div>
    </div>`;
  }
  $("#carrito-calculos").html(calcHtml);
  $("#carrito-total").text(`$${money(total)}`);

  // 5) Estado visual y mensajes de cada promo (auto)
  // Promo 1
  setPromoUI("promo1", hayParNoSmart, d1,
    "Agregá 2 o más unidades del mismo producto no Smart");
  // Promo 2
  setPromoUI("promo2", hayTrioSmart, d2,
    "Agregá 3 o más productos Smart");
  // Promo 3
  setPromoUI("promo3", supera30k, d3,
    `Faltan $${money(Math.max(0, 30000 - subtotal))} para activar`);
  
  // Caja ahorro
  if (descuentoTotal > 0) {
    $("#box-ahorro").removeClass("hidden");
    $("#ahorro-msg").text(`Estás ahorrando $${money(descuentoTotal)} en tu compra`);
  } else {
    $("#box-ahorro").addClass("hidden");
  }
}

// UI automática para cada promo
function setPromoUI(promoId, elegible, ahorro, msgNo) {
  const $card = $(`.promo-card[data-promo-id="${promoId}"]`);
  const $msg  = $card.find(".promo-msg");
  const $btn  = $card.find(".promo-btn");

  if (elegible && ahorro > 0) {
    $card.addClass("bg-black/60 border-[var(--brand)]/50");
    $msg.text(`Ahorrás $${money(ahorro)}`).removeClass("text-white/50").addClass("text-cyan");
    $btn.text("Aplicada").removeClass("bg-white/5 text-white").addClass("bg-[var(--brand)] text-black");
  } else {
    $card.removeClass("bg-black/60 border-[var(--brand)]/50");
    $msg.text(msgNo).removeClass("text-cyan").addClass("text-white/50");
    $btn.text("No aplica").removeClass("bg-[var(--brand)] text-black").addClass("bg-white/5 text-white");
  }
}

// Init
$(recalcular);

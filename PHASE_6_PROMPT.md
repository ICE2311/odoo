PROMPT 6 — MERCH SHOP
Read PROJECT_SPEC.md (from Phase 0) first and follow it. Build ONLY this phase.
Scene: "Sell branded hoodies and T-shirts to members. Collect sizes, take orders and payment, and know how many of each size are left. Members order from their phones at any hour."
Rules
Merch is MEMBERS-ONLY. Visitors and non-members can browse /shop and product pages, but every cart, checkout and payment function starts with requireMember().
Membership is re-checked at three points: add to cart, create checkout, and payment capture. If the membership lapsed in between, checkout is blocked with "Your membership has expired — renew to complete this order", holds are released, and (if payment was already captured by the gateway) the order is auto-refunded.
Prices: one price per product/variant (no member discount — only members can buy). Price decided on the server and snapshotted.
Orders that were already paid stay valid and collectable even if the membership lapses afterwards; past orders remain visible in /account/orders.
Products have variants (size, optionally colour) each with its own stock.
Stock is held during checkout and released on fail/expiry. Never sell more than stock.
[ASSUMPTION] Fulfilment is pickup from the club table/office (no shipping). Order has a pickup QR/code.
Per-user max quantity per variant: products.max_per_user (optional).
Build
Tables:
products(id, slug, name, description, image_urls TEXT[] (public https links, max 5, PROJECT_SPEC §1c), base_price_paise, status draft|active|archived, max_per_user NULL)
product_variants(id, product_id, label ('S','M','L','XL'), sku, stock_on_hand, stock_held, price_override_paise NULL)
carts(id, user_id UNIQUE, updated_at); cart_items(cart_id, variant_id, qty)
merch_orders(id, order_number, user_id, total_paise,
             status 'pending_payment'|'paid'|'ready_for_pickup'|'collected'|'cancelled'|'refunded',
             payment_id, collected_at NULL, collected_by NULL, created_at)
merch_order_items(order_id, variant_id, product_name, variant_label, unit_price_paise, qty)   // snapshot
stock_movements(id, variant_id, delta, reason 'restock'|'sale'|'refund'|'adjustment', ref_id, by, at)

Atomic stock hold per variant (same pattern as seats):
UPDATE product_variants SET stock_held = stock_held + :qty
WHERE id=:id AND stock_on_hand - stock_held >= :qty

All variants in one transaction; if any fails, roll back and tell the user which size is out. 3. Register payment purpose merch_order:
computeAmount(orderId, caller):
    requireMember()                     // non-members rejected here too
    return SUM(variant price * qty)     // from DB, never from client
onCaptured(tx, payment):
    if !isActiveMember(payment.user_id):     // lapsed between checkout and capture
        release holds; mark order 'cancelled'; trigger refund; return
    held -> sold, stock_movements 'sale', ledger 'merch_sales',
    email receipt with pickup code
onRefunded: restock, ledger refund

Public /shop (grid, cached) and /shop/[slug] (images, size picker showing "Only 3 left" / "Sold out", price). The action area depends on the caller (decided on the server):
Visitor → "Log in to buy (members only)"
Non-member / lapsed member → "Merch is for members only — Become a member" (links to /account/membership, returns to this product after purchase)
Member → size picker + "Add to cart"
/cart (members only; edit qty) → checkout → PayButton. Non-members hitting /cart get redirected to /account/membership with an explanation.
/account/orders and /account/orders/[id] (status timeline + pickup QR).
Admin /admin/shop (products with stock per size, low-stock badges below settings.low_stock_threshold), /admin/shop/[id] (edit product, variants, paste image links (validated, live preview with <RemoteImage>, reorder), restock/adjust with reason → stock_movements).
Admin /admin/orders: filter by status/product/size, mark ready for pickup (emails the buyer), scan pickup QR → mark collected, refund, and a "size summary" view (how many of each size sold / left) for ordering from the supplier. CSV export.
Checkpoint 6
Concurrency test: variant with stock 3, 10 simultaneous checkouts → exactly 3 sold.
Members-only: Visitor, guest@ (non-member) and lapsed@ get 401/403 on addToCart, createCheckout and payment; member@ and admin@ (member) succeed. Product pages show the correct button for each role. Membership lapsing between cart and capture → order cancelled + auto-refund, no ledger sale (test).
Order snapshot keeps old price after admin changes product price.
Stock after: purchase, refund, restock, adjustment — stock_on_hand always equals SUM(stock_movements) (test).
Pickup QR scan marks order collected; second scan says "already collected at…".
Ledger merch_sales total equals sum of paid orders minus refunds.
Role matrix: admin shop/orders functions → Admin only; /account/orders returns only the caller's orders.
Manual walkthrough on a phone: non-member opens a hoodie page → sees "Members only — Become a member" → buys membership → returns and buys an M hoodie; another member buys 2 L hoodies; admin sees size summary and marks both orders collected.
A member whose membership lapses after buying can still see the order and collect it.
STOP after the Checkpoint Report.


# Add Edit Product Page to Admin Panel

Add an "Edit Product" page so product images (and other fields) can be updated from the webapp UI instead of modifying the database directly.

## Files to Create

- **`app/admin/products/[id]/edit/page.tsx`** — Client component edit form (mirrors `new/page.tsx` pattern)
  - Fetches product data on mount via `GET /api/admin/products/[id]`
  - Pre-fills all fields: name, description, price, stock, isDigital, current image
  - Shows current image preview; allows uploading a replacement via existing `/api/admin/upload-image`
  - Submits changes via `PUT /api/admin/products/[id]`

- **`app/api/admin/products/[id]/route.ts`** — API route for single product operations
  - `GET`: returns product by ID
  - `PUT`: validates and updates product fields (name, description, price, stock, isDigital, image)

## Files to Modify

- **`app/admin/products/page.tsx`** — Add an "Editar" link on each product row pointing to `/admin/products/[id]/edit`

- **`middleware.ts`** — Add matchers for the new routes:
  - `/admin/products/:path*` (covers edit pages)
  - `/api/admin/products/:path*` (covers the new `[id]` API route)

## Design Decisions

- Reuses the existing `upload-image` API — no new upload logic needed
- Follows the same UI style as `new/page.tsx` (Tailwind, react-hook-form, same layout)
- Only the `image` column in the DB gets updated when a new image is uploaded; if no new image is selected, the existing path is preserved
- No DB migration needed — all columns already exist in `ec_products`

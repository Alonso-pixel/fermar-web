# Gemini Product Image Transform Plan

This plan adds a Gemini-powered image transformation section in admin product forms so you can upload an image, transform it with AI while preserving the main product, preview it, and save the transformed PNG as the product image.

## Confirmed Decisions

1. Output format: **PNG**
2. Scope: **both pages** (`new` and `edit`)
3. Prompt UX: **presets + free-text input**
4. Dependency: add **`@google/genai`** SDK

## Current Flow (Baseline)

- New/edit product forms upload image via `POST /api/admin/upload-image`.
- Upload route validates type/size and writes to `public/products/`.
- Product create/update routes store returned image path in DB.
- Admin routes are protected by basic auth middleware.

## Implementation Steps

1. **Environment + dependency setup**
   - Add `@google/genai` to `package.json` dependencies.
   - Extend `src/env.ts` with `GEMINI_API_KEY`.
   - Document this env var in `DOCUMENTATION.md`.

2. **Create Gemini transform API route**
   - Add `app/api/admin/transform-image/route.ts`.
   - Accept `multipart/form-data` with:
     - `image` (required)
     - `prompt` (optional; fallback to default product-safe prompt)
   - Reuse upload constraints (mime + max size).
   - Call Gemini with image + prompt, receive transformed output.
   - Save result as **PNG** into `public/products/` with unique filename.
   - Return `{ success: true, path, filename, appliedPrompt }`.

3. **Protect new API route**
   - Add `/api/admin/transform-image` to `middleware.ts` matcher.

4. **Add AI transform UI to both product pages**
   - Update:
     - `app/admin/products/new/page.tsx`
     - `app/admin/products/[id]/edit/page.tsx`
   - Add section with:
     - free-text prompt textarea
     - preset prompt buttons/chips
     - `Transformar con IA` action button
     - transformed preview block
   - Behavior:
     - user selects source image
     - user applies preset and/or edits prompt
     - app sends image + prompt to `/api/admin/transform-image`
     - transformed image path is used when saving product
     - fallback to original upload flow when no transform is used

5. **Prompt strategy (product-safe)**
   - Default prompt:
     - "Edita esta foto de producto para e-commerce. Mantén intacto el producto principal (misma forma, proporciones, textura, color base, logotipo y detalles de marca). Solo mejora elementos secundarios: iluminación, sombras suaves, fondo limpio/neutral, reflejos controlados y nitidez general. No cambies el diseño del producto, no agregues ni quites partes, no cambies el encuadre principal. Entrega una imagen realista y comercial lista para catálogo."
   - Presets:
     - Fondo neutro premium
     - Look de estudio
     - Contexto suave minimalista

6. **Documentation updates**
   - Update `DOCUMENTATION.md` to include:
     - new API route contract (`/api/admin/transform-image`)
     - admin UI workflow (upload -> transform -> preview -> save)
     - prompt guidelines and safety notes

## Validation Checklist

- Missing `GEMINI_API_KEY` returns clear server error.
- Invalid file type/size is rejected consistently.
- Transformed files are persisted as PNG in `public/products/`.
- Route remains admin-protected.
- New + edit pages both support transform + fallback behavior.

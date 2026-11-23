# Dhaka Flower Tub

Dhaka Flower Tub is a product catalogue website with a WhatsApp-first enquiry flow and a protected product-management dashboard.

## Structure

```text
client/   React + Vite public website and admin UI
server/   Express + MongoDB API
```

## Local development

Install dependencies independently:

```bash
npm --prefix client install
npm --prefix server install
```

Create `server/.env` from `server/.env.example` and set a strong admin password and JWT secret. Create `client/.env` from `client/.env.example` if the API is not running at the default local URL.

Run the API from `server/`:

```bash
npm run dev
```

Run the frontend from `client/` in a second terminal:

```bash
npm run dev
```

The public site is available at `http://localhost:5173/`. The admin login is at `http://localhost:5173/admin/login`.

## Environment variables

### Client

Only browser-safe values belong in `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_WHATSAPP_NUMBER=8801700000000
```

For Vercel, set `VITE_API_URL` to the deployed Render API URL, including `/api`.

### Server

Keep these values in `server/.env` or Render environment settings. Never put them in a `VITE_*` variable:

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
NODE_ENV=development
CLIENT_URL=http://localhost:5173
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-long-random-password
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=8h

# Image uploads (see "Image uploads" below)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_FOLDER=dhakaflowertub   # optional
```

## Image uploads

Admins upload product and offer images straight from their device (Admin > Add/Edit product, Add/Edit offer package). The same `ImageUploader` component (`client/src/admin/ImageUploader.jsx`) is used for both.

**Provider: [Cloudinary](https://cloudinary.com) free plan** (no credit card required).

How it works:

1. The browser asks the API for a signed upload payload (`POST /api/uploads/sign`, admin only).
2. The browser uploads the file directly to Cloudinary (this gives real upload progress and keeps large files off the Render server).
3. Cloudinary returns a URL. Only the URL, alt text and `publicId` are stored in MongoDB (`images[].url|alt|publicId` on products, `image.url|alt|publicId` on offers). No image data is stored in the database.
4. When an image is replaced, removed, or its product/offer is deleted, the old Cloudinary file is deleted by the API (best effort; failures never block a save).

Setup:

1. Create a free account at cloudinary.com and open **Settings > API Keys**.
2. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` to `server/.env` locally and to the Render environment settings. The secret never reaches the browser and must not be put in a `VITE_*` variable.
3. Restart the API. Until these are set, the upload button shows a clear "not configured" error.

Optimisation and validation:

- Browser and server-signed rules: JPG, PNG, WebP or AVIF, maximum 5 MB per file (the signed upload also restricts formats).
- Stored originals are resized down to at most 2000 x 2000 px (`c_limit`).
- The public site requests Cloudinary images with `f_auto,q_auto` and a width, so visitors get WebP/AVIF at an appropriate size.
- Existing images (for example Unsplash URLs) keep working. They are shown in the editor and can be replaced; they are never deleted from their host.

Free-plan limits (verify current numbers at cloudinary.com/pricing; they can change):

- 25 credits per month, shared between storage, bandwidth and transformations (about 1 GB of delivery or 1 GB of storage per credit).
- Maximum image file size 10 MB on the free plan (this site enforces 5 MB).
- Limits are soft: Cloudinary contacts you before restricting an account. Stored images are never moved if you later change provider, because the database only holds plain URLs.

## Categories

The catalogue always has exactly four categories: **Residential, Corporate, Commercial, Hospitality**.

- Products store the stable key (`residential`, `corporate`, `commercial`, `hospitality`), so renaming a category never breaks products.
- Admin > Categories lets you edit each category's **name and description**. You cannot add a fifth or delete one (the API has no create/delete routes). Edits appear on the website automatically.
- Product forms use a dropdown of the four categories; the API rejects any other value.
- Public API: `GET /api/categories`. Admin API: `PUT /api/categories/:key`.

### Migration of existing products

On every API start (after connecting to MongoDB) the server creates any missing category and maps products that still use the old free-text categories. Nothing is deleted and the old value is kept in `legacyCategory`:

| Old category | New category |
| --- | --- |
| Indoor Planters | Residential |
| Outdoor Tubs | Hospitality |
| Architectural Tubs | Corporate |
| Ceramic Series | Commercial |
| anything else | Residential |

This mapping is a starting point. Review it in Admin > Products and move products to the right category if needed.

## Typography

One typeface family everywhere: **Plus Jakarta Sans**, with **Hind Siliguri** as the Bangla/Unicode fallback (loaded from Google Fonts in `client/index.html`). Tokens are in `client/src/index.css` (`--font-sans`, `--font-ui`); the `font-serif` Tailwind utility maps to the same family.

## Commands

From `client/`:

```bash
npm run dev
npm run build
npm run lint
```

From `server/`:

```bash
npm run dev
npm start
npm run seed
```

## Deployment

### Vercel

Create a Vercel project with root directory `client`. Use the Vite defaults: build command `npm run build`, output directory `dist`, and install command `npm install`. Set the public `VITE_API_URL` and `VITE_WHATSAPP_NUMBER` environment variables. `client/vercel.json` rewrites admin/browser routes to the SPA entry point.

### Render

Create a Web Service with root directory `server`, build command `npm install`, and start command `npm start`. Add `MONGODB_URI`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_EXPIRES_IN`, `CLIENT_URL`, and `NODE_ENV` in the Render environment settings. Use the MongoDB Atlas connection string for `MONGODB_URI`.

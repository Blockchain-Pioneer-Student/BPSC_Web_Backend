# Local development and upload storage

This setup uses a PostgreSQL container. Image storage can be switched between
the backend's `uploads` folder and Cloudinary with `UPLOAD_STORAGE`.

## Choose image storage

Set one of these values in `BPSC_Web_Backend/.env`, then restart the backend:

```env
UPLOAD_STORAGE=local
```

Local uploads are served from `http://localhost:10000/uploads/...` and persist
in the ignored `uploads` folder.

```env
UPLOAD_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Cloudinary credentials are required for Cloudinary mode. The current local
`.env` can stay set to `local` until those credentials are available. Uploaded
URLs are saved with the page content, so switching storage does not migrate
images that were already uploaded.

## Start PostgreSQL

From this folder, run:

```powershell
docker compose up -d
docker compose ps
```

The database listens on `localhost:5432`. If that port is already occupied,
change the left side of `5432:5432` in `docker-compose.yml` to `5433:5432`, and
change the port in `DATABASE_URL` to `5433`.

## Start the three apps

The backend `.env` should contain the local settings shown in `.env.example`,
with `UPLOAD_STORAGE=local` while Cloudinary credentials are unavailable.
`TYPEORM_SYNCHRONIZE=true` creates the local schema on first start and seeds
the root/admin roles plus sample event/blog categories. This setting is ignored
when `NODE_ENV=production`.

In separate PowerShell terminals:

```powershell
# BPSC_Web_Backend
npm run start:dev
```

```powershell
# BPSC_Web_Admin
npm run dev
```

```powershell
# BPSC_Web_Client
npm run dev
```

Both frontend `.env.local` files should set:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:10000/api
```

## Create a local admin account

After the backend is ready, create a root account once:

```powershell
$body = @{
  username = 'localadmin'
  email = 'localadmin@example.local'
  password = 'LocalTest123!'
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:10000/api/auth/create-root' `
  -ContentType 'application/json' `
  -Body $body
```

Sign in to Admin at `http://localhost:8080` using `localadmin` and that password.
Open **Nội dung website**, upload a hero background in About, Events, News, or
Team, save that section, then view its page in Client at `http://localhost:8081`.

Local-mode images are served from `http://localhost:10000/uploads/...` and
persist under the backend's ignored `uploads` folder. Stop PostgreSQL with
`docker compose down`; use `docker compose down -v` only when you want to delete
the local database and all its records.

# Storage setup for Designer Drop

This guide walks through setting up object storage for uploaded screen recordings and screenshots. The backend will receive files in `POST /upload`, store them in one of the options below, and return URLs for the frontend to save in each drop.

---

## Flow

1. User selects a file in the app → frontend sends it to your backend `POST /upload`.
2. Backend uploads the file to object storage and gets a permanent URL.
3. Backend returns `{ url, thumbnailUrl? }` to the frontend.
4. Frontend includes that URL in `CreateDropInput` when calling `POST /drops`.

Credentials (API keys, bucket names) stay on the backend only; the browser never talks to storage directly.

---

## Option 1: Supabase Storage (fastest to try)

Supabase gives you a Postgres DB, Auth, and Storage in one project. Good for MVP and internal tools.

### 1. Create project and bucket

1. Go to [supabase.com](https://supabase.com) → Sign in → **New project** (e.g. `designer-drop`).
2. In the dashboard: **Storage** → **New bucket**.
3. Name: `drops`. Set **Public bucket** to **On** so files are readable via URL (or use signed URLs if you prefer).
4. Optional: under **Policies**, add a policy so only authenticated users can upload (or restrict to your backend via service role).

### 2. Get credentials

- **Project URL:** Settings → API → **Project URL** (e.g. `https://xxxx.supabase.co`).
- **Service role key:** Settings → API → **service_role** (secret; use only on backend).

### 3. Environment variables (backend)

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=drops
```

### 4. Backend upload example (Node)

```bash
npm install @supabase/supabase-js
```

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'drops'

export async function uploadFile(file, userId) {
  const ext = file.originalname.split('.').pop() || 'bin'
  const path = `${userId}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (error) throw error

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return { url: urlData.publicUrl }
}
```

Use this inside your `POST /upload` handler (e.g. Express `multer` or similar to get `file` from `multipart/form-data`).

---

## Option 2: Cloudflare R2 (S3-compatible, no egress fees)

R2 is S3-compatible, so you can use the AWS SDK. Good if you expect a lot of video traffic and want to avoid egress costs.

### 1. Create bucket

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → **Create bucket**.
2. Name: `designer-drop` (or `designer-drop-prod`). Region optional.

### 2. API tokens

1. **R2** → **Manage R2 API Tokens** → **Create API token**.
2. Permissions: **Object Read & Write** for this bucket (or all buckets).
3. Copy **Access Key ID** and **Secret Access Key** (and note the **Endpoint** URL shown for your bucket).

### 3. Environment variables (backend)

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=designer-drop
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

For public read access you can enable a custom domain or R2’s public bucket URL in the R2 dashboard (Settings for the bucket).

### 4. Backend upload example (Node, AWS SDK v3)

```bash
npm install @aws-sdk/client-s3
```

```js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME
const PUBLIC_URL = process.env.R2_PUBLIC_URL // e.g. your custom domain or R2 dev URL

export async function uploadFile(file, userId) {
  const ext = file.originalname.split('.').pop() || 'bin'
  const key = `${userId}/${Date.now()}.${ext}`

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  )

  const url = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : `https://${BUCKET}.r2.dev/${key}`
  return { url }
}
```

---

## Option 3: AWS S3

If you already use AWS or want a widely supported option.

### 1. Create bucket

1. AWS Console → **S3** → **Create bucket**.
2. Name: e.g. `designer-drop-uploads`. Block public access if you prefer; then use presigned URLs for read.
3. For simple public read: Bucket policy to allow `GetObject` from your frontend origin or from everyone (less secure).

### 2. IAM user for the backend

1. **IAM** → **Users** → **Create user** (e.g. `designer-drop-backend`).
2. Attach a policy that allows `s3:PutObject`, `s3:GetObject`, and optionally `s3:DeleteObject` on the bucket ARN.
3. Create **Access key** → copy Access Key ID and Secret.

### 3. Environment variables (backend)

```env
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=designer-drop-uploads
S3_PUBLIC_BASE=https://designer-drop-uploads.s3.eu-west-1.amazonaws.com
```

(Or use a CloudFront distribution URL for `S3_PUBLIC_BASE`.)

### 4. Backend upload example (Node, AWS SDK v3)

```bash
npm install @aws-sdk/client-s3
```

```js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.S3_BUCKET
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE

export async function uploadFile(file, userId) {
  const ext = file.originalname.split('.').pop() || 'bin'
  const key = `drops/${userId}/${Date.now()}.${ext}`

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  )

  const url = PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  return { url }
}
```

---

## Suggested path

- **Quickest:** Supabase Storage (Option 1) — create project, bucket, and use the Node snippet in your `POST /upload` handler.
- **Scale / low cost for video:** Cloudflare R2 (Option 2) with the S3-compatible snippet.
- **Already on AWS:** S3 (Option 3) with IAM and the S3 snippet.

After storage is set up, implement the rest of the backend (DB for drops, auth) as in [BACKEND.md](./BACKEND.md) and point the frontend’s upload flow at your `POST /upload` endpoint.

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { GoogleGenAI } from '@google/genai'

const app = express()
const port = process.env.PORT || 3001

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'drops'

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null

const openaiApiKey = process.env.OPENAI_API_KEY
const geminiApiKey = process.env.GEMINI_API_KEY
const synthesizeSecret = process.env.SYNTHESIZE_SECRET
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null
const gemini = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null

/** Whether we can run digest/user synthesis (needs OpenAI or Gemini). */
const hasSynthesisLLM = !!(openai || gemini)

/** Build text for embedding from drop row (title, description, tags, project, labels) */
function dropToEmbeddingText(row) {
  const parts = [row.title, row.description].filter(Boolean)
  if (row.tags?.length) parts.push(...row.tags)
  if (row.project) parts.push(row.project)
  if (row.labels?.length) parts.push(...row.labels)
  return parts.join(' ').slice(0, 8000)
}

/** Generate embedding and upsert into drop_embeddings. No-op if openai not configured. */
async function ensureDropEmbedding(dropId, row) {
  if (!openai || !supabase) return
  const text = dropToEmbeddingText(row)
  if (!text.trim()) return
  try {
    const { data: emb } = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    const vector = emb?.data?.[0]?.embedding
    if (!vector || !Array.isArray(vector)) return
    await supabase.from('drop_embeddings').upsert(
      { drop_id: dropId, embedding: vector, updated_at: new Date().toISOString() },
      { onConflict: 'drop_id' }
    )
  } catch (err) {
    console.error('Embedding error for drop', dropId, err.message)
  }
}

/**
 * Run a single chat completion for synthesis (digest or user synthesis).
 * Uses Gemini if GEMINI_API_KEY is set, otherwise OpenAI. Returns trimmed assistant text.
 */
async function llmChat(systemPrompt, userPrompt) {
  if (gemini) {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    })
    const text = (response?.text ?? '').trim()
    if (!text) throw new Error('Empty response from Gemini')
    return text
  }
  if (openai) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    })
    const text = (completion.choices[0]?.message?.content ?? '').trim()
    if (!text) throw new Error('Empty response from OpenAI')
    return text
  }
  throw new Error('No LLM configured. Set OPENAI_API_KEY or GEMINI_API_KEY in server .env')
}

app.use(cors({ origin: true }))
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
})

const defaultOwner = {
  id: 'current-user-1',
  displayName: 'Current User',
  avatarUrl: undefined,
}

/** Map Postgres row (snake_case) to API shape (camelCase) */
function rowToDrop(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerDisplayName: row.owner_name,
    ownerAvatarUrl: row.owner_avatar ?? undefined,
    type: row.type,
    title: row.title,
    description: row.description ?? undefined,
    videoUrl: row.video_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    url: row.url ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    tags: row.tags ?? [],
    mentionedUserIds: row.mentioned_ids ?? [],
    mentionedUsers: [],
    project: row.project ?? undefined,
    labels: row.labels ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    visibility: row.visibility || 'public',
  }
}

// POST /api/upload – upload file to Supabase Storage, return URL
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }
  if (!supabase) {
    return res.status(503).json({
      message:
        'Storage not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET in server/.env',
    })
  }

  const ownerId = defaultOwner.id
  const ext = req.file.originalname.split('.').pop() || 'bin'
  const path = `${ownerId}/${Date.now()}.${ext}`

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return res.status(500).json({ message: error.message || 'Upload failed' })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(data.path)
    res.json({ url: publicUrl, thumbnailUrl: publicUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message || 'Upload failed' })
  }
})

// GET /api/drops
app.get('/api/drops', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ message: 'Supabase not configured. Set SUPABASE_* in server/.env' })
  }
  const forYou = req.query.forYou === 'true'
  const userId = req.query.userId || (forYou ? defaultOwner.id : null)
  const includePrivate = req.query.includePrivate === 'true'
  const ownerId = req.query.ownerId
  const tag = req.query.tag
  const project = req.query.project
  const dateFrom = req.query.dateFrom
  const dateTo = req.query.dateTo

  if (forYou && userId && openai) {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50)
    const { data: userDrops } = await supabase
      .from('drops')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    const contextText = (userDrops || [])
      .map((row) => dropToEmbeddingText(row))
      .filter(Boolean)
      .join('\n')
      .slice(0, 8000)
    if (!contextText.trim()) {
      const { data, error } = await supabase
        .from('drops')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) return res.status(500).json({ message: error.message })
      return res.json((data || []).map(rowToDrop))
    }
    try {
      const { data: emb } = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: contextText,
      })
      const vector = emb?.data?.[0]?.embedding
      if (!vector || !Array.isArray(vector)) {
        const { data, error } = await supabase
          .from('drops')
          .select('*')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(limit)
        if (error) return res.status(500).json({ message: error.message })
        return res.json((data || []).map(rowToDrop))
      }
      const { data: matchRows, error: rpcError } = await supabase.rpc('match_drops_by_embedding', {
        query_embedding: vector,
        p_limit: limit,
      })
      if (rpcError || !matchRows?.length) {
        const { data, error } = await supabase
          .from('drops')
          .select('*')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(limit)
        if (error) return res.status(500).json({ message: error.message })
        return res.json((data || []).map(rowToDrop))
      }
      const ids = matchRows.map((r) => r.drop_id)
      let dropsQuery = supabase.from('drops').select('*').in('id', ids)
      if (!includePrivate) dropsQuery = dropsQuery.eq('visibility', 'public')
      const { data: drops, error: dropsError } = await dropsQuery
      if (dropsError || !drops?.length) return res.json([])
      const byId = Object.fromEntries(drops.map((d) => [d.id, d]))
      const ordered = ids.filter((id) => byId[id]).map((id) => rowToDrop(byId[id]))
      return res.json(ordered)
    } catch (err) {
      console.error('For you feed error:', err)
      const { data, error } = await supabase
        .from('drops')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) return res.status(500).json({ message: error.message })
      return res.json((data || []).map(rowToDrop))
    }
  }

  let query = supabase.from('drops').select('*').order('created_at', { ascending: false })
  if (ownerId) {
    query = query.eq('owner_id', ownerId)
  } else {
    if (!includePrivate) query = query.eq('visibility', 'public')
  }
  if (tag) query = query.contains('tags', [tag])
  if (project) query = query.eq('project', project)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)

  const { data, error } = await query
  if (error) {
    console.error('Drops list error:', error)
    return res.status(500).json({ message: error.message || 'Failed to list drops' })
  }
  res.json((data || []).map(rowToDrop))
})

// GET /api/drops/:id
app.get('/api/drops/:id', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ message: 'Supabase not configured. Set SUPABASE_* in server/.env' })
  }
  const { data, error } = await supabase
    .from('drops')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (error || !data) return res.status(404).json({ message: 'Drop not found' })
  res.json(rowToDrop(data))
})

// POST /api/drops
app.post('/api/drops', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ message: 'Supabase not configured. Set SUPABASE_* in server/.env' })
  }
  const body = req.body
  const row = {
    owner_id: defaultOwner.id,
    owner_name: defaultOwner.displayName,
    owner_avatar: defaultOwner.avatarUrl ?? null,
    type: body.type || 'screenshot',
    title: body.title || 'Untitled',
    description: body.description ?? null,
    video_url: body.videoUrl ?? null,
    image_url: body.imageUrl ?? null,
    url: body.url ?? null,
    thumbnail_url: body.thumbnailUrl ?? null,
    tags: body.tags || [],
    mentioned_ids: body.mentionedUserIds || [],
    project: body.project ?? null,
    labels: body.labels || [],
    visibility: body.visibility || 'public',
  }
  const { data, error } = await supabase.from('drops').insert(row).select().single()
  if (error) {
    console.error('Create drop error:', error)
    return res.status(500).json({ message: error.message || 'Failed to create drop' })
  }
  ensureDropEmbedding(data.id, data).catch(() => {})
  res.status(201).json(rowToDrop(data))
})

// PUT /api/drops/:id
app.put('/api/drops/:id', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ message: 'Supabase not configured. Set SUPABASE_* in server/.env' })
  }
  const body = req.body
  const update = {
    title: body.title,
    description: body.description,
    tags: body.tags,
    mentioned_ids: body.mentionedUserIds,
    project: body.project,
    labels: body.labels,
    visibility: body.visibility,
    updated_at: new Date().toISOString(),
  }
  Object.keys(update).forEach((k) => update[k] === undefined && delete update[k])
  const { data, error } = await supabase
    .from('drops')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error || !data) return res.status(404).json({ message: 'Drop not found' })
  ensureDropEmbedding(data.id, data).catch(() => {})
  res.json(rowToDrop(data))
})

// GET /api/drops/:id/related – related drops by embedding similarity
app.get('/api/drops/:id/related', async (req, res) => {
  if (!supabase) return res.status(503).json({ message: 'Supabase not configured' })
  const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10)
  const { data: currentDrop, error: currentError } = await supabase
    .from('drops')
    .select('tags, project')
    .eq('id', req.params.id)
    .single()
  const curTags = new Set((currentDrop?.tags || []).filter(Boolean))
  const curProject = currentDrop?.project || ''
  const { data: rows, error } = await supabase.rpc('get_related_drop_ids', {
    p_drop_id: req.params.id,
    p_limit: limit,
  })
  if (error) {
    if (error.code === '42883') return res.json([])
    return res.status(500).json({ message: error.message })
  }
  if (!rows?.length) return res.json([])
  const ids = rows.map((r) => r.related_id)
  const { data: drops, error: dropsError } = await supabase.from('drops').select('*').in('id', ids)
  if (dropsError || !drops?.length) return res.json([])
  const byId = Object.fromEntries(drops.map((d) => [d.id, d]))
  const result = ids.map((id) => {
    const r = rows.find((x) => x.related_id === id)
    const row = byId[id]
    const tagsOverlap = row?.tags?.some((t) => curTags.has(t))
    const projectMatch = curProject && row?.project === curProject
    const reason = tagsOverlap || projectMatch ? 'Similar tags and project' : 'Similar theme'
    return { drop: rowToDrop(row), score: r?.score, reason }
  })
  res.json(result)
})

// DELETE /api/drops/:id
app.delete('/api/drops/:id', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ message: 'Supabase not configured. Set SUPABASE_* in server/.env' })
  }
  const { data, error } = await supabase.from('drops').delete().eq('id', req.params.id).select()
  if (error) {
    console.error('Delete drop error:', error)
    return res.status(500).json({ message: error.message || 'Failed to delete drop' })
  }
  if (!data || data.length === 0) return res.status(404).json({ message: 'Drop not found' })
  res.status(204).send()
})

// GET /api/users/search – stub for @mentions
app.get('/api/users/search', (req, res) => {
  res.json([])
})

// --- Digests (weekly synthesis) ---
function rowToDraftDigest(row) {
  return {
    id: row.id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    contentMd: row.content_md,
    createdAt: row.created_at,
    createdBy: row.created_by ?? undefined,
  }
}
function rowToDigest(row) {
  return {
    id: row.id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    contentMd: row.content_md,
    publishedAt: row.published_at,
    publishedBy: row.published_by ?? undefined,
  }
}

// GET /api/digests/draft – latest draft for review
app.get('/api/digests/draft', async (req, res) => {
  if (!supabase) return res.status(503).json({ message: 'Supabase not configured' })
  const { data, error } = await supabase
    .from('draft_digests')
    .select('*')
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return res.status(500).json({ message: error.message })
  if (!data) return res.json(null)
  res.json(rowToDraftDigest(data))
})

// POST /api/digests/publish – publish a draft (body: { draftId } or { periodEnd })
app.post('/api/digests/publish', async (req, res) => {
  if (!supabase) return res.status(503).json({ message: 'Supabase not configured' })
  const { draftId, periodEnd } = req.body || {}
  let draft
  if (draftId) {
    const { data, error } = await supabase.from('draft_digests').select('*').eq('id', draftId).single()
    if (error || !data) return res.status(404).json({ message: 'Draft not found' })
    draft = data
  } else if (periodEnd) {
    const { data, error } = await supabase.from('draft_digests').select('*').eq('period_end', periodEnd).maybeSingle()
    if (error || !data) return res.status(404).json({ message: 'Draft not found for this period' })
    draft = data
  } else {
    return res.status(400).json({ message: 'Provide draftId or periodEnd' })
  }
  const publishedBy = defaultOwner.id
  const { data: inserted, error } = await supabase
    .from('digests')
    .insert({
      period_start: draft.period_start,
      period_end: draft.period_end,
      content_md: draft.content_md,
      published_by: publishedBy,
    })
    .select()
    .single()
  if (error) return res.status(500).json({ message: error.message })
  res.status(201).json(rowToDigest(inserted))
})

// GET /api/digests – list published digests (newest first)
app.get('/api/digests', async (req, res) => {
  if (!supabase) return res.status(503).json({ message: 'Supabase not configured' })
  const { data, error } = await supabase
    .from('digests')
    .select('*')
    .order('published_at', { ascending: false })
  if (error) return res.status(500).json({ message: error.message })
  res.json((data || []).map(rowToDigest))
})

/** Run weekly synthesis for a period; returns markdown. Caller must have supabase + (openai or gemini). */
async function runSynthesis(periodStart, periodEnd) {
  const { data: drops, error: dropsError } = await supabase
    .from('drops')
    .select('id, title, description, tags, project, labels, owner_name, created_at')
    .eq('visibility', 'public')
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd + 'T23:59:59.999Z')
    .order('created_at', { ascending: true })
  if (dropsError) throw new Error(dropsError.message)
  const payload = (drops || []).map((d) => ({
    id: d.id,
    title: d.title,
    description: (d.description || '').slice(0, 500),
    tags: d.tags || [],
    project: d.project || null,
    labels: d.labels || [],
    ownerDisplayName: d.owner_name,
    createdAt: d.created_at,
  }))
  const systemPrompt = `You are summarizing a week of design work for an internal design team. Produce a single markdown document. Use clear formatting: bullet points, quoted highlights where relevant, **bold** for emphasis, and tag relevant people by name (e.g. "@Name" or "Name's work") when their work is featured. Include links to specific drops where useful using [title](/drops/DROP_ID) with the drop id from the payload. Be concise. Synthesize themes and overlaps; do not just list drops.`
  const userPrompt = `DROPS (last 7 days). Each drop has an id (use for links), title, description, tags, project, ownerDisplayName, createdAt:
${JSON.stringify(payload, null, 2)}

Produce a single markdown document with exactly these sections. Use bullets, quotes, and tag people by name where relevant. Use [Source: title](/drops/<id>) for drop links.

## Summary
(2–3 sentences for leadership)

## Major themes
(Bullet points; tag people involved)

## Repeated problem areas
(Where multiple people are solving similar things)

## Emerging patterns
(What's trending across work)

## Cross-team overlaps
(Explicit connections; tag people)

## Risks and duplication
(Potential duplicate effort or gaps)

## Copy-paste for Slack
(Short, scannable version under 2000 chars)`
  const contentMd = await llmChat(systemPrompt, userPrompt)
  return contentMd
}

// POST /api/digests/generate – generate draft for last 7 days (no secret; for in-app "Generate draft" button)
app.post('/api/digests/generate', async (req, res) => {
  if (!supabase) return res.status(503).json({ message: 'Supabase not configured' })
  if (!hasSynthesisLLM) return res.status(503).json({ message: 'AI not configured. Set OPENAI_API_KEY or GEMINI_API_KEY in server/.env' })
  const now = new Date()
  const periodEnd = now.toISOString().slice(0, 10)
  const periodStartDate = new Date(now)
  periodStartDate.setDate(periodStartDate.getDate() - 7)
  const periodStart = periodStartDate.toISOString().slice(0, 10)
  try {
    const contentMd = await runSynthesis(periodStart, periodEnd)
    const { data: draft, error: draftError } = await supabase
      .from('draft_digests')
      .upsert(
        { period_start: periodStart, period_end: periodEnd, content_md: contentMd },
        { onConflict: 'period_end' }
      )
      .select()
      .single()
    if (draftError) return res.status(500).json({ message: draftError.message })
    res.status(201).json(rowToDraftDigest(draft))
  } catch (err) {
    console.error('Generate digest error:', err)
    res.status(500).json({ message: err.message || 'Synthesis failed' })
  }
})

// POST /api/admin/synthesize-weekly – same as generate, but for cron; protect with SYNTHESIZE_SECRET
app.post('/api/admin/synthesize-weekly', async (req, res) => {
  const secret = req.headers['x-synthesize-secret'] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (synthesizeSecret && secret !== synthesizeSecret) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  if (!supabase) return res.status(503).json({ message: 'Supabase not configured' })
  if (!hasSynthesisLLM) return res.status(503).json({ message: 'AI not configured. Set OPENAI_API_KEY or GEMINI_API_KEY in server/.env' })
  const now = new Date()
  const periodEnd = now.toISOString().slice(0, 10)
  const periodStartDate = new Date(now)
  periodStartDate.setDate(periodStartDate.getDate() - 7)
  const periodStart = periodStartDate.toISOString().slice(0, 10)
  try {
    const contentMd = await runSynthesis(periodStart, periodEnd)
    const { data: draft, error: draftError } = await supabase
      .from('draft_digests')
      .upsert(
        { period_start: periodStart, period_end: periodEnd, content_md: contentMd },
        { onConflict: 'period_end' }
      )
      .select()
      .single()
    if (draftError) return res.status(500).json({ message: draftError.message })
    res.status(201).json(rowToDraftDigest(draft))
  } catch (err) {
    console.error('Synthesize error:', err)
    res.status(500).json({ message: err.message || 'Synthesis failed' })
  }
})

// POST /api/digests/regenerate – re-run synthesis for the current draft period (no secret; for in-app Regenerate button)
app.post('/api/digests/regenerate', async (req, res) => {
  if (!supabase) return res.status(503).json({ message: 'Supabase not configured' })
  if (!hasSynthesisLLM) return res.status(503).json({ message: 'AI not configured. Set OPENAI_API_KEY or GEMINI_API_KEY in server/.env' })
  const { data: latest, error: fetchError } = await supabase
    .from('draft_digests')
    .select('period_start, period_end')
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (fetchError) return res.status(500).json({ message: fetchError.message })
  if (!latest) return res.status(404).json({ message: 'No draft to regenerate' })
  const { period_start: periodStart, period_end: periodEnd } = latest
  try {
    const contentMd = await runSynthesis(periodStart, periodEnd)
    const { data: draft, error: draftError } = await supabase
      .from('draft_digests')
      .upsert(
        { period_start: periodStart, period_end: periodEnd, content_md: contentMd },
        { onConflict: 'period_end' }
      )
      .select()
      .single()
    if (draftError) return res.status(500).json({ message: draftError.message })
    res.status(200).json(rowToDraftDigest(draft))
  } catch (err) {
    console.error('Regenerate error:', err)
    res.status(500).json({ message: err.message || 'Regenerate failed' })
  }
})

// --- User syntheses ("Synthesize my work") ---
const SYNTHESIS_OUTPUT_TYPES = {
  colleague_update: 'Update for a colleague',
  performance_review: 'Professional milestone / performance review',
  other: 'Other',
}

function rowToUserSynthesis(row, sourceDrops = []) {
  return {
    id: row.id,
    userId: row.user_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    outputType: row.output_type,
    contentMd: row.content_md,
    sourceIds: row.source_ids ?? [],
    sourceDrops: sourceDrops.map((d) => ({ id: d.id, title: d.title })),
    createdAt: row.created_at,
  }
}

function getDateRangeFromPreset(preset) {
  const now = new Date()
  const to = now.toISOString().slice(0, 10)
  const from = new Date(now)
  const day = 24 * 60 * 60 * 1000
  switch (preset) {
    case '3d': from.setDate(from.getDate() - 3); break
    case '7d': from.setDate(from.getDate() - 7); break
    case '30d': from.setDate(from.getDate() - 30); break
    case '180d': from.setDate(from.getDate() - 180); break
    default: return null
  }
  return { start: from.toISOString().slice(0, 10), end: to }
}

/** Run user-scoped synthesis: drops owned by user; optionally include drops where user is mentioned. */
async function runUserSynthesis(userId, periodStart, periodEnd, outputType, customOutputDescription, includeMentioned = true) {
  const periodEndCeil = periodEnd + 'T23:59:59.999Z'
  const { data: owned } = await supabase
    .from('drops')
    .select('id, title, description, tags, project, owner_name, created_at')
    .eq('owner_id', userId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEndCeil)
    .order('created_at', { ascending: true })
  const drops = [...(owned || [])]
  if (includeMentioned) {
    const { data: mentioned } = await supabase
      .from('drops')
      .select('id, title, description, tags, project, owner_name, created_at')
      .contains('mentioned_ids', [userId])
      .gte('created_at', periodStart)
      .lte('created_at', periodEndCeil)
      .order('created_at', { ascending: true })
    const seen = new Set(drops.map((d) => d.id))
    for (const d of mentioned || []) {
      if (!seen.has(d.id)) { seen.add(d.id); drops.push(d) }
    }
  }
  drops.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const sourceIds = drops.map((d) => d.id)
  const payload = drops.map((d) => ({
    id: d.id,
    title: d.title,
    description: (d.description || '').slice(0, 400),
    tags: d.tags || [],
    project: d.project || null,
    ownerDisplayName: d.owner_name,
    createdAt: d.created_at,
  }))
  const outputLabel = outputType === 'other' && customOutputDescription
    ? customOutputDescription.slice(0, 200)
    : (SYNTHESIS_OUTPUT_TYPES[outputType] || outputType)
  const systemPrompt = `You are helping a designer summarize their work for: ${outputLabel}. Produce a single markdown document. Be concise. Include inline citations to sources using markdown links in the form [Source: title](/drops/DROP_ID) where DROP_ID is the exact id from the payload. Use each drop's id from the JSON for the link.`
  const userPrompt = `DROPS (period ${periodStart} to ${periodEnd}):
${JSON.stringify(payload, null, 2)}

Produce a markdown summary suitable for: ${outputLabel}. Use [Source: Title](/drops/<id>) for citations.`
  const contentMd = await llmChat(systemPrompt, userPrompt)
  return { contentMd, sourceIds }
}

// POST /api/syntheses – create a new user synthesis
app.post('/api/syntheses', async (req, res) => {
  if (!supabase) return res.status(503).json({ message: 'Supabase not configured' })
  if (!hasSynthesisLLM) return res.status(503).json({ message: 'AI not configured. Set OPENAI_API_KEY or GEMINI_API_KEY in server/.env' })
  const { userId, datePreset, periodStart, periodEnd, outputType, customOutputDescription, includeMentioned } = req.body || {}
  if (!userId) return res.status(400).json({ message: 'userId is required' })
  const type = outputType || 'colleague_update'
  const includeMent = includeMentioned !== false
  let start = periodStart
  let end = periodEnd
  if (datePreset && datePreset !== 'all') {
    const range = getDateRangeFromPreset(datePreset)
    if (!range) return res.status(400).json({ message: 'Invalid datePreset' })
    start = range.start
    end = range.end
  }
  if (!start || !end) return res.status(400).json({ message: 'Provide datePreset or periodStart and periodEnd' })
  try {
    const { contentMd, sourceIds } = await runUserSynthesis(userId, start, end, type, customOutputDescription, includeMent)
    const { data: row, error } = await supabase
      .from('user_syntheses')
      .insert({
        user_id: userId,
        period_start: start,
        period_end: end,
        output_type: type,
        content_md: contentMd,
        source_ids: sourceIds,
      })
      .select()
      .single()
    if (error) return res.status(500).json({ message: error.message })
    res.status(201).json(rowToUserSynthesis(row))
  } catch (err) {
    console.error('User synthesis error:', err)
    res.status(500).json({ message: err.message || 'Synthesis failed' })
  }
})

// GET /api/syntheses?userId= – list syntheses for a user (newest first)
app.get('/api/syntheses', async (req, res) => {
  if (!supabase) return res.status(503).json({ message: 'Supabase not configured' })
  const uid = req.query.userId
  if (!uid) return res.status(400).json({ message: 'userId query is required' })
  const { data, error } = await supabase
    .from('user_syntheses')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ message: error.message })
  res.json((data || []).map((r) => rowToUserSynthesis(r)))
})

// GET /api/syntheses/:id – get one synthesis with source drop titles
app.get('/api/syntheses/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ message: 'Supabase not configured' })
  const { data: row, error } = await supabase
    .from('user_syntheses')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (error || !row) return res.status(404).json({ message: 'Synthesis not found' })
  const ids = row.source_ids || []
  let sourceDrops = []
  if (ids.length > 0) {
    const { data: drops } = await supabase.from('drops').select('id, title').in('id', ids)
    sourceDrops = drops || []
  }
  res.json(rowToUserSynthesis(row, sourceDrops))
})

app.listen(port, () => {
  console.log(`Designer Drop API running at http://localhost:${port}`)
  if (!supabase) {
    console.warn(
      'Supabase not configured. Set SUPABASE_* in server/.env to enable file uploads.'
    )
  }
})

---
name: hono
description: Use when building Hono web applications or when the user asks about Hono APIs, routing, middleware, JSX, validation, testing, or streaming. TRIGGER when code imports from 'hono' or 'hono/*', or user mentions Hono. Use `npx hono request` to test endpoints.
---

# Hono Skill

Official source: https://github.com/yusukebe/hono-skill

Build Hono web applications. Use `app.request()` to test endpoints without starting a server. If bindings (D1) are required, pass mock env as the third argument to `app.request()`.

```ts
import { Hono } from 'hono'

type Env = {
  Bindings: { DB: D1Database }
}
const app = new Hono<Env>()

app.get('/path', (c) => c.json({ ok: true }))
app.post('/path', async (c) => {
  const body = await c.req.json()
  return c.json(body, 201)
})

export default app
```

- Write handlers inline for path param inference
- Use `app.route()` to group by feature
- Export `type AppType = typeof app` when RPC is needed
- Docs: https://hono.dev/docs

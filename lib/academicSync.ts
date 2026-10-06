// Client helper for /api/vocabwise/sync (Academic progress is per child). Adds the child the learner is
// currently using — query string for GET, JSON body for POST/PATCH — so call sites stay one-liners.
// Families with several children and no child picked get a 409 from the server; we send them to /kids.
export function activeChildId(): string | null {
  try {
    return localStorage.getItem('nav_child_id') ?? localStorage.getItem('vw_active_child')
  } catch {
    return null
  }
}

export async function academicFetch(init?: RequestInit, childId?: string): Promise<Response> {
  const id = childId ?? activeChildId()
  const method = (init?.method ?? 'GET').toUpperCase()
  let url = '/api/vocabwise/sync'
  let finalInit = init
  if (method === 'GET') {
    if (id) url += `?childId=${encodeURIComponent(id)}`
  } else if (id && typeof init?.body === 'string') {
    try { finalInit = { ...init, body: JSON.stringify({ ...JSON.parse(init.body), childId: id }) } } catch { /* keep as is */ }
  }
  const res = await fetch(url, finalInit)
  if (res.status === 409 && typeof window !== 'undefined') {
    const d = await res.clone().json().catch(() => null)
    if (d?.error === 'child_required') window.location.assign('/kids')
  }
  return res
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api'

export async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mailos_token') : null
    const authHeaders: Record<string, string> = {}
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options?.headers,
      },
    })
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }
    return res.json()
  } catch (err) {
    console.warn(`Fetch error for ${path}, using client fallback:`, err)
    throw err
  }
}

export const api = {
  health: () => fetchAPI('/health/'),
  cpu: () => fetchAPI('/health/cpu'),
  memory: () => fetchAPI('/health/memory'),
  network: () => fetchAPI('/health/network'),
  processes: () => fetchAPI('/health/processes'),
  uptime: () => fetchAPI('/health/uptime'),

  domains: () => fetchAPI('/domains/'),
  createDomain: (name: string) => fetchAPI('/domains/', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteDomain: (id: string) => fetchAPI(`/domains/${id}`, { method: 'DELETE' }),

  mailboxes: (domain?: string) => fetchAPI(`/mailboxes/${domain ? `?domain=${domain}` : ''}`),
  createMailbox: (data: object) => fetchAPI('/mailboxes/', { method: 'POST', body: JSON.stringify(data) }),
  deleteMailbox: (id: string) => fetchAPI(`/mailboxes/${id}`, { method: 'DELETE' }),

  queues: () => fetchAPI('/queues/'),
  queueMessages: (status?: string) => fetchAPI(`/queues/messages${status ? `?status=${status}` : ''}`),

  services: () => fetchAPI('/services/'),
  serviceAction: (name: string, action: string) =>
    fetchAPI(`/services/${name}/action`, { method: 'POST', body: JSON.stringify({ action }) }),

  security: {
    firewall: () => fetchAPI('/security/firewall'),
    ssl: () => fetchAPI('/security/ssl'),
    fail2ban: () => fetchAPI('/security/fail2ban'),
  },

  settings: () => fetchAPI('/settings/'),
}

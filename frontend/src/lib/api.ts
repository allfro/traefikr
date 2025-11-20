import axios from 'axios'

// Use the API URL from environment variable or default to same origin (for unified container)
// In development with separate containers, set VITE_TRAEFIKR_API_URL=http://localhost:8000
const API_BASE_URL = import.meta.env.VITE_TRAEFIKR_API_URL || ''

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Type definitions matching backend API
export type Protocol = 'http' | 'tcp' | 'udp' | 'any'
export type ResourceType = 'routers' | 'services' | 'middlewares' | 'serversTransports' | 'tls' | 'entrypoints'

export interface Resource {
  name: string // name@provider format
  provider: string
  protocol: Protocol
  type: ResourceType
  enabled: boolean
  config: Record<string, any>
  source?: 'database' | 'traefik' // Added by backend when ?traefik=true
  status?: string // Status from Traefik (enabled, disabled, warning, error)
}

export interface CreateResourceRequest {
  name: string // without @provider suffix
  provider: string
  enabled?: boolean
  config: Record<string, any>
}

export interface UpdateResourceRequest {
  enabled?: boolean
  config?: Record<string, any>
}

export interface Entrypoint {
  name: string
  address: string
  [key: string]: any
}

export interface APIKeyListItem {
  id: number
  name: string
  key_preview: string // Masked key (first 8 chars + "...")
  created_at: string
  comment?: string
  is_active: boolean
  last_used_at?: string
}

export interface APIKeyCreatedResponse {
  id: number
  name: string
  key: string // Full key only shown once on creation
  comment?: string
}

export interface CreateAPIKeyRequest {
  name: string
  comment?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  message: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

export interface ChangePasswordResponse {
  message: string
}

// Authentication API
export const authApi = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>('/api/auth/login', credentials),
  changePassword: (data: ChangePasswordRequest) =>
    api.put<ChangePasswordResponse>('/api/auth/password', data),
}

// Generic Resource API - works with any protocol/type combination
export const resourcesApi = {
  // Get JSON schema for a resource type
  getSchema: (protocol: Protocol, type: ResourceType) =>
    api.get<Record<string, any>>(`/api/${protocol}/${type}/schema.json`),

  // List resources (traefik=false by default, only database resources)
  list: (protocol: Protocol, type: ResourceType, includeTraefik = false) =>
    api.get<Resource[]>(`/api/${protocol}/${type}`, {
      params: { traefik: includeTraefik }
    }),

  // Get single resource
  get: (protocol: Protocol, type: ResourceType, name: string, provider: string) =>
    api.get<Resource>(`/api/${protocol}/${type}/${name}@${provider}`),

  // Create resource
  create: (protocol: Protocol, type: ResourceType, resource: CreateResourceRequest) =>
    api.post<Resource>(`/api/${protocol}/${type}`, resource),

  // Update resource
  update: (protocol: Protocol, type: ResourceType, nameProvider: string, resource: UpdateResourceRequest) =>
    api.put<Resource>(`/api/${protocol}/${type}/${nameProvider}`, resource),

  // Delete resource
  delete: (protocol: Protocol, type: ResourceType, provider: string, name: string) =>
    api.delete(`/api/${protocol}/${type}/${name}@${provider}`),
}

// Entrypoints API (read-only)
export const entrypointsApi = {
  list: () => api.get<Entrypoint[]>('/api/entrypoints'),
  get: (name: string) => api.get<Entrypoint>(`/api/entrypoints/${name}`),
}

// HTTP Provider API Keys
export const httpProviderApi = {
  listKeys: () => api.get<APIKeyListItem[]>('/api/http/provider'),
  createKey: (key: CreateAPIKeyRequest) => api.post<APIKeyCreatedResponse>('/api/http/provider', key),
  deleteKey: (id: number) => api.delete(`/api/http/provider/${id}`),
}

// Traefik Configuration (for Traefik polling - requires x-traefikr-key header)
export const configApi = {
  get: () => api.get('/api/config'),
}

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS (for legacy code not yet migrated)
// ============================================================================

export interface Router {
  name: string
  provider: string
  entryPoints?: string[]
  service?: string
  rule?: string
  priority?: number
  middlewares?: string[]
  tls?: any
  status?: string
  editable?: boolean
}

export interface Service {
  name: string
  provider: string
  loadBalancer?: any
  status?: string
  editable?: boolean
}

export interface Middleware {
  name: string
  provider: string
  type: string
  config: Record<string, any>
}

export interface ProviderStatus {
  type: string
  enabled: boolean
  status: string
  message?: string
  itemCount?: Record<string, number>
}

// Legacy routers API
export const routersApi = {
  list: (provider?: string) => {
    const params = provider ? { provider } : {}
    return api.get<Router[]>('/routers', { params })
  },
  get: (provider: string, name: string) => api.get<Router>(`/routers/${provider}/${name}`),
  create: (provider: string, router: Partial<Router>) => api.post<Router>(`/routers/${provider}`, router),
  update: (provider: string, name: string, router: Partial<Router>) =>
    api.put<Router>(`/routers/${provider}/${name}`, router),
  delete: (provider: string, name: string) => api.delete(`/routers/${provider}/${name}`),
}

// Legacy services API
export const servicesApi = {
  list: (provider?: string) => {
    const params = provider ? { provider } : {}
    return api.get<Service[]>('/services', { params })
  },
  get: (provider: string, name: string) => api.get<Service>(`/services/${provider}/${name}`),
  create: (provider: string, service: Partial<Service>) => api.post<Service>(`/services/${provider}`, service),
  update: (provider: string, name: string, service: Partial<Service>) =>
    api.put<Service>(`/services/${provider}/${name}`, service),
  delete: (provider: string, name: string) => api.delete(`/services/${provider}/${name}`),
}

// Legacy middlewares API
export const middlewaresApi = {
  list: (provider?: string) => {
    const params = provider ? { provider } : {}
    return api.get<Middleware[]>('/middlewares', { params })
  },
  get: (provider: string, name: string) => api.get<Middleware>(`/middlewares/${provider}/${name}`),
  create: (provider: string, middleware: Partial<Middleware>) =>
    api.post<Middleware>(`/middlewares/${provider}`, middleware),
  update: (provider: string, name: string, middleware: Partial<Middleware>) =>
    api.put<Middleware>(`/middlewares/${provider}/${name}`, middleware),
  delete: (provider: string, name: string) => api.delete(`/middlewares/${provider}/${name}`),
}

// Legacy providers API
export const providersApi = {
  list: () => api.get<ProviderStatus[]>('/providers'),
  getStatus: (provider: string) => api.get<ProviderStatus>(`/providers/${provider}/status`),
  getConfig: (provider: string) => api.get(`/providers/${provider}/config`),
  updateConfig: (provider: string, config: any) => api.put(`/providers/${provider}/config`, config),
}
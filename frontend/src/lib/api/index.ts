import type { ApiClient } from './client'
import { MockAdapter } from './mockAdapter'
import { HttpAdapter } from './httpAdapter'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export const api: ApiClient = useMock
  ? new MockAdapter()
  : new HttpAdapter(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api')

export * from './client'
export * from './mockAdapter'
export * from './httpAdapter'

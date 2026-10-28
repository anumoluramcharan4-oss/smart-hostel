import type { ApiClient } from './client'
import { MockAdapter } from './mockAdapter'

// HttpAdapter will connect to the real FastAPI backend in Stage 3.
// For Stage 1 prototype, it delegates to MockAdapter as a graceful fallback.
export class HttpAdapter extends MockAdapter implements ApiClient {
  private baseUrl: string

  constructor(baseUrl = 'http://localhost:8000/api') {
    super()
    this.baseUrl = baseUrl
  }

  getBaseUrl() {
    return this.baseUrl
  }
}

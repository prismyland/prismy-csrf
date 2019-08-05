import {
  Context,
  createInjectDecorators,
  BaseHandler,
  methodSelector,
  createError
} from 'prismy'

export interface CSRFStrategy {
  issuer(context: Context): Promise<string> | string
  verifier(context: Context): Promise<boolean> | boolean
}

export interface CSRFOptions {
  ignoreMethods?: string[]
}

export function createCSRFProtection(
  strategy: CSRFStrategy,
  options: CSRFOptions = {}
) {
  const ignoreMethods = options.ignoreMethods || ['GET', 'HEAD', 'OPTIONS']
  const csrfTokenSelector = strategy.issuer.bind(strategy)
  const csrfTokenVerifier = strategy.verifier.bind(strategy)
  function CSRFToken() {
    return createInjectDecorators(csrfTokenSelector)
  }

  return {
    csrfTokenSelector,
    csrfTokenVerifier,
    CSRFToken,
    CSRFMiddleware: class extends BaseHandler {
      handle() {
        const method = this.select(methodSelector)
        if (ignoreMethods.some(ignoreMethod => method === ignoreMethod)) {
          return
        }
        if (!csrfTokenVerifier(this.context!)) {
          throw createError(403, 'Invalid CSRF token')
        }
      }
    }
  }
}

export default createCSRFProtection

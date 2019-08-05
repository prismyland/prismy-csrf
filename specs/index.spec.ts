import test from 'ava'
import { testServer } from 'prismy-test-server'
import got from 'got'
import createCSRFProtection from '../src'
import { Context } from 'prismy'

test('CSRFToken issues a token', async t => {
  const strategy = {
    issuer() {
      return 'test'
    },
    verifier() {
      return true
    }
  }
  const { CSRFToken } = createCSRFProtection(strategy)
  class MyHandler {
    handle(@CSRFToken() csrfToken: string) {
      return {
        csrfToken
      }
    }
  }
  await testServer(MyHandler, async url => {
    const response = await got(url, {
      json: true
    })

    t.deepEqual(response.body, {
      csrfToken: 'test'
    })
  })
})

test('CSRFMiddleware validates a token', async t => {
  const strategy = {
    issuer() {
      return 'test'
    },
    verifier(context: Context) {
      return context.req.headers['csrf-token'] === 'test'
    }
  }
  const { CSRFMiddleware } = createCSRFProtection(strategy)
  class MyHandler {
    handle() {
      return 'Hello, World!'
    }
  }
  await testServer([CSRFMiddleware, MyHandler], async url => {
    const response = await got.post(url, {
      headers: {
        'CSRF-TOKEN': 'test'
      }
    })

    t.deepEqual(response.body, 'Hello, World!')
  })
})

test('CSRFMiddleware throws when invalid token is given', async t => {
  const strategy = {
    issuer() {
      return 'test'
    },
    verifier(context: Context) {
      return context.req.headers['csrf-token'] === 'test'
    }
  }
  const { CSRFMiddleware } = createCSRFProtection(strategy)
  class MyHandler {
    handle() {
      return 'Hello, World!'
    }
  }
  await testServer([CSRFMiddleware, MyHandler], async url => {
    const response = await got.post(url, {
      headers: {
        'CSRF-TOKEN': 'wrong-token'
      },
      throwHttpErrors: false
    })

    t.is(response.statusCode, 403)
    t.is(response.body, 'Invalid CSRF token')
  })
})

test('CSRFMiddleware ignores methods in `ignoreMethods` option', async t => {
  const strategy = {
    issuer() {
      return 'test'
    },
    verifier(context: Context) {
      return context.req.headers['csrf-token'] === 'test'
    }
  }
  const { CSRFMiddleware } = createCSRFProtection(strategy, {
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS', 'POST']
  })
  class MyHandler {
    handle() {
      return 'Hello, World!'
    }
  }
  await testServer([CSRFMiddleware, MyHandler], async url => {
    const response = await got.post(url, {
      headers: {
        'CSRF-TOKEN': 'wrong-token'
      }
    })

    t.is(response.statusCode, 200)
    t.is(response.body, 'Hello, World!')
  })
})

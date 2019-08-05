import test from 'ava'
import { testServer } from 'prismy-test-server'
import got from 'got'
import createCSRFProtection, { CSRFStrategy } from '../src'
import { Context } from 'prismy'

const testStrategy: CSRFStrategy = {
  issuer() {
    return 'test'
  },
  verifier(context: Context) {
    return context.req.headers['csrf-token'] === 'test'
  }
}

test('CSRFToken issues a token', async t => {
  const { CSRFToken } = createCSRFProtection(testStrategy)
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
  const { CSRFMiddleware } = createCSRFProtection(testStrategy)
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
  const { CSRFMiddleware } = createCSRFProtection(testStrategy)
  class MyHandler {
    handle() {
      /* istanbul ignore next */
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
  const { CSRFMiddleware } = createCSRFProtection(testStrategy, {
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

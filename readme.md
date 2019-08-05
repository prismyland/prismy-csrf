# `prismy-csrf`

:shield: CSRF Protection for prismy

[![Build Status](https://travis-ci.com/prismyland/prismy-csrf.svg?branch=master)](https://travis-ci.com/prismyland/prismy-csrf)
[![codecov](https://codecov.io/gh/prismyland/prismy-csrf/branch/master/graph/badge.svg)](https://codecov.io/gh/prismyland/prismy-csrf)
[![NPM download](https://img.shields.io/npm/dm/prismy-csrf.svg)](https://www.npmjs.com/package/prismy-csrf)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/prismyland/prismy-csrf.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/prismyland/prismy-csrf/context:javascript)

```
npm i prismy-csrf
```

## Example

```ts
import {
  prismy,
  Context,
  createInjectDecorators,
  createTextBodySelector,
  UrlEncodedBody
} from 'prismy'
import createCSRFProtection from 'prismy-csrf'
import JWTCSRFStrategy from 'prismy-csrf-strategy-jwt'
import querystring from 'querystring'

const { CSRFToken, CSRFMiddleware } = createCSRFProtection(
  new JWTCSRFStrategy({
    secret: 'RANDOM_HASH',
    tokenSelector: (context: Context) => {
      const body = createUrlEncodedBodySelector()(context)
      return body._csrf
    }
  })
)

class MyHandler extends BaseHandler {
  async handle(@CSRFToken() csrfToken: string) {
    return [
      '<!DOCTYPE html>',
      '<body>',
      '<form action="/" method="post">',
      '<input name="message">',
      `<input type="hidden" name="_csrf" value=${csrfToken}>`,
      '<button type="submit">Send</button>',
      '</form>',
      '</body>'
    ].join('')
  }
}

export default prismy([CSRFMiddleware, MyHandler])
```

/**
 * Entry Script
 */
require('dotenv').config()


process.env.ROOT_PATH = __dirname

// avoid loading asset files on the server-side
require.extensions['.png'] = function () { }
require.extensions['.sass'] = function () { }
require.extensions['.css'] = function () { }
require.extensions['.gif'] = function () { }


if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'test') {
  require('./dist/')
  return
}

require('./server')

import path from 'path'
import { api } from '../common/api.js'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { error, log, logJson, run, warn } from '@semo/core'
import _ from 'lodash'

const API = api('semo-plugin-api')

export const disabled = false // Set to true to disable this command temporarily
export const plugin = 'api' // Set this for importing plugin config
export const command = 'api [url]'
export const desc = 'Send API request'

export const builder = function (yargs: any) {
  const AXIOS_GROUP = 'Axios config:'

  yargs.option('color', { describe: 'Render colorful json response' })
  yargs.option('config-file', {
    describe: 'Use when many options needs to be set',
    alias: 'file',
  })
  yargs.option('socks-proxy', {
    describe: 'Proxy server of socks, default is socks://127.0.0.1:1080',
    alias: ['ss', 'socks'],
  })

  yargs.option('default-socks-proxy', {
    describe: 'Default proxy server of socks.',
    default: 'socks5://127.0.0.1:1080',
  })

  yargs.option('method', {
    describe: 'HTTP methods',
    default: 'get',
    alias: 'X',
    group: AXIOS_GROUP,
  })

  yargs.option('headers', {
    describe: 'Request headers',
    alias: 'H',
    group: AXIOS_GROUP,
  })
  yargs.option('data', {
    describe: 'Data for post, put or patch',
    group: AXIOS_GROUP,
  })
  yargs.option('base-url', {
    describe: 'Prepended to `url` unless `url` is absolute',
    group: AXIOS_GROUP,
  })
  yargs.option('params', {
    describe: 'URL parameters to be sent with the request',
    group: AXIOS_GROUP,
  })
  yargs.option('timeout', {
    describe: 'Milliseconds before the request times out',
    group: AXIOS_GROUP,
  })
  yargs.option('auth', {
    describe: 'HTTP Basic auth, --auth.username and --auth.password',
    group: AXIOS_GROUP,
  })
  yargs.option('with-credentials', {
    describe: 'Request with credentials',
    group: AXIOS_GROUP,
  })
  yargs.option('response-type', {
    describe: 'Response type, default is json',
    choices: ['arraybuffer', 'document', 'json', 'text', 'stream'],
    group: AXIOS_GROUP,
  })
  yargs.option('response-encoding', {
    describe: 'Response encoding, default is utf-8',
    group: AXIOS_GROUP,
  })
  yargs.option('xsrf-cookie-name', {
    describe: 'Default is XSRF-TOKEN',
    group: AXIOS_GROUP,
  })
  yargs.option('xsrf-header-name', {
    describe: 'Default is X-XSRF-TOKEN',
    group: AXIOS_GROUP,
  })
  yargs.option('max-content-length', {
    describe: 'Allowed response max content length',
    group: AXIOS_GROUP,
  })
  yargs.option('max-redirects', {
    describe: 'Allowed max redirects to follow',
    group: AXIOS_GROUP,
  })
  yargs.option('socket-path', {
    describe: 'UNIX Socket to be used',
    group: AXIOS_GROUP,
  })
  yargs.option('proxy', {
    describe: 'Proxy server of http or https, --proxy.host and --proxy.port',
    group: AXIOS_GROUP,
  })
}

export const handler = async function (argv: any) {
  argv.method = argv.method.toLowerCase()
  if (
    !['get', 'post', 'put', 'patch', 'head', 'delete', 'options'].includes(
      argv.method
    )
  ) {
    error('Request method is invalid:')
  }

  let fileConfig: any = {}
  if (argv.configFile) {
    fileConfig = await import(path.resolve(process.cwd(), argv.configFile))
    if (_.isFunction(fileConfig)) {
      fileConfig = await fileConfig()
    } else if (fileConfig.default && _.isFunction(fileConfig.default)) {
      fileConfig = await fileConfig.default()
    } else if (fileConfig.default) {
      fileConfig = fileConfig.default
    }
    fileConfig = await run(fileConfig)
    console.log('fileConfig', fileConfig)
  }

  // This is just part of axios supported request options
  const config: any = Object.assign(
    fileConfig || {},
    _.pick(argv, [
      'baseURL',
      'params',
      'data',
      'timeout',
      'withCredentials',
      'auth',
      'responseType',
      'responseEncoding',
      'xsrfCookieName',
      'xsrfHeaderName',
      'maxContentLength',
      'maxRedirects',
      'socketPath',
      'proxy',
      'headers',
    ])
  )

  if (argv.socksProxy) {
    let sockesUrl = _.isString(argv.socksProxy)
      ? argv.socksProxy
      : argv.defaultSocksProxy

    // sockes5 is default protocol
    if (!sockesUrl.includes('://')) {
      sockesUrl = 'socks5://' + sockesUrl
    }

    const httpsAgent = new SocksProxyAgent(sockesUrl)
    config.httpAgent = httpsAgent
    config.httpsAgent = httpsAgent
  }

  if (argv.url && !config.baseUrl && !argv.url.startsWith('http')) {
    argv.url = `https://${argv.url}`
  }

  if (config.method && config.method !== argv.method) {
    argv.method = config.method
  }

  // process headers
  if (argv.headers) {
    if (_.isString(argv.headers)) {
      argv.headers = _.castArray(argv.headers)
    }

    if (_.isArray(argv.headers)) {
      const newHeaders = {}

      argv.headers.forEach((item) => {
        const split = item.split(':')
        if (split.length === 2) {
          newHeaders[split[0]] = split[1]
        }
      })

      argv.headers = newHeaders
    }
  }

  const method = _.get(API, argv.method)

  try {
    const response = ['get', 'delete', 'head', 'options'].includes(argv.method)
      ? await method(argv.url, config)
      : await method(argv.url, config.data ? config.data : {}, config)
    if (argv.color) {
      logJson(response)
    } else {
      log(response)
    }
  } catch (e) {
    warn(e.message)
  }
}

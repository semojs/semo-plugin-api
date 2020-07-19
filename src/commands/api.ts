import path from 'path'
import { Utils } from '@semo/core'
import { api } from '../common/api'
import { SocksProxyAgent } from 'socks-proxy-agent'
const API = api('semo-plugin-api')

export const disabled = false // Set to true to disable this command temporarily
// export const plugin = '' // Set this for importing plugin config
export const command = 'api [url]'
export const desc = 'Send API request'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  const AXIOS_GROUP = 'Axios config:'

  yargs.option('color', { describe: 'Render colorful json response' })
  yargs.option('config-file', { describe: 'Use when many options needs to be set' })
  yargs.option('socks-proxy', { describe: 'Proxy server of socks, default is socks://127.0.0.1:1080', alias: ['ss'] })

  yargs.option('method', {
    describe: 'HTTP methods',
    default: 'get',
    alias: 'X',
    group: AXIOS_GROUP
  })

  yargs.option('headers', { describe: 'Request headers', alias: 'H', group: AXIOS_GROUP })
  yargs.option('data', { describe: 'Data for post, put or patch', group: AXIOS_GROUP })
  yargs.option('base-url', { describe: 'Prepended to `url` unless `url` is absolute', group: AXIOS_GROUP })
  yargs.option('params', { describe: 'URL parameters to be sent with the request', group: AXIOS_GROUP })
  yargs.option('timeout', { describe: 'Milliseconds before the request times out', group: AXIOS_GROUP })
  yargs.option('auth', { describe: 'HTTP Basic auth, --auth.username and --auth.password', group: AXIOS_GROUP })
  yargs.option('with-credentials', { describe: 'Request with credentials', group: AXIOS_GROUP })
  yargs.option('response-type', { describe: 'Response type, default is json', choices: ['arraybuffer', 'document', 'json', 'text', 'stream'], group: AXIOS_GROUP })
  yargs.option('response-encoding', { describe: 'Response encoding, default is utf-8', group: AXIOS_GROUP })
  yargs.option('xsrf-cookie-name', { describe: 'Default is XSRF-TOKEN', group: AXIOS_GROUP })
  yargs.option('xsrf-header-name', { describe: 'Default is X-XSRF-TOKEN', group: AXIOS_GROUP })
  yargs.option('max-content-length', { describe: 'Allowed response max content length', group: AXIOS_GROUP })
  yargs.option('max-redirects', { describe: 'Allowed max redirects to follow', group: AXIOS_GROUP })
  yargs.option('socket-path', { describe: 'UNIX Socket to be used', group: AXIOS_GROUP })
  yargs.option('proxy', { describe: 'Proxy server of http or https, --proxy.host and --proxy.port', group: AXIOS_GROUP })
  
}

export const handler = async function (argv: any) {
  argv.method = argv.method.toLowerCase()
  if (!['get', 'post', 'put', 'patch', 'head', 'delete', 'options'].includes(argv.method)) {
    Utils.error('Request method is invalid:')
  }

 

  let fileConfig = {}
  if (argv.file) {
    fileConfig = require(path.resolve(process.cwd(), argv.file))
    fileConfig = await Utils.run(fileConfig)
  }

  // This is just part of axios supported request options
  const config: any = Object.assign(fileConfig || {}, Utils._.pick(argv, [
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
    'headers'
  ]))

  if (argv.socksProxy) {
    const httpsAgent = new SocksProxyAgent(Utils._.isString(argv.socksProxy) ? argv.socksProxy : 'socks5://127.0.0.1:1080')
    config.httpAgent = httpsAgent
    config.httpsAgent = httpsAgent
  }

  // file attrs first
  if (config.url && config.url !== argv.url) {
    argv.url = config.url
  }

  if (config.method && config.method !== argv.method) {
    argv.method = config.method
  }

  // process headers
  if (argv.headers) {
    if (Utils._.isString(argv.headers)) {
      argv.headers = Utils._.castArray(argv.headers)
    }

    if (Utils._.isArray(argv.headers)) {
      let newHeaders = {}

      argv.headers.forEach(item => {
        const split = item.split(':')
        if (split.length === 2) {
          newHeaders[split[0]] = split[1]
        }
      })

      argv.headers = newHeaders
    }

  }

  const method = Utils._.get(API, argv.method)

  try {
    const response = ['get', 'delete', 'head', 'options'].includes(argv.method) 
      ? await method(argv.url, config)
      : await method(argv.url, config.data ? config.data : {}, config)
    if (argv.color) {
      Utils.log(response)
    } else {
      console.log(response)
    }
  } catch (e) {
    Utils.warn(e.message)
  }
}

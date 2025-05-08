import axios from 'axios'
import qs from 'qs'
import _ from 'lodash'
import { debugChannel } from '@semo/core'
export const api = function (service: string) {
  const debug = debugChannel(service)
  const API = axios.create()
  API.interceptors.request.use(
    function (config: any) {
      // Log API request info
      if (config.params) {
        debug(
          'Request:',
          `${config.method ? config.method.toUpperCase() : 'GET'} ${_.upperCase(config.method)} ${config.url}?${qs.stringify(config.params, { encode: false })}`
        )
      } else {
        debug('Request:', `${_.upperCase(config.method)} ${config.url}`)
      }
      if (config.data) {
        debug('Params:', config.data)
      }
      return config
    },
    function (error) {
      // Do something with request error
      return Promise.reject(error)
    }
  )
  API.interceptors.response.use(function (response: any) {
    debug('Response status:', response.status)
    debug('Response data:', response.data)
    let ret
    if (['head', 'delete'].includes(response.config.method)) {
      ret = { status: response.status, statusText: response.statusText }
    } else if (['options'].includes(response.config.method)) {
      ret = {
        status: response.status,
        statusText: response.statusText,
        'access-control-allow-credentials':
          response.headers['access-control-allow-credentials'],
        'access-control-allow-methods':
          response.headers['access-control-allow-methods'],
      }
    } else {
      ret = response.data
    }
    return ret
  })

  return API
}

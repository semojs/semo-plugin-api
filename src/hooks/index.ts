import { api } from '../common/api'

export = async (Utils) => {
  const API = api('semo-repl')
  return {
    hook_repl: new Utils.Hook('semo', { api: API }),
    hook_component: new Utils.Hook('semo', { api: API }),
  }
}
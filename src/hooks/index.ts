import { api } from '../common/api'

export = async (Utils) => {
  return {
    hook_repl: new Utils.Hook('semo', { api: api('semo-repl') }),
    hook_component: new Utils.Hook('semo', { api }),
  }
}
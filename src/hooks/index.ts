import { api } from '../common/api.js'

export const hook_repl = {
  semo: () => {
    return {
      api: api('semo-plugin-api'),
    }
  },
}

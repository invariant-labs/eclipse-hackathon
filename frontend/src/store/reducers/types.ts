import { UnknownAction, ActionCreator } from 'redux'

interface ActionsBasicType {
  [k: string]: ActionCreator<UnknownAction>
}

export type PayloadType<actions extends ActionsBasicType> = {
  [k in keyof actions]: Parameters<actions[k]>[0]
}

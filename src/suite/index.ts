import {Suite, Action, HookFunction} from "../gherkin"

export let suite = new Suite()

export const When = (pattern: string, action: Action) => suite.given(pattern, action)
export const Then = (pattern: string, action: Action) => suite.then(pattern, action)
export const Given = (pattern: string, action: Action) => suite.given(pattern, action)


export const Before= (action: HookFunction) => suite.before(action)
export const After = (action: HookFunction) => suite.after(action)

export const resetSuite = () => {
	suite = new Suite()
}

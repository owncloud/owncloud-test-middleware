export enum Token {
	GIVEN,
	WHEN,
	THEN
}

export type Action = (...args: any[]) => Promise<null>;
export type HookFunction = () => Promise<null>;

export class StepDef {
	token: Token;
	pattern: string;
	action: Action;

	constructor(token: Token, pattern: string, action: Action) {
		if (typeof action !== 'function') {
			throw new Error("not function type")
		}
		this.token = token
		this.pattern = pattern
		this.action = action
	}

	match(step: Step): boolean {
		if (step.token !== this.token) {
			return false
		}

		if (step.pattern === this.pattern) {
			let datalen = step.data.length
			if (step.table && step.table.length) {
				datalen += 1
			}

			if (datalen !== this.action.length) {
				return false
			}
			return true
		}
		return false
	}


	async run(...args: any[]): Promise<void> {
		if (args.length !== this.action.length) {
			throw new Error("Cannot run step with invalid num of args")
		}

		try {
			await this.action(...args)
		} catch(e) {
			throw new Error("failed while running")
		}
	}
}

export class Suite {
	steps: StepDef[];
	afterSteps: HookFunction[];
	beforeSteps: HookFunction[];
	constructor() {
		this.steps = []
		this.afterSteps = []
		this.beforeSteps = []
	}

	addstep(token: Token, pattern: string, action: Action) {
		if (typeof action !== 'function') {
			throw new Error("not function type")
		}

		for (const step of this.steps) {
			if (step.pattern === pattern) {
				throw new Error("step already registered")
			}
		}

		this.steps.push(new StepDef(token, pattern, action))
	}

	given(pattern: string, action: Action){ this.addstep(Token.GIVEN, pattern, action) }
	when(pattern: string, action: Action){ this.addstep(Token.WHEN, pattern, action) }
	then(pattern: string, action: Action){ this.addstep(Token.THEN, pattern, action) }

	after(fn: HookFunction){ this.afterSteps.push(fn) }
	before(fn: HookFunction){ this.beforeSteps.push(fn) }

	getMatch(step: Step): StepDef|null {
		for (const stepdef of this.steps) {
			if (stepdef.match(step)) {
				return stepdef
			}
		}
		return null
	}

	async cleanup() {
		for(const fn of this.afterSteps) {
			await fn()
		}
	}

	async setup() {
		for(const fn of this.beforeSteps) {
			await fn()
		}
	}
}

export class Step {
	token: Token;
	pattern: string;
	data: any[];
	table: string[][];

	constructor(token: Token, stepPattern: string, table: string[][]) {
		this.token = token

		let {pattern, data} = verifyMatchParams(stepPattern)
		this.pattern = pattern
		this.data = data
		this.table = table
	}

}

function verifyMatchParams(pattern: string) : {pattern: string, data: (string|number)[]} {
	var reg: RegExp = RegExp(/(\d+|"([^\"]*)")/g)
	var data: (string|number)[] = []
	let found = pattern.match(reg);

	if (!found) {
		found = []
	}

	for (let match of found) {
		if (match[0] === '"') {
			data.push(match.replace(/['"]+/g, ''))
		} else {
			data.push(match)
		}
	}

	pattern = pattern.replace(/\"[^\"]*\"/g, '{string}')
	pattern = pattern.replace(/\d+/g, '{int}')

	return {pattern, data}
}

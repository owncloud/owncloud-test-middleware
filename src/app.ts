import express from 'express';

import { Step, Token  } from './gherkin';
import bodyParser from 'body-parser';

import { suite } from './suite';

import './contexts/provisioning';
import './contexts/sharing';

// Create Express Server
const app = express();


app.use(bodyParser.json())

// Configuration
const PORT = 3000;
const HOST = "localhost";

app.use('/execute', async (req, res) => {
	const {pattern, table} = req.body
	const step = new Step(Token.GIVEN, pattern, table)
	const stepDef = suite.getMatch(step)

	if (stepDef) {
		try {
			await stepDef.run(...step.data)
			res.writeHead(200)
		} catch(e) {
			res.write(e.message)
			res.writeHead(400)
		}
	} else {
		res.writeHead(404)
	}
	res.end()
});

app.use('/init', async (req, res) => {
	try {
		await suite.setup()
		res.writeHead(200)
	} catch(e) {
		res.write(e.message)
		res.writeHead(400)
	}
	res.end()
});

app.use('/cleanup', async (req, res) => {
	try {
		await suite.cleanup()
		res.writeHead(200)
	} catch(e) {
		res.write(e.message)
		res.writeHead(400)
	}
	res.end()
});

app.listen(PORT, HOST, () => {
   console.log(`Starting Test Middleware At ${HOST}:${PORT}`);
});

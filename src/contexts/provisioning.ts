// @ts-nocheck
import {Given} from '../suite'

Given("user {string} has been created with default attributes", function(username) {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log("creating new user ", username)
			resolve()
		}, 5000)
	})
})


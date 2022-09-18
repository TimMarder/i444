import makeContacts from './contacts.mjs';
import readline from 'readline';

import { readJson } from 'cs544-node-utils';
import { errResult, okResult, Result } from 'cs544-js-utils';

import fs from 'fs';
import Path from 'path';



export default async function main(args) {
  if (args.length < 1) usage();
  const userId = args[0];
  const contactsResult = makeContacts();
  if (contactsResult.errors) { errors(contactsResult); process.exit(1); }
  const contacts = contactsResult.val;
  const userContactsResult = contacts.userContacts(userId);
  if (userContactsResult.errors) { errors(userContactsResult); process.exit(1); }
  const userContacts = userContactsResult.val;
  const loadResult = await loadContacts(userContacts, args.slice(1));
  if (loadResult.errors) { errors(loadResult); process.exit(1); }
  help();
  console.log(`loaded contacts with ids: `, loadResult.val);
  repl(userContacts);
}

async function loadContacts(userContacts, filePaths) {
  const ids = [];
  for (const path of filePaths) {
    const result = await readJson(path);
    if (result.errors) return result;
    else {
      const val = result.val;
      const contacts = Array.isArray(val) ? val : [val];
      for (const contact of contacts) {
	const result = userContacts.create(contact);
	if (result.errors) return result;
	ids.push(result.val);
      }
    }
  }
  return okResult(ids);
}

const PROMPT = '>> ';

async function repl(userContacts) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false, //no ANSI terminal escapes
    prompt: PROMPT,
  });  
  rl.on('line', async (line) => await doLine(userContacts, line, rl));
  rl.prompt();
}


//handler for a line
async function doLine(userContacts, line, rl) {
  line = line.trim();
  if (line.length > 0) {
    const args = line.split(/\s+/);
    const cmd = CMDS[args[0]]?.cmd;
    if (!cmd) {
      errors(errResult(`unknown command '${args[0]}'`));
    }
    else {
      const result = await cmd(userContacts, args[0], ...args.slice(1));
      if (!(result instanceof Result)) {
	errors(errResult(`${args[0]} must return a Result type`));
      }
      else if (result.errors) {
	errors(result);
      }
      else {
	if (result.val) console.dir(result.val, { depth: null});
      }
    }
  }
  rl.prompt();
}

async function create(userContacts, _, ...jsonPaths) {
  return (jsonPaths.length === 0)
    ? errResult(`one or more JSON_PATH arguments are required`)
    : loadContacts(userContacts, jsonPaths);
}

async function idCmd(userContacts, cmd, id) {
  return (id === undefined)
    ? errResult(`A CONTACT_ID is required for an ${cmd}`)
    : userContacts[cmd].call(userContacts, id);
}

function help() {
  const msg =
    Object.values(CMDS).map(v => v.help.replace(/\s+$/, '')).join('\n');
  console.log('Allowed commands are:\n', msg, '\n');
  return okResult('');
}

async function search(userContacts, _, ...args) {
  const params = {};
  let nums = args.slice(-2).filter(s => /^\d+$/.test(s));
  let [index=0, count=DEFAULT_COUNT] = nums.map(str => Number(str));
  const rest = nums.length > 0 ? args.slice(0, -nums.length) : args;
  for (const arg of rest) {
    if (/@/.test(arg)) {
      if (params.email) return errResult('only a single email may be specified');
      params.email = arg;
    }
    else {
      if (params.nameWordPrefix) {
	return errResult('only a single nameWordPrefix may be specified');
      }
      params.nameWordPrefix = arg;
    }
  }
  return userContacts.search(params, index, count);
}

async function update(userContacts, _, id, jsonPath) {
  if (id === undefined) {
    return errResult(`A CONTACT_ID is required for an update`);
  }
  else if (jsonPath === undefined) {
    return errResult(`A JSON_PATH is required for an update`);
  }
  else {
    const update = await readJson(jsonPath);
    if (update.errors) return update;
    return userContacts.update({id, ...update});
  }
}

const DEFAULT_COUNT = 5;
const CMDS = {
  create: {
    help: `
      create JSON_PATH...
        Create contacts specified in JSON_PATH... for current user.
    `,
    cmd: create,
  },
  help: {
    help: `
      help
        print this help message.
    `,
    cmd: help,
  },
  read: {
    help: `
      read CONTACT_ID
        return contact specified by CONTACT_ID from contacts for current user.
    `,
    cmd: idCmd,
  },
  search: {
    help: `
      search [NAME_WORD] [EMAIL] [START_INDEX] [RESULT_COUNT]
        Return up to RESULT_COUNT (default 5) contacts for the
        current user starting at index START_INDEX (default 0).
        The contacts are filtered by name words starting with prefix
	NAME_WORD and email equal to EMAIL.  If neither NAME_WORD
	or EMAIL are specified, then all contacts for the current user
	are returned. 
    `,
    cmd: search,
  },
  /*
  remove: {
    help: `
      remove CONTACT_ID
        remove contact specified by CONTACT_ID from contacts for current user.
    `,
    cmd: idCmd,
  },
  update: {
    help: `
      update CONTACT_ID JSON_PATH
        Update contact CONTACT_ID for current user as per JSON_PATH.
    `,
    cmd: update,
  },
  */
};


function errors(result) {
  for (const err of result.errors) {
    console.error(err.message ?? err.toString());
  }
}


function usage() {
  const prog = Path.basename(process.argv[1]);
  console.error(`usage: ${prog} USER_ID [JSON_CONTACTS_FILE...]`);
  process.exit(1);
}

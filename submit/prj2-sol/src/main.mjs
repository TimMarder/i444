import makeContactsDao from './contacts-dao.mjs';
import makeContactsServices from './contacts-services.mjs';

import { readJson } from 'cs544-node-utils';
import { errResult, okResult, Result } from 'cs544-js-utils';

import fs from 'fs';
import Path from 'path';



export default async function main(args) {
  if (args.length < 2 || args[0] === 'help' ) usage();
  const dbUrl  = args[0];
  const cmd = args[1];
  let dao;
  try {
    const daoResult = await makeContactsDao(dbUrl);
    if (daoResult.errors) die(daoResult);
    dao = daoResult.val;
    const services = makeContactsServices(dao);
    const cmdFn = CONTACTS_CMDS[cmd]?.cmd;
    if (!cmdFn) die(`unknown command "${cmd}"`);
    const result = await cmdFn.call(null, services, args.slice(2));
    if (result === null || result === undefined) {
      console.error('nullish result');
    }
    else if (result.errors) {
      errors(result);
    }
    else {
      console.log(JSON.stringify(result.val, null, 2));
    }
  }
  finally {
    if (dao) await dao.close();
  }
}

/*********************** User Services Commands ************************/

async function clearAll(services, args) {
  return (args.length > 0)
    ? errResult(`clearAll does not take any arguments`)
    : await services.clearAll();
}

async function clear(services, [userId, ...args]) {
  if (!userId) return errResult("no userId specified");
  return (args.length > 0)
    ? errResult(`clear does not take any command`)
    : await services.clear({userId});
}

async function create(services, [userId, ...jsonPaths]) {
  if (!userId) return errResult("no userId specified");
  return (jsonPaths.length === 0)
    ? errResult(`one or more JSON_PATH arguments are required`)
    : await loadContacts(services, userId, jsonPaths);
}

async function loadContacts(services, userId, filePaths) {
  const ids = [];
  for (const path of filePaths) {
    const result = await readJson(path);
    if (result.errors) return result;
    else {
      const val = result.val;
      const jsonContacts = Array.isArray(val) ? val : [val];
      for (const contact of jsonContacts) {
	const result = await services.create({userId, ...contact});
	if (result.errors) return result;
	ids.push(result.val);
      }
    }
  }
  return okResult(ids);
}

async function read(services, [userId, contactId]) {
  if (!userId) return errResult("no userId specified");
  return (contactId === undefined)
    ? errResult(`A CONTACT_ID is required for a read`)
    : await services.read({userId, id: contactId});
}

const SEARCH_ARGS = new Set(['prefix', 'email', 'id', 'count', 'index']);
const INT_ARGS = new Set(['count', 'index']);
async function search(services, [userId, ...args]) {
  if (!userId) return errResult("no userId specified");
  const params = {userId};
  for (const arg of args) {
    const m = arg.match(/^(\w+)\=(.+)$/);
    if (!m) { console.error(`bad arg "${arg}": must be "name=value"`); usage(); }
    let [, name, value] = m;
    if (!SEARCH_ARGS.has(name)) {
      console.error(`unknown search arg "${name}"`); usage();
    }
    else if (INT_ARGS.has(name)) {
      if (!value.match(/^\d+$/)) {
	console.error(`expecting int value for "${name}"-arg`); usage();
      }
      value = parseInt(value);
    }
    params[name] = value;
  }
  return services.search(params);
}

function contactsHelp() {
  const msg =
    Object.values(CONTACTS_CMDS).map(v => v.help.replace(/\s+$/, '')).join('\n');
  return msg;
}




/************************** Utility Functions **************************/

function errors(result) {
  for (const err of result.errors) {
    console.error(err.message ?? err.toString());
  }
}
function die(result) {
  if (result instanceof Result) {
    errors(result);
  }
  else {
    console.error(result);
  }
  process.exit(1); 
}

function usage() {
  const prog = Path.basename(process.argv[1]);
  const cmdHelp = contactsHelp().replace(/^ *\n/, '').replace(/\s+$/, '');
  const msg = `
    usage: ${prog} help
           ${prog} DB_URL CMD ARGS...

    where CMD ARGS... are:\n${cmdHelp}
  `.replace(/^ *\n/, '').replace(/\s+$/, '');
  console.error(msg);
  process.exit(1);
}


/************************ Contacts Commands Info ***********************/

const CONTACTS_CMDS = {
  clearAll: {
    help: `
      clearAll
        Clear out all contacts for all users
    `,
    cmd: clearAll,
  },
  clear: {
    help: `
      clear USER_ID 
        Clear out all contacts for user specified by USER_ID
    `,
    cmd: clear,
  },
  create: {
    help: `
      create USER_ID JSON_PATH...
        Create contacts specified in JSON_PATH... for user specified by USER_ID
    `,
    cmd: create,
  },
  read: {
    help: `
      read USER_ID CONTACT_ID
        return contact specified by CONTACT_ID from contacts for user 
        specified by USER_ID.
    `,
    cmd: read,
  },
  search: {
    help: `
      search USER_ID [prefix=PREFIX email=EMAIL id=ID index=INDEX count=COUNT]...
        Return up to COUNT (default 5) contacts for the user
        specified by USER_ID starting at index INDEX (default
        0).  The returned contacts are sorted by name.  The contacts
        are filtered by name words starting with prefix
        PREFIX, email equal to EMAIL and id equal to ID.  If none of ID,
        PREFIX or EMAIL are specified, then all contacts for
        the user specified by USER_ID are returned (subject to
        INDEX and COUNT).
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

import serve from './contacts-ws.mjs';


import { okResult, errResult } from 'cs544-js-utils';
import { cwdPath, readJson } from 'cs544-node-utils';
import { makeContactsDao, makeContactsServices, } from 'contacts-dao';

import assert from 'assert';
import fs from 'fs';
import https from 'https';
import Path from 'path';
import util from 'util';

/**************************** main program *****************************/

const BASE = '/contacts';

export default async function main(args) {
  if (args.length < 1 || args.length === 2) usage();
  const config = (await import(cwdPath(args[0]))).default;
  const base = config.base ?? BASE;
  const port = getPort(config.ws.port);
  try {
    const daoResult = await makeContactsDao(config.dbUrl);
    if (daoResult.errors) panic(daoResult);
    const dao = daoResult.val;
    if (args.length > 2) {
      const userId = args[1];
      const loadResult = await loadContacts(dao, userId, args.slice(2));
      if (loadResult.errors) panic(loadResult);
      console.log(loadResult.val);
    }
    const services = makeContactsServices(dao);
    const serveResult = await serve(services, base);
    if (serveResult.errors) panic(serveResult);
    const app = serveResult.val;
    const serverOpts = {
      key: fs.readFileSync(config.https.keyPath),
      cert: fs.readFileSync(config.https.certPath),
    };
    https.createServer(serverOpts, app)
      .listen(config.ws.port, function() {
	console.log(`listening on port ${config.ws.port}`);
      });
  }
  catch (err) {
    console.error(err);
    process.exit(1);
  }
  finally {
    //this runs even when http server still running, need to
    //keep dao open
    //if (dao) await dao.close();
  }
}

function usage() {
  const prog = Path.basename(process.argv[1]);
  const msg = `usage: ${prog} CONFIG_PATH [USER_ID CONTACT_FILE...]`;
  console.error(msg);
  process.exit(1);
}

/**************************** Loading Data *****************************/

async function loadContacts(services, userId, filePaths) {
  const clearResult = await services.clearAll();
  if (clearResult.errors) return clearResult;
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

/****************************** Utilities ******************************/

function panic(errResult) {
  assert(errResult.errors);
  for (const err of errResult.errors) {
    console.error(err.message);
  }
  process.exit(1);
}


function getPort(portStr) {
  let port;
  if (!/^\d+$/.test(portStr) || (port = Number(portStr)) < 1024) {
    usageError(`bad port ${portStr}: must be >= 1024`);
  }
  return port;
}

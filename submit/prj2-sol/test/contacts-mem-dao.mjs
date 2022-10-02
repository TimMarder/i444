import makeContactsDao from '../src/contacts-dao.mjs';

import { MongoMemoryServer } from 'mongodb-memory-server';

import { assert } from 'chai';

export default class {

  /* mongodb-memory-server v6.x.x
  static async setup() {
    const mongod = new MongoMemoryServer();
    const uri = await mongod.getUri();
    assert(mongod.getInstanceInfo(), `mongo memory server startup failed`);
    const dao = await makeContactsDao(uri);
    dao._mongod = mongod;
    return dao;
  }

  static async tearDown(dao) {
    await dao.close();
    await dao._mongod.stop();
    assert.equal(dao._mongod.getInstanceInfo(), false,
		 `mongo memory server stop failed`);
  }
  */
  static async setup() {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    assert(mongod.instanceInfo, `mongo memory server startup failed`);
    const daoResult = await makeContactsDao(uri);
    if (daoResult.hasErrors) throw daoResult;
    const dao = daoResult.val;
    dao._mongod = mongod;
    return dao;
  }

  static async tearDown(dao) {
    await dao.close();
    await dao._mongod.stop();
    assert.equal(dao._mongod.instanceInfo, undefined,
		 `mongo memory server stop failed`);
  }

}

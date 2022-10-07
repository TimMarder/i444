import assert from 'assert';

import { namePrefixes } from './utils.mjs';
import { okResult, errResult } from 'cs544-js-utils';
import { MongoClient } from 'mongodb';

/** return a contacts dao for mongo URL dbUrl.  If there is previous contacts
 *  data at dbUrl, the returned dao should encompass that data.
 *  Error Codes:
 *    DB: a database error was encountered.
 */
export default async function makeContactsDao(dbUrl) {
  return ContactsDao.make(dbUrl);
}

const DEFAULT_COUNT = 5;
const COLLECTION_NAME = 'contacts';
const NEXT_ID_KEY = 'nextId';
const RAND_LEN = 5;

/** holds the contacts for multiple users. All request methods
 *  should assume that their single parameter has been validated
 *  with all non-db validations.
 *  For all requests except create(), unknown request properties are ignored.
 *  For create(), the unknown request properties are stored.
 */
class ContactsDao {
  constructor(params) {
    this.client = params.client;
  }

  /** Factory method to create a new instance of this 
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  static async make(dbUrl) {
    try {
      const client = new MongoClient(dbUrl);
      this.setupCollection(client);
      return okResult(new ContactsDao({ client }));
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }

  static async setupCollection(client) {
    const db = client.db();
    const collections = await (db.listCollections().toArray());
    const exists = !!collections.find(c => c.name === COLLECTION_NAME);
    if (!exists) {
      const options = {collation: {locale: 'en', strength: 2, }};
      const collection = await db.createCollection(COLLECTION_NAME, options);
      collection.createIndex({name: 1});
    }
  }

  /** close off this DAO; implementing object is invalid after 
   *  call to close() 
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async close() { 
    try {
      await this.client.close();
    }
    catch (e) {
      console.error(e);
      return errResult(e.message, { code: 'DB' });
    }
  }


  /** clear out all contacts for all users; returns number of contacts
   *  cleared out. 
   *  Error Codes:
   *    DB: a database error occurred
   */
  async clearAll() {
    try {
      const delRes = await this.#collection.deleteMany({})
      return okResult(delRes.deletedCount);
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }
  
  /** Clear out all contacts for user userId; return # of contacts cleared.
   *  Error Codes:
   *    DB: a database error occurred
   */
  async clear({userId}) {
    try {
      const delRes = await this.#collection.deleteMany({ userId })
      return okResult(delRes.deletedCount);
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }

  /** Add object contact into this as a contact for user userId and
   *  return Result<contactId> where contactId is the ID for the newly
   *  added contact.  The contact will have a name field which must
   *  contain at least one word containing at least one letter.
   *
   *  Unknown properties in contact are also stored in the database.
   *
   *  Errors Codes: 
   *    BAD_REQ: contact contains an _id property
   *    DB: a database error occurred   
   */
  async create(contact) {
    try {
      if ("_id" in contact) {
        return errResult('contact contains an _id property', { code: 'BAD_REQ' });
      }

      const contactId = await this.#nextId();
      await this.#collection.insertOne({ id: contactId, ...contact, _prefix: namePrefixes(contact.name) });
      return okResult(contactId);
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }
  

  /** Return XContact for contactId for user userId.
   *  Error Codes:
   *    DB: a database error occurred   
   *    NOT_FOUND: no contact for contactId id
   */
  async read({userId, id}) {
    try {
      const result = await this.#collection.findOne({ userId, id });
      if (!result) {
        return errResult(`no contact for contactId ${id}`, { code: 'NOT_FOUND' })
      }

      delete result._id;
      delete result._prefix;
      return okResult(result);
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }

  /** perform a case-insensitive search for contact for user specified
   *  by userId using zero or more of the following fields in params:
   *    id:     the contact ID.
   *    prefix: a string, the letters of which must match 
   *            the prefix of a word in the contacts name field
   *    email:  an Email address
   *  If no params are specified, then all contacts for userId are returned.
   *  The returned XContact's are sorted by name (case-insensitive).
   *  The ordering of two contacts having the same name is unspecified.
   *  
   *  The results are sliced from startIndex (default 0) to 
   *  startIndex + count (default 5).
   *  Error Codes:
   *    DB: a database error occurred   
   */
  async search({userId, id, prefix, email, index=0, count=DEFAULT_COUNT}={}) {
    try {
      const query = { userId };
      if (id) {
        query.id = id;
      }
      if (email) {
        query.emails = email;
      }
      if (prefix) {
        query._prefix = prefix;
      }
      const cursor = this.#collection.find(query);
      const result = await cursor.sort({ name: 1 }).skip(index).limit(count).toArray();
      return okResult(result.map(item => {
        delete item._id;
        delete item._prefix;
        return item;
      }));
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }
 
  // Returns a unique, difficult to guess id.
  async #nextId() {
    const query = { _id: NEXT_ID_KEY };
    const update = { $inc: { [NEXT_ID_KEY]: 1 } };
    const options = { upsert: true, returnDocument: 'after' };
    const ret = await this.client.db().collection('id_gen').findOneAndUpdate(query, update, options);
    const seq = ret.value[NEXT_ID_KEY];
    return String(seq) + Math.random().toFixed(RAND_LEN).replace(/^0\./, '_');
  }

  get #collection() {
    return this.client.db().collection(COLLECTION_NAME);
  }
}

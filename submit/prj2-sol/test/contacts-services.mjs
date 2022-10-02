import CONTACTS from './test-data.mjs';
import ContactsDao from './contacts-mem-dao.mjs';
import makeContactsServices from '../src/contacts-services.mjs';
import chai from 'chai';

const { expect } = chai;

const USER_IDS = [ 'john', 'sue', ];

describe('Contacts services', () => {

  const userContactIds = { };
  let services, dao;

  beforeEach(async function () {
    dao = await ContactsDao.setup();
    services = makeContactsServices(dao);
    for (const userId of USER_IDS) {
      const ids = [];
      for (const contact of CONTACTS) {
	const idResult = await services.create({userId, ...contact});
	expect(idResult.errors).to.be.undefined;
	ids.push(idResult.val);
      }
      userContactIds[userId] = ids;
    }
  });

  //mocha runs this after each test; we use this to clean up the SERVICES.
  afterEach(async function () {
    await ContactsDao.tearDown(dao);
  });

  describe ('DAO services', () => {
    
    it ('must retrieve previously created contacts', async () => {
      const contacts = [];
      for (const id of userContactIds[USER_IDS[0]]) {
	const contactResult = await services.read({userId: USER_IDS[0], id});
	expect(contactResult.errors).to.be.undefined;
	const contact = cleanRetContact(contactResult.val);
	contacts.push(contact);
      }
      expect(contacts).to.deep.equal(CONTACTS);
    });

    it ('must not retrieve contacts for a different userId', async () => {
      for (const id of userContactIds[USER_IDS[0]]) {
	const contactResult = await services.read({userId: USER_IDS[1], id});
	expect(contactResult.errors).to.not.be.undefined;
	expect(contactResult.errors[0].options.code).to.equal('NOT_FOUND');
      }
    });

    it ('must not retrieve any contacts after clearing all', async () => {
      const clearResult = await services.clearAll();
      expect(clearResult.errors).to.be.undefined;
      expect(clearResult.val).to.equal(CONTACTS.length * USER_IDS.length);
      for (const userId of USER_IDS) {
	for (const id of userContactIds[userId]) {
	  const contactResult = await services.read({userId, id});
	  expect(contactResult.errors).to.not.be.undefined;
	  expect(contactResult.errors[0].options.code).to.equal('NOT_FOUND');
	}
      }
    });

    it ('must not retrieve contacts cleared for userId', async () => {
      const clearResult = await services.clear({userId: USER_IDS[0]});
      expect(clearResult.errors).to.be.undefined;
      expect(clearResult.val).to.equal(CONTACTS.length);
      for (const id of userContactIds[USER_IDS[0]]) {
	const contactResult = await services.read({userId: USER_IDS[0], id});
	expect(contactResult.errors).to.not.be.undefined;
	expect(contactResult.errors[0].options.code).to.equal('NOT_FOUND');
      }
      //must retrieve contacts for other users
      const contacts = [];
      for (const id of userContactIds[USER_IDS[1]]) {
	const contactResult = await services.read({userId: USER_IDS[1], id});
	expect(contactResult.errors).to.be.undefined;
	const contact = cleanRetContact(contactResult.val);
	contacts.push(contact);
      }
      expect(contacts).to.deep.equal(CONTACTS);
    });

    it ('read contact with bad contact id must error NOT_FOUND', async () => {
      const contacts = [];
      const id = userContactIds[USER_IDS[0]][0] + 'x';
      const contactResult = await services.read({userId: USER_IDS[0], id});
      expect(contactResult.errors).to.not.be.undefined;
      expect(contactResult.errors[0].options.code).to.equal('NOT_FOUND');
    });
    
    it ('read contact with bad userId must error NOT_FOUND', async () => {
      expect('TODO').to.be.undefined;
    });
    
    it ('creating contact with _id property must error BAD_REQ', async () => {
      expect('TODO').to.be.undefined;
    });

    it ('search without options must retrieve all contacts', async () => {
      const contactsResult = await services.search({userId: USER_IDS[0],} );
      expect(contactsResult.errors).to.be.undefined;
      const contacts = contactsResult.val.map(cleanRetContact);
      expect(contacts).to.deep.equal(CONTACTS);
    });

    it ('contacts search must start search at index', async () => {
      const index = 3;
      const contactsResult =
	await services.search({userId: USER_IDS[0], index});
      expect(contactsResult.errors).to.be.undefined;
      const contacts = contactsResult.val.map(cleanRetContact);
      expect(contacts).to.deep.equal(CONTACTS.slice(index));
    });

    it ('search must return count results starting at index', async () => {
      const index = 2;
      const count = 2;
      const contactsResult =
        await services.search({userId: USER_IDS[0], index, count});
      expect(contactsResult.errors).to.be.undefined;
      const contacts = contactsResult.val.map(cleanRetContact);
      expect(contacts).to.deep.equal(CONTACTS.slice(index, index + count));
    });

    it ('contacts search must search by first name word prefix', async () => {
      const prefix = 'que';
      const contactsResult =
	await services.search({userId: USER_IDS[0], prefix});
      expect(contactsResult.errors).to.be.undefined;
      const contacts = contactsResult.val.map(cleanRetContact);
      expect(contacts).to.deep.equal(CONTACTS.slice(3, 4));
    });

    it ('contacts search must search by last name word prefix', async () => {
      const prefix = 'go';
      const contactsResult =
	await services.search({userId: USER_IDS[0], prefix});
      expect(contactsResult.errors).to.be.undefined;
      const contacts = contactsResult.val.map(cleanRetContact);
      expect(contacts).to.deep.equal(CONTACTS.slice(3, 4));
    });
    
    it ('contacts search must retrieve multiple results', async () => {
      const prefix = 'john';
      const contactsResult =
	await services.search({userId: USER_IDS[0], prefix});
      expect(contactsResult.errors).to.be.undefined;
      const contacts = contactsResult.val.map(cleanRetContact);
      expect(contacts).to.deep.equal([CONTACTS[0], CONTACTS[4]]);
    });

    it ('contacts search must search by email', async () => {
      const email = 'qgordon37@gmail.com';
      const contactsResult =
	await services.search({userId: USER_IDS[0], email});
      expect(contactsResult.errors).to.be.undefined;
      const contacts = contactsResult.val.map(cleanRetContact);
      expect(contacts).to.deep.equal(CONTACTS.slice(3, 4));
    });
    
    it ('contacts search must search by id', async () => {
      const id = userContactIds[USER_IDS[0]][3];
      const contactsResult = await services.search({userId: USER_IDS[0], id});
      expect(contactsResult.errors).to.be.undefined;
      const contacts = contactsResult.val.map(cleanRetContact);
      expect(contacts).to.deep.equal(CONTACTS.slice(3, 4));
    });
    
    it ('case insensitive search by email and name word prefix', async () => {
      const prefix = 'QUE';
      const email = 'QGORDON37@GMAIL.COM';
      const contactsResult =
        await services.search({userId: USER_IDS[0], email, prefix});
      expect(contactsResult.errors).to.be.undefined;
      const contacts = contactsResult.val.map(cleanRetContact);
      expect(contacts).to.deep.equal(CONTACTS.slice(3, 4));
    });
    
    it ('search with incorrect name prefix must return empty', async () => {
      const prefix = 'QUEN';
      const contactsResult =
	await services.search({userId: USER_IDS[0], prefix});
      expect(contactsResult.errors).to.be.undefined;
      const contacts = contactsResult.val
      expect(contacts).to.have.lengthOf(0);
    });

    it ('search with prefix and incorrect id must return empty', async () => {
      const prefix = 'QUE';
      const id = userContactIds[USER_IDS[0]][0];
      const contactsResult =
	await services.search({userId: USER_IDS[0], id, prefix});
      expect(contactsResult.errors).to.be.undefined;
      const contacts = contactsResult.val
      expect(contacts).to.have.lengthOf(0);
    });
  });

  describe ('Invalid request services caught by checker', () => {

    it ('creating contact with bad name must error BAD_REQ', async () => {
      const contact = { userId: USER_IDS[0], ... CONTACTS[0] };
      contact.name = '@$ %@';
      const createResult = await services.create(contact);
      expect(createResult.errors).to.not.be.undefined;
      expect(createResult.errors[0].options.code).to.equal('BAD_REQ');
    });

    it ('creating contact with bad email must error BAD_REQ', async () => {
      const contact = {  userId: USER_IDS[0], ... CONTACTS[0] };
      contact.emails = ['johnatgmail.com'];
      const createResult = await services.create(contact);
      expect(createResult.errors).to.not.be.undefined;
      expect(createResult.errors[0].options.code).to.equal('BAD_REQ');
    });
    
    it ('reading a contact with undefined id must error BAD_REQ', async () => {
      const contactResult = await services.read({userId: USER_IDS[0], });
      expect(contactResult.errors).to.not.be.undefined;
      expect(contactResult.errors[0].options.code).to.equal('BAD_REQ');
    });

    it ('creating a contact with an id must error BAD_REQ', async () => {
      const contact = CONTACTS[0];
      const create = { userId: USER_IDS[0], id: 'xxx', ...contact };
      const contactResult = await services.create(create);
      expect(contactResult.errors).to.not.be.undefined;
      expect(contactResult.errors[0].options.code).to.equal('BAD_REQ');
    });

    it ('searching contact with bad prefix must error BAD_REQ', async () => {
      const searchResult =
        await services.create({userId: USER_IDS[0], prefix: '@',});
      expect(searchResult.errors).to.not.be.undefined;
      expect(searchResult.errors[0].options.code).to.equal('BAD_REQ');
    });
    
    it ('searching contact with bad email must error BAD_REQ', async () => {
      const searchResult =
	await services.create({userId: USER_IDS[0], 
			       emails: ['x at gmail.co',],});
      expect(searchResult.errors).to.not.be.undefined;
      expect(searchResult.errors[0].options.code).to.equal('BAD_REQ');
    });

  });


  
});

function cleanRetContact(contact) {
  const clean = { ...contact };
  delete clean.id; delete clean.userId;
  return clean;
}

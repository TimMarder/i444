import makeWs from '../src/contacts-ws.mjs';

import STATUS from 'http-status';

import CONTACTS from './test-data.mjs';
import { DEFAULT_COUNT } from '../src/defs.mjs';

import supertest from 'supertest';

import { makeContactsServices } from 'contacts-dao';

//will run the project DAO using an in-memory mongodb server
import ContactsDao from './contacts-mem-dao.mjs';

import chai from 'chai';
const { expect } = chai;

const USER_IDS = [ 'john', 'sue', ];
const BASE = '/contacts';

describe('web services', () => {
  
  //mocha will run beforeEach() before each test to set up these variables
  let ws, dao, contacts;
  beforeEach(async function () {
    dao = await ContactsDao.setup();
    contacts = makeContactsServices(dao);
    const appResult = makeWs(contacts, BASE);
    expect(appResult.errors).to.be.undefined;
    ws = supertest(appResult.val);
  });
	 
  //mocha runs this after each test; we use this to clean up the DAO.
  afterEach(async function () {
    await ContactsDao.tearDown(dao);
  });
	 
  async function createContact(userId, params) {
    try {
      return await
        ws.post(`${BASE}/${userId}`)
	  .set('Content-Type', 'application/json')
	  .send(params);
    }
    catch (err) {
      console.error(err);
    }
  }

  function contactUrl(userId, contactId) {
    return `${BASE}/${userId}/${contactId}`;
  }

  describe('create/read contacts', () => {
  
    it('must create contact with location', async () => {
      const userId = USER_IDS[0];
      const res = await createContact(userId, CONTACTS[0]);
      expect(res.status).to.equal(STATUS.CREATED);
      expect(res.headers.location)
	.to.match(new RegExp(`${BASE}/${userId}/.+$`));
    });

    it('must get 404 for creating contact without userId', async () => {
      const res = await createContact('', CONTACTS[0]);
      expect(res.status).to.equal(STATUS.NOT_FOUND);
    });
  
    it('must retrieve created contact', async () => {
      const userId = USER_IDS[0];
      const res1 = await createContact(userId, CONTACTS[0]);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const res2 = await ws.get(`${BASE}/${baseUrl}`);
      expect(res2.status).to.equal(STATUS.OK);
      const newContact = {id, userId, ...CONTACTS[0]};
      expect(res2.body.result).to.deep.equal(newContact);
    });

    it ('must return correct self link for retrieved contact', async () => {
      const userId = USER_IDS[0];
      const res1 = await createContact(userId, CONTACTS[0]);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const url = `${BASE}/${baseUrl}`;
      const res2 = await ws.get(url);
      expect(res2.status).to.equal(STATUS.OK);
      const links = res2.body.links;
      expect(links).to.have.length(1);
      expect(links[0].rel).to.equal('self');
      expect(links[0].href).to.match(new RegExp(`${url}$`));
    });
    
    it('must get 404 for bad contact id', async () => {
      const userId = USER_IDS[0];
      const res1 = await createContact(userId, CONTACTS[0]);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const url = `${BASE}/${baseUrl}x`;
      const res2 = await ws.get(url);
      expect(res2.status).to.equal(STATUS.NOT_FOUND);
    });

    it('must retrieve created contact with single self link', async () => {
      const userId = USER_IDS[0];
      const res1 = await createContact(userId, CONTACTS[0]);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const url = `${BASE}/${baseUrl}`;
      const res2 = await ws.get(url);
      expect(res2.status).to.equal(STATUS.OK);
      const links = res2.body.links;
      expect(links).to.have.length(1);
      expect(links[0].rel).to.equal('self');
      expect(links[0].href).to.match(new RegExp(`${url}$`));
      //supertest uses different  ephemeral port for each req
      expect(links[0].href.replace(/:\d+/, ''))
	.to.equal(loc.replace(/:\d+/, ''));
    });

  });

  describe('delete contacts', () => {
  
    it('must delete contact', async () => {
      const contactInfo = CONTACTS[0];
      const userId = USER_IDS[0];
      const res1 = await createContact(userId, contactInfo);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const res2 = await ws.delete(`${BASE}/${baseUrl}`);
      expect(res2.status).to.equal(STATUS.NO_CONTENT);
    });

    it('must not retrieve deleted contact', async () => {
      const contactInfo = CONTACTS[0];
      const userId = USER_IDS[0];
      const res1 = await createContact(userId, contactInfo);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const url = `${BASE}/${baseUrl}`;
      const res2 = await ws.delete(url);
      expect(res2.status).to.equal(STATUS.NO_CONTENT);
      const res3 = await ws.get(url);
      expect(res3.status).to.equal(STATUS.NOT_FOUND);
    });

    it('delete contact with bad userId must error NOT_FOUND', async () => {
      const contactInfo = CONTACTS[0];
      const userId = USER_IDS[0];
      const res1 = await createContact(userId, contactInfo);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const res2 = await ws.delete(`${BASE}/x${baseUrl}`);
      expect(res2.status).to.equal(STATUS.NOT_FOUND);
    });
    
    it('delete contact with bad id must error NOT_FOUND', async () => {
      const contactInfo = CONTACTS[0];
      const userId = USER_IDS[0];
      const res1 = await createContact(userId, contactInfo);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const res2 = await ws.delete(`${BASE}/${baseUrl}x`);
      expect(res2.status).to.equal(STATUS.NOT_FOUND);
    });

  });

  describe('update contacts', () => {
  
    it('must update contact', async () => {
      const contactInfo = CONTACTS[0];
      const userId = USER_IDS[0];
      const res1 = await createContact(userId, contactInfo);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const res2 = await ws.patch(`${BASE}/${baseUrl}`);
      expect(res2.status).to.equal(STATUS.OK);
      expect(res2.body.result).to.deep.equal({...contactInfo, userId, id});
    });

    it('must update contact name', async () => {
      const userId = USER_IDS[0];
      const name = 'Test User';
      const contactInfo = CONTACTS[0];
      const res1 = await createContact(userId, contactInfo);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const url = `${BASE}/${baseUrl}`;
      const res2 = await ws.patch(url).send({name});
      expect(res2.status).to.equal(STATUS.OK);
      const res3 = await ws.get(url);
      expect(res3.status).to.equal(STATUS.OK);
      expect(res3.body.result)
	.to.deep.equal({ ...contactInfo, userId, id, name });
    });
    
    it('must update contact emails', async () => {
      const userId = USER_IDS[0];
      const emails = [ 'test@test.tst' ];
      const contactInfo = CONTACTS[0];
      const res1 = await createContact(userId, contactInfo);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const url = `${BASE}/${baseUrl}`;
      const res2 = await ws.patch(url).send({emails});
      expect(res2.status).to.equal(STATUS.OK);
      const res3 = await ws.get(url);
      expect(res3.status).to.equal(STATUS.OK);
      expect(res3.body.result)
	.to.deep.equal({ ...contactInfo, userId, id, emails });
    });
    
    it('must return self link in update contact name', async () => {
      const userId = USER_IDS[0];
      const name = 'Test User';
      const contactInfo = CONTACTS[0];
      const res1 = await createContact(userId, contactInfo);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const url = `${BASE}/${baseUrl}`;
      const res2 = await ws.patch(url).send({name});
      expect(res2.status).to.equal(STATUS.OK);
      const res3 = await ws.get(url);
      expect(res3.status).to.equal(STATUS.OK);
      expect(res3.body.result)
	.to.deep.equal({ ...contactInfo, userId, id, name });
      const links = res2.body.links;
      expect(links).to.have.length(1);
      expect(links[0].rel).to.equal('self');
      expect(links[0].href).to.match(new RegExp(`${url}$`));
      //supertest uses different  ephemeral port for each req
      expect(links[0].href.replace(/:\d+/, ''))
	.to.equal(loc.replace(/:\d+/, ''));
    });
    
    it('update contact with bad userId must error NOT_FOUND', async () => {
      const userId = USER_IDS[0];
      const res1 = await createContact(userId, CONTACTS[0]);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const res2 = await ws.patch(`${BASE}/x${baseUrl}`);
      expect(res2.status).to.equal(STATUS.NOT_FOUND);
    });

    it('update contact with bad id must error NOT_FOUND', async () => {
      const userId = USER_IDS[0];
      const res1 = await createContact(userId, CONTACTS[0]);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const res2 = await ws.patch(`${BASE}/${baseUrl}x`);
      expect(res2.status).to.equal(STATUS.NOT_FOUND);
    });

    it('must update bad contact name must error BAD_REQUEST', async () => {
      const userId = USER_IDS[0];
      const name = '@#$';
      const contactInfo = CONTACTS[0];
      const res1 = await createContact(userId, contactInfo);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const url = `${BASE}/${baseUrl}`;
      const res2 = await ws.patch(url).send({name});
      expect(res2.status).to.equal(STATUS.BAD_REQUEST);
    });
    
    it('must update bad contact emails must error BAD_REQUEST', async () => {
      const userId = USER_IDS[0];
      const emails = [ 'test at test.tst' ];
      const contactInfo = CONTACTS[0];
      const res1 = await createContact(userId, contactInfo);
      const loc = res1.headers.location;
      const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
      const id = baseUrl.slice(userId.length + 1);
      const url = `${BASE}/${baseUrl}`;
      const res2 = await ws.patch(url).send({emails});
      expect(res2.status).to.equal(STATUS.BAD_REQUEST);
    });
    
  });

  describe('search contacts', () => {

    const XX = 'Xenos';
    let contacts, userId;
    let wsContacts;
    beforeEach(async function () {
      wsContacts = [];
      userId = USER_IDS[0];
      contacts =
	[ ...CONTACTS, ...CONTACTS.map(c => ({ ...c, name: `${XX} ${c.name}`}))	]
	.sort((c1, c2) => c1.name < c2.name ? -1 : c1.name > c2.name ? +1 : 0);
      for (const contact of contacts) {
	const res1 = await createContact(userId, contact);
	expect(res1.status).to.equal(STATUS.CREATED);
	const loc = res1.headers.location; 
	expect(loc).to.match(new RegExp(`${BASE}/${userId}/.+$`));
	const baseUrl = loc.substring(loc.indexOf(BASE) + BASE.length + 1);
	const id = baseUrl.slice(userId.length + 1);
	const res2 = await ws.get(`${BASE}/${baseUrl}`);
	expect(res2.status).to.equal(STATUS.OK);
	wsContacts.push(res2.body.result);
      }
    });

    it(`must retrieve first ${DEFAULT_COUNT} contacts`, async () => {
      const url = `${BASE}/${userId}`;
      const res = await ws.get(url);
      expect(res.status).to.equal(STATUS.OK);
      expect(res.body.result).to.have.length(DEFAULT_COUNT);
      const searchContacts = res.body.result;
      expect(res.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(0, DEFAULT_COUNT));
    });

    it(`must retrieve empty contacts for unknown userId`, async () => {
      const url = `${BASE}/${USER_IDS[1]}`;
      const res = await ws.get(url);
      expect(res.status).to.equal(STATUS.OK);
      expect(res.body.result).to.have.length(0);
    });

    it(`must retrieve first 2 contacts`, async () => {
      const count = 2;
      const params = { count };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res = await ws.get(url);
      expect(res.status).to.equal(STATUS.OK);
      expect(res.body.result).to.have.length(count);
      const searchContacts = res.body.result;
      expect(res.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(0, count));
    });

    it(`must retrieve middle 3 contacts`, async () => {
      const index = 5;
      const count = 3;
      const params = { count, index };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res = await ws.get(url);
      expect(res.status).to.equal(STATUS.OK);
      expect(res.body.result).to.have.length(count);
      const searchContacts = res.body.result;
      expect(res.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(index, index + count));
    });

    it(`must retrieve all contacts with specified email`, async () => {
      const email = wsContacts.find(c => c?.emails?.[0]).emails[0];
      const params = { email, };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res = await ws.get(url);
      expect(res.status).to.equal(STATUS.OK);
      const searchContacts = res.body.result;
      const expected = wsContacts.filter(c => c?.emails?.[0] === email);
      expect(res.body.result.map(r => r.result)).to.deep.equal(expected);
    });

    it(`must retrieve no contacts with unknown name prefix XX`, async () => {
      const prefix = 'XX';
      const params = { prefix };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res = await ws.get(url);
      expect(res.status).to.equal(STATUS.OK);
      expect(res.body.result).to.have.length(0);
    });

    it(`must retrieve no contacts with unknown email`, async () => {
      const email = 'x@xxx.xxx';
      const params = { email };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res = await ws.get(url);
      expect(res.status).to.equal(STATUS.OK);
      expect(res.body.result).to.have.length(0);
    });

    it(`must retrieve all contacts with ${XX} name prefix`, async () => {
      const prefix = XX;
      const index = 2;
      const count = 2;
      const params = { prefix, count, index };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res = await ws.get(url);
      expect(res.status).to.equal(STATUS.OK);
      expect(res.body.result).to.have.length(count);
      const searchContacts = res.body.result;
      const expected = wsContacts
        .filter(c => c.name.startsWith(XX))
	.slice(index, index + count);
      expect(res.body.result.map(r => r.result)).to.deep.equal(expected);
    });

    it(`must have self, next and prev links for middle results`, async () => {
      const index = 5;
      const count = 3;
      const params = { count, index };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res1 = await ws.get(url);
      expect(res1.status).to.equal(STATUS.OK);
      expect(res1.body.result).to.have.length(count);
      const searchContacts = res1.body.result;
      expect(res1.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(index, index + count));
      const links = res1.body.links;
      expect(links).to.have.length(3);
      const self = links.find(link => link.rel === 'self');
      expect(self).to.not.be.undefined;
      const next = links.find(link => link.rel === 'next');
      expect(next).to.not.be.undefined;
      const prev = links.find(link => link.rel === 'prev');
      expect(prev).to.not.be.undefined;
      const nextIndex = next.href.match(/index=(\d+)/)[1];
      expect(Number(nextIndex)).to.equal(index + count);
      const prevIndex = prev.href.match(/index=(\d+)/)[1];
      expect(Number(prevIndex)).to.equal(index > count ? index - count : 0);
    });

    it(`must not have prev link for first results`, async () => {
      const index = 0;
      const count = 3;
      const params = { count, index };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res1 = await ws.get(url);
      expect(res1.status).to.equal(STATUS.OK);
      expect(res1.body.result).to.have.length(count);
      const searchContacts = res1.body.result;
      expect(res1.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(index, index + count));
      const links = res1.body.links;
      expect(links).to.have.length(2);
      const next = links.find(link => link.rel === 'next');
      expect(next).to.not.be.undefined;
      const prev = links.find(link => link.rel === 'prev');
      expect(prev).to.be.undefined;
      const nextIndex = next.href.match(/index=(\d+)/)[1];
      expect(Number(nextIndex)).to.equal(index + count);
    });

    it(`must not have next links for last results`, async () => {
      const index = 7;
      const params = { index };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res1 = await ws.get(url);
      expect(res1.status).to.equal(STATUS.OK);
      expect(res1.body.result).to.have.length(3);
      const searchContacts = res1.body.result;
      expect(res1.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(index));
      const links = res1.body.links;
      expect(links).to.have.length(2);
      const next = links.find(link => link.rel === 'next');
      expect(next).to.be.undefined;
      const prev = links.find(link => link.rel === 'prev');
      expect(prev).to.not.be.undefined;
      const prevIndex = prev.href.match(/index=(\d+)/)[1];
      expect(Number(prevIndex))
	.to.equal(index > DEFAULT_COUNT ? index - DEFAULT_COUNT : 0);
    });

    it(`must follow self link in middle results`, async () => {
      const index = 5;
      const count = 3;
      const params = { count, index };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res1 = await ws.get(url);
      expect(res1.status).to.equal(STATUS.OK);
      expect(res1.body.result).to.have.length(count);
      const searchContacts = res1.body.result;
      expect(res1.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(index, index + count));
      const links = res1.body.links;
      expect(links).to.have.length(3);
      const self = links.find(link => link.rel === 'self');
      expect(self).to.not.be.undefined;
      const selfUrl = self.href.replace(new RegExp(`^.+(${BASE})`), `$1`);
      expect(selfUrl).to.equal(url);
      const res2 = await ws.get(selfUrl);
      expect(res2.status).to.equal(STATUS.OK);
      expect(res2.body.result).to.have.length(count);
      expect(res2.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(index, index + count));
    });
    
    it(`must follow next link in middle results`, async () => {
      const index = 4;
      const count = 3;
      const params = { count, index };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res1 = await ws.get(url);
      expect(res1.status).to.equal(STATUS.OK);
      expect(res1.body.result).to.have.length(count);
      const searchContacts = res1.body.result;
      expect(res1.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(index, index + count));
      const links = res1.body.links;
      expect(links).to.have.length(3);
      const next = links.find(link => link.rel === 'next');
      expect(next).to.not.be.undefined;
      const nextUrl = next.href.replace(new RegExp(`^.+(${BASE})`), `$1`);
      const res2 = await ws.get(nextUrl);
      expect(res2.status).to.equal(STATUS.OK);
      expect(res2.body.result).to.have.length(count);
      expect(res2.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(index + count, index + 2*count));
    });
    
    it(`must follow prev link in middle results`, async () => {
      const index = 4;
      const count = 3;
      const params = { count, index };
      const q = new URLSearchParams(params).toString();
      const url = `${BASE}/${userId}?${q}`;
      const res1 = await ws.get(url);
      expect(res1.status).to.equal(STATUS.OK);
      expect(res1.body.result).to.have.length(count);
      const searchContacts = res1.body.result;
      expect(res1.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(index, index + count));
      const links = res1.body.links;
      expect(links).to.have.length(3);
      const prev = links.find(link => link.rel === 'prev');
      expect(prev).to.not.be.undefined;
      const prevUrl = prev.href.replace(new RegExp(`^.+(${BASE})`), `$1`);
      const res2 = await ws.get(prevUrl);
      expect(res2.status).to.equal(STATUS.OK);
      expect(res2.body.result).to.have.length(count);
      expect(res2.body.result.map(r => r.result))
	.to.deep.equal(wsContacts.slice(index - count, index));
    });
    
  });

});


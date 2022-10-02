import chai from 'chai';
const { expect } = chai;

const USER_ID = 'john';

import CONTACTS from './test-data.mjs';
import { checkClearRequest, checkCreateRequest,
	 checkReadRequest, checkSearchRequest,
       } from '../src/request-checkers.mjs';


describe('Clear Checker', () => {

  it ('a good clear request must be ok', async () => {
    const req = { userId: USER_ID };
    const createResult = checkClearRequest(req);
    expect(createResult.errors).to.be.undefined;
  });

  it ('clear request with missing userId must error BAD_REQ', async () => {
    const req = { };
    const createResult = checkCreateRequest(req);
    expect(createResult.errors).to.not.be.undefined;
    expect(createResult.errors[0].options.code).to.equal('BAD_REQ');
  });
});

describe('Create Checker', () => {

  it ('creating a good contact must be ok', async () => {
    const contact = { userId: USER_ID, ...CONTACTS[0] };
    const createResult = checkCreateRequest(contact);
    expect(createResult.errors).to.be.undefined;
  });

  it ('creating contact with missing userId must error BAD_REQ', async () => {
    const contact = { ...CONTACTS[0] };
    const createResult = checkCreateRequest(contact);
    expect(createResult.errors).to.not.be.undefined;
    expect(createResult.errors[0].options.code).to.equal('BAD_REQ');
  });
  
  it ('creating contact with missing name must error BAD_REQ', async () => {
    const contact = { userId: USER_ID, ... CONTACTS[0] };
    delete contact.name;
    const createResult = checkCreateRequest(contact);
    expect(createResult.errors).to.not.be.undefined;
    expect(createResult.errors[0].options.code).to.equal('BAD_REQ');
  });
  
  it ('creating contact with bad name must error BAD_REQ', async () => {
    const contact = { userId: USER_ID, ... CONTACTS[0] };
    contact.name = '@$ %@';
    const createResult = checkCreateRequest(contact);
    expect(createResult.errors).to.not.be.undefined;
    expect(createResult.errors[0].options.code).to.equal('BAD_REQ');
  });

  it ('creating contact with bad email must error BAD_REQ', async () => {
    const contact = { userId: USER_ID, ... CONTACTS[0] };
    contact.emails = ['johnatgmail.com'];
    const createResult = checkCreateRequest(contact);
    expect(createResult.errors).to.not.be.undefined;
    expect(createResult.errors[0].options.code).to.equal('BAD_REQ');
  });


  it ('creating a contact with an id must error BAD_REQ', async () => {
    const contact = { id: 'xxx', userId: USER_ID, ... CONTACTS[0] };
    const createResult = checkCreateRequest(contact);
    expect(createResult.errors).to.not.be.undefined;
    expect(createResult.errors[0].options.code).to.equal('BAD_REQ');
  });

});

describe('Read Checker', () => {

  it ('a good read request must be ok', async () => {
    const req = { userId: USER_ID, id: 'xxx', };
    const readResult = checkReadRequest(req);
    expect(readResult.errors).to.be.undefined;
  });

  it ('a read request with missing userId must error BAD_REQ', async () => {
    const req = { id: 'xxx', };
    const readResult = checkReadRequest(req);
    expect(readResult.errors).to.not.be.undefined;
  });

  it ('a read request with missing id must error BAD_REQ', async () => {
    const req = { userId: USER_ID,  };
    const readResult = checkReadRequest(req);
    expect(readResult.errors).to.not.be.undefined;
  });

});

describe('Search Checker', () => {

  it ('a good search request with no params must be ok', async () => {
    const req = { userId: USER_ID, };
    const searchResult = checkSearchRequest(req);
    expect(searchResult.errors).to.be.undefined;
  });

  it ('a good search request with prefix param must be ok', async () => {
    const req = { userId: USER_ID, prefix: 'x', };
    const searchResult = checkSearchRequest(req);
    expect(searchResult.errors).to.be.undefined;
  });

  it ('a good search request with id param must be ok', async () => {
    const req = { userId: USER_ID, id: 'x', };
    const searchResult = checkSearchRequest(req);
    expect(searchResult.errors).to.be.undefined;
  });
  
  it ('a good search request with email param must be ok', async () => {
    const req = { userId: USER_ID, email: 'x@x.COM', };
    const searchResult = checkSearchRequest(req);
    expect(searchResult.errors).to.be.undefined;
  });

  it ('a good search request with string count param must be ok', async () => {
	const req = { userId: USER_ID, count: '5', };
	const searchResult = checkSearchRequest(req);
	expect(searchResult.errors).to.be.undefined;
      });
  
  it ('a good search request with int count param must be ok', async () => {
	const req = { userId: USER_ID, count: 5, };
	const searchResult = checkSearchRequest(req);
	expect(searchResult.errors).to.be.undefined;
      });

  it ('a good search request with multiple search params must be ok',
      async () => {
	const req = { userId: USER_ID, prefix: 'x', email: 'x@x.x', id: 'x',
		      index: '2', count: 5, };
	const searchResult = checkSearchRequest(req);
	expect(searchResult.errors).to.be.undefined;
      });

  it ('a search request with missing userId must error BAD_REQ', async () => {
    const req = { };
    const searchResult = checkSearchRequest(req);
    expect(searchResult.errors).to.not.be.undefined;
    expect(searchResult.errors[0].options.code).to.equal('BAD_REQ');
  });
  
  it ('a search request with bad prefix must error BAD_REQ', async () => {
    const req = { userId: USER_ID, prefix: '@' };
    const searchResult = checkSearchRequest(req);
    expect(searchResult.errors).to.not.be.undefined;
    expect(searchResult.errors[0].options.code).to.equal('BAD_REQ');
  });

  it ('a search request with bad email must error BAD_REQ', async () => {
    const req = { userId: USER_ID, email: '@' };
    const searchResult = checkSearchRequest(req);
    expect(searchResult.errors).to.not.be.undefined;
    expect(searchResult.errors[0].options.code).to.equal('BAD_REQ');
  });

  it ('a search request with bad count must error BAD_REQ', async () => {
    const req = { userId: USER_ID, count: '2@' };
    const searchResult = checkSearchRequest(req);
    expect(searchResult.errors).to.not.be.undefined;
    expect(searchResult.errors[0].options.code).to.equal('BAD_REQ');
  });
  
  it ('a search request with bad index must error BAD_REQ', async () => {
    const req = { userId: USER_ID, index: '@2' };
    const searchResult = checkSearchRequest(req);
    expect(searchResult.errors).to.not.be.undefined;
    expect(searchResult.errors[0].options.code).to.equal('BAD_REQ');
  });
  
});


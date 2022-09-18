import makeContacts from '../src/contacts.mjs';

import chai from 'chai';
const { expect } = chai;

const USER = 'cs444-544';

describe('Contacts', () => {

  let userContacts;
  let ids;

  beforeEach(() => {
    const contactsResult = makeContacts();
    expect(contactsResult.errors).to.be.undefined;
    const userContactsResult = contactsResult.val.userContacts(USER);
    expect(userContactsResult.errors).to.be.undefined;
    userContacts = userContactsResult.val;
    ids = [];
    for (const contact of CONTACTS) {
      const idResult = userContacts.create(contact);
      expect(idResult.errors).to.be.undefined;
      ids.push(idResult.val);
    }
  });

  it ('must retrieve previously created contacts', () => {
    const contacts = [];
    for (const id of ids) {
      const contactResult = userContacts.read(id);
      expect(contactResult.errors).to.be.undefined;
      const contact = contactResult.val;
      delete contact.id;
      contacts.push(contact);
    }
    expect(contacts).to.deep.equal(CONTACTS);
  });

  it ('retrieving a contact with a non-existing id must error NOT_FOUND', () => {
    const contacts = [];
    const id = ids[0] + 'x';
    const contactResult = userContacts.read(id);
    expect(contactResult.errors).to.not.be.undefined;
    expect(contactResult.errors[0].options.code).to.equal('NOT_FOUND');
  });

  it ('retrieving a contact with an undefined id must error BAD_REQ', () => {
    const contactResult = userContacts.read();
    expect(contactResult.errors).to.not.be.undefined;
    expect(contactResult.errors[0].options.code).to.equal('BAD_REQ');
  });

  it ('creating a contact with an id must error BAD_REQ', () => {
    const contact = CONTACTS[0];
    const create = { id: 'xxx', ...contact };
    const contactResult = userContacts.create(create);
    expect(contactResult.errors).to.not.be.undefined;
    expect(contactResult.errors[0].options.code).to.equal('BAD_REQ');
  });

  it ('contacts search without any options must retrieve all CONTACTS', () => {
    const contactsResult = userContacts.search();
    expect(contactsResult.errors).to.be.undefined;
    const contacts = contactsResult.val
	  .map(c => { const c1 = { ... c}; delete c1.id; return c1; });
    expect(contacts).to.deep.equal(CONTACTS);
  });

  it ('contacts search must start search at index', () => {
    const index = 3;
    const contactsResult = userContacts.search({}, index);
    expect(contactsResult.errors).to.be.undefined;
    const contacts = contactsResult.val
	  .map(c => { const c1 = { ... c}; delete c1.id; return c1; });
    expect(contacts).to.deep.equal(CONTACTS.slice(index));
  });

  it ('contacts search must return count results starting at index', () => {
    const index = 2;
    const count = 2;
    const contactsResult = userContacts.search({}, index, count);
    expect(contactsResult.errors).to.be.undefined;
    const contacts = contactsResult.val
	  .map(c => { const c1 = { ... c}; delete c1.id; return c1; });
    expect(contacts).to.deep.equal(CONTACTS.slice(index, index + count));
  });

  it ('contacts search must search by first name word prefix', () => {
    const nameWordPrefix = 'que';
    const contactsResult = userContacts.search({nameWordPrefix});
    expect(contactsResult.errors).to.be.undefined;
    const contacts = contactsResult.val
	  .map(c => { const c1 = { ... c}; delete c1.id; return c1; });
    expect(contacts).to.deep.equal(CONTACTS.slice(1, 2));
  });

  it ('contacts search must search by last name word prefix', () => {
    const nameWordPrefix = 'go';
    const contactsResult = userContacts.search({nameWordPrefix});
    expect(contactsResult.errors).to.be.undefined;
    const contacts = contactsResult.val
	  .map(c => { const c1 = { ... c}; delete c1.id; return c1; });
    expect(contacts).to.deep.equal(CONTACTS.slice(1, 2));
  });
  
  it ('contacts search must retrieve multiple results', () => {
    const nameWordPrefix = 'john';
    const contactsResult = userContacts.search({nameWordPrefix});
    expect(contactsResult.errors).to.be.undefined;
    const contacts = contactsResult.val
	  .map(c => { const c1 = { ... c}; delete c1.id; return c1; });
    const cmp = (c1, c2) => c1.name < c2.name ? -1 : c1.name > c2.name ? 1 : 0;
    expect(contacts.sort(cmp))
      .to.deep.equal([CONTACTS[0], CONTACTS[2]].sort(cmp));
  });

  it ('contacts search must search by email', () => {
    const email = 'qgordon37@gmail.com';
    const contactsResult = userContacts.search({email});
    expect(contactsResult.errors).to.be.undefined;
    const contacts = contactsResult.val
	  .map(c => { const c1 = { ... c}; delete c1.id; return c1; });
    expect(contacts).to.deep.equal(CONTACTS.slice(1, 2));
  });
    
  it ('contacts search must search by id', () => {
    const id = ids[3];
    const contactsResult = userContacts.search({id});
    expect(contactsResult.errors).to.be.undefined;
    const contacts = contactsResult.val
	  .map(c => { const c1 = { ... c}; delete c1.id; return c1; });
    expect(contacts).to.deep.equal(CONTACTS.slice(3, 4));
  });
    
  it ('contacts case insensitive search by email and name word prefix', () => {
    const nameWordPrefix = 'QUE';
    const email = 'QGORDON37@GMAIL.COM';
    const contactsResult = userContacts.search({email, nameWordPrefix});
    expect(contactsResult.errors).to.be.undefined;
    const contacts = contactsResult.val
	  .map(c => { const c1 = { ... c}; delete c1.id; return c1; });
    expect(contacts).to.deep.equal(CONTACTS.slice(1, 2));
  });
  
  it ('contacts search with incorrect name prefix must return empty', () => {
    const nameWordPrefix = 'QUEN';
    const contactsResult = userContacts.search({nameWordPrefix});
    expect(contactsResult.errors).to.be.undefined;
    const contacts = contactsResult.val
    expect(contacts).to.have.lengthOf(0);
  });

  it ('retrieved contact must not share structure with stored contact', () => {
    const index = 0;
    const id = ids[index];
    const contactResult = userContacts.read(id);
    expect(contactResult.errors).to.be.undefined;
    const contact = contactResult.val;
    delete contact.id;
    expect(contact).to.deep.equal(CONTACTS[index]);
    contact.addr.addrLine1 = '123 University Av';
    contact.emails[0] = 'jstudent@binghamton.edu'; 
    const contact1Result = userContacts.read(id);
    expect(contact1Result.errors).to.be.undefined;
    const contact1 = contact1Result.val;
    delete contact1.id;
    expect(contact1).to.deep.equal(CONTACTS[index]);
  });
  
});

const CONTACTS = [
  {
    name: 'Ethan Johns',
    emails: [ 'ejohns77@binghamton.edu', 'ejohns@hotmail.com' ],
    addr: { addrLine1: 'Hillside Apts, #28', addrLine2: '723 Spruce Avenue' },
    phones: [ [ 'home', '(554) 504-5249' ] ]
  },
  {
    name: 'Queenie Gordon',
    emails: [ 'qgordon37@gmail.com' ],
    addr: { addrLine1: '611 Park Road' },
    phones: [ [ 'spouse', '(497) 694-9780' ] ]
  },
  {
    name: 'Zoe Johnson',
    emails: [
      'zojohn23@yahoo.com',
      'zojohn@hotmail.com',
      'zjohns@binghamton.edu',
      'zjohns21@hotmail.com'
    ],
    addr: {
      addrLine1: '673 Washington Road',
      city: 'Lincoln',
      state: 'HI',
      zip: '62271'
    },
    phones: [
      [ 'work', '(938) 228-1311' ],
      [ 'cell', '(557) 927-2609' ],
      [ 'cell', '(147) 756-5621' ],
      [ 'work', '(278) 837-4562' ]
    ]
  },
  {
    name: 'Nancy Evans',
    addr: { addrLine1: '388 Oak Road' },
    phones: [ [ 'home', '(314) 712-7299' ] ]
  },
  {
    name: 'Ethan Martin',
    emails: [ 'emartin@maildrop.com' ],
    addr: {
      addrLine1: '235 Meadow Road',
      city: 'Lincoln',
      state: 'MI',
      zip: '35696'
    }
  }
];

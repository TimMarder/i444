//the following declarations are legal TS accepted by the TS playground

//note Result below refers to Result defined in
//in the course file lib/js-utils/src/errors.d.ts
//the following placeholder declaration keeps TS happy
type Result<T> = { val: T };

/** Top level required function */
declare function makeContacts() : Result<Contacts>;

/** holds the contacts for multiple users */
interface Contacts {

  /** return an instance of UserContacts */
  userContacts(userId: string) : Result<UserContacts>;
}

/** an email must be a string which matches /^.+?\@.+?\..+$/ */
type Email = string;

type Address = {
  /** an address must have at least one address line */
  addrLine1: string;

  /** an address may have a second optional address line */
  addrLine2?: string;

  /** an address may have an optional city */
  city?: string;
  
  /** an address may have an optional state */
  state?: string;
  
  /** an address may have an optional zip */
  zip?: string;
  
}

/** a Phone is a pair giving the type of phone number ("home", "cell", etc)
 *  and a phone number like "(607) 123-4567").
 */
type Phone = [ type: string, telNumber: string ];
interface Contact {
  /** every contact must have a name field.  
   *  Each name must have at least one word containing at least two letters.
   */
  name: string;

  /** a contact may have zero or more emails associated with it */
  emails?: Email[];

  /** a contact may have an optional address */
  addr?: Address;

  /** a contact may have zero or more Phones associated with it */
  phones?: Phone[];


  /** a contact may have an optional notes field */
  notes?: string;

  /** a contact may have an optional structured info field */
  info?: { [key: string]: string };
  
  /** a Contact may have other fields mapping to arbitrary objects.
   *  The key may not be id.
   *  declaration commented out for technical TS reasons
   */
  //[key: string]: object;
}

/** an ID is some opaque string */
type ID = string;

/** an extended contact XContact enhances a contact with an ID */
interface XContact extends Contact {
  id: ID;
}

/** holds the contacts for a single user */
interface UserContacts {
  // performance of the following methods should usually be independent
  // of the number of contacts for the user.

  /** the userId of the user who owns these contacts */
  readonly userId: string;


  /** Add object contact into this under a new contactId and return
   *  Result<contactId>.  The contact must have a name field which
   *  must contain at least one word containing at least two letters.  
   *  The added contact should not share any structure with the contact param.
   *  Errors Codes: 
   *    BAD_REQ: contact.name is not a string which contains at least one word 
   *             with at least 2 letters.
   *             Contact.emails is present but is not an array or contains
   *             an entry which does not match /^.+?\@.+?\..+$/.
   *             Contact contains an id property
   */
  create(contact: Contact) : Result<ID>;

  /** Return XContact for contactId.
   *  The returned contact should not share any structure with that
   *  stored within this.
   *  Error Codes:
   *    BAD_REQ: contactId not provided as a string
   *    NOT_FOUND: no contact for contactId
   */
  read(contactId: ID) : Result<XContact>;

  /** search for contact by zero or more of the following fields in params:
   *    id:     the contact ID.
   *    nameWordPrefix: a string, the letters of which must match 
   *            the prefix of a word in the contacts name field
   *    email:  an Email address
   *  If no params are specified, then all contacts are returned
   *  
   *  The results are sliced from startIndex (default 0) to 
   *  startIndex + count (default 5).
   *  Error Codes:
   *    BAD_REQ: name is specified in params but does not consist of
   *             a single word containing at least two letters
   *             email is specified in params but does not contain a
   *             a valid Email address
   */
  search(params?: {id?: ID, nameWordPrefix?: string, email?: Email},
	 startIndex?: number, count?: number) : Result<XContact[]>;
  
}

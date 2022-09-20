// refer to ./contacts.d.ts for details of types

import { okResult, errResult } from "cs544-js-utils";

export default function makeContacts() {
  return okResult(new Contacts());
}

/** holds the contacts for different users */
class Contacts {
  //TODO: add instance fields if necessary

  /** return an instance of UserContacts */
  userContacts(userId) {
    //TODO: fix to ensure same object returned for same userId
    return okResult(new UserContacts(userId));
  }
}

/** holds the contacts for single user specified by userId */
class UserContacts {
  //TODO: add instance fields if necessary
  #counter = 0;
  #userId = 0;
  #contacts 
  constructor(userId) {
    this.#counter = 0;
    this.#userId = userId;
    this.#contacts = new Map();
  }

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
  create(contact) {
    let validation = this.#validate(contact);

    if (validation.success === true) {
      let id = this.#generateId();
      contact.id = id;
      this.#contacts.set(id, contact);
      return okResult(id);
    } else {
      return errResult(validation.reason);
    }
  }

  /** Return XContact for contactId.
   *  The returned contact should not share any structure with that
   *  stored within this.
   *  Error Codes:
   *    BAD_REQ: contactId not provided as a string
   *    NOT_FOUND: no contact for contactId
   */
  read(contactId) {
    if(typeof contactId !== "string"){
      return errResult("BAD_REQ");
    }

    const contact = this.#contacts.get(contactId);

    if(contact === undefined){
      return errResult("NOT_FOUND");
    }

    return okResult(contact);
  }

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
  search({ id, nameWordPrefix, email } = {}, startIndex = 0, count = 5) {
    let contacts = []; 
    
    this.#contacts.forEach((value, key, map) => {
      contacts.push(value)
    });

    if(id !== undefined){
      contacts = contacts.filter( item => item.id === id);
    }

    if(nameWordPrefix !== undefined){
      var re = /([A-Z]){2,}/i;
      let res = re.test(nameWordPrefix);
      if (res === false) {
        return errResult("BAD_REQ");
      }

      contacts = contacts.filter( item => item.name.startsWith(nameWordPrefix) === true);
    }

    
    if(email !== undefined){
      contacts = contacts.filter( item => item.emails.indexOf(email) > -1);
    }

    if(contacts.length > count){
      contacts = contacts.slice(startIndex, count)
    }


    return okResult(contacts);
  }

  byUserId(userId) {
    if(userId === this.#userId){
      return this.#contacts;
    }else{
      return errResult("BAD_REQ");
    }

  }

  //TODO: define auxiliary methods

  
  #generateId() {
    this.#counter++;
    return this.#counter.toString();
  }

  #validate(contact) {
    let isValid = true;
    let reason = "";

    if (contact.emails instanceof Array === false) {
      isValid = false;
      reason = "BAD_REQ";
    }

    if (isValid === true) {
      contact.emails.forEach((email) => {
        var re = /^.+?\@.+?\..+$/;
        let res = re.test(email);
        if (res === false) {
          isValid = false;
          reason = "BAD_REQ";
          return false;
        }
      });
    }

    if (isValid === true) {
      var re = /([A-Z]){2,}/i;
      let res = re.test(contact.name);
      if (res === false) {
        isValid = false;
        reason = "BAD_REQ";
        return false;
      }
    }

    return {
      reason: reason,
      success: isValid,
    };
  }
}

//TODO: define auxiliary functions and classes.

// non-destructive implementations of set operations which may be useful
function setIntersection(setA, setB) {
  const result = new Set();
  for (const el of setA) {
    if (setB.has(el)) result.add(el);
  }
  return result;
}

function setUnion(setA, setB) {
  const result = new Set(setA);
  for (const el of setB) result.add(el);
  return result;
}

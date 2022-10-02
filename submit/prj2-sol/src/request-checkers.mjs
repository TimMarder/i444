import { Result, errResult, okResult } from 'cs544-js-utils';
import { namePrefixes } from './utils.mjs';

export function checkClearAllRequest(reqObj) {
  return okResult();
}

export function checkClearRequest(reqObj) {
  return checkRequest(reqObj, [ checkRequiredString('userId'), ]);
}

export function checkCreateRequest(reqObj) {
  return checkRequest(reqObj, [
    checkRequiredString('userId'),
    checkForbidden('id'),
    checkName, checkOptionalEmails,    
  ]);
}

export function checkReadRequest(reqObj) {
  return checkRequest(reqObj, [
    checkRequiredString('userId'), checkRequiredString('id'),
  ]);
}

export function checkSearchRequest(reqObj) {
  const checkers = [
    checkRequiredString('userId'),
    req => req.email ? checkEmail(req.email) : okResult(),
    checkOptionalPrefix,
    checkOptionalInt('index'), checkOptionalInt('count'),
  ];
  return checkRequest(reqObj, checkers); 
}


function checkRequest(reqObj, checkers) {
  const errs = [];
  for (const check of checkers) {
    const checkResult = check(reqObj);
    if (checkResult.errors) {
      errs.push(...checkResult.errors);
    }
  }
  return (errs.length === 0) ? okResult() : new Result(null, errs);
}

function checkOptionalInt(key) {
  return reqObj => 
    (reqObj[key] === undefined || reqObj[key].toString().match(/^\d+$/))
    ? okResult()
    : errResult(`bad ${key} "${reqObj[key]}": expect integer`, {code:'BAD_REQ'});
}


function checkOptionalPrefix(reqObj) {
  if (reqObj.prefix) {
    const prefix = reqObj.prefix.toString();
    return /[a-z]/.test(prefix.toLowerCase())
      ? okResult()
      : errResult(`invalid prefix "${prefix}"`, { code: 'BAD_REQ' });
  }
  return okResult();
}

function checkName(reqObj) {
  const name = reqObj.name;
  if (typeof name !== 'string') {
    return errResult('name must be a string', { code: 'BAD_REQ' });
  }
  else {
    const prefixes = namePrefixes(name);
    return (prefixes.length > 0)
      ? okResult()
      : errResult(`no alphabetic word in name`, { code: 'BAD_REQ' });
  }
}


function checkRequiredString(key) {
  return reqObj => {
    if (typeof reqObj[key] !== 'string' || reqObj[key].trim().length === 0) {
      return new errResult(`request must have a string valued ${key} property`,
			   {code: 'BAD_REQ'});
    }
    else {
      return okResult(reqObj);
    }
  };
}

function checkForbidden(key) {
  return reqObj => {
    if (reqObj[key] !== undefined) {
      return errResult(`request cannot have a ${key} property`,
			   {code: 'BAD_REQ'});
    }
    else {
      return okResult();
    }
  };
}


function checkOptionalEmails(reqObj) {
  const emails = reqObj.emails;
  if (emails === undefined) {
    return okResult();
  }
  else if (!Array.isArray(emails)) {
    return errResult('emails must be an array', { code: 'BAD_REQ' });
  }
  else {
    const errResult = emails.map(checkEmail).find(result => result.errors);
    return errResult ?? okResult();
  }
}

function checkEmail(email) {
  return (
    (email && email.toString().trim().match(/^.+?\@.+?\..+$/))
      ? okResult()
      : errResult(`bad email "${email}"`, { code: 'BAD_REQ' })
  );
}

		     

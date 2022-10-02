import * as checkers from './request-checkers.mjs';

export default function makeServices(dao) {
  return new ContactsServices(dao);
}

class ContactsServices {
  constructor(dao) {
    this.dao = dao;
  }

  //generate wrapper methods which wrap call to checker function followed by
  //call to dao function.  Each generated method has structure of
  //form:
  //
  // SERVICE(req) {
  //   const checkResult = checkerFn(req); //checkerFn appropriate to SERVICE
  //   if (checkResult.errors) return checkResult;
  //   return this.dao[SERVICE](req);
  // }
  static {
    for (const service of [ 'clearAll', 'clear', 'create', 'read', 'search' ]) {
      ContactsServices.prototype[service] =
	async function (req) {
	  const checkFnName =
	    `check${service[0].toUpperCase()}${service.slice(1)}Request`;
	  const checkResult = checkers[checkFnName](req);
	  if (checkResult.errors) return checkResult;
	  return await this.dao[service](req);
	}
    }
  }

}

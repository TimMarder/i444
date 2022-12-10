import { Result, okResult, errResult } from 'cs544-js-utils';

/** Return a Result for dispatching HTTP method to url.  If jsonBody
 *  is specified, then it should be sent as JSON.  
 *
 *  The response should return an error Result if there is a fetch
 *  error or if the response JSON contains errors.
 *
 *  If there are no errors and the response body is non-empty then the
 *  function should return the response body within an ok Result.
 *
 * If there are no errors and the response body is empty, the function
 * should return an undefined ok Result.  
 */
export async function doFetchJson(method, url, jsonBody=undefined) {
  const options = { method };
  if (jsonBody) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(jsonBody);
  }
  try {
    const response = await fetch(url, options);
    const contentLength = Number(response.headers.get('content-length') ?? 0);
    if (contentLength === 0) {
      return okResult();
    }
    else {
      const data = await response.json();
      return (data.errors) ? new Result(null, data.errors) : okResult(data);
    }
  }
  catch (err) {
    console.error(err);
    return errResult(err);
  }
}


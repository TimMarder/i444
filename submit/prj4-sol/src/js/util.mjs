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
  try {
    const response =
      await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonBody)
      });

    const contentLength = response.headers.get("content-length");
    if (!contentLength || parseInt(contentLength) === 0) {
      return okResult(undefined);
    }

    const data = await response.json();
    if (data.errors) {
      return new Result(null, data.errors);
    } 

    return okResult(data);
  } catch (err) {
    return errResult(err.message, { code: 'INTERNAL', cause: err });
  }
}

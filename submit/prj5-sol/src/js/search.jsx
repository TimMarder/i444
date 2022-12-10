import React, { useEffect } from "react";

import { doFetchJson } from "./utils.mjs";

export default function Search(props) {
  const { wsUrl, queryParam, resultTag, label = "Search" } = props;
  const [currentUrl, setCurrentUrl] = React.useState(wsUrl);
  const [prevUrl, setPrevUrl] = React.useState("");
  const [nextUrl, setNextUrl] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [errors, setErrors] = React.useState([]);

  async function doSearch() {
    const res = await doFetchJson("GET", currentUrl);

    if (res.errors) {
      setErrors(res.errors);
      return;
    }

    const val = res.val;
    setResults(val.result);

    setNextUrl(getLink(val.links, "next"));
    setPrevUrl(getLink(val.links, "prev"));
  }

  React.useEffect(() => {
    if (currentUrl) {
      doSearch();
    }
  }, [currentUrl]);

  const onSearchChange = (e) => {
    const query = e.target.value;
    setCurrentUrl(queryUrl(wsUrl, queryParam, query));
  };

  const handleClickPrev = (e) => {
    e.preventDefault();
    setCurrentUrl(prevUrl);
  };

  const handleClickNext = (e) => {
    e.preventDefault();
    setCurrentUrl(nextUrl);
  };

  return (
    <div>
      <Errors errors={errors} />

      <div className="search">
        <Input label={label} onChange={onSearchChange} />

        <Scroll
          onNext={handleClickNext}
          onPrev={handleClickPrev}
          nextUrl={nextUrl}
          prevUrl={prevUrl}
        />

        <Results
          results={results}
          resultTag={resultTag}
          onDeletedContact={doSearch}
        />

        <Scroll
          onNext={handleClickNext}
          onPrev={handleClickPrev}
          nextUrl={nextUrl}
          prevUrl={prevUrl}
        />
      </div>
    </div>
  );
}

function Errors({ errors }) {
  return (
    <ul id="errors" className="errors">
      {errors.map((err) => (
        <li key={err.message}>{err.message}</li>
      ))}
    </ul>
  );
}

function Input({ label, onChange }) {
  return (
    <label>
      {label}
      <input onChange={onChange} />
    </label>
  );
}

function Results({ results, resultTag, onDeletedContact }) {
  return (
    <ul id="results">
      {results.map((item) => {
        return (
          <Result
            key={item.result.id}
            data={item.result}
            url={getLink(item.links, "self")}
            resultTag={resultTag}
            onDeletedContact={onDeletedContact}
          />
        );
      })}
    </ul>
  );
}

function Result({ data, resultTag, onDeletedContact, url }) {
  const resultRef = React.useRef();
  const handleClickDelete = (e) => {
    e.preventDefault();
    doFetchJson("DELETE", url).then((res) => {
      onDeletedContact();
    });
  };
  useEffect(() => {
    const ele = document.createElement(resultTag);
    ele.setResult(data);
    resultRef.current.prepend(ele);
  }, []);
  return (
    <li className="result" ref={resultRef}>
      <div className="delete" onClick={handleClickDelete}>
        <a href="#">
          <span className="material-icons md-48">delete</span>
        </a>
      </div>
    </li>
  );
}

function Scroll({ onPrev, onNext, prevUrl, nextUrl }) {
  return (
    <div className="scroll">
      <a
        href="#"
        rel="prev"
        className="prev"
        onClick={onPrev}
        style={{ visibility: prevUrl ? "visible" : "hidden" }}
      >
        &lt;&lt;
      </a>
      <a
        href="#"
        rel="next"
        className="next"
        onClick={onNext}
        style={{ visibility: nextUrl ? "visible" : "hidden" }}
      >
        &gt;&gt;
      </a>
    </div>
  );
}

/*************************** Utility Functions *************************/

/** Given a `links[]` array returned by web services, return the `href`
 *  for `rel`; '' if none.
 */
function getLink(links, rel) {
  return links?.find((lnk) => lnk.rel === rel)?.href ?? "";
}

/** Given a baseUrl, return the URL equivalent to
 *  `${baseUrl}?${name}=${value}`, but with all appropriate escaping.
 */
function queryUrl(baseUrl, name, value) {
  const url = new URL(baseUrl);
  url.searchParams.set(name, value);
  return url.href;
}

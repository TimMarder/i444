import './contact-widget.mjs';
import Search from "./search.jsx";

import React from 'react';
import * as ReactDom from 'react-dom/client';

const DEFAULT_WS = 'https://localhost:2345/contacts';
const DEFAULT_USER_ID = 'john';

function getUserWsUrl() {
  const url = new URL(document.location.href);
  const wsUrl = url?.searchParams?.get('ws-url') ?? DEFAULT_WS;
  const userId = url?.searchParams?.get('user-id') ?? DEFAULT_USER_ID;
  return `${wsUrl}/${userId}`;
}

function setup() {
  const wsUrl = getUserWsUrl();
  const queryParam = 'prefix';
  const resultTag = 'contact-widget';
  const label = 'Search Contacts';
  const props = {wsUrl, queryParam, resultTag, label};
  const app = React.createElement(Search, props);
  ReactDom.createRoot(document.querySelector('#app')).render(app);
}

setup();



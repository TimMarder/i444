import './search-widget.mjs';
import './contact-widget.mjs';


const DEFAULT_WS = 'https://localhost:2345/contacts';
const DEFAULT_USER_ID = 'john';

function getUserWsUrl() {
  const url = new URL(document.location.href);
  const wsUrl = url?.searchParams?.get('ws-url') ?? DEFAULT_WS;
  const userId = url?.searchParams?.get('user-id') ?? DEFAULT_USER_ID;
  return `${wsUrl}/${userId}`;
}

function setup() {
  const search = document.createElement('search-widget');
  search.setAttribute('ws-url', getUserWsUrl());
  search.setAttribute('query-param', 'prefix');  
  search.setAttribute('result-widget', 'contact-widget');
  search.setAttribute('label', 'Search Contacts');
  const app = document.querySelector('#app');
  app.append(search);
}

setup();



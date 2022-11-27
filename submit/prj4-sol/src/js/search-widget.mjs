import { doFetchJson } from './util.mjs';

/** Has the following attributes:
 *  
 *  'ws-url':        The basic search URL (required).
 *  'query-param':   The name of the parameter appended to ws-url to specify
 *                   the search term (required).
 *  'result-widget': The name of the element used for displaying
 *                   each individual search result (required).
 *  'label':         The label for the search widget (optional).
 */
class SearchWidget extends HTMLElement {
  constructor() {
    super();
    const shadow = this.shadow = this.attachShadow({mode: "closed"});
    let template = document.querySelector('#search-widget');
    shadow.appendChild(template.content.cloneNode(true));
    this.resultTemplate = template.content.querySelector('.result');
  }

  connectedCallback() {
    this.wsUrl = this.getAttribute('ws-url');
    this.queryParam = this.getAttribute('query-param');
    this.resultWidget = this.getAttribute('result-widget');
    const label = this.getAttribute('label');

    if (label) {
      this.shadow.querySelector('label').innerHTML = label;
    }
    this.currentUrl = `${this.wsUrl}`
    this.#doSearch();

    this.shadow.querySelector('input').addEventListener('input', e => {
      const query = e.target.value;
      this.currentUrl = `${this.wsUrl}?${this.queryParam}=${query}`
      this.#doSearch();
    });

    const nextEle = this.shadow.querySelectorAll('.next');
    const prevEle = this.shadow.querySelectorAll('.prev');
    for (const ele of nextEle) {
      ele.addEventListener('click', e => {
        e.preventDefault();
        this.currentUrl = this.nextUrl;
        this.#doSearch();
      });
    }
    for (const ele of prevEle) {
      ele.addEventListener('click', e => {
        e.preventDefault()
        this.currentUrl = this.prevUrl;
        this.#doSearch();
      });
    }
  }

  async #doSearch() {
    const res = await doFetchJson('GET', this.currentUrl);

    const errorsEle = this.shadow.querySelector('#errors');
    errorsEle.innerHTML = '';
    const resultsEle = this.shadow.querySelector('#results');
    resultsEle.innerHTML = '';

    if (res.errors) {
      for (const err of res.errors) {
        const li = document.createElement('li');
        li.innerHTML = err.message;
        errorsEle.appendChild(li);
      }
      return;
    }

    const val = res.val;
    for (const item of val.result) {
      const resultEle = this.resultTemplate.cloneNode(true);
      const ele = document.createElement(this.resultWidget);
      ele.setResult(item.result);
      resultEle.prepend(ele);
      resultEle.querySelector('.delete').addEventListener('click', e => {
        e.preventDefault();
        doFetchJson('DELETE', item.links[0].href).then(res => {
          this.#doSearch();
        });
      });
      resultsEle.appendChild(resultEle);
    }

    this.nextUrl = undefined;
    this.prevUrl = undefined;
    for (const link of val.links) {
      if (link.rel === 'next') {
        this.nextUrl = link.href;
      } else if (link.rel === 'prev') {
        this.prevUrl = link.href;
      }
    }

    const nextEle = this.shadow.querySelectorAll('.next');
    const prevEle = this.shadow.querySelectorAll('.prev');
    for (const ele of nextEle) {
      ele.style.visibility = this.nextUrl ? 'visible' : 'hidden';
    }
    for (const ele of prevEle) {
      ele.style.visibility = this.prevUrl ? 'visible' : 'hidden';
    }
  }

}

customElements.define('search-widget', SearchWidget);

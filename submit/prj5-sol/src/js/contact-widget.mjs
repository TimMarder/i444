import { doFetch } from './utils.mjs';

class ContactWidget extends HTMLElement {

  constructor() {
    super();
    const shadow = this.shadow = this.attachShadow({mode: "closed"});
    let template = document.querySelector('#contact-widget');
    shadow.appendChild(template.content.cloneNode(true));
  }

  /** set the contactInfo for this widget */
  setResult(contactInfo) {
    console.assert(contactInfo.name !== undefined, 'bad contact info',
		   contactInfo);		   
    this.#fillContactInfo(contactInfo);
  }

  #fillContactInfo(contact) {
    const shadow = this.shadow;
    const contactFields = ['name', 'emails', 'addr', 'phones',];
    for (const [k, v] of contactFields.map(k => [k, contact[k]])) {
      if (v === undefined) {
	shadow.querySelectorAll(`.${k}`).forEach(e => e.style.display = 'none');
      }
      else {
	switch (k) {
	  case 'addr':
	    this.#fillAddress(v);
	    break;
	  case 'emails':
	    this.#fillEmails(v);
	    break;
	  case 'phones':
	    this.#fillPhones(v);
	    break;
	  default:
	    shadow.querySelector(`dd.${k}`).innerHTML = v;
	} // switch (k)
      } //else v !== undefined
    } //for (const [k, v] of contactFields.map(...))
  }
  
  #fillAddress(addr) {
    const shadow = this.shadow;
    const addrKeys = ['addrLine1', 'addrLine2', 'city', 'state', 'zip'];
    for (const [k1, v1] of addrKeys.map(k => [k, addr[k]])) {
      if (v1 === undefined) {
	shadow.querySelectorAll(`.${k1}`)
	  .forEach(e => e.style.display = 'none');
      }
      else {
	this.shadow.querySelector(`dd.${k1}`).innerHTML = v1;
      }
    }
  }

  #fillEmails(emails) {
    const shadow = this.shadow;
    if (emails.length === 0) {
      shadow.querySelectorAll(`.emails`)
	.forEach(e => e.style.display = 'none');
    }
    else {
      const ulEmails = shadow.querySelector('ul.emails');
      const emailElement = ulEmails.firstElementChild;
      ulEmails.innerText = '';
      for (const email of emails) {
	const e = emailElement.cloneNode(true);
	e.innerHTML = `<a href="mailto:${email}">${email}</a>`;
	ulEmails.append(e);
      }
    }
  }

  #fillPhones(phones) {
    const shadow = this.shadow;
    if (phones.length === 0) {
      shadow.querySelectorAll(`.phones`)
	.forEach(e => e.style.display = 'none');
    }
    else {
      const ulPhone = shadow.querySelector('ul.phones');
      const phoneElement = ulPhone.firstElementChild;
      ulPhone.innerText = '';
      for (const [t, n] of phones) {
	const e = phoneElement.cloneNode(true);
	e.querySelector('.phone-number').innerHTML = n;
	e.querySelector('.phone-type').innerHTML = t;
	ulPhone.append(e);
      }
    }
  }

}


customElements.define('contact-widget', ContactWidget);

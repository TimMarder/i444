const CERT_BASE = `${process.env.HOME}/tmp/localhost-certs`;

export default {

  /** all web service URLs start with this */
  base: '/contacts',

  /** where test and training images are stored */
  dbUrl:  'mongodb://localhost:27017/contacts',

  /** web service external details */
  ws: {
    /** web services run on this port */
    port: 2345,
  },

  /** parameters used for setting up the https connection */
  https: {
    /** path to certificate */
    certPath: `${CERT_BASE}/localhost.crt`,

    /** path to private key */
    keyPath: `${CERT_BASE}/localhost.key`,
  },
  

};

//must be sorted by name
const CONTACTS = [
  { //#0
    name: 'Ethan Johns',  
    emails: [ 'ejohns77@binghamton.edu', 'ejohns@hotmail.com' ],
    addr: { addrLine1: 'Hillside Apts, #28', addrLine2: '723 Spruce Avenue' },
    phones: [ [ 'home', '(554) 504-5249' ] ]
  },
  { //#1
    name: 'Ethan Martin',
    emails: [ 'emartin@maildrop.com' ],
    addr: {
      addrLine1: '235 Meadow Road',
      city: 'Lincoln',
      state: 'MI',
      zip: '35696'
    }
  },
  { //#2
    name: 'Nancy Evans',
    addr: { addrLine1: '388 Oak Road' },
    phones: [ [ 'home', '(314) 712-7299' ] ]
  },
  { //#3
    name: 'Queenie Gordon',
    emails: [ 'qgordon37@gmail.com' ],
    addr: { addrLine1: '611 Park Road' },
    phones: [ [ 'spouse', '(497) 694-9780' ] ]
  },
  { //#4
    name: 'Zoe Johnson',
    emails: [
      'zojohn23@yahoo.com',
      'zojohn@hotmail.com',
      'zjohns@binghamton.edu',
      'zjohns21@hotmail.com'
    ],
    addr: {
      addrLine1: '673 Washington Road',
      city: 'Lincoln',
      state: 'HI',
      zip: '62271'
    },
    phones: [
      [ 'work', '(938) 228-1311' ],
      [ 'cell', '(557) 927-2609' ],
      [ 'cell', '(147) 756-5621' ],
      [ 'work', '(278) 837-4562' ]
    ]
  },
];

export default CONTACTS;


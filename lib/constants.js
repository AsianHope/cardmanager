BADGE_TYPE =['Parent','Staff','Visitor','Student'];
ADMIN_BADGE_TYPE =[
                   {label: 'Parent', value: 'Parent'},
                   {label: 'Staff', value: 'Staff'},
                   {label: 'Visitor', value: 'Visitor'},
                   {label: 'Student', value: 'Student'},
                   {label: 'Terminal', value: 'Terminal'},
                  ];

DEFAULT_CARD = {
  "name": "Please enter barcode.",
  "barcode": "XXX",
  "associations": ["UNK","UNK","UNK","UNK",
                   "UNK","UNK","UNK","UNK",
                   "UNK","UNK","UNK","UNK"
  ],
  "expires": "XXXX-XX-XX",
  "type" : "XXXX"
};

INVALID_CARD = {
      "name": "Card Not Found!",
      "barcode": "NA",
      "associations": ["NA","NA","NA","NA",
                       "NA","NA","NA","NA",
                       "NA","NA","NA","NA"
      ],
      "expires": "XXXX-XX-XX",
      "type" : "XXXX"
    };

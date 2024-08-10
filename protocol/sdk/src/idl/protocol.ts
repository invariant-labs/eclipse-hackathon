export type Protocol = {
  "version": "0.1.0",
  "name": "protocol",
  "instructions": [
    {
      "name": "init",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuthority",
          "type": "u8"
        }
      ]
    },
    {
      "name": "test",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "puppetProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "counter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "stateBump",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "state",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "programAuthority",
            "type": "publicKey"
          },
          {
            "name": "counter",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "bumpAuthority",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ErrorExample",
      "msg": "[S001] ErrorExample"
    }
  ]
};

export const IDL: Protocol = {
  "version": "0.1.0",
  "name": "protocol",
  "instructions": [
    {
      "name": "init",
      "accounts": [
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bumpAuthority",
          "type": "u8"
        }
      ]
    },
    {
      "name": "test",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "puppetProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "counter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "stateBump",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "state",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "programAuthority",
            "type": "publicKey"
          },
          {
            "name": "counter",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "bumpAuthority",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ErrorExample",
      "msg": "[S001] ErrorExample"
    }
  ]
};

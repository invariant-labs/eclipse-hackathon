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
    },
    {
      "name": "mint",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "invokeUpdateSecondsPerLiquidity",
      "accounts": [
        {
          "name": "invariantProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "upperTick",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenX",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenY",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "signer",
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
          "name": "lowerTickIndex",
          "type": "i32"
        },
        {
          "name": "upperTickIndex",
          "type": "i32"
        },
        {
          "name": "index",
          "type": "i32"
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
    },
    {
      "code": 6001,
      "name": "InvalidAuthority",
      "msg": "Provided authority is different than expected"
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
    },
    {
      "name": "mint",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "invokeUpdateSecondsPerLiquidity",
      "accounts": [
        {
          "name": "invariantProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "upperTick",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenX",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenY",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "signer",
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
          "name": "lowerTickIndex",
          "type": "i32"
        },
        {
          "name": "upperTickIndex",
          "type": "i32"
        },
        {
          "name": "index",
          "type": "i32"
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
    },
    {
      "code": 6001,
      "name": "InvalidAuthority",
      "msg": "Provided authority is different than expected"
    }
  ]
};

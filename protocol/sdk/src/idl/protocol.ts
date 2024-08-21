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
      "name": "deposit",
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
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userBalance",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
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
      "name": "withdraw",
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
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userBalance",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
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
    },
    {
      "name": "invokeCreatePosition",
      "accounts": [
        {
          "name": "invariantProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "upperTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickmap",
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
          "name": "accountX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
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
          "name": "liquidityDelta",
          "type": "u128"
        },
        {
          "name": "slippageLimitLower",
          "type": "u128"
        },
        {
          "name": "slippageLimitUpper",
          "type": "u128"
        }
      ]
    },
    {
      "name": "invokeClosePosition",
      "accounts": [
        {
          "name": "invariantState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "invariantProgramAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "removedPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickmap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "upperTick",
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
          "name": "accountX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invariantProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u32"
        },
        {
          "name": "lowerTickIndex",
          "type": "i32"
        },
        {
          "name": "upperTickIndex",
          "type": "i32"
        }
      ]
    },
    {
      "name": "reopenPosition",
      "accounts": [
        {
          "name": "invariantProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "invariantState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invariantProgramAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "upperTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickmap",
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
          "name": "accountX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
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
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "initLpPool",
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
          "name": "lpPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": false,
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
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "mintLpToken",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "INVARIANT"
          ]
        },
        {
          "name": "invState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invProgramAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "upperTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickmap",
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
          "name": "accountX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "invReserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "invReserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
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
          "name": "liquidity",
          "type": "u128"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "burnLpToken",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "INVARIANT"
          ]
        },
        {
          "name": "invState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invProgramAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "upperTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickmap",
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
          "name": "accountX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "invReserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "invReserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
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
          "name": "liquidity",
          "type": "u128"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "lpPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "invariantPosition",
            "type": "publicKey"
          },
          {
            "name": "positionBump",
            "type": "u8"
          },
          {
            "name": "leftoverX",
            "type": "u64"
          },
          {
            "name": "leftoverY",
            "type": "u64"
          },
          {
            "name": "tokenX",
            "type": "publicKey"
          },
          {
            "name": "tokenY",
            "type": "publicKey"
          },
          {
            "name": "tickSpacing",
            "type": "u16"
          },
          {
            "name": "fee",
            "type": {
              "defined": "FixedPoint"
            }
          },
          {
            "name": "tokenBump",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
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
  "types": [
    {
      "name": "Price",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "Liquidity",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "FeeGrowth",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "FixedPoint",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u128"
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
    },
    {
      "code": 6002,
      "name": "InvalidMint",
      "msg": "Provided mint account is different than expected"
    },
    {
      "code": 6003,
      "name": "InvalidOwner",
      "msg": "Provided owner account is different than expected"
    },
    {
      "code": 6004,
      "name": "InvalidInvariantAuthority",
      "msg": "Provided Invariant authority is different than expected"
    },
    {
      "code": 6005,
      "name": "InvalidTokenProgram",
      "msg": "Provided Token Program for Token is different than expected"
    },
    {
      "code": 6006,
      "name": "InvalidShares",
      "msg": "Error originated from compute_lp_share_change"
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
      "name": "deposit",
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
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userBalance",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
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
      "name": "withdraw",
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
          "name": "reserve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userBalance",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
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
    },
    {
      "name": "invokeCreatePosition",
      "accounts": [
        {
          "name": "invariantProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "upperTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickmap",
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
          "name": "accountX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
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
          "name": "liquidityDelta",
          "type": "u128"
        },
        {
          "name": "slippageLimitLower",
          "type": "u128"
        },
        {
          "name": "slippageLimitUpper",
          "type": "u128"
        }
      ]
    },
    {
      "name": "invokeClosePosition",
      "accounts": [
        {
          "name": "invariantState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "invariantProgramAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "removedPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickmap",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "upperTick",
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
          "name": "accountX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invariantProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u32"
        },
        {
          "name": "lowerTickIndex",
          "type": "i32"
        },
        {
          "name": "upperTickIndex",
          "type": "i32"
        }
      ]
    },
    {
      "name": "reopenPosition",
      "accounts": [
        {
          "name": "invariantProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "invariantState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invariantProgramAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "upperTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickmap",
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
          "name": "accountX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
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
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "initLpPool",
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
          "name": "lpPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": false,
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
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "mintLpToken",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "INVARIANT"
          ]
        },
        {
          "name": "invState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invProgramAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "upperTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickmap",
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
          "name": "accountX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "invReserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "invReserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
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
          "name": "liquidity",
          "type": "u128"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "burnLpToken",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountLp",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "INVARIANT"
          ]
        },
        {
          "name": "invState",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "invProgramAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lastPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "positionList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lowerTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "upperTick",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tickmap",
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
          "name": "accountX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "accountY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "invReserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "invReserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false
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
          "name": "liquidity",
          "type": "u128"
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "lpPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "invariantPosition",
            "type": "publicKey"
          },
          {
            "name": "positionBump",
            "type": "u8"
          },
          {
            "name": "leftoverX",
            "type": "u64"
          },
          {
            "name": "leftoverY",
            "type": "u64"
          },
          {
            "name": "tokenX",
            "type": "publicKey"
          },
          {
            "name": "tokenY",
            "type": "publicKey"
          },
          {
            "name": "tickSpacing",
            "type": "u16"
          },
          {
            "name": "fee",
            "type": {
              "defined": "FixedPoint"
            }
          },
          {
            "name": "tokenBump",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
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
  "types": [
    {
      "name": "Price",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "Liquidity",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "FeeGrowth",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "FixedPoint",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "v",
            "type": "u128"
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
    },
    {
      "code": 6002,
      "name": "InvalidMint",
      "msg": "Provided mint account is different than expected"
    },
    {
      "code": 6003,
      "name": "InvalidOwner",
      "msg": "Provided owner account is different than expected"
    },
    {
      "code": 6004,
      "name": "InvalidInvariantAuthority",
      "msg": "Provided Invariant authority is different than expected"
    },
    {
      "code": 6005,
      "name": "InvalidTokenProgram",
      "msg": "Provided Token Program for Token is different than expected"
    },
    {
      "code": 6006,
      "name": "InvalidShares",
      "msg": "Error originated from compute_lp_share_change"
    }
  ]
};

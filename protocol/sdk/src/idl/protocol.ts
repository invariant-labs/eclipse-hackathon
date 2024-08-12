/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/protocol.json`.
 */
export type Protocol = {
  "address": "HTBzkQCWc2sbkn5WmLkPmQKKotaeeWgZ3RSD4Eg3f1MS",
  "metadata": {
    "name": "protocol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "init",
      "discriminator": [
        220,
        59,
        207,
        236,
        108,
        250,
        47,
        100
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "test",
      "discriminator": [
        163,
        36,
        134,
        53,
        232,
        223,
        146,
        222
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "puppetProgram",
          "address": "8KQzCc22ZqGLPoipqRhYvkQtHJw6nY1NxrrGy8JLz1jC"
        },
        {
          "name": "counter",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
  "errors": [
    {
      "code": 6000,
      "name": "errorExample",
      "msg": "[S001] ErrorExample"
    }
  ]
};

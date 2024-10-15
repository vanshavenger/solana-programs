/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/favorites.json`.
 */
export type Favorites = {
  "address": "AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ",
  "metadata": {
    "name": "favorites",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "setFavorites",
      "discriminator": [
        211,
        137,
        87,
        135,
        161,
        224,
        187,
        120
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "favorites",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  118,
                  111,
                  114,
                  105,
                  116,
                  101,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "number",
          "type": "u64"
        },
        {
          "name": "color",
          "type": "string"
        },
        {
          "name": "hobbies",
          "type": {
            "vec": "string"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "favorites",
      "discriminator": [
        44,
        205,
        48,
        25,
        172,
        96,
        48,
        27
      ]
    }
  ],
  "types": [
    {
      "name": "favorites",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "number",
            "type": "u64"
          },
          {
            "name": "color",
            "type": "string"
          },
          {
            "name": "hobbies",
            "type": {
              "vec": "string"
            }
          }
        ]
      }
    }
  ]
};

import dotenv from "dotenv";
dotenv.config();

export default {
    domainUrl: process.env.DOMAIN_URL,
    vcAuthority: process.env.VC_AUTHORITY,
    keys: {
        hexPrivateKey: process.env.PRIVATE_KEY_HEX,
        did: process.env.DID,
        didLong: process.env.DID_LONG,
        didKey: process.env.DID_KEY,
        alg:  process.env.DID_ALG || "ES256K"
    },
    presentation: {
        id: "851eb04ca3e2b2589d6f6a72875",
        input_descriptors: [
        {
          id: "VerifiedCredentialEmployee",
          name: "VerifiedCredentialEmployee",
          purpose: "So we can see that your Corporate Verified Employee",
          schema: [
            {
              "uri": "VerifiedCredentialEmployee"
            }
          ],
          constraints: {
              fields: [
              {
                  path: [
                      "$.issuer",
                      "$.vc.issuer",
                      "$.iss"
                  ],
                  filter: {
                      type: "string",
                      pattern: process.env.VC_AUTHORITY
                  }
              }
            ]
          }
      }]
    }
  };
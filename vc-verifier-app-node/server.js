
import express from "express";
import bodyParser from 'body-parser';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { RP , SubjectType , verifyDidJWT, PassBy, SupportedVersion} from "@sphereon/did-auth-siop";
import { decodeJWT, verifyJWT } from 'did-jwt';
import * as ionResolver from '@decentralized-identity/ion-tools';

import dotenv from "dotenv";
dotenv.config();

const app = express();
const router = express.Router();

// app.use(express.static('src'));
app.use('/shop', express.static('src'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/shop', router);

var DB = {};

const keys = {
  hexPrivateKey: process.env.PRIVATE_KEY_HEX,
  did : process.env.DID,
  didLong: process.env.DID_LONG,
  didKey: process.env.DID_KEY,
  alg:  process.env.DID_ALG || "ES256K"
}
const domainUrl = process.env.DOMAIN_URL;
const vcAuthority = process.env.VC_AUTHORITY;

console.log(JSON.stringify(keys))

const PRESENTATION = {
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
                pattern: vcAuthority
            }
        }
      ]
    }
}]};

router.get("/api/vc/presentation/requests/:id", async (req, res) => {
  console.log("Getting authorization request for id: " +   req.params.id);
  res.send(DB[req.params.id].requestJwt);
});

router.get("/api/vc/presentation/:id", async (req, res) => {
  res.send(DB[req.params.id]);
});

router.post("/api/vc/presentation/callback", async (req, res) => {
  console.log("Received presentation body: " +   JSON.stringify(req.body));

  var { id } = req.query;
  if(!id) {
    id = req.body.state;
  } 
  console.log("Presentation id: " + id);

  verifyDidJWT(req.body.vp_token, ionResolver, { audience : keys.did }).then(obj => {
    console.log("VP_token is valid, payload: " +JSON.stringify(obj.payload));
    // verifyJWT(obj.payload.vp.verifiableCredential[0], {"resolver" : ionResolver , audience : keys.did }).then(obj => {
      var obj = decodeJWT(obj.payload.vp.verifiableCredential[0]);      
      console.log("VC token is valid, payload: " + JSON.stringify(obj.payload));

      DB[id] = { ...DB[id], 
        "subject" : obj.payload.sub , 
        "verifiedCredentialsData" : [ { "claims" : obj.payload.vc.credentialSubject }],
        "requestStatus" : "presentation_verified" 
      }
    // });   
  });

  res.send(DB[id]);
});

router.get("/api/vc/presentation", async (req, res) => {
  
  const rp = RP.builder()
        .withSupportedVersions(SupportedVersion.SIOPv2_ID1)
        .withClientId(keys.did)
        .withResponseMode("post")
        .withInternalSignature(keys.hexPrivateKey, keys.didLong, keys.didKey, keys.alg)
        .addDidMethod("ion")
        .withRedirectUri(domainUrl + "/shop/api/vc/presentation/callback")
        .withScope("openid")
        .withRequestBy(PassBy.VALUE)
        .withVerifyCallback(domainUrl + "/shop/api/vc/presentation/callback")
        .withResponseType("id_token")
        .withClientMetadata({
            client_name: "Verifiable Credential Employee",
            vpFormatsSupported: { 
              jwt_vc: { alg: ["EdDSA", "ES256K"] } , 
              jwt_vp: { alg: [ "ES256K","EdDSA" ] } 
            },
            subjectSyntaxTypesSupported: ['did:ion'],
            passBy: PassBy.VALUE
        })
        .withPresentationDefinition(PRESENTATION)
        .build();    
  
  const requestId = new Date().getTime().toString();
  const authzRequest = await rp.createAuthorizationRequestURI( {"nonce" : requestId, "state" : requestId});

  // Add presentation request in memory, Authenticator gets the signed authz request
  DB[requestId] = { 
    requestId : requestId,
    requestJwt : authzRequest.requestObjectJwt
  };

  // openid-vc: Microsoft Authenticator callback
  res.send({
    requestId: requestId,
    url: "openid-vc://?request_uri=" + domainUrl + "/shop/api/vc/presentation/requests/" + requestId
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/src/verifier.html'));
});

router.get('/verifier', function(req, res) {
  res.sendFile(path.join(__dirname + '/src/verifier.html'));
});

app.get('/', function(req, res) {
  res.redirect("/shop");
});

app.listen(8081, function(req, res) {
  console.log("Server is running at port 8081");
});
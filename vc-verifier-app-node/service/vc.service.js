import { RP , verifyDidJWT, PassBy, SupportedVersion} from "@sphereon/did-auth-siop";
import { decodeJWT } from 'did-jwt';
import * as ionResolver from '@decentralized-identity/ion-tools';

import config from "../config/vc.config.js";

const DB = {}; // Just for demo porpuses

export async function getRequestJwt(requestId) {
    return DB[requestId].requestJwt;
}

export async function getRequest(requestId) {
    return DB[requestId];
}

export async function handleAuthorizationResponse(vpToken, requestId) {
    verifyDidJWT(vpToken, ionResolver, { audience : config.keys.did }).then(obj => {
        console.log("VP token is valid, payload: " + JSON.stringify(obj.payload));
        // verifyJWT(obj.payload.vp.verifiableCredential[0], {"resolver" : ionResolver , audience : config.keys.did }).then(obj => {
        var obj = decodeJWT(obj.payload.vp.verifiableCredential[0]);      
        console.log("VC token is valid, payload: " + JSON.stringify(obj.payload));

        // Store and update request status
        DB[requestId] = { ...DB[requestId], 
            "subject" : obj.payload.sub , 
            "verifiedCredentialsData" : [ { "claims" : obj.payload.vc.credentialSubject }],
            "requestStatus" : "presentation_verified" 
        }
        // });   
    });
    return DB[requestId];
}    

export async function getAuthorizationRequest() {
    const rp = RP.builder()
        .withSupportedVersions(SupportedVersion.SIOPv2_ID1)
        .withClientId(config.keys.did)
        .withResponseMode("post")
        .withInternalSignature(
            config.keys.hexPrivateKey, 
            config.keys.didLong, 
            config.keys.didKey, 
            config.keys.alg)
        .addDidMethod("ion")
        .withRedirectUri(config.domainUrl + "/shop/api/vc/presentation/callback")
        .withScope("openid")
        .withRequestBy(PassBy.VALUE)
        .withVerifyCallback(config.domainUrl + "/shop/api/vc/presentation/callback")
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
        .withPresentationDefinition(config.presentation)
        .build(); 
  
    const requestId = generateRequestId();
    const authzRequest = await rp.createAuthorizationRequestURI({"nonce" : requestId, "state" : requestId});

    // Add presentation request into DB (memory)
    // Authenticator gets the signed authz request (JWT) based on the requestId
    DB[requestId] = { 
        requestId : requestId,
        requestJwt : authzRequest.requestObjectJwt
    };

    // openid-vc: Microsoft Authenticator callback
    return {
        requestId: requestId,
        url: "openid-vc://?request_uri=" + config.domainUrl + "/shop/api/vc/presentation/requests/" + requestId
    }; 
}

function generateRequestId() {
    return new Date().getTime().toString();
}
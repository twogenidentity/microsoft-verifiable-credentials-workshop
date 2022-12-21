# verifiable-credentials-demoapp-spring-issuer

0. Create the Credentials

- Credentials -> Create Credential
- Select Custom Credentials -> Next
- CredentialName: VerifiedCredentialEmployee
  - Display definition: Copy/paste the content of the file presentation-employee-display.json
  - Rules definition: Copy/paste the content of the file presentation-employee-rules.json (*)
    (*) Check if you have to adjust the following properties for the Identity Provider:
  - `attestations.idTokens.clientId` which is the client id for the Microsoft Authenticator
  - `attestations.idTokens.configuration` which is the OIDC .well-known/openid-configuration endpoint

1. Adjust the following application properties:

From MS Entra: 
Org Settings -> Decentralized identifier (DID): did:web:ed5d-190-191-157-39.sa.ngrok.io
To:
application.yaml -> vc_authority

From MS Entra:
Credentials -> VerifiedCredentialCorporateEmployee -> Manifest URL: https://verifiedid.did.msidentity.com/v1.0/tenants/4600638d-90f9-43a0-8619-d2ca64250531/verifiableCredentials/contracts/276e7ec3-3ec6-e25f-b2ee-d56a6205d638/manifest
To:
application.yaml -> vc_credential_manifest


If you change the application dns, you have to adjust the following properties:

From:
Your application DNS:  https://ed5d-190-191-157-39.sa.ngrok.io
To:
application.yaml -> vc_issuance_uri
and
application.yaml -> idp_oauth2_redirect_uri


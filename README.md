# Workshop Microsoft Verifiable Credentials for Keycloak Identity Claims (SSI)
This repository demonstrates how to integrate [Microsoft Entra Verified ID](https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-verified-id) with your Identity Provider for issuing [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) based on identity tokens. In the workshop I have explained how to integrate with [Auth0](https://auth0.com/) or
[Keycloak](https://www.keycloak.org/) for issuing VCs. You can also integrate it with other Identity Providers.

On the other hand, we proof how to verify VCs with Microsoft Entra Verified ID Services. Nevertheless, we also provide an app that verifies VCs with the authentication library [Sphereon](https://sphereon.com) [SIOP-OpenID4VP](https://github.com/Sphereon-Opensource/SIOP-OpenID4VP) - No Microsoft integration is needed. The library implements the standards Self Issued OpenID Provider v2 ([SIOPV2](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html)) and OpenID Connect for Verifiable Presentations ([OIDC4VP](https://openid.net/specs/openid-connect-4-verifiable-presentations-1_0-ID1.html)) to be fully self sovereign.

## In Short
This workshop is based on the concept of [Decentralized Identity](https://identity.foundation/) (also known as Verifiable Credentials) which leads to the idea that identity-related information should be self-controlled, portable and with decentralized identifiers. In short, self-sovereign identity (SSI) or [decentralized identity](https://www.w3.org/TR/did-core/) (DID) is a method of identity that centers the control of information around the user.
VCs are tamper-proof, cryptographically-verifiable claims made by the issuer. Every attestation that an entity (e.g., an organization) issues is associated with their DID.

The following architecture diagram describes the workshop components involved in the verifiable credentials ecosystem.

 ![architecture-diagram](doc/images/architecture-diagram.png)

The followin gives an overview of how VC works - An article will be released soon with more details, theoretical and technical background about verifiable credentials.

### Workshop Scenario:
- Magnolia Inc. (issuer) issues Employee credential (verifiable credentials) for your Employees with Microsoft Entra Services. The employees are being authenticated with the Enterprise Identity Provider which is integrated with the Magnolia Employee portal. This portal is capable of issuing Employee Verifiable credentials.
- The employees (holder) use Microsoft Authenticator as the company’s Identity wallet for handling the authentication and verified IDs use cases.
- Orion Global Inc. is a telecommunication company that trusts in the Employee verifiable credentials issued by Magnolia Inc. as proof of Employment. The Telco Portal can validate Magnolia Employee verifiable credentials with Microsoft Entra Services 
- eShop is an Online Store that trusts in the Employee Verifiable credentials issued by Magnolia Inc. eShop can validate VCs implementing the standards [OIDC4VP](https://openid.net/specs/openid-connect-4-verifiable-presentations-1_0-ID1.html) with the library Sphereon - this means the app is not integrated with Microsoft Entra.
- The goal is, thanks to the decentralized credentials, that Magnolia employees be capable of providing a proof of Employment to Orion Global to access the portal. On the other hand, Orion is capable of verifying the employee’s authenticity, improving the user experience (KYC) in the customer onboarding and sign in processes and improving the security avoiding Identity fraud.

### Workshop Technical Background Overview

- Magnolia Inc has configured its tenant configuration for issuing verifiable credentials in Microsoft Entra Verified ID. It also has configured the Azure ID Vault for signing credentials.
- [Magnolia Employee portal](./vc-issuer-app-spring) is a Spring Boot application integrated with OpenID Connect with an Identity Provider. It’s also integrated with Microsoft Entra Verified Services for issuing VCs. It has configured Spring Security OAuth 2.0 for the OpenID Connect integration with IdP and Client Credentials grant with Azure AD.
- After the employee is authenticated, the verifiable credential is configured to use the Identity token claims from the IdP. The employee credential is signed by Magnolia and includes the employees DID as the subject DID. 
- [Telco Portal](./vc-verifier-app-spring) is integrated with Microsoft Entra Verified Services for verifying VC on the onboarding and sign-in process. Furthermore, it has configured Spring Security OAuth 2.0 Client Credentials grant with Azure AD.
- [eShop Portal](./vc-verifier-node) is capable of verifying VC thanks to the library [Sphereon SIOP-OpenID4VP](https://github.com/Sphereon-Opensource/SIOP-OpenID4VP). The library implements the standard OpenID Connect for Verifiable Presentations ([OIDC4VP](https://openid.net/specs/openid-connect-4-verifiable-presentations-1_0-ID1.html)) and it supports requesting VC using the Presentation Exchange specs.
- Identity Provider manages the identities and exposes the OpenID Connect endpoints for handling the authentication with Magnolia Employee Portal and Microsoft Authenticator (Digital wallet).
- Microsoft Entra Verified ID exposes the verification services for verifiable credentials use cases. Because DIDs are stored on the blockchain, anyone can verify the validity of an attestation by cross-checking the issuer's DID.

# How to deploy?

## Prerequisites
- Azure tenant with an active subscription
- Install Git, Docker in order to run the steps provided in the next section
- A mobile device with Microsoft Authenticator
- [ngrok](https://ngrok.com/) and sign up for a free account

## Getting Started

1. Obtaining your ngrok public url  
   Several endpoints must be published to the Internet. In this case to simplify the workshop, I have used ngrok for exposing those services. Download [ngrok](https://ngrok.com/download) and expose the port 80 or just run the following command.

   ```sh
   docker run -it -e NGROK_AUTHTOKEN={your-ngrok-token} ngrok/ngrok:alpine http host.docker.internal:80

   Session Status               online                                                                                                    ...
   Forwarding                   https://f27c-190-191-157-39.sa.ngrok.io -> http://localhost     
   ```

   You will use this public url for exposing the services to the Internet through an nginx container provided in the workshop, e.g.: ```DOMAIN_URL: https://6ff7-190-191-157-39.sa.ngrok.io```
 
2. Clone this repository
 
   ```bash
   git clone https://github.com/twogenidentity/microsoft-verifiable-credentials-workshop
   cd microsoft-verifiable-credentials-workshop
   ```
  
### Microsoft Azure and Entra Configuration Steps

3. Configure your tenant for Microsoft Entra Verified ID
  * Create an [Azure Key Vault instance](https://learn.microsoft.com/en-us/azure/active-directory/verifiable-credentials/verifiable-credentials-configure-tenant#create-a-key-vault)
  * Set up the Verified ID service with the public url obtained from STEP 1
    ```
    e.g:
    Organization name: Magnolia
    Trusted domain: {your-public-url}
    Key vault: {your-kv-vault}
    ```
  * Register an application in Azure AD

4. Configure Service endpoint configuration

  * Copy or download the DID document to the did.json and did-configuration.json file in the folder microsoft-verifiable-credentials-workshop
  * Add the value of the DOMAIN_URL to the ```.env``` file
  * Run the following commands to expose those did json files. (e.g: https://domain/.well-known/did.json and  https://domain/.well-known/did-configuration.json) with the nginx container

    ```sh
    docker run -it --rm --name lb-did -p 80:80 \
    -v $(pwd)/nginx/base.conf:/etc/nginx/conf.d/default.conf \
    -v $(pwd)/nginx/did-location.conf:/etc/nginx/includes/did-location.conf \
    -v $(pwd)/did.json:/usr/share/nginx/html/did.json \
    -v $(pwd)/did-configuration.json:/usr/share/nginx/html/did-configuration.json nginx:alpine
    ```

 * Proceed to complete the verification steps in Microsoft Entra

5. Create the verifiable credential ```VerifiableCredentialEmployee``` for the workshop:

  * Credentials > Select “Custom Credential”
  * Credential Name: ```VerifiedCredentialEmployee```
  * Copy and paste the content of the file ```presentation-employee-display.json``` to Display definition text box 
  * Then based on your Identity Provider integration:
    *  For Auth0: Copy and paste the ```presentation-employee-rules-auth0.json``` to Rules definition text box and replace in the Rules Definition textbox the value ```{AUTH0_DOMAIN}``` with your Auth0 Tenant
    * For Keycloak: Copy and paste the ```presentation-employee-rules.json``` to Rules definition text box and replace in the Rules Definition textbox the value ```{DOMAIN_URL}``` with your public domain url  
  * Click “Create”

    <img src="doc/images/ms-verified-credential.png" width="50%" height="80%"> 
 Once you finish those steps stop the docker container ( <kbd>Ctrl</kbd>+<kbd>C</kbd>)

## Configure and deploy the workshop

1. Adjust the ```.env``` file with your configuration.

| Component                 |  From                         |  To                   | 
|:-------------------------:|:------------------------------|:----------------------|
| ngrok                     |   Public URI                  |  ```.env``` > ```DOMAIN_URL```    |
| MS Entra Verified ID      |   Org Settings > Decentralized identifier (DID)                      |  ```.env``` > ```VC_AUTHORITY```    |
| MS Entra Verified ID      |   Credentials > VerifiedCredentialEmployee > Manifest URL                      |  ```.env``` > ```VC_CREDENTIAL_MANIFEST```    |
| MS Entra Verified ID      |   Org Settings > TenantID                      |  ```.env``` > ```AZURE_TENANT_ID```    |
| Azure AD                  |   App Registration > {issuer-app} > Application (client) ID                      |  ```.env``` > ```AZURE_ISSUER_OAUTH2_CLIENT_ID```   |
| Azure AD                  |   App Registration > {issuer-app} > Client credentials                      |  ```.env``` > ```AZURE_ISSUER_OAUTH2_CLIENT_SECRET```    |
| Azure AD                  |   App Registration > {verifier-app} > Application (client) ID                      |  ```.env``` > ```AZURE_VERIFIER_OAUTH2_CLIENT_ID```|
| Azure AD                  |   App Registration > {verifier-app} > Application (client) ID                      |  ```.env``` > ```AZURE_VERIFIER_OAUTH2_CLIENT_SECRET```   |

If you want to run the [eShop Portal](./vc-verifier-node), since the Spereon library uses DID for the RP, complete the following variables in the `.env` file with your private key and DID (ION Network):
- `VC_ISSUER_PRIVATE_KEY_HEX`: Private Key for signing Authz Request. e.g.: `851eb04ca3e2b2589d6f6a7287565816ee8e3126599bfeede8d3e93c53fb26e3`
- `VC_ISSUER_DID`: DID  e.g.: `ion:EiANaYB43B-E9ngU1Z9XLx8zgIJ6SdOcx74sjeeF7KSa2A`
- `VC_ISSUER_DID_LONG`: DID long format e.g.: `did:ion:EiANaYB43B-E9ngU1Z9XLx8zgIJ6SdOcx74sjeeF7KSa2A:...iOnsicHVibG`
- VC_ISSUER_DID_KEY: DID Key (Public key) e.g.: `"did:ion:EiANaYB43B-E9ngU1Z9XLx8zgIJ6SdOcx74sjeeF7KSa2A#auth-key"`

I will release soon a tool that will help you to create the keys and the DID for an ION Network for demo porposes.

## Choose your Identity Provider
### Integration with your Auth0 tenant

2. Proceed to import the OAuth clients with ```auth0-deploy-cli``` or create the OAuth clients through the Auth0 Console taking the files in the [```auth0\node-deploy-cli\data\clients```](auth0/node-deploy-cli/data/clients) folder as a reference  
Here is explained how to do the importing by using the node app with ```auth0-deploy-cli```:
- Complete the variables in the ```.env``` file located in the folder ```auth0\node-deploy-cli``` and run the folowing command:
   ```bash
   cd auth0\node-deploy-cli
   npm run auth0:import
   ```
3. Adjust the following variables in ```.env``` file with the issuer (portal) client id and client secret and the Auth0 issuer URI:
    ```yaml
    IDP_OAUTH2_CLIENT_ID:
    IDP_OAUTH2_CLIENT_SECRET:
    IDP_ISSUER_URI: e.g: {auth0-tenant}.auth0.com
    ```

4. Execute following Docker Compose command to start the deployment

   ```bash
   docker-compose -f docker-compose-lb.yml -f docker-compose.yml up
   ```

### Integration with Keycloak (local)
2. Execute following Docker Compose command to start the deployment

   ```bash
   docker-compose -f docker-compose-idp.yml -f docker-compose-lb.yml -f docker-compose.yml up
   ```

3. Proceed to initialize the PoC:  
  This script will create the OAuth clients and the users.
   ```bash
   docker exec idp /bin/bash /opt/keycloak/init.sh
   ```

## Workshop Architecture Overview

  Here is an overview of the deployed component as a container.
  
  ngrok: ```https://public-url``` --> nginx container: ```http://localhost``` --> Path base services :point_down:
 

| Component                   |   Path Service                     |
| ------------------------- |:-----------------------------:|
| Magnolia Inc Employee Portal: VC Issuer Spring Boot App |    https://public-url/issuer                      |
| Orion Global Telco Portal: VC Verifier Spring Boot App        |     https://public-url/verifier                      |
| eShop Portal: VC Verifier Node App        |     https://public-url/shop                      |
| DID Configuration files                |     https://public-url/.well-know/did.json & did-configuration.json                    |
| Enterprise Identity Provider: Keycloak (Optional)         |   https://public-url/                       |

# Test cases

A brief introduction was described at the beginning of the readme. Nevertheless, here are described the main use cases:

## Issue your Employee Verifiable Credential in the Magnolia Employee Portal with MS Entra
1. Access the Magnolia Employee portal and click on the sign-in button to login to the Identity provider. 
2. Do the login process with the user ```mwellis@demo.com``` / ```1234demo!```
3. Then, proceed to get the Employee Verifiable Credentials
4. Scan the QR code with the Microsoft Authenticator App
5. In the Authenticator app, click to login to the Identity Provider in order to identity with the demo user ```mwellis@demo.com``` / ```1234demo!```
6. Press accept button to store in the user’s credential in the ID wallet

## Sign-in with your Employee Verifiable Credential in the Orion Global Portal with MS Entra
7. Access the Orion Global Portal and click to sign-in with your Employee Credential
8. Scan the QR code with the Microsoft Authenticator App
9. Accept to share the credential
10. View your credential information in the Orion Global Portal

## Sign-in with your Employee Verifiable Credential in the eShop Portal
11. Access the eShop Portal and click to sign-in with your Employee Credential
12. Scan the QR code with the Microsoft Authenticator App
13. Accept to share the credential
14. View your credential information in the Portal

Here is a video showing the used cases described before.

## Auth0 integration

- Issue Employee Cerifiable Credential based on Auth0 identity tokens with MS Entra

![Auth0-Testcase-0](doc/video/auth0-part1.gif)

## Other cases

- Verify Employee verifiable credential in Telco Portal integrated with MS Entra

![Auth0-Testcase-1](doc/video/auth0-part2.gif)

- Verify Employee verifiable credential in eShop Portal

![shop-testcase](doc/video/shop-testcase.gif)


## Keycloak integration

- Issue Employee Cerifiable Credential based on Keycloak identity tokens

[![Testcases](doc/video/testcases.gif)](https://youtu.be/3C_TEuwX_eE)

# Workshop Microsoft Verifiable Credentials for Keycloak Identity Claims (SSI)
This repository demonstrates how to integrate [Microsoft Entra Verified ID](https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-verified-id) with [Keycloak](https://www.keycloak.org/) Access Manager for issuing [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) based Keycloak id tokens. Nevertheless, you can also integrate your Identity Provider with the demo.
## In Short
This workshop is based on the concept of [Decentralized Identity](https://identity.foundation/) (also known as ​​Verifiable Credentials) which leads to the idea that identity-related information should be self-controlled, portable and with decentralized identifiers. In short, self-sovereign identity (SSI) or [decentralized identity](https://www.w3.org/TR/did-core/) (DID) is a method of identity that centers the control of information around the user.
VC are tamper-proof, cryptographically verifiable claims made by the issuer. Every attestation or Verifiable Credential that an entity (e.g., an organization) issues are associated with their DID.

The following architecture diagram describes the workshop components involved in the verifiable credentials ecosystem.

 ![architecture-diagram](doc/images/architecture-diagram.png)

The following, describes gives an overview of how VC works - An article will be release soon with more details, theoretical and technical background about verifiable credentials.

### Workshop Scenario:
- Magnolia Inc. (issuer) issues Employee credential (verifiable credentials) for your Employees. The employees are being authenticated with the Enterprise Identity Provider which is integrated with Magnolia Employee portal. This portal is capable of issuing Employee Verifiable credentials.
- The employees (holder) use Microsoft Authenticator as the company’ Identity wallet for handling the authentication and verified IDs use cases.
- Orion Global Inc. is a telecommunication company that trusts in the Employee verifiable credentials issued by Magnolia Inc. as proof of Employment. The Telco Portal can validate Magnolia Employee verifiable credentials.

- The goal is to, thanks to the decentralized credentials, Magnolia employees be capable of providing a proof of Employment to Orion Global to access the portal. On the other hand, Orion is capable of verifying the employee’ authenticity, improving the user experience (KYC) in the customer onboarding and sign in processes and improving the security avoiding Identity fraud.

### Workshop Technical Background Overview

- Magnolia Inc has configured your tenant configuration for issuing verifiable credentials in Microsoft Entra Verified ID. It also has configured the Azure ID Vault for signing credentials.
- Magnolia Employee portal is a Spring Boot application integrated with OpenID Connect with Keycloak Access Manager. It’s also integrated with Microsoft Entra Verified Services for issuing verifiable credentials. It has configured Spring Security OAuth 2.0 for the OpenID Connect integration with Keycloak and Client Credentials grant with Azure AD.
- After the employee is authenticated, the verifiable credential is configured to use the id token claims from the IdP. The employee credential is signed by Magnolia and includes the employees DID as the subject DID. 
- Telco Portal is integrated with Microsoft Entra Verified Services for verifying verifiable credentials on the onboarding and sign-in process. Furthermore, it has configured Spring Security OAuth 2.0 Client Credentials grant with Azure AD.
- Keycloak manages the identities and exposes the OpenID Connect endpoints for handling the authentication with Magnolia Employee Portal and Microsoft Authenticator (Digital wallet).
- Microsoft Entra Verified ID exposes the verification services for verifiable credentials use cases. Because DIDs are stored on the blockchain, anyone can verify the validity of an attestation by cross-checking the issuer's DID.

# How to deploy?

## Prerequisites
- Azure tenant with an active subscription
- Install Git, Docker in order to run the steps provided in the next section
- A mobile device with Microsoft Authenticator
- [ngrok](https://ngrok.com/) and sign up for a free account

## Getting Started

1. Obtaining your ngrok public url  
   Several endpoints must be published to the Internet. In this case to simplify the workshop, I have used ngrok for exposing those services.

   ```sh
   docker run -it -e NGROK_AUTHTOKEN={your-ngrok-token} ngrok/ngrok:alpine http 80

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
  * Create an Azure Key Vault instance
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
    -v $(pwd)/nginx/nginx-did-well-known.conf:/etc/nginx/conf.d/default.conf \
    -v $(pwd)/did.json:/usr/share/nginx/html/did.json \
    -v $(pwd)/did-configuration.json:/usr/share/nginx/html/did-configuration.json nginx:alpine
    ```

 * Proceed to complete the verification steps in Microsoft Entra

5. Create the verifiable credential ```VerifiableCredentialEmployee``` for the workshop;

  * Credentials > Select “Custom Credential”
  * Credential Name: ```VerifiedCredentialEmployee```
  * Copy and paste the content of the file ```presentation-employee-display.json``` to Display definition text box and ```presentation-employee-rules.json``` to Rules definition text box
  * Replace in the Rules Definition textbox the value ```{DOMAIN_URL}``` with your public domain url
  * Click “Create”

 Once you finish those steps stop the docker container (CTRL+C)

## Configure and deploy the workshop

1. Adjust the ```.env``` file with your configuration.

| Component                 |  From                         |  To                   | 
|:-------------------------:|:------------------------------|:----------------------|
| ngrok                     |   Public URI                  |  ```.env``` > ```DOMAIN_URL```    |
| MS Entra Verified ID      |   Org Settings > Decentralized identifier (DID)                      |  ```.env``` > ```VC_AUTHORITY```    |
| MS Entra Verified ID      |   Credentials > VerifiedCredentialEmployee > Manifest URL                      |  ```.env``` > ```VC_CREDENTIAL_MANIFEST```    |
| MS Entra Verified ID      |   Org Settings > TenantID                      |  .env > AZURE_TENANT_ID    |
| Azure AD                  |   App Registration > {issuer-app} > Application (client) ID                      |  ```.env``` > ```AZURE_ISSUER_OAUTH2_CLIENT_ID```   |
| Azure AD                  |   App Registration > {issuer-app} > Client credentials                      |  ```.env``` > ```AZURE_ISSUER_OAUTH2_CLIENT_SECRET```    |
| Azure AD                  |   App Registration > {verifier-app} > Application (client) ID                      |  ```.env``` > ```AZURE_VERIFIER_OAUTH2_CLIENT_ID```|
| Azure AD                  |   App Registration > {verifier-app} > Application (client) ID                      |  ```.env``` > ```AZURE_VERIFIER_OAUTH2_CLIENT_SECRET```   |

2. Execute following Docker Compose command to start the deployment

   ```bash
   docker-compose -f docker-compose-idp.yml -f docker-compose.yml up
   ```

3. Proceed to initialize the PoC:  
  This script will create the OAuth clients and the users.
   ```bash
   docker exec idp /bin/bash /opt/keycloak/init.sh
   ```

## Workshop Architecture Overview

  Here is an overview of the deployed component as container.
  
  ngrok: ```https://public-url``` --> nginx container: ```http://localhost``` --> Path base services :point_down:
 

| Component                   |   Path Service                     |
| ------------------------- |:-----------------------------:|
| Enterprise Identity Provider: Keycloak         |   https://public-url/                      |
| Magnolia Inc Employee Portal: VC Issuer Spring Boot App |    https://public-url/issuer                      |
| Orion Global Telco Portal: VC Verifier Spring Boot App        |     https://public-url/verifier                      |
| DID Configuration files                |     https://public-url/.well-know/did.json & did-configuration.json                    |

# Test cases

A brief introduction was described at the beginning of the readme. Nevertheless, here are described the main use cases:

## Issue your Employee Verifiable Credential in the Magnolia Employee Portal
1. Access the Magnolia Employee portal and click on the sign-in button to login to the Identity provider. 
2. Do the login process with the user ```mwellis@demo.com``` / ```1234demo!```
3. Then, proceed to get the Employee Verifiable Credentials
4. Scan the QR code with the Microsoft Authenticator App
5. In the Authenticator app, click to login to the Identity Provider in order to identity yourself with the demo user ```mwellis@demo.com``` / ```1234demo!```
6. Press accept button to stored in the user’s credential in the ID wallet

## Sign-in with your Employee Verifiable Credential in the Orion Global Portal
7. Access the Orion Global Portal the Magnolia Employee portal and click to sign-in with your Employee Credential
8. Scan the QR code with the Microsoft Authenticator App
9. Accept to share the credential
10. View your credential information in the Orion Global Portal

Here is a video showing the used cases described before.

![Testcases](doc/video/testcases.gif)

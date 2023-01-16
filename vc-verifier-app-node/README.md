# Verifiable Credentials Verifier Node Application

This demo application uses the library [Sphereon SIOP-OpenID4VP](https://github.com/Sphereon-Opensource/SIOP-OpenID4VP) for validating Verifiable Credentials. Nevertheless, in this case the app is configured for validating VC issued by MS Entra Services (ION Network). The supported features are described below:

- Build and send the [Authorization Request](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html) with the [Presentation Definition](https://identity.foundation/presentation-exchange/) to Microsoft Authenticator
- Validate the [VP Token](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#name-response-type-vp_token) and the verifiable credential
- Show the verifiable credential data in the UI

More details about the configuration and the use cases are available in the workshop README.

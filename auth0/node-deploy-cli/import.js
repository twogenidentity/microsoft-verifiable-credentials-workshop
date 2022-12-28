import { deploy } from 'auth0-deploy-cli';
import dotenv from "dotenv";
dotenv.config();

const auth0Config = {
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_EXPORT_IDENTIFIERS: false,
    AUTH0_ALLOW_DELETE: false,
    AUTH0_API_MAX_RETRIES: 10,
    AUTH0_KEYWORD_REPLACE_MAPPINGS: {
      CLIENT_ISSUER_CALLBACK_URL: process.env.CLIENT_ISSUER_CALLBACK_URL
    }  
};

console.log("Importing Auth0 clients....")

deploy({
    input_file: './data',
    config: auth0Config
  })
    .then(() => console.log('Import process was successful'))
    .catch(err => console.log(`Something went wrong. Error: ${err}`));
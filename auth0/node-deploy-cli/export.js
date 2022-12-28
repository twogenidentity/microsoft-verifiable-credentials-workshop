import { dump } from 'auth0-deploy-cli';
import dotenv from "dotenv";
dotenv.config();

console.log("Exporting Auth0 tenant config")

const auth0Config = {
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_EXPORT_IDENTIFIERS: false,
    AUTH0_ALLOW_DELETE: false,
    AUTH0_API_MAX_RETRIES: 10
};

dump({
    output_folder: './data', 
    base_path: '.',
    config: auth0Config
  })
  .then(() => console.log('Auth0 export was successful'))
  .catch(err => console.log(`Something went wrong. Error: ${err}`));
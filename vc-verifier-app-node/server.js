import express from "express";
import bodyParser from 'body-parser';
import * as controller from "./controllers/vc.controller.js"

const app = express();
const router = express.Router();

app
  .use('/shop', express.static('public'))
  .use(bodyParser.urlencoded({ extended: true }))
  .use('/shop', router)
  .use("/", function(req, res) {
    res.redirect("/shop");
  });  

router
  .get('/', controller.home)
  .get("/api/vc/presentation", controller.getAuthorizationRequest)
  .get("/api/vc/presentation/:id", controller.getRequest)
  .get("/api/vc/presentation/requests/:id", controller.getRequestJwt)
  .post("/api/vc/presentation/callback", controller.handleAuthorizationResponse);
 

app.listen(8081, function(req, res) {
  console.log("Server is running at port 8081");
});
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

import * as vc from "../service/vc.service.js"

export async function getRequestJwt(req, res) {
    try {
        console.log("Getting Request JWT id: " + req.params.id);        
        return res.send(await vc.getRequestJwt(req.params.id));
    }   
    catch (error) {
        res.status(500).send({ message: error.message });
    }    
}

export async function getRequest(req, res) {
    try {
        console.log("Getting Request id: " + req.params.id);        
        return res.send(await vc.getRequest(req.params.id));
    }   
    catch (error) {
        res.status(500).send({ message: error.message });
    }    
}

export async function getAuthorizationRequest(req, res) {
    try {
        return res.send(await vc.getAuthorizationRequest());
    }   
    catch (error) {
        res.status(500).send({ message: error.message });
    }    
}

export async function handleAuthorizationResponse(req, res) {
    try {
        console.log("Received presentation body: " + JSON.stringify(req.body));
        var { id } = req.query;
        if(!id) {
            id = req.body.state;
        } 
        return res.status(200).send(vc.handleAuthorizationResponse(req.body.vp_token, id));
    }   
    catch (error) {
        res.status(500).send({ message: error.message });
    }    
}

export function home(req, res) {
    return res.sendFile(path.join( __dirname + '/../public/verifier.html'));
}
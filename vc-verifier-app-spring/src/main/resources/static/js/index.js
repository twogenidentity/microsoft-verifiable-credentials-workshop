
var qrcode = new QRCode("qrcode", { width: 280, height: 280});
var carousel = new bootstrap.Carousel(document.querySelector('#carouselExampleDark'),{ pause: true, interval: false });
var presentationRequestId;

const showLogin = () => {
  spinner("hide");
}

const showCredential = (credential) => {
  const vcData = credential.verifiedCredentialsData[0];
  if(vcData) {
      document.querySelector(".credential-title").textContent = "Credential have been successfully verified!"
      document.querySelector(".credential-subtitle").textContent = "You have proved that you are an Employee"
      document.querySelector('.displayName').textContent = vcData.claims.displayName;
      document.querySelector('.userName').textContent = vcData.claims.userName;
      document.querySelector('.firstName').textContent = vcData.claims.firstName;
      document.querySelector('.lastName').textContent = vcData.claims.lastName;
      document.querySelector('.issuer').alt = vcData.issuer;
      document.querySelector('.did').href = "https://identity.foundation/ion/explorer/?did=" + credential.subject;
      document.querySelector(".credential").style.display = "none";
      document.querySelector(".credential-success").style.display = ""
  }
  //carousel.next()
  spinner("hide");
}

const requestPresentation = async () => {
    console.log('Requesting credential...');
    spinner();
    const response = await fetch('api/vc/presentation');
    spinner("hide");
    const presentationResponse = await response.json();
    console.log('Waiting for presentation response: ' + presentationResponse);
    presentationRequestId = presentationResponse.requestId;
    qrcode.makeCode(presentationResponse.url);
    document.querySelector("#qrcode img").classList.add("mx-auto");
    //carousel.next();
    carousel.to(1);
    console.log('Waiting for presentation status...');
    const credential = await poll({
      fn: checkPresentation,
      analyze: analyze,
      interval: 10000,
      maxAttempts: 50
    });
    console.log(JSON.stringify(credential));
    showCredential(credential)
}


const poll = ({ fn, analyze, interval, maxAttempts }) => {
  let attempts = 0;
  const executePoll = async (resolve, reject) => {
    const response = await fn();
    const credential = await response.json()
    attempts++;
    if (analyze(credential)) {
      return resolve(credential);
    } else if (maxAttempts && attempts === maxAttempts) {
      return reject(new Error('Exceeded max attempts'));
    } else {
      setTimeout(executePoll, interval, resolve, reject);
    }
  };
  return new Promise(executePoll);
};

const analyze = (credential) => {
    console.log(credential);
    if(credential && credential.requestStatus) { // request_retrieved or presentation_error or presentation_verified
        carousel.to(2);
        return (credential.requestStatus == "presentation_error" || credential.requestStatus == "presentation_verified");
    }
    return false;
}

const checkPresentation = async () => {
    console.log("Checking status for issuance: " + presentationRequestId);
    return await fetch('api/vc/presentation/' + presentationRequestId);
}

const spinner = function(display) {
  if(display == "hide") {
    // Improve UX
    setTimeout(() => {
      document.querySelector('.spinner').style.display = "none";
    }, "500")
  }
  else {
    document.querySelector('.spinner').style.display = "block";
  }

}

document.querySelector('.btn.step-0').addEventListener('click', () => { requestPresentation(); });

const handleLogin = async () =>{
  try {
      console.log("Handling login")
      /**
      const response = await fetch('http://localhost:3100/api/me');
      const identityClaims = await response.json();
      if(response.ok) {
        showUser(identityClaims);
        return;
      }
      **/
  }
  catch(e) {
      console.log(e)
  }
  showLogin();
}
spinner();
handleLogin();
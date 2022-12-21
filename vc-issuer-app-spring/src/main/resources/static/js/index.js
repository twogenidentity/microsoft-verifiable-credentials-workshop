
var qrcode = new QRCode("qrcode", { width: 280, height: 280});
var carousel = new bootstrap.Carousel(document.querySelector('#carouselExampleDark'),{ pause: true, interval: false , touch: false ,keyboard: false});
var issuanceRequestId;

const showLogin = () => {
  spinner("hide");
}

const showUser = (claims) => {
  let userDisplay = (claims.family_name && claims.given_name) ?  claims.given_name + " " + claims.family_name : claims.email;
  document.querySelector('.display').textContent = userDisplay;
  document.querySelector('.display-header').textContent = "Hello " + userDisplay;
  document.querySelector('.user-info-1').textContent = claims.email;
  document.querySelector('.user-info-2').textContent = claims.preferred_username  + " | " + claims.family_name + " | " +  claims.given_name;
  //carousel.next()
  carousel.to(1);
  spinner("hide");
}

const requestIssuance = async () => {
    console.log('Requesting credential...');
    spinner();
    const response = await fetch('api/vc/issuance');
    spinner("hide");
    const issuanceResponse = await response.json();
    console.log('Waiting for issuance response: ' + issuanceResponse);
    issuanceRequestId = issuanceResponse.requestId;
    qrcode.makeCode(issuanceResponse.url);
    document.querySelector("#qrcode img").classList.add("mx-auto");
    //carousel.next();
    carousel.to(2);
    console.log('Waiting for issuance status...');
    const credential = await poll({
      fn: checkIssuance,
      analyze: analyze,
      interval: 1000,
      maxAttempts: 100
    });
    console.log(credential);
    document.querySelector(".credential-title").textContent = "Credentials have been successfully issued!"
    document.querySelector(".credential-subtitle").textContent = "You may now use your digital identity card to prove who you are to other parties."
    document.querySelector(".credential-success").style.display = ""
    //carousel.next();
    // document.querySelector('#credential').innerHTML = JSON.stringify(credential, null, 2);
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
    if(credential && credential.requestStatus) { // request_retrieved or issuance_error or issuance_successful
        //carousel.next();
        carousel.to(3);
        return (credential.requestStatus == "issuance_error" || credential.requestStatus == "issuance_successful");
    }
    return false;
}


const checkIssuance = async () => {
    console.log("Checking status for issuance: " + issuanceRequestId);
    return await fetch('api/vc/issuance/' + issuanceRequestId);
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

document.querySelector('.btn.step-0').addEventListener('click', () => { requestIssuance(); });

const handleLogin = async () =>{
  try {
      console.log("Handling login")
      const response = await fetch('api/me');
      const identityClaims = await response.json();
      if(response.ok) {
        showUser(identityClaims);
        return;
      }
  }
  catch(e) {
      console.log(e)
  }
  showLogin();
}

spinner();
handleLogin();
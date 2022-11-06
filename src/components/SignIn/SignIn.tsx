import React from "react";
import { UrlParams } from "../../App";
import "./SignIn.css";

type SignInParams = {
    signIn: () => void;
    urlParams: UrlParams;
}

function SignIn({ urlParams, signIn }: SignInParams) {
    function reject() {
        if (!urlParams.originUrl) {
            throw new Error("urlParams.originUrl not found");
        }
        const url = new URL(urlParams.originUrl);
        window.location.assign(url.toString());
    }

  return (
    <div>
        <div className="modal-wrapper">
            <div className="modal">
                <div className="modal-header">
                    <img src={`https://images.web3auth.io/login-${urlParams.loginProvider}.svg`} alt={`${urlParams.loginProvider} logo icon`} />
                    <h1>Connect with <span>{urlParams.loginProvider}</span></h1>
                    <p>{urlParams.originUrl}</p>
                    <p>{urlParams.contractId}</p>
                </div>
                <div className="modal-buttons">
                    <button className="button" onClick={signIn}>Connect</button>
                    <button className="button button-reject" onClick={reject}>Reject</button>
                </div>
            </div>
        </div>
    </div>
  );
}

export default SignIn;

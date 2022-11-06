import React, { useState } from "react";
import { UrlParams } from "../../App";
import "./SignAndSendTransaction.css";

type SignAndSendTransactionParams = {
    approveTransactions: () => void;
    urlParams: UrlParams;
}

function SignAndSendTransaction({ urlParams, approveTransactions }: SignAndSendTransactionParams) {
    const [inProgress, setInProgress] = useState(false);
    
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
                    <h1>Sign And Send Transactions</h1>
                    <p>{urlParams.originUrl}</p>
                    <p>{urlParams.contractId}</p>
                    <code>{JSON.stringify(JSON.parse(Buffer.from(urlParams.transactions!, "base64").toString()), null, 4)}</code>
                </div>
                <div className="modal-buttons">
                    <button className="button" disabled={inProgress} onClick={() => {
                        setInProgress(true);
                        approveTransactions();
                    }}>{inProgress ? <span className="spinner"><img src="https://cdn-icons-png.flaticon.com/512/25/25220.png" alt="spinner"/></span> : "Approve"}</button>
                    <button className="button button-reject" disabled={inProgress} onClick={reject}>Reject</button>
                </div>
            </div>
        </div>
    </div>
  );
}

export default SignAndSendTransaction;

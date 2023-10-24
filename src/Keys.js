import { useState, useEffect } from "react"

export default ({pubkey, setpubkey, privkey, setprivkey}) => {
    const [versionLocked, setVersionLocked] = useState(!!window.localStorage.versionLocked);

    const storageHandler = (pubkey, privkey) => {
        if (pubkey) { crypto.subtle.importKey("jwk", JSON.parse(pubkey), {"name": "RSA-OAEP", "hash": "SHA-512"}, true, ["encrypt"]).then(setpubkey); }
        if (privkey) { crypto.subtle.importKey("jwk", JSON.parse(privkey), {"name": "RSA-OAEP", "hash": "SHA-512"}, true, ["decrypt"]).then(setprivkey); }
    };
    
    const generatekeys = async () => {
        const keys = await crypto.subtle.generateKey({"name": "RSA-OAEP", "modulusLength": 2048, "publicExponent": new Uint8Array([0x01, 0x00, 0x01]), "hash": "SHA-512"}, true, ["encrypt", "decrypt"]);

        const pub = await crypto.subtle.exportKey("jwk", keys.publicKey);
        window.localStorage.pubkey = JSON.stringify(pub);

        const priv = await crypto.subtle.exportKey("jwk", keys.privateKey);
        window.localStorage.privkey = JSON.stringify(priv);

        setpubkey(pub);
        setprivkey(priv);
    }

    useEffect(() => {
        if (!window.localStorage.hasVisitedBefore) {
            window.localStorage.hasVisitedBefore = true;
            generatekeys();
        }
        const listener = () => storageHandler(window.localStorage.pubkey, window.localStorage.privkey);
        listener();
        window.addEventListener("storage", listener);
        return () => window.removeEventListener("storage", listener);
    }, [setpubkey, setprivkey]);

    useEffect(() => {
        window.addEventListener("storage", event => {
            if (event.key === "versionLocked") {
                if (!event.newValue && event.oldValue) { // we're newly disabling versionLocked
                    window.location.reload();
                }
                setVersionLocked(!!event.newValue);
            }
        });
    }, []);

    const pubkeyDisplay = window.localStorage.pubkey != null ? 
        <div style={{"display": "inline-block"}} onClick={() => navigator.clipboard.writeText(window.localStorage.pubkey)}>
            Pubkey: {JSON.parse(window.localStorage.pubkey).n.slice(0, 10)}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" style={{"display": "inline-block"}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
        </div> : null
    const privkeyDisplay = window.localStorage.privkey != null ? 
    <div onClick={() => navigator.clipboard.writeText(window.localStorage.privkey)} style={{"display": "inline-block"}}>
        Privkey: {JSON.parse(window.localStorage.privkey).d.slice(0, 10)}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" style={{"display": "inline-block"}}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
    </div> : null

    let warning = null;
    if (window.localStorage.privkey && window.localStorage.pubkey && JSON.parse(window.localStorage.pubkey).n !== JSON.parse(window.localStorage.privkey).n) {
        warning = "PUBKEY/PRIVKEY DON'T MATCH";
    }

    return <div style={{"backgroundColor": "#3ea363"}}>
        <div style={{"display": "inline-block", "paddingRight": "50px", "paddingLeft": "20px"}}>
            {pubkeyDisplay}
            <button style={{"paddingLeft": "10px"}} onClick={() => {
                navigator.clipboard.readText().then(data => {
                    console.log("data is", data)
                    try {
                        storageHandler(data, null);
                        window.localStorage.pubkey = data;
                    } catch (e) {
                        console.log(e)
                        alert("public key was invalid!");
                    }
                })
            }}> import pubkey </button>
        </div>
        <div style={{"display": "inline-block"}}>
            {privkeyDisplay}
            <button style={{"paddingLeft": "10px"}} onClick={() => {
                navigator.clipboard.readText().then(data => {
                    try {
                        storageHandler(null, data);
                        window.localStorage.privkey = data;
                    } catch {
                        alert("private key was invalid!");
                    }
                })
            }}> import privkey </button>
        </div>
        {warning}
        <button onClick={generatekeys} style={{"paddingLeft": "100px"}} > Generate new keys </button>

        <button style={{"paddingLeft": "30px"}} onClick={() => {
            setVersionLocked(!versionLocked);
            navigator.serviceWorker.getRegistration().then(registration => {
                registration.active.postMessage(!versionLocked);
            });
            if (versionLocked) { // removing version lock
                window.localStorage.removeItem("versionLocked");
                window.location.reload(); // reload page to get new site
            } else { // putting lock in place
                window.localStorage.setItem("versionLocked", "true");
            }
        }}> {versionLocked ? "version locked" : "on latest version"} </button>
      </div>
}
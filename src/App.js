import { useState } from "react"
import Posts from "./Posts";
import Keys from "./Keys";

function App() {
  const [pubkey, setpubkey] = useState(null);
  const [privkey, setprivkey] = useState(null);

  return (
    <>
      <header>
        <Keys pubkey={pubkey} setpubkey={setpubkey} privkey={privkey} setprivkey={setprivkey} />
      </header>
      <Posts pubkey={pubkey} privkey={privkey} />
    </>
  );
}

export default App;

import { useState } from "react"
import Posts from "./Posts";
import Keys from "./Keys";

function App() {
  const [pubkey, setpubkey] = useState(null);
  const [privkey, setprivkey] = useState(null);
  const [numHiddenPosts, setNumHiddenPosts] = useState(0);

  return (
    <>
      <header>
        <Keys pubkey={pubkey} setpubkey={setpubkey} privkey={privkey} setprivkey={setprivkey} numHiddenPosts={numHiddenPosts} />
      </header>
      <Posts pubkey={pubkey} privkey={privkey} setNumHiddenPosts={setNumHiddenPosts} />
    </>
  );
}

export default App;

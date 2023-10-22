import { useState, useEffect } from "react"
import Post from "./Post";

const serverLoc = "https://worker.sophia-wisdom1999.workers.dev"

export default ({pubkey, privkey}) => {
    const [postText, setText] = useState('');
    const [posts, realSetPosts] = useState([]);

    const setPosts = async (posts) => {
        posts.reverse();
        realSetPosts(await Promise.all(posts.map(async (post) => {
            return {...post, children: await Promise.all(post.children.map(async (child) => {
                if (privkey) {
                    try {
                        var decrypted = await crypto.subtle.decrypt({"name": "RSA-OAEP"}, privkey, Uint8Array.from(atob(child.content),  c => c.charCodeAt(0)));
                    } catch {
                        return child;
                    }
                    const decoder = new TextDecoder();
                    return {...child, content: decoder.decode(decrypted)};
                }
                return child;
            }))}
        })));
    }

    const post = () => {
        fetch(`${serverLoc}/api/write`, {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify({"content": postText, "pubkey": window.localStorage.pubkey}),
        }).then(r => r.json()).then(posts => {
            setPosts(posts);
            setText('');
        });
    }

    const reply = async (content, id, pubkey) => {
        // id is id of main post
        let body = {content};
        if (pubkey != null) {
            const key = await crypto.subtle.importKey("jwk", JSON.parse(pubkey), {"name": "RSA-OAEP", "hash": "SHA-512"}, true, ["encrypt"]);
            const encoder = new TextEncoder();
            const encodedContent = encoder.encode(content);
            const encryptedContent = await crypto.subtle.encrypt({"name": "RSA-OAEP"}, key, encodedContent);
            content = btoa(String.fromCharCode(...new Uint8Array(encryptedContent))); // encode as base64
            body = {content, pubkey};
        }

        fetch(`${serverLoc}/api/write_child/${id}`, {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify(body),
        }).then(r => r.json()).then(posts => {
            setPosts(posts);
            setText('');
        });
    }

    useEffect(() => {
        const get = () => fetch(`${serverLoc}/api/read`).then(r => r.json()).then(setPosts);
        get();
        const id = setInterval(get, 30000);
        return () => clearInterval(id);
    }, [privkey]);

    return <div style={{"backgroundColor": "#e18aeb"}}>
        <button onClick={post}> make post </button>
        <textarea value={postText} onChange={e => setText(e.target.value)}>
        </textarea>

        <div>
            {posts.map(post => <Post key={post.id} reply={(content, pubkey)=> reply(content, post.id, pubkey)} pubkey={post.pubkey} content={post.content} children={post.children} />)}
        </div>
    </div>
}
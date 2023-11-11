import { useState, useEffect, useRef } from "react"
import Post from "./Post";

// const serverLoc = "https://worker.sophia-wisdom1999.workers.dev"
const serverLoc = "http://5.78.71.108"

const Posts = ({pubkey: localPubkey, privkey, setNumHiddenPosts}) => {
    const [postText, setText] = useState('');
    const [posts, realSetPosts] = useState([]);
    const postsHash = useRef(null);

    const setPosts = async (newPosts) => {
        console.log("newPosts: ", newPosts);
        let decryptedPosts = await Promise.all(newPosts.map(async (post) => {
            try { // post is unencrypted
                return {...post, ...JSON.parse(post.content)};
            } catch {}
            const storageResult = window.localStorage.getItem(post.content);
            if (storageResult !== null) { // post is encrypted by us
                return {...post, ...JSON.parse(storageResult)};
            }
            if (privkey) {
                // TODO: decryption cache?
                try { // see if post is encrypted to us
                    const IV = Uint8Array.from(atob(post.content.slice(0, 24)), c => c.charCodeAt(0));
                    const wrappedKeyPortion = Uint8Array.from(atob(post.content.slice(24, 368)), c => c.charCodeAt(0));
                    const aesKey = await crypto.subtle.unwrapKey("jwk", wrappedKeyPortion, privkey, {"name": "RSA-OAEP"}, "AES-CBC", false, ["decrypt"]);
                    const encryptedBodyPortion = Uint8Array.from(atob(post.content.slice(368)), c => c.charCodeAt(0))
                    const decrypted = await crypto.subtle.decrypt({"name": "AES-CBC", "iv": IV}, aesKey, encryptedBodyPortion);
                    const decoder = new TextDecoder();
                    return {...post, ...JSON.parse(decoder.decode(decrypted)), decrypted: true};
                } catch (e) {
                    console.log("got error: ", e, "for post", post);
                    return undefined;
                }
            } else {
                return undefined;
            }
        }));
        decryptedPosts = decryptedPosts.filter(val => typeof val !== "undefined");

        let postsById = new Map();
        for (let i = 0; i < decryptedPosts.length; i++) {
            const decryptedPost = decryptedPosts[i];
            postsById.set(decryptedPost.id, {...decryptedPost, children: []});
        }
        for (let i = 0; i < decryptedPosts.length; i++) {
            const decryptedPost = decryptedPosts[i];
            if (typeof decryptedPost.reply_to == "number") {
                postsById.delete(decryptedPost.id);
                if (postsById.has(decryptedPost.reply_to)) {
                    postsById.get(decryptedPost.reply_to).children.unshift(decryptedPost);
                } else {
                    console.error("Don't have the original post child post is replying to: ", decryptedPost);
                }
            }
        }
        const childrenedPosts = Array.from(postsById.values());
        for (let i = 0; i < childrenedPosts.length; i++) {
            const childrenedPost = childrenedPosts[i];
            childrenedPost.children.sort((a, b) => a.timestamp - b.timestamp);
        }

        console.log("childrenedPosts: ", childrenedPosts);
        if (JSON.stringify(childrenedPosts) !== JSON.stringify(posts)) {
            realSetPosts(childrenedPosts);
            setNumHiddenPosts(newPosts.length - decryptedPosts.length);
        }
    }

    const post = () => {
        if (postText === '') {
            return;
        }
        fetch(`${serverLoc}/api/write`, {
            method: "POST",
            body: JSON.stringify({content: postText, pubkey: window.localStorage.pubkey, reply_to: null}),
        }).then(r => r.json()).then(posts => {
            setPosts(posts);
            setText('');
        });
    }

    const reply = async (content, id, replyPubkey, callback) => {
        if (content === '') {
            return;
        }
        // id is id of main post
        let body = JSON.stringify({content, pubkey: window.localStorage.pubkey, reply_to: id});
        if (replyPubkey != null) { // encrypt entire json
            const pubkey = await crypto.subtle.importKey("jwk", JSON.parse(replyPubkey), {"name": "RSA-OAEP", "hash": "SHA-256"}, true, ["encrypt", "wrapKey"]);
            const aesKey = await crypto.subtle.generateKey({"name": "AES-CBC", "length": 128}, true, ["encrypt", "decrypt"]);
            const wrappedAESKey = await crypto.subtle.wrapKey("jwk", aesKey, pubkey, {"name": "RSA-OAEP"});
            console.log("pubkey", pubkey);
            console.log("aeskey", aesKey);
            console.log("wrappedAESKey", wrappedAESKey);
            let base64wrappedAESKey = btoa(String.fromCharCode(...new Uint8Array(wrappedAESKey)));
            const encoder = new TextEncoder();
            const encodedBody = encoder.encode(body);
            let iv = new Uint8Array(16);
            crypto.getRandomValues(iv);
            let encryptedBody = await crypto.subtle.encrypt({"name": "AES-CBC", "iv": iv}, aesKey, encodedBody);
            let base64IV = btoa(String.fromCharCode(...iv));
            let base64body = btoa(String.fromCharCode(...new Uint8Array(encryptedBody)));
            console.log("base64IV length: ", base64IV.length);
            console.log("base64wrappedAESKey length: ", base64wrappedAESKey.length);
            console.log("base64body length: ", base64body.length);
            console.log("unencrypted body: ", body);
            const base64message = base64IV + base64wrappedAESKey + base64body;
            window.localStorage.setItem(base64message, body);
            body = base64message;
        }

        fetch(`${serverLoc}/api/write`, {
            method: "POST",
            body: body,
        }).then(r => {
            if (r.status === 200) {
                postsHash.current = r.headers.get("cache");
            }
            return r.json()
        }).then(posts => {
            setPosts(posts);
            setText('');
            if (typeof callback === "function") {
                callback();
            }
        })
    }

    useEffect(() => {
        const controller = new AbortController();
        const get = () => fetch(`${serverLoc}/api/read`, {signal: controller.signal, method: "GET", headers: {"cache": postsHash.current}}).then(r => {
            if (r.status === 200) {
                postsHash.current = r.headers.get("cache");
                r.json().then(setPosts);
            }
            // otherwise it's a 304
        }).catch(() => null);
        get();
        const id = setInterval(get, 1000);
        return () => { controller.abort(); clearInterval(id); }
    }, [privkey]);

    return <div>
        <div style={{"paddingTop": "100px", "paddingBottom": "40px", "textAlign": "center", "verticalAlign": "baseline"}}>
            <textarea value={postText} onChange={e => setText(e.target.value)} style={{"height": "100px", "width": "40%", "fontSize": "20px"}}/>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={post}> make post </button>
        </div>

        <div>
            {posts.map(post => <Post key={post.id} reply={(content, pubkey, callback)=> reply(content, post.id, pubkey, callback)} pubkey={post.pubkey} content={post.content} timestamp={post.timestamp} children={post.children} />)}
        </div>
    </div>
}

export default Posts;

import { useState, useEffect } from "react"
import Post from "./Post";

const serverLoc = "https://worker.sophia-wisdom1999.workers.dev"

const Posts = ({pubkey: localPubkey, privkey}) => {
    const [postText, setText] = useState('');
    const [posts, realSetPosts] = useState([]);

    const setPosts = async (newPosts) => {
        newPosts.reverse();
        const pastReplies = window.localStorage.pastReplies ? JSON.parse(window.localStorage.pastReplies) : {};
        const decryptedPosts = await Promise.all(newPosts.map(async (post) => {
            return {...post, children: await Promise.all(post.children.map(async (child) => {
                if (child.content in pastReplies) {
                    return {...child, content: pastReplies[child.content], pastreply: true}
                } else if (privkey) {
                    try {
                        var decrypted = await crypto.subtle.decrypt({"name": "RSA-OAEP"}, privkey, Uint8Array.from(atob(child.content),  c => c.charCodeAt(0)));
                    } catch {
                        return child;
                    }
                    const decoder = new TextDecoder();
                    return {...child, content: decoder.decode(decrypted), decrypted: true};
                } else {
                    return child;
                }
            }))}
        }));
        if (JSON.stringify(decryptedPosts) !== JSON.stringify(posts)) {
            realSetPosts(decryptedPosts);
        }
    }

    const post = () => {
        if (postText === '') {
            return;
        }
        fetch(`${serverLoc}/api/write`, {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify({"content": postText, "pubkey": window.localStorage.pubkey}),
        }).then(r => r.json()).then(posts => {
            setPosts(posts);
            setText('');
        });
    }

    const reply = async (content, id, replyPubkey) => {
        if (content === '') {
            return;
        }
        // id is id of main post
        let body = {content, pubkey: window.localStorage.pubkey};
        if (replyPubkey != null) {
            const key = await crypto.subtle.importKey("jwk", JSON.parse(replyPubkey), {"name": "RSA-OAEP", "hash": "SHA-512"}, true, ["encrypt"]);
            const encoder = new TextEncoder();
            const encodedContent = encoder.encode(content);
            const encryptedContent = await crypto.subtle.encrypt({"name": "RSA-OAEP"}, key, encodedContent);
            body.content = btoa(String.fromCharCode(...new Uint8Array(encryptedContent))); // encode as base64
            window.localStorage.pastReplies = JSON.stringify({...JSON.parse(window.localStorage.pastReplies), [body.content]: content});
        }

        fetch(`${serverLoc}/api/write_child/${id}`, {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify(body),
        }).then(r => r.json()).then(posts => {
            setPosts(posts);
            setText('');
        })
    }

    useEffect(() => {
        const controller = new AbortController();
        const get = () => fetch(`${serverLoc}/api/read`, {signal: controller.signal}).then(r => r.json()).then(setPosts).catch(() => null);
        get();
        const id = setInterval(get, 5000);
        return () => { controller.abort(); clearInterval(id); }
    }, [privkey, posts]);

    console.log("posts: ", posts);

    return <div>
        <div style={{"paddingTop": "100px", "paddingBottom": "40px", "textAlign": "center", "verticalAlign": "baseline"}}>
            <textarea value={postText} onChange={e => setText(e.target.value)} style={{"height": "100px", "width": "40%", "fontSize": "20px"}}/>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={post}> make post </button>
        </div>

        <div>
            {posts.map(post => <Post key={post.id} reply={(content, pubkey)=> reply(content, post.id, pubkey)} pubkey={post.pubkey} content={post.content} timestamp={post.timestamp} children={post.children} />)}
        </div>
    </div>
}

export default Posts;

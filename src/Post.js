import { useState } from "react"

export default props => {
    const [replyContent, setReply] = useState('');
    const [encrypted, setEncrypted] = useState(true);

    return <div>
        {props.content}
        <textarea value={replyContent} onChange={e => setReply(e.target.value)} />
        <label htmlFor="encrypted"> Encrypted:  </label>
        <input checked={encrypted} onChange={e => setEncrypted(e.target.checked)} type="checkbox" name="encrypted"></input>
        <button onClick={() => { props.reply(replyContent, encrypted ? props.pubkey : null); setReply('')}}> reply </button>
        <div>
            {props.children.map(child =>
                <div key={child.id}>
                    {child.id}:  {child.content} <button onClick={() => props.reply(replyContent, encrypted ? child.pubkey : null)}> reply to reply </button>
                </div>
            )}
        </div>
    </div>
}
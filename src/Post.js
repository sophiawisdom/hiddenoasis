import { useState } from "react"

const Post = props => {
    const [replyContent, setReply] = useState('');
    const [hideEncrypted, setHideEncrypted] = useState(true);
    const [pubkey, setPubkey] = useState(null);

    // long base64 strings should have no spaces and should be really long -- filter those out. TOCONSIDER: this might break links?
    const childrenWeShouldDisplay = props.children.filter(child => !hideEncrypted || child.content.split(" ")[0].length < 200);
    const hiddenReplies = props.children.length - childrenWeShouldDisplay.length;

    const wouldBeHiddenReplies = props.children.filter(child => child.content.split(" ")[0].length < 200).length != props.children.length;

    const onEnterPress = e => {
        if(e.keyCode === 13 && e.shiftKey === false) {
            e.preventDefault();
            props.reply(replyContent, pubkey);
        }
    }

    return <div style={{"paddingLeft": "100px", "paddingRight": "100px", "paddingBottom": "10px", "backgroundColor": "#fc97e2", "borderTop": "solid 2px white"}}>
        <div style={{"fontSize": "12px", "color": "grey"}}>
            {new Date(props.timestamp).toLocaleString()}
            <span onClick={() => setPubkey(props.pubkey)}> {JSON.parse(props.pubkey).n.slice(0, 10)} </span>
        </div>
        <div style={{"fontSize": "25px"}}>
            {props.content}
        </div>
        {wouldBeHiddenReplies ?
            (hideEncrypted ?
                <button style={{"color": "#9b7da1"}} onClick={() => setHideEncrypted(false)}> {hiddenReplies} hidden encrypted {hiddenReplies > 1 ? "replies" : "reply"} </button>
                : <button style={{"color": "#9b7da1"}} onClick={() => setHideEncrypted(true)}> unhide encrypted replies </button>
            )
            : null
        }

        <div style={{"paddingLeft": "50px", "paddingTop": "20px"}}>
            {childrenWeShouldDisplay.map(child =>
                <div style={{"fontSize": "20px"}} key={child.id}>
                    <div style={{"fontSize": "12px", "color": "grey"}}>
                        {new Date(child.timestamp).toLocaleString()}
                        {child.pubkey ? <span onClick={() => setPubkey(child.pubkey)}> {JSON.parse(child.pubkey).n.slice(0, 10)} </span> : null}
                        {child.decrypted ? "(decrypted)" : null}
                        {child.pastreply ? "(your reply)" : null}
                    </div>
                    {child.content}
                </div>
            )}
        </div>
        <div style={{"fontSize": "13px", "color": "#79717a", "marginTop": "20px"}}>
            {
            pubkey ?
                <div> encrypting with {JSON.parse(pubkey).n.slice(0, 10)} <button onClick={() => setPubkey(null)} style={{"color": "#978b99"}}> reply unencrypted </button> </div>
                : "unencrypted"
            }
        </div>
        <div style={{"height": "64px"}}>
            <textarea style={{"height": "100%", "width": "400px"}} value={replyContent} onKeyDown={onEnterPress} onChange={e => setReply(e.target.value)} />
        </div>
    </div>
}

export default Post;
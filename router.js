import { Router } from 'itty-router';

// now let's create a router (note the lack of "new")
const router = Router();

const options = {
	headers: {
		"content-type": "application/json",
		"Access-Control-Allow-Headers": "content-type",
		"Access-Control-Allow-Methods": "POST",
		"Access-Control-Allow-Origin": "*",
	}
};

router.get('/api/read', async (request, env) => new Response(await env.posts.get("post"), options));

router.post('/api/write', async (request, env) => {
	const content = await request.json();

	let post = JSON.parse(await env.posts.get("post"));

	let newpost = {id: post.length, content: content.content, children: [], timestamp: (new Date()).getTime()};
    if ("pubkey" in content) {
        newpost.pubkey = content.pubkey;
	}
	post.push(newpost);

	await env.posts.put("post", JSON.stringify(post));

	return new Response(JSON.stringify(post), options);
});

router.options("/api/write", () => {
	return new Response("", options);
});

router.options("/api/write_child/:id", () => {
	return new Response("", options);
});

router.post('/api/write_child/:id', async (request, env) => {
	const content = await request.json();

	const id = parseInt(request.params.id);
	if (!Number.isInteger(id)) {
		return new Response("id not a number!", options);
	}

	let post = JSON.parse(await env.posts.get("post"));
	if (id >= post.length) {
		return new Response("id too big...", options)
	}

	let child_post = {id: post[id].children.length, pubkey: content.pubkey, content: content.content, timestamp: (new Date()).getTime()};
	if ("pubkey" in content) {
		child_post.pubkey = content.pubkey
	}
	post[id].children.push(child_post);

	console.log("new post", post);

	await env.posts.put("post", JSON.stringify(post));

	return new Response(JSON.stringify(post), options);
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;

import { Router } from 'itty-router';

// now let's create a router (note the lack of "new")
const router = Router();

// For CORS
const options = {
	headers: {
		"content-type": "application/json",
		"Access-Control-Allow-Headers": "content-type",
		"Access-Control-Allow-Methods": "POST",
		"Access-Control-Allow-Origin": "*",
	}
};

router.get('/api/read', async (request, env) => new Response(await env.posts.get("posts"), options));

router.post('/api/write', async (request, env) => {
	const content = await request.text();
	console.log("content is: ", content);

	let posts = JSON.parse(await env.posts.get("posts"));

	let newpost = {
		// server parameters
		id: posts.length,
		timestamp: (new Date()).getTime(),
		// client parameter
		content
	};
	posts.unshift(newpost);

	let newposts = JSON.stringify(posts);
	await env.posts.put("posts", newposts);

	return new Response(newposts, options);
});

// For CORS
router.options("/api/write", () => {
	return new Response("", options);
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;

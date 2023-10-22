from flask import Flask, send_file, request

import json

from flask_cors import CORS, cross_origin

app = Flask(__name__, static_folder="build/static")

cors = CORS(app, resources={r"/*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'

# posts are {id: int, content: string, pubkey?: string, children: childpost[]}
# childposts are {id: int, content: string, pubkey?: string}
posts = []

@app.route("/write_main", methods=["POST"])
def write_main():
    cur_post_id = max((post['id'] for post in posts), default=-1)+1
    post = {"id": cur_post_id, "content": request.json['content'], "children": []}
    if "pubkey" in request.json:
        post['pubkey'] = request.json['pubkey']
    posts.append(post)
    print("posts: ", posts)
    return posts

@app.route("/write_child/<int:main_id>", methods=["POST"])
def write_child(main_id):
    if type(main_id) != int or main_id >= len(posts) or main_id < 0:
        raise ValueError("id bad")
    subpost = posts[main_id]
    child_post_id = max((subpost['id'] for subpost in subpost['children']), default=-1)+1
    post = {"id": child_post_id, "content": request.json['content']}
    if "pubkey" in request.json:
        post['pubkey'] = request.json['pubkey']
    subpost['children'].append(post)
    print("posts: ", posts)
    return posts

@app.route("/read")
def read():
    print("posts: ", posts)
    return posts

@app.route('/')
def main():
    try:
        return send_file("build/index.html")
    except FileNotFoundError:
        return "Unable to find index.html. This probably means that the website hasn't built yet.", 500

app.run(host="0.0.0.0", port=5200, debug=True)

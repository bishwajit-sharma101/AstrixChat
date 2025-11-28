// PublicFeed.jsx
import React, { useState } from "react";
import PostComposer from "./PostComposer";
import PublicPost from "./PublicPost";


export default function PublicFeed() {
const [posts, setPosts] = useState([
{ user: "Aisha", text: "Anybody here into anime? Let's talk!", tag: "anime" },
{ user: "Rahul", text: "Looking to make new friends.", tag: "friends" },
{ user: "Lena", text: "You are stronger than you think!", tag: "motivation" }
]);


const addPost = (post) => {
setPosts([{ user: "You", ...post }, ...posts]);
};


return (
<div className="flex-1 overflow-y-auto bg-gray-950">
<PostComposer onPost={addPost} />


<div className="p-4">
{posts.map((post, i) => (
<PublicPost key={i} post={post} />
))}
</div>
</div>
);
}
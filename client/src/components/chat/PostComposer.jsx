// PostComposer.jsx
import React, { useState } from "react";


export default function PostComposer({ onPost }) {
const [text, setText] = useState("");
const [tag, setTag] = useState("general");


const publish = () => {
if (!text.trim()) return;
onPost({ text, tag });
setText("");
};


return (
<div className="p-4 bg-gray-900 border-b border-gray-800">
<textarea
value={text}
onChange={(e) => setText(e.target.value)}
placeholder="Share a thought…"
className="w-full bg-gray-800 text-white p-3 rounded-xl h-20 outline-none mb-3"
/>


<div className="flex items-center justify-between">
<select
className="bg-gray-800 text-white p-2 rounded-xl"
value={tag}
onChange={(e) => setTag(e.target.value)}
>
<option value="general">General</option>
<option value="anime">Anime</option>
<option value="friends">Friends</option>
<option value="motivation">Motivation</option>
</select>


<button
onClick={publish}
className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium"
>
Post
</button>
</div>
</div>
);
}
// PublicPost.jsx
import React from "react";
import Avatar from "../common/Avatar";


export default function PublicPost({ post }) {
return (
<div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 shadow">
{/* User */}
<div className="flex items-center gap-3 mb-3">
<Avatar name={post.user} />
<div className="text-white font-medium">{post.user}</div>
</div>


{/* Content */}
<div className="text-gray-200 mb-3">{post.text}</div>


{/* Tag */}
<div className="inline-block px-3 py-1 rounded-full text-sm bg-blue-600 text-white">
#{post.tag}
</div>
</div>
);
}
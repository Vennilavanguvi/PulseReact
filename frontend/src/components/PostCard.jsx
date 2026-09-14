import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

function timeAgo(dateStr) {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function PostCard({ post, isLast }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likedByMe);
  const [count, setCount] = useState(post.likeCount);
  const [busy, setBusy] = useState(false);

  async function handleLike() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const result = await api.toggleLike(post.id);
      setLiked(result.liked);
      setCount(result.likeCount);
    } catch {
      // Keep the previous state visible; a transient failure here isn't worth a banner.
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="post-card">
      <div className="post-rail">
        <span className="post-dot" aria-hidden="true" />
        {!isLast && <span className="post-rail-line" aria-hidden="true" />}
      </div>
      <div className="post-body">
        <div className="post-meta">
          <span className="post-name">{post.author.displayName}</span>
          <span className="post-handle">@{post.author.username}</span>
          <span className="post-time">{timeAgo(post.createdAt)}</span>
        </div>
        <p className="post-content">{post.content}</p>
        {post.hashtags.length > 0 && (
          <div className="post-tags">
            {post.hashtags.map((tag) => (
              <span className="tag-chip" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}
        <button
          className={`like-btn ${liked ? 'like-btn--active' : ''}`}
          onClick={handleLike}
          disabled={!user}
          title={user ? 'Like this post' : 'Log in to like posts'}
        >
          <span className="like-icon" aria-hidden="true" />
          {count}
        </button>
      </div>
    </article>
  );
}

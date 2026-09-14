import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export default function ComposeBox({ onPosted }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="compose-box compose-box--locked">
        <p>Log in to post what's happening.</p>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const post = await api.createPost(content.trim());
      setContent('');
      onPosted(post);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = 500 - content.length;

  return (
    <form className="compose-box" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        placeholder="What's happening? Use #hashtags to mark a topic."
        rows={3}
      />
      <div className="compose-box-footer">
        <span className={`char-count ${remaining < 20 ? 'char-count--low' : ''}`}>
          {remaining}
        </span>
        <button className="btn btn-primary" type="submit" disabled={submitting || !content.trim()}>
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}

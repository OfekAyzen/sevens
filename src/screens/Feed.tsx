import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { copy } from '../domain/copy';
import { downscaleImage } from '../ui/image';
import { itemVariants, listVariants, pressable, springSnap } from '../ui/motion';
import { useDerived } from '../store/derived';
import { useRun } from '../store/run';
import { Button, Card, Screen } from '../ui/components';
import { playTick } from '../ui/sound';

/**
 * The feed.
 *
 * A finite list that ends. No infinite scroll, no autoplay, no pull-to-refresh —
 * the point is that a person opens it, sees what their friends did, reacts, and
 * puts the phone down.
 *
 * Reactions are one tap and count for support points — that mechanic is
 * unchanged, just re-skinned as a heart. Comments (Design Revision, this
 * round) are a separate, unscored layer: the existing rule against REQUIRING
 * a written comment for support points is about not gating a score behind
 * writing, not about banning optional commentary.
 */
export function Feed({ now = new Date() }: { now?: Date }) {
  const d = useDerived(now);
  const addPost = useRun((s) => s.addPost);
  const react = useRun((s) => s.react);
  const addComment = useRun((s) => s.addComment);

  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [bursts, setBursts] = useState<Record<string, number[]>>({});
  const nextBurstId = useRef(0);

  if (!d) return null;

  const myReactedPostIds = new Set(d.myDoc.reactions.map((r) => r.postId));

  function likeWithBurst(postId: string) {
    playTick();
    const id = ++nextBurstId.current;
    setBursts((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), id] }));
    setTimeout(() => {
      setBursts((prev) => ({ ...prev, [postId]: (prev[postId] ?? []).filter((b) => b !== id) }));
    }, 700);
  }

  async function onPickFile(file: File) {
    // Downscaled hard: these documents sync as JSON and four phones share them.
    setImage(await downscaleImage(file, 900, 0.7));
  }

  return (
    <Screen testId="feed" accent="var(--p4)" scroll="fixed">
      <h1>{copy.feed.heading}</h1>

      <Card testId="composer">
        <label>
          {copy.feed.caption}
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            data-testid="input-caption"
          />
        </label>

        {image ? <img className="post__image" src={image} alt="" /> : null}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          data-testid="input-file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onPickFile(file);
          }}
        />
        <Button variant="quiet" testId="attach" onClick={() => fileRef.current?.click()}>
          {copy.feed.attach}
        </Button>

        <Button
          testId="post"
          disabled={busy || caption.trim().length === 0}
          onClick={() => {
            setBusy(true);
            void addPost(d.day, caption.trim(), image).then(() => {
              setCaption('');
              setImage(undefined);
              setBusy(false);
            });
          }}
        >
          {copy.feed.post}
        </Button>
      </Card>

      {d.posts.length === 0 ? (
        <p className="muted" data-testid="feed-empty">
          {copy.feed.empty}
        </p>
      ) : (
        <motion.ul
          className="posts"
          variants={listVariants}
          initial="initial"
          animate="enter"
          data-testid="posts"
        >
          {d.posts.map((post, i) => {
            const mine = post.personId === d.me;
            const reacted = myReactedPostIds.has(post.id);
            const postComments = d.comments.filter((c) => c.postId === post.id);
            const draft = drafts[post.id] ?? '';

            return (
              <motion.li
                className="post"
                key={post.id}
                data-post-id={post.id}
                variants={itemVariants}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: (i % 4) * 0.3 }}
                style={{ borderColor: `var(--p${(i % 4) + 1})` }}
              >
                <div className="post__head">
                  <span className="post__who">{d.names[post.personId] ?? post.personId}</span>
                  <span className="muted">{copy.feed.dayLabel(post.day)}</span>
                </div>
                {post.image ? <img className="post__image" src={post.image} alt="" /> : null}
                <p>{post.caption}</p>

                {!mine ? (
                  <div className="react-wrap">
                    <motion.button
                      className={`react ${reacted ? 'is-on' : ''}`}
                      data-testid={`react-${post.id}`}
                      onClick={() => {
                        likeWithBurst(post.id);
                        void react(post, '❤️', d.day);
                      }}
                      {...pressable}
                    >
                      {reacted ? copy.feed.supported : copy.feed.support}
                    </motion.button>
                    <AnimatePresence>
                      {(bursts[post.id] ?? []).map((burstId) => (
                        <motion.span
                          key={burstId}
                          className="react__burst"
                          initial={{ opacity: 1, y: 0, scale: 0.6 }}
                          animate={{ opacity: 0, y: -36, scale: 1.3 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.65, ease: 'easeOut' }}
                        >
                          ❤️
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : null}

                {postComments.length > 0 ? (
                  <ul className="comments">
                    {postComments.map((c) => (
                      <li key={c.id} className="comment">
                        <span className="comment__who">{d.names[c.personId] ?? c.personId}</span>{' '}
                        {c.text}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="row">
                  <input
                    type="text"
                    className="comment-input"
                    placeholder={copy.feed.commentPrompt}
                    value={draft}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    data-testid={`input-comment-${post.id}`}
                  />
                  <motion.button
                    className="btn btn--quiet"
                    disabled={draft.trim().length === 0}
                    data-testid={`add-comment-${post.id}`}
                    transition={springSnap}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      void addComment(post.id, d.day, draft).then(() => {
                        setDrafts((prev) => ({ ...prev, [post.id]: '' }));
                      });
                    }}
                  >
                    {copy.feed.commentPost}
                  </motion.button>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </Screen>
  );
}

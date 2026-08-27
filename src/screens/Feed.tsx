import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { copy } from '../domain/copy';
import { downscaleImage } from '../ui/image';
import { itemVariants, listVariants, pressable } from '../ui/motion';
import { useDerived } from '../store/derived';
import { useRun } from '../store/run';
import { Button, Card, Screen } from '../ui/components';

/**
 * The feed.
 *
 * A finite list that ends. No infinite scroll, no autoplay, no pull-to-refresh —
 * the point is that a person opens it, sees what their friends did, reacts, and
 * puts the phone down.
 *
 * Reactions are one tap and count for support points. Requiring a written comment
 * would be "higher quality" and would collapse Day 4 support to zero.
 */
export function Feed({ onBack, now = new Date() }: { onBack: () => void; now?: Date }) {
  const d = useDerived(now);
  const addPost = useRun((s) => s.addPost);
  const react = useRun((s) => s.react);

  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!d) return null;

  const myReactedPostIds = new Set(d.myDoc.reactions.map((r) => r.postId));

  async function onPickFile(file: File) {
    // Downscaled hard: these documents sync as JSON and four phones share them.
    setImage(await downscaleImage(file, 900, 0.7));
  }

  return (
    <Screen testId="feed">
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
          {d.posts.map((post) => {
            const mine = post.personId === d.me;
            const reacted = myReactedPostIds.has(post.id);
            return (
              <motion.li className="post" key={post.id} variants={itemVariants}>
                <div className="post__head">
                  <span className="post__who">{d.names[post.personId] ?? post.personId}</span>
                  <span className="muted">{copy.feed.dayLabel(post.day)}</span>
                </div>
                {post.image ? <img className="post__image" src={post.image} alt="" /> : null}
                <p>{post.caption}</p>
                {!mine ? (
                  <motion.button
                    className={`react ${reacted ? 'is-on' : ''}`}
                    data-testid={`react-${post.id}`}
                    onClick={() => void react(post, '👏', d.day)}
                    {...pressable}
                  >
                    {reacted ? copy.feed.supported : copy.feed.support}
                  </motion.button>
                ) : null}
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      <Button variant="quiet" onClick={onBack} testId="back">
        {copy.nav.back}
      </Button>
    </Screen>
  );
}

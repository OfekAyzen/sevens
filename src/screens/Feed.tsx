import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { copy } from '../domain/copy';
import { personCounters } from '../domain/counters';
import type { PersonId } from '../domain/types';
import { downscaleImage } from '../ui/image';
import { itemVariants, listVariants, pressable, spring, springSnap } from '../ui/motion';
import { useDerived } from '../store/derived';
import { useRun } from '../store/run';
import { Button, Screen } from '../ui/components';
import { HeartIcon, PlusIcon, UserIcon, XIcon } from '../ui/icons';
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

  const [composerOpen, setComposerOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [bursts, setBursts] = useState<Record<string, number[]>>({});
  const nextBurstId = useRef(0);
  const [selected, setSelected] = useState<PersonId | null>(null);

  if (!d) return null;

  const myReactedPostIds = new Set(d.myDoc.reactions.map((r) => r.postId));

  const selectedIndex = selected ? d.members.findIndex((m) => m.personId === selected) : -1;
  const detailMember = selected ? d.members.find((m) => m.personId === selected) : null;
  const detailHue = selectedIndex >= 0 ? `var(--p${(selectedIndex % 4) + 1})` : undefined;
  // Reuses the same personCounters() every screen's own stats come from — see
  // src/domain/counters.ts. Deliberately omits anything about the cover
  // token: its spend status is holder-only, never shown on someone else's
  // profile (see docs/PRODUCT-SPEC.md).
  const detailCounters = selected ? personCounters(d.runState, selected, d.day) : null;

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

      <AnimatePresence>
        {composerOpen ? (
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setComposerOpen(false)}
          >
            <motion.div
              className="sheet"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={spring}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet__head">
                <h2>{copy.feed.postPrompt}</h2>
                <button
                  className="sheet__close"
                  aria-label={copy.feed.composerClose}
                  data-testid="composer-close"
                  onClick={() => setComposerOpen(false)}
                >
                  <XIcon size={18} />
                </button>
              </div>

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
                    setComposerOpen(false);
                  });
                }}
              >
                {copy.feed.post}
              </Button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
                  <button
                    className="post__who"
                    onClick={() => setSelected(post.personId)}
                    data-testid={`user-icon-${post.personId}`}
                    aria-label={d.names[post.personId] ?? post.personId}
                  >
                    <UserIcon size={16} />
                    {d.names[post.personId] ?? post.personId}
                  </button>
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
                      <HeartIcon size={16} filled={reacted} className="react__icon" />
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
                          <HeartIcon size={18} filled />
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

      <motion.button
        className="fab"
        data-testid="new-post-fab"
        aria-label={copy.feed.postPrompt}
        onClick={() => setComposerOpen(true)}
        {...pressable}
      >
        <PlusIcon size={26} />
      </motion.button>

      <AnimatePresence>
        {detailMember && detailCounters ? (
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="sheet"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={spring}
              data-testid="person-detail"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet__head">
                <h2 style={{ color: detailHue }}>{detailMember.displayName}</h2>
                <button
                  className="sheet__close"
                  aria-label={copy.group.close}
                  data-testid="person-detail-close"
                  onClick={() => setSelected(null)}
                >
                  <XIcon size={18} />
                </button>
              </div>
              <div className="row" style={{ gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                <span className="muted">{copy.counters.daysPractised(detailCounters.daysPractised)}</span>
                <span className="muted">{copy.counters.bestRun(detailCounters.bestRun)}</span>
                <span className="muted">{copy.group.streak(detailCounters.currentStreak)}</span>
                <span className="muted">{copy.group.minutes(detailCounters.totalMinutes)}</span>
                <span className="muted">{copy.group.detailPosts(detailMember.posts.length)}</span>
                <span className="muted">{copy.group.detailSupport(detailMember.reactions.length)}</span>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Screen>
  );
}

import { motion } from 'framer-motion';
import { copy } from '../domain/copy';
import { groupBand } from '../domain/group';
import { personalReport } from '../domain/report';
import { GROUP_TARGET } from '../domain/types';
import { revealVariants } from '../ui/motion';
import { useDerived } from '../store/derived';
import { useRun } from '../store/run';
import { Button, Card, GroupNumber, Screen } from '../ui/components';

/**
 * Day 7 and Day 8.
 *
 * Day 7 is a showcase, not a verdict. The payload is each person's Day 1 artefact
 * beside their Day 7 artefact — self-referential, unfakeable, and it works
 * identically for guitar, Python and cooking. Artefacts are NEVER compared across
 * people; every comparison here is a person against their own Day 1.
 *
 * The single reveal animation in the whole application lives on this screen. It
 * is worth something precisely because Day 2 got `Logged. Day 2.` and nothing else.
 *
 * Day 8 hands back the data and offers a clean exit. There is deliberately no
 * "start another week" prompt: an app with no growth motive should be willing to
 * end, and visibly ending is the strongest signal that the week was on the level.
 */
export function Finale({ onBack, now = new Date() }: { onBack: () => void; now?: Date }) {
  const d = useDerived(now);
  const exportAll = useRun((s) => s.exportAll);
  if (!d) return null;

  const band = groupBand(d.total);
  const report = personalReport(d.myDoc, d.day);

  return (
    <Screen testId="finale">
      <motion.div variants={revealVariants} initial="initial" animate="enter">
        <GroupNumber total={d.total} target={GROUP_TARGET} />
      </motion.div>

      {band.label ? (
        <h1 data-testid="band" style={{ textAlign: 'center' }}>
          {band.label}
        </h1>
      ) : null}

      <Card testId="before-after">
        <h2>{copy.days[7].heading}</h2>
        <p>{copy.days[7].body}</p>
        <div className="beforeafter">
          {[report.firstArtefact, report.lastArtefact].map((post, i) => (
            <div className="beforeafter__side" key={post?.id ?? i}>
              <span className="muted">{i === 0 ? copy.finale.before : copy.finale.after}</span>
              {post?.image ? <img className="post__image" src={post.image} alt="" /> : null}
              <p>{post?.caption ?? copy.finale.nothingPosted}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card testId="my-report">
        <h2>{copy.finale.reportHeading}</h2>
        <p>{copy.finale.daysLine(report.daysPractised, report.bestRun)}</p>
        {report.medianMinutes !== null ? (
          <p>{copy.finale.medianLine(report.medianMinutes)}</p>
        ) : null}
        <p className="muted">{copy.finale.feedbackLine(d.myDoc.declaration.feedbackSource)}</p>
        {report.unusedToken ? <p className="muted">{copy.ending.unusedToken}</p> : null}
      </Card>

      <Card testId="reflections">
        <h2>{copy.finale.reflectionsHeading}</h2>
        {report.reflections.length === 0 ? (
          <p className="muted">{copy.finale.noReflections}</p>
        ) : (
          report.reflections.map((r) => (
            <p key={r.day}>
              <span className="muted">{copy.feed.dayLabel(r.day)} </span>
              {r.text}
            </p>
          ))
        )}
      </Card>

      <Card testId="ending">
        <h2>{copy.ending.heading}</h2>
        <p>{copy.ending.body}</p>
        <Button testId="export" onClick={() => void exportAll()}>
          {copy.settings.exportData}
        </Button>
      </Card>

      <Button variant="quiet" onClick={onBack} testId="back">
        {copy.nav.back}
      </Button>
    </Screen>
  );
}

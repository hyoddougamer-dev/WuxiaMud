import { useState } from 'react'
import { describe, type Backup } from '../../core/backup.ts'
import { copy, decode, download, encode, fileName, mark, paste, pickFile } from '../backup.ts'
import { realm } from '../../core/realms.ts'
import type { PlayerState } from '../../core/state.ts'
import type { Ancestor } from '../../core/ancestry.ts'

/**
 * 存 Keep a copy.
 *
 * The one screen in the game that exists because something can go wrong. Fifty-two days
 * live in one browser's localStorage: clear the site data, uninstall the app, lose the
 * phone, and it is gone with no recourse and no mistake made.
 *
 * Two rules shape it. The reliable door comes first — copying, which behaves the same in
 * a tab, an installed PWA and an Android WebView, where an anchor download can silently
 * do nothing. And a restore never replaces anything until the player has been told, in a
 * sentence, exactly which cultivator they are about to overwrite and with what.
 */
export function Keep({ state, line, now, onRestore }: {
  state: PlayerState
  line: Ancestor[]
  now: number
  onRestore: (b: Backup) => void
}) {
  const [said, setSaid] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [showing, setShowing] = useState(false)

  const days = Math.max(0, Math.floor((now - state.createdAt) / 86_400_000))
  const text = encode(state, line, now)
  const kept = () => { mark({ lastBackupAt: now }); setFailed(null) }

  async function onCopy() {
    if (await copy(text)) { kept(); setSaid('Copied. Paste it somewhere that is not this phone.') }
    else { setShowing(true); setSaid(null); setFailed('The clipboard refused. Select the text below and copy it by hand.') }
  }

  function onDownload() {
    const b = decode(text)
    const name = b.ok ? fileName(b.backup) : 'ninefold-backup.json'
    if (download(text, name)) { kept(); setSaid(`Saved as ${name}.`) }
    else { setFailed('This browser would not write the file. Copying works everywhere — use that.') }
  }

  function offer(raw: string | null) {
    if (raw === null) return
    const r = decode(raw, now)
    if (r.ok) { setPending(r.backup); setFailed(null); setSaid(null) }
    else { setPending(null); setFailed(r.why) }
  }

  return (
    <>
      <p className="label">Keep a copy <span className="han">存</span></p>

      <div className="keepnow">
        <span className="kk han">存</span>
        <span className="kb">
          <span className="kn">{state.name} · {realm(state.realm).name}</span>
          <span className="kd">
            {days} day{days === 1 ? '' : 's'} old, on this phone only.
            Uninstalling the app deletes it.
          </span>
        </span>
      </div>

      <div className="list">
        <button className="card" onClick={() => void onCopy()}>
          <span className="cb">
            <span className="cn">Copy this cultivator</span>
            <span className="cd">One line of text. Put it in a note, a chat with yourself, an email.</span>
          </span>
          <span className="cx">copy</span>
        </button>
        <button className="card" onClick={onDownload}>
          <span className="cb">
            <span className="cn">Save to a file</span>
            <span className="cd">Nicer when it works. Some phone browsers refuse; copying never does.</span>
          </span>
          <span className="cx">file</span>
        </button>
      </div>

      {said && <p className="notice">{said}</p>}
      {failed && <p className="notice warn">{failed}</p>}

      {showing && (
        <textarea className="backupbox" readOnly value={text} rows={4}
                  onFocus={(e) => e.currentTarget.select()} aria-label="Your backup, to copy by hand" />
      )}

      <p className="label">Bring one back</p>
      <div className="list">
        <button className="card" onClick={() => void paste().then(offer)}>
          <span className="cb">
            <span className="cn">Paste a backup</span>
            <span className="cd">Reads whatever is on the clipboard.</span>
          </span>
          <span className="cx">paste</span>
        </button>
        <button className="card" onClick={() => void pickFile().then(offer)}>
          <span className="cb">
            <span className="cn">Open a backup file</span>
            <span className="cd">A .json written by this game, of any older version.</span>
          </span>
          <span className="cx">file</span>
        </button>
      </div>

      {/* Nothing is replaced until it has been named. */}
      {pending && (
        <div className="panel alarm">
          <p className="cn">{describe(pending)}</p>
          <p className="hint">
            Restoring this ends {state.name} at {realm(state.realm).name} after {days} day
            {days === 1 ? '' : 's'}. There is no undo, so keep a copy of this one first if
            you want it back.
          </p>
          <button className="cta" onClick={() => { onRestore(pending); setPending(null) }}>
            Replace this cultivator
          </button>
          <button className="cta ghost" onClick={() => setPending(null)}>Keep the one I have</button>
        </div>
      )}
    </>
  )
}

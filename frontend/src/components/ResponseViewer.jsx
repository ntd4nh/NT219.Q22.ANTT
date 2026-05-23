import './ResponseViewer.css'

export default function ResponseViewer({ status, latency, data, error }) {
  const badgeClass = status === 200 ? 'success' : status === 401 || status === 403 ? 'danger' : status === 500 ? 'warning' : 'neutral'
  const displayStatus = status ?? 'No request yet'
  const payload = data ?? (error ? { message: error } : null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    } catch {
      // ignore
    }
  }

  return (
    <div className="response-panel panel glass-panel">
      <div className="response-header">
        <div className={`response-badge ${badgeClass}`}>Status: {displayStatus}</div>
        {latency ? <div>{latency}ms</div> : null}
        <button className="button-secondary" type="button" onClick={handleCopy} disabled={!payload}>📋 Copy</button>
      </div>
      {payload ? (
        <pre className="response-body">{JSON.stringify(payload, null, 2)}</pre>
      ) : (
        <div className="response-empty">Chưa có response nào. Gửi request để xem kết quả.</div>
      )}
    </div>
  )
}

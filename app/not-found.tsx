export default function NotFound() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Page Not Found</h2>
      <p>Could not find the requested resource.</p>
      <p>
        <a href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          Return to Home
        </a>
      </p>
    </div>
  );
}
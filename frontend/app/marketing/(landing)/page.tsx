import Link from "next/link";

const features = [
  ["01", "A clear front desk", "Give reception and security one reliable view of every expected visitor."],
  ["02", "Meetings without friction", "Schedule rooms, invite attendees, and keep everyone aligned in real time."],
  ["03", "Insights that matter", "Turn visitor and room activity into simple, useful operational reports."],
];

export default function LandingPage() {
  return (
    <main className="marketing-page">
      <nav className="marketing-nav">
        <Link className="brand marketing-brand" href="/marketing"><span className="brand-mark">O</span>Office<span className="brand-accent">Flow</span></Link>
        <div className="marketing-links"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#security">Security</a></div>
        <div className="marketing-actions"><Link className="marketing-login" href="/login">Sign in</Link><Link className="button primary" href="/login">Open dashboard</Link></div>
      </nav>
      <section className="hero" id="how-it-works">
        <div className="hero-copy"><span className="pill">The modern office front desk</span><h1>Welcome people.<br /><span>Run a better office.</span></h1><p>OfficeFlow brings visitors, meetings, and workplace operations together in one calm, connected workspace.</p><div className="hero-actions"><Link className="button primary hero-button" href="/login">Get started <span>→</span></Link><a className="watch-link" href="#features"><span className="play">▶</span> See how it works</a></div><div className="trusted"><span>Trusted by teams who care about</span><b>simple, thoughtful workplaces.</b></div></div>
        <div className="hero-visual"><div className="visual-glow" /><div className="mock-window"><div className="mock-top"><span className="mock-dots">● ● ●</span><span>OfficeFlow / Today</span><span>•••</span></div><div className="mock-body"><div className="mock-sidebar"><span className="mock-logo">O</span><i /><i /><i /><i /><i /></div><div className="mock-main"><small>MONDAY, OCTOBER 5, 2026</small><h3>Good morning, Jordan</h3><div className="mock-cards"><i /><i /><i /></div><div className="mock-chart"><b>Visitor activity</b><span /><span /><span /><span /></div><div className="mock-table"><b>Recent visitors</b><i /><i /><i /></div></div></div></div></div>
      </section>
      <section className="feature-section" id="features"><div className="section-intro"><span className="eyebrow">Everything in one place</span><h2>Less admin. More <em>connection.</em></h2><p>Designed for the people who keep your workplace moving.</p></div><div className="feature-grid">{features.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p><a href="#how-it-works">Learn more →</a></article>)}</div></section>
      <section className="cta-section" id="security"><div><span className="pill">Ready when you are</span><h2>Your office, in flow.</h2><p>Make every arrival, meeting, and decision feel effortless.</p></div><Link className="button primary" href="/login">Explore OfficeFlow →</Link></section>
      <footer><span>© 2026 OfficeFlow</span><span>Visitor & meeting management, thoughtfully designed.</span></footer>
    </main>
  );
}

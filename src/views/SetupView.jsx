import { useState } from 'react'
import useStore from '../store/useStore'
import GuestList from '../components/guests/GuestList'
import CSVImport from '../components/guests/CSVImport'
import TableSettings from '../components/tables/TableSettings'
import ConstraintForm from '../components/constraints/ConstraintForm'
import ConstraintList from '../components/constraints/ConstraintList'
import Button from '../components/ui/Button'

const ONBOARDING_KEY = 'wedding-seating-onboarding-dismissed'

function StepHeader({ number, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: 'var(--purple-mid)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.8rem', fontWeight: 700,
      }}>
        {number}
      </div>
      <div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1rem', fontWeight: 700, color: 'var(--purple-dark)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{subtitle}</div>}
      </div>
    </div>
  )
}

function Section({ number, title, subtitle, children, scrollable = false }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      ...(scrollable ? { minHeight: 0 } : {}),
    }}>
      <StepHeader number={number} title={title} subtitle={subtitle} />
      <div style={scrollable ? { flex: 1, minHeight: 0, overflowY: 'auto' } : {}}>
        {children}
      </div>
    </div>
  )
}

export default function SetupView() {
  const [showCSV, setShowCSV] = useState(false)
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => !!localStorage.getItem(ONBOARDING_KEY)
  )
  const guests = useStore((s) => s.guests)
  const tables = useStore((s) => s.tables)

  function dismissOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setOnboardingDismissed(true)
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '1.25rem',
    }}>
      {/* Onboarding banner — only shown on first visit */}
      {!onboardingDismissed && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, #FAF5FF, #F0F9FF)',
          border: '1.5px solid var(--purple-light)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 1200,
          margin: '0 auto 1.25rem',
          width: '100%',
        }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--purple-dark)', marginBottom: '0.35rem', fontSize: '0.95rem' }}>
              💍 Welcome to Wedding Seating
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              Follow the 3 steps below to build your seating chart.
              Start by adding guests, then configure your tables, then set any seating rules.
              When you're ready, head to the <strong>Seating</strong> tab to drag guests to tables.
            </div>
          </div>
          <button
            onClick={dismissOnboarding}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1rem', flexShrink: 0,
              padding: '0.1rem',
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        flex: 1,
        minHeight: 0,
        alignItems: 'start',
        gridTemplateRows: '1fr',
      }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 0, height: '100%' }}>
          <Section
            number={1}
            title="Add Guests"
            subtitle={guests.length > 0 ? `${guests.length} guest${guests.length > 1 ? 's' : ''} added` : 'Add guests one by one or import a CSV'}
            scrollable
          >
            <div style={{ marginBottom: '0.75rem' }}>
              <Button
                variant={showCSV ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setShowCSV((v) => !v)}
              >
                📄 {showCSV ? 'Hide CSV import' : 'Import from CSV'}
              </Button>
            </div>

            {showCSV && (
              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: 'var(--bg)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}>
                <CSVImport onClose={() => setShowCSV(false)} />
              </div>
            )}

            <GuestList />
          </Section>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 0, overflowY: 'auto' }}>
          <Section
            number={2}
            title="Configure Tables"
            subtitle={tables.length > 0 ? `${tables.length} table${tables.length > 1 ? 's' : ''} configured` : 'Set how many tables and their sizes'}
          >
            <TableSettings />
          </Section>

          <Section
            number={3}
            title="Set Seating Rules"
            subtitle="Optionally require or forbid guest pairs from sharing a table"
          >
            <ConstraintForm />
            <div style={{ marginTop: '1rem' }}>
              <ConstraintList />
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'

type Props = {
  title?: string
  description?: string
}

export default function LoginGate({
  title = 'Войдите, чтобы увидеть подробности',
  description = 'Описание, правила, депозит и профиль владельца доступны после регистрации. Контакты — только после подтверждённой брони.',
}: Props) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(123,92,240,0.12), rgba(91,138,240,0.08))',
      border: '1px solid rgba(123,92,240,0.25)',
      borderRadius: 16,
      padding: '20px 18px',
      marginBottom: 20,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>🔐</div>
      <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 8, lineHeight: 1.4 }}>
        {title}
      </p>
      <p style={{ color: '#A0A0A0', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
        {description}
      </p>
      <Link
        href="/auth"
        className="btn-primary"
        style={{ display: 'inline-flex', justifyContent: 'center', padding: '12px 28px', fontSize: 14 }}
      >
        Войти или зарегистрироваться
      </Link>
    </div>
  )
}

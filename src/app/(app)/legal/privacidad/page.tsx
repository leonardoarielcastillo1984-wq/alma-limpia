import { LegalPage } from "../LegalPage";

export const metadata = { title: "Política de privacidad — ALMA LIMPIA" };

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updated="Octubre 2026">
      <Section title="Qué datos guardamos">
        <li><b>Cuenta:</b> email, nombre visible, fecha, hora y lugar de nacimiento (solo si los ingresás).</li>
        <li><b>Uso:</b> consultas, mensajes, tiradas de tarot, cartas natales, reportes de numerología, entradas de diario y favoritos.</li>
        <li><b>Pagos:</b> registramos importes y estado de tus compras. Los datos de tu tarjeta los procesa Mercado Pago; nunca los vemos ni los guardamos.</li>
        <li><b>Preferencias:</b> mazo elegido, sonido, animaciones, notificaciones y consentimiento de memoria.</li>
      </Section>
      <Section title="Memoria entre consultas">
        <li>La guía puede recordar temas de consultas anteriores <b>solo si activaste la opción</b> en tu perfil. Podés apagarla cuando quieras y deja de usarse desde ese momento.</li>
        <li>Cada cambio de consentimiento queda registrado con fecha.</li>
      </Section>
      <Section title="Cómo usamos los datos">
        <li>Para brindar las experiencias que comprás o usás gratis: lecturas, cálculos, historial y personalización.</li>
        <li>Para estadísticas internas agregadas (servicios más usados, conversión). Nunca vendemos datos personales.</li>
        <li>Para seguridad: prevención de abuso y registros de auditoría.</li>
      </Section>
      <Section title="Quién accede">
        <li>Solo vos accedés a tus consultas, diarios y reportes. El acceso se verifica en el servidor en cada petición.</li>
        <li>El equipo de administración ve métricas agregadas y datos de compras, no el contenido de tus conversaciones salvo que lo pidas expresamente para soporte.</li>
      </Section>
      <Section title="Tus derechos">
        <li><b>Exportar:</b> desde Perfil → “Exportar mis datos” descargás todo en JSON.</li>
        <li><b>Eliminar:</b> desde Perfil → “Eliminar mi cuenta” se borran tus datos de forma permanente.</li>
        <li><b>Rectificar:</b> todos tus datos personales se editan desde Perfil.</li>
      </Section>
      <Section title="Retención y seguridad">
        <li>Guardamos tu información mientras tu cuenta esté activa. Las sesiones duran 7 días y las claves viajan cifradas (HTTPS) y hasheadas en la base.</li>
        <li>Las copias de seguridad se conservan por un período limitado antes de ser sobrescritas.</li>
      </Section>
      <Section title="Menores">
        <li>ALMA LIMPIA está dirigida a mayores de 18 años. Las cartas astrales infantiles son responsabilidad del adulto que las solicita.</li>
      </Section>
      <p className="text-[11px] text-mist/60">
        Consultas sobre privacidad: escribinos desde la sección de soporte de la app.
      </p>
    </LegalPage>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-lg text-gold-soft">{title}</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ivory/85">{children}</ul>
    </section>
  );
}

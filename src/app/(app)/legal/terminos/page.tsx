import { LegalPage } from "../LegalPage";

export const metadata = { title: "Términos y condiciones — ALMA LIMPIA" };

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y condiciones" updated="Octubre 2026">
      <Section title="El servicio">
        <li>ALMA LIMPIA ofrece experiencias de autoconocimiento: tarot, astrología, numerología, oráculos, rituales guiados y acompañamiento conversacional con la guía espiritual de la plataforma.</li>
        <li>Todas las lecturas son <b>experiencias simbólicas, culturales y de reflexión</b>. No son predicciones verificables ni asesoramiento profesional.</li>
      </Section>
      <Section title="La guía espiritual">
        <li>La guía de ALMA LIMPIA es una experiencia digital de acompañamiento simbólico: no es una persona física ni una profesional de la salud. Está diseñada para acompañar procesos de reflexión personal.</li>
        <li>Si estás atravesando una crisis o necesitás ayuda médica, psicológica, legal o financiera, buscá un profesional habilitado o los servicios de emergencia de tu país.</li>
      </Section>
      <Section title="Cuenta y uso">
        <li>Debés ser mayor de 18 años. Podés usar funciones limitadas como invitada/o o crear una cuenta para guardar tu historial.</li>
        <li>Tu cuenta es personal e intransferible. No compartas tus credenciales.</li>
        <li>No está permitido usar la plataforma para fines ilegales, para extraer contenido de forma automatizada ni para interferir con su funcionamiento.</li>
      </Section>
      <Section title="Compras, créditos y membresía">
        <li>Los precios se muestran en pesos argentinos y pueden modificarse; el precio vigente es el que ves al momento de pagar.</li>
        <li>Las <b>compras de servicios</b> habilitan una consulta del servicio adquirido. Los <b>créditos</b> se consumen según el costo de cada experiencia y no tienen vencimiento mientras tu cuenta esté activa.</li>
        <li>La <b>membresía mensual</b> habilita consultas conversacionales y lecturas mientras esté activa; no cubre servicios con experiencias especiales (tarot, carta natal, sinastría) salvo indicación expresa.</li>
        <li>Las consultas gratuitas diarias son un beneficio limitado por servicio y por día.</li>
      </Section>
      <Section title="Contenido">
        <li>Lo que escribís en tus diarios es privado y tuyo. Podés exportarlo o eliminarlo cuando quieras.</li>
        <li>Las interpretaciones que recibís son para tu uso personal; no está permitido revenderlas ni presentarlas como servicios propios.</li>
      </Section>
      <Section title="Disponibilidad">
        <li>Hacemos lo posible por mantener el servicio disponible, pero no garantizamos funcionamiento ininterrumpido. Las experiencias gratuitas pueden variar con el tiempo.</li>
        <li>Podemos suspender cuentas que incumplan estos términos, previa notificación cuando sea posible.</li>
      </Section>
      <p className="text-[11px] text-mist/60">
        Al usar ALMA LIMPIA aceptás estos términos. Última revisión: octubre 2026.
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

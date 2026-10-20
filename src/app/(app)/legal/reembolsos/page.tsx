import { LegalPage } from "../LegalPage";

export const metadata = { title: "Política de reembolsos — ALMA LIMPIA" };

export default function ReembolsosPage() {
  return (
    <LegalPage title="Política de reembolsos" updated="Octubre 2026">
      <Section title="Regla general">
        <li>Las experiencias digitales (consultas, lecturas, cartas, reportes) se entregan de forma inmediata. Una vez iniciada la experiencia, <b>no hay reembolso</b>, salvo error técnico comprobable.</li>
      </Section>
      <Section title="Casos con reembolso">
        <li><b>Pago acreditado pero servicio no habilitado:</b> si el pago figura aprobado en Mercado Pago y tu consulta no se habilitó, te la activamos manualmente o te reintegramos el importe. Vos elegís.</li>
        <li><b>Cobro duplicado:</b> se devuelve el duplicado de forma automática al detectarlo.</li>
        <li><b>Fallo técnico:</b> si una experiencia se interrumpió por un error nuestro y no pudo reanudarse, se repone sin costo o se reembolsa.</li>
      </Section>
      <Section title="Créditos y membresía">
        <li>Los créditos no consumidos pueden reembolsarse dentro de los 10 días de la compra. Los ya utilizados no.</li>
        <li>La membresía puede cancelarse en cualquier momento desde tu perfil: seguís con acceso hasta el fin del período pago. No hay reembolso proporcional del mes en curso, salvo los casos anteriores.</li>
      </Section>
      <Section title="Cómo pedirlo">
        <li>Escribinos desde la app con el detalle de tu compra (fecha, servicio, comprobante de Mercado Pago). Respondemos en un plazo de 5 días hábiles.</li>
        <li>Los reembolsos se acreditan por el mismo medio de pago que usaste, en los plazos que indique Mercado Pago (usualmente 5 a 15 días).</li>
      </Section>
      <p className="text-[11px] text-mist/60">
        Esta política no afecta los derechos que te otorga la Ley de Defensa del Consumidor 24.240.
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

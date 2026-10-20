/**
 * Email transaccional — ALMA LIMPIA.
 * Si no hay SMTP configurado, los envíos se loguean (modo dev) y no fallan.
 * Envs: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALMA_EMAIL_FROM
 */
import nodemailer from "nodemailer";

const FROM = process.env.ALMA_EMAIL_FROM ?? `ALMA LIMPIA <${process.env.SMTP_USER ?? "hola@almalimpia.app"}>`;

function transporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === "465",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const t = transporter();
  if (!t) {
    // Modo dev: sin SMTP, solo registrar (no romper flujos)
    console.info(`[email:mock] → ${to} | ${subject}`);
    return true;
  }
  try {
    await t.sendMail({ from: FROM, to, subject, html });
    return true;
  } catch (e) {
    console.error("[email] fallo de envío", e);
    return false;
  }
}

// ---------- Templates ----------

function layout(title: string, body: string): string {
  return `
  <div style="background:#17103a;padding:32px 16px;font-family:Georgia,serif;color:#f5efe0">
    <div style="max-width:480px;margin:0 auto;background:#241a52;border:1px solid rgba(233,189,121,.25);border-radius:16px;padding:28px">
      <h1 style="color:#e9bd79;font-size:22px;margin:0 0 4px">ALMA LIMPIA</h1>
      <h2 style="color:#f5efe0;font-size:17px;font-weight:normal;margin:0 0 18px">${title}</h2>
      ${body}
      <p style="margin-top:24px;font-size:11px;color:#b8accf">Experiencias simbólicas de autoconocimiento · no respondas este correo</p>
    </div>
  </div>`;
}

export const emailTemplates = {
  welcome: (name: string) =>
    layout(
      "Bienvenida/o a tu universo",
      `<p>Hola ${name},</p>
       <p>Tu espacio ya está listo: tu carta natal te espera, los oráculos están despiertos y tu diario en blanco quiere escucharte.</p>
       <p style="margin-top:16px"><a href="${process.env.ALMA_APP_URL ?? ""}/inicio" style="display:inline-block;background:#e9bd79;color:#17103a;padding:10px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Entrar a mi universo</a></p>`
    ),

  purchase: (name: string, item: string, amount: string) =>
    layout(
      "Tu compra está confirmada",
      `<p>Hola ${name},</p>
       <p>Recibimos tu pago de <b>${amount}</b>. <b>${item}</b> ya está habilitado en tu cuenta.</p>
       <p style="margin-top:16px"><a href="${process.env.ALMA_APP_URL ?? ""}/inicio" style="display:inline-block;background:#e9bd79;color:#17103a;padding:10px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Ir a mi experiencia</a></p>`
    ),

  resetPassword: (name: string, url: string) =>
    layout(
      "Recuperá tu acceso",
      `<p>Hola ${name},</p>
       <p>Nos pidieron restablecer tu contraseña. Este enlace vale <b>1 hora</b>:</p>
       <p style="margin-top:16px"><a href="${url}" style="display:inline-block;background:#e9bd79;color:#17103a;padding:10px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Crear nueva contraseña</a></p>
       <p style="margin-top:16px;font-size:12px;color:#b8accf">Si no fuiste vos, ignorá este correo: tu clave no cambia.</p>`
    ),

  membershipExpiring: (name: string, plan: string, daysLeft: number) =>
    layout(
      "Tu membresía está por vencer",
      `<p>Hola ${name},</p>
       <p>Tu membresía <b>${plan}</b> vence en <b>${daysLeft} día${daysLeft === 1 ? "" : "s"}</b>. Renovala para no perder tus lecturas ilimitadas.</p>
       <p style="margin-top:16px"><a href="${process.env.ALMA_APP_URL ?? ""}/membresia" style="display:inline-block;background:#e9bd79;color:#17103a;padding:10px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Renovar membresía</a></p>`
    ),
};

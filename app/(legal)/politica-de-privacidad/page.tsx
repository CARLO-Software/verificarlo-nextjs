import type { Metadata } from "next";
import LegalPageLayout from "@/app/components/Legal/LegalPageLayout";

// Página 100% estática - no necesita regenerarse
export const dynamic = 'force-static';
export const revalidate = false;

export const metadata: Metadata = {
  title: "Política de Privacidad | VerifiCARLO",
  description:
    "Política de privacidad y protección de datos personales de VerifiCARLO, en cumplimiento con la Ley N° 29733.",
};

export default function PoliticaPrivacidadPage() {
  return (
    <LegalPageLayout
      title="Política de Privacidad"
      lastUpdated="01 de Abril de 2026"
    >
      <section>
        <p>
          En VerifiCARLO valoramos y respetamos su privacidad. Esta Política de
          Privacidad describe cómo recopilamos, usamos, almacenamos y
          protegemos su información personal en cumplimiento con la{" "}
          <strong>Ley N° 29733 - Ley de Protección de Datos Personales</strong>{" "}
          de la República del Perú y su Reglamento.
        </p>
      </section>

      <section>
        <h2>1. Titular del Banco de Datos Personales</h2>
        <p>El responsable del tratamiento de sus datos personales es:</p>
        <ul>
          <li>
            <strong>Razón Social:</strong> MOVE TECHNOLOGIES S.A.C.
          </li>
          <li>
            <strong>RUC:</strong> 20603667451
          </li>
          <li>
            <strong>Domicilio:</strong> Cerro Azul 421, Santiago de Surco,
            Lima, Perú
          </li>
          <li>
            <strong>Correo electrónico:</strong> verificarlo@carlo.pe
          </li>
          <li>
            <strong>Teléfono:</strong> +51 934 140 010
          </li>
        </ul>
        <p>
          Para ejercer sus derechos ARCO (Acceso, Rectificación, Cancelación y
          Oposición) o realizar consultas sobre el tratamiento de sus datos,
          puede contactarnos a través de los medios indicados anteriormente.
        </p>
      </section>

      <section>
        <h2>2. Datos Personales que Recopilamos</h2>
        <p>
          Recopilamos diferentes tipos de información personal dependiendo de
          su interacción con nuestra plataforma:
        </p>

        <h3>2.1. Datos de Contacto</h3>
        <ul>
          <li>Nombre completo</li>
          <li>Número de teléfono</li>
          <li>Correo electrónico</li>
          <li>Dirección (donde se realizará la inspección)</li>
          <li>Distrito de residencia</li>
        </ul>

        <h3>2.2. Datos del Vehículo</h3>
        <ul>
          <li>Marca y modelo del vehículo</li>
          <li>Año de fabricación</li>
          <li>Placa vehicular (opcional durante la reserva)</li>
          <li>Fotografías del vehículo tomadas durante la inspección</li>
        </ul>

        <h3>2.3. Datos de la Transacción</h3>
        <ul>
          <li>Fecha y hora de la inspección</li>
          <li>Plan de inspección contratado</li>
          <li>
            Información de pago (procesada por terceros, ver sección 5)
          </li>
          <li>Comprobantes de pago</li>
        </ul>

        <h3>2.4. Datos de Navegación y Uso</h3>
        <ul>
          <li>Dirección IP</li>
          <li>Tipo de navegador y dispositivo</li>
          <li>Páginas visitadas y tiempo de permanencia</li>
          <li>Origen de la visita (fuente de tráfico)</li>
          <li>Cookies y tecnologías similares (ver sección 9)</li>
        </ul>

        <h3>2.5. Datos de Marketing (Opcional)</h3>
        <ul>
          <li>
            Preferencia de recibir comunicaciones promocionales (opt-in
            explícito)
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Finalidad del Tratamiento de Datos</h2>
        <p>Utilizamos sus datos personales para los siguientes propósitos:</p>

        <h3>3.1. Prestación del Servicio</h3>
        <ul>
          <li>Procesar su reserva de inspección vehicular</li>
          <li>Coordinar la fecha, hora y ubicación de la inspección</li>
          <li>Realizar la inspección técnica del vehículo</li>
          <li>Elaborar y entregar el reporte de inspección</li>
          <li>Brindar soporte post-inspección</li>
        </ul>

        <h3>3.2. Gestión Administrativa y Comercial</h3>
        <ul>
          <li>Procesamiento de pagos</li>
          <li>Emisión de comprobantes de pago</li>
          <li>Gestión contable y tributaria</li>
          <li>Atención de reclamos y consultas</li>
          <li>
            Envío de notificaciones relacionadas con el servicio (confirmación
            de cita, recordatorios, etc.)
          </li>
        </ul>

        <h3>3.3. Mejora del Servicio</h3>
        <ul>
          <li>Análisis de uso de la plataforma</li>
          <li>Mejora de la experiencia del usuario</li>
          <li>Desarrollo de nuevas funcionalidades</li>
          <li>Estudios de satisfacción del cliente</li>
        </ul>

        <h3>3.4. Marketing y Comunicaciones (Con su Consentimiento)</h3>
        <ul>
          <li>
            Envío de ofertas, promociones y contenido educativo sobre compra de
            vehículos
          </li>
          <li>Newsletters con consejos y novedades de VerifiCARLO</li>
        </ul>
        <p>
          <strong>Importante:</strong> Solo recibirá comunicaciones
          promocionales si ha marcado expresamente la casilla de opt-in durante
          el proceso de reserva. Puede cancelar su suscripción en cualquier
          momento.
        </p>

        <h3>3.5. Cumplimiento de Obligaciones Legales</h3>
        <ul>
          <li>Cumplimiento de requerimientos de SUNAT</li>
          <li>Respuesta a solicitudes de autoridades competentes</li>
          <li>Cumplimiento de normativas de protección al consumidor</li>
        </ul>
      </section>

      <section>
        <h2>4. Base Legal del Tratamiento</h2>
        <p>El tratamiento de sus datos personales se fundamenta en:</p>
        <ul>
          <li>
            <strong>Consentimiento:</strong> Al aceptar esta Política de
            Privacidad y los Términos y Condiciones, usted otorga su
            consentimiento libre, previo, expreso e informado para el
            tratamiento de sus datos personales.
          </li>
          <li>
            <strong>Ejecución del Contrato:</strong> El tratamiento es
            necesario para la prestación del servicio de inspección vehicular
            que ha contratado.
          </li>
          <li>
            <strong>Cumplimiento de Obligaciones Legales:</strong> Estamos
            obligados a tratar ciertos datos para cumplir con leyes tributarias
            y regulatorias (SUNAT, INDECOPI, etc.).
          </li>
          <li>
            <strong>Intereses Legítimos:</strong> Para mejorar nuestros
            servicios, prevenir fraudes y garantizar la seguridad de nuestra
            plataforma.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Compartir Datos con Terceros</h2>
        <p>
          VerifiCARLO puede compartir su información personal con terceros
          únicamente en los siguientes casos:
        </p>

        <h3>5.1. Proveedores de Servicios</h3>
        <ul>
          <li>
            <strong>Pasarela de Pagos (Culqi):</strong> Para procesar
            transacciones con tarjeta de crédito/débito. Culqi cumple con
            estándares PCI-DSS.
          </li>
          <li>
            <strong>Servicios de Hosting y Almacenamiento:</strong> Para
            almacenar datos de forma segura (ej. Vercel, Neon, Cloudinary para
            imágenes).
          </li>
          <li>
            <strong>Servicios de Email:</strong> Para enviar correos
            electrónicos transaccionales y de marketing (si dio su
            consentimiento).
          </li>
          <li>
            <strong>Herramientas de Analítica:</strong> Google Analytics, Meta
            Pixel, TikTok Pixel (ver sección 9 sobre cookies).
          </li>
        </ul>

        <h3>5.2. Autoridades y Cumplimiento Legal</h3>
        <p>
          Podemos compartir datos con autoridades gubernamentales cuando sea
          requerido por ley o en respuesta a procesos legales válidos
          (requerimientos de SUNAT, INDECOPI, Poder Judicial, etc.).
        </p>

        <h3>5.3. Lo que NO Hacemos</h3>
        <ul>
          <li>
            <strong>NO vendemos</strong> sus datos personales a terceros.
          </li>
          <li>
            <strong>NO compartimos</strong> sus datos con fines publicitarios
            sin su consentimiento.
          </li>
          <li>
            <strong>NO cedemos</strong> su información a otras empresas sin
            base legal.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Derechos ARCO (Ley N° 29733)</h2>
        <p>
          Como titular de sus datos personales, usted tiene los siguientes
          derechos:
        </p>

        <h3>6.1. Derecho de Acceso (A)</h3>
        <p>
          Puede solicitar información sobre qué datos personales tenemos sobre
          usted, su origen, finalidad del tratamiento y destinatarios.
        </p>

        <h3>6.2. Derecho de Rectificación (R)</h3>
        <p>
          Puede solicitar la corrección de datos inexactos, incompletos o
          desact ualizados.
        </p>

        <h3>6.3. Derecho de Cancelación (C)</h3>
        <p>
          Puede solicitar la eliminación de sus datos personales cuando
          considere que no están siendo tratados conforme a la ley, salvo que
          exista una obligación legal de conservarlos.
        </p>

        <h3>6.4. Derecho de Oposición (O)</h3>
        <p>
          Puede oponerse al tratamiento de sus datos personales para fines
          específicos (ej. marketing), siempre que no exista una obligación
          legal que lo impida.
        </p>

        <h3>6.5. Cómo Ejercer sus Derechos</h3>
        <p>Para ejercer cualquiera de estos derechos, puede:</p>
        <ul>
          <li>
            Enviar un correo electrónico a{" "}
            <strong>verificarlo@carlo.pe</strong> con el asunto "Solicitud ARCO
            - [Tipo de Derecho]"
          </li>
          <li>
            Indicar claramente qué derecho desea ejercer y proporcionar
            información que permita verificar su identidad
          </li>
        </ul>
        <p>
          Responderemos a su solicitud dentro de los{" "}
          <strong>20 días hábiles</strong> siguientes a su recepción, de
          acuerdo a lo establecido por la normativa peruana.
        </p>

        <h3>6.6. Revocación del Consentimiento</h3>
        <p>
          Puede revocar su consentimiento para el tratamiento de datos en
          cualquier momento, sin efectos retroactivos. Esto puede limitar
          nuestra capacidad de prestarle ciertos servicios.
        </p>
      </section>

      <section>
        <h2>7. Seguridad de los Datos</h2>
        <p>
          VerifiCARLO implementa medidas técnicas, organizativas y legales para
          proteger sus datos personales contra acceso no autorizado, pérdida,
          destrucción o alteración:
        </p>

        <h3>7.1. Medidas Técnicas</h3>
        <ul>
          <li>
            <strong>Encriptación:</strong> Utilizamos certificados SSL/TLS para
            proteger la transmisión de datos sensibles.
          </li>
          <li>
            <strong>Almacenamiento Seguro:</strong> Los datos se almacenan en
            servidores con medidas de seguridad avanzadas.
          </li>
          <li>
            <strong>Acceso Restringido:</strong> Solo personal autorizado tiene
            acceso a los datos personales.
          </li>
          <li>
            <strong>Monitoreo:</strong> Sistemas de detección de intrusiones y
            monitoreo continuo.
          </li>
        </ul>

        <h3>7.2. Medidas Organizativas</h3>
        <ul>
          <li>
            Capacitación del personal en protección de datos y confidencialidad
          </li>
          <li>Políticas internas de seguridad de la información</li>
          <li>
            Acuerdos de confidencialidad con empleados y proveedores
          </li>
        </ul>

        <h3>7.3. Limitación de Responsabilidad</h3>
        <p>
          Si bien implementamos las mejores prácticas de seguridad, ningún
          sistema es 100% seguro. En caso de una brecha de seguridad que afecte
          sus datos, le notificaremos de acuerdo a la normativa vigente.
        </p>
      </section>

      <section>
        <h2>8. Transferencia Internacional de Datos</h2>
        <p>
          Algunos de nuestros proveedores de servicios (como servicios de
          hosting en la nube) pueden estar ubicados fuera del Perú. En estos
          casos:
        </p>
        <ul>
          <li>
            Verificamos que los proveedores cumplan con estándares de
            protección de datos equivalentes a los de Perú
          </li>
          <li>
            Establecemos contratos que garantizan el adecuado tratamiento de
            sus datos
          </li>
          <li>
            Los datos solo se transfieren a países con niveles adecuados de
            protección o mediante garantías apropiadas
          </li>
        </ul>
        <p>
          <strong>Proveedores internacionales que utilizamos:</strong>
        </p>
        <ul>
          <li>
            Vercel - Hosting de la plataforma web (Estados Unidos)
          </li>
          <li>
            Neon - Base de datos (Estados Unidos)
          </li>
          <li>
            Cloudinary - Almacenamiento de imágenes (Estados Unidos/Europa)
          </li>
          <li>
            Google Analytics - Analítica web (Estados Unidos)
          </li>
        </ul>
      </section>

      <section>
        <h2>9. Cookies y Tecnologías de Rastreo</h2>
        <p>
          Utilizamos cookies y tecnologías similares para mejorar su
          experiencia en nuestro sitio web, analizar el uso y personalizar
          contenido.
        </p>

        <h3>9.1. Tipos de Cookies que Utilizamos</h3>

        <h4>Cookies Esenciales (Necesarias)</h4>
        <ul>
          <li>Cookies de sesión para mantener su sesión activa</li>
          <li>
            Cookies de seguridad para prevenir actividades fraudulentas
          </li>
          <li>Cookies de funcionalidad para recordar sus preferencias</li>
        </ul>

        <h4>Cookies de Analítica</h4>
        <ul>
          <li>
            <strong>Google Analytics:</strong> Para analizar el tráfico del
            sitio y el comportamiento de los usuarios
          </li>
          <li>
            Recopila: páginas visitadas, tiempo de permanencia, fuente de
            tráfico, dispositivo usado
          </li>
        </ul>

        <h4>Cookies de Marketing</h4>
        <ul>
          <li>
            <strong>Meta Pixel (Facebook):</strong> ID 1381587826730443
          </li>
          <li>
            <strong>TikTok Pixel:</strong> ID D4928FBC77U6O1UKRBG0
          </li>
          <li>
            <strong>Google Tag Manager:</strong> GTM-N74TS6ZF
          </li>
          <li>
            Utilizadas para mostrar publicidad relevante y medir la efectividad
            de campañas
          </li>
        </ul>

        <h3>9.2. Cómo Gestionar Cookies</h3>
        <p>Puede controlar y/o eliminar las cookies según sus preferencias:</p>
        <ul>
          <li>
            <strong>Configuración del navegador:</strong> La mayoría de
            navegadores permiten rechazar o eliminar cookies
          </li>
          <li>
            <strong>Herramientas de opt-out:</strong>
            <ul>
              <li>
                Google Analytics:{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://tools.google.com/dlpage/gaoptout
                </a>
              </li>
              <li>
                Meta: Configuración de anuncios en su cuenta de Facebook
              </li>
            </ul>
          </li>
        </ul>
        <p>
          <strong>Nota:</strong> Deshabilitar cookies esenciales puede afectar
          la funcionalidad del sitio web.
        </p>
      </section>

      <section>
        <h2>10. Retención de Datos</h2>
        <p>
          Conservamos sus datos personales durante el tiempo necesario para
          cumplir con las finalidades descritas en esta política:
        </p>
        <ul>
          <li>
            <strong>Datos de la transacción:</strong> Mínimo 5 años (obligación
            tributaria de SUNAT)
          </li>
          <li>
            <strong>Comprobantes de pago:</strong> 5 años (obligación legal
            tributaria)
          </li>
          <li>
            <strong>Reportes de inspección:</strong> 3 años desde la fecha de
            emisión
          </li>
          <li>
            <strong>Datos de marketing:</strong> Hasta que revoque su
            consentimiento
          </li>
          <li>
            <strong>Datos de navegación (cookies):</strong> Según la política
            de cada cookie (generalmente 1-2 años)
          </li>
        </ul>
        <p>
          Una vez vencidos estos plazos, sus datos serán eliminados o
          anonimizados de forma segura, salvo que exista una obligación legal
          de conservarlos.
        </p>
      </section>

      <section>
        <h2>11. Menores de Edad</h2>
        <p>
          Nuestros servicios están dirigidos a personas mayores de 18 años. No
          recopilamos intencionalmente datos personales de menores de edad sin
          el consentimiento de sus padres o tutores legales.
        </p>
        <p>
          Si descubrimos que hemos recopilado datos de un menor sin el
          consentimiento apropiado, tomaremos medidas para eliminar esa
          información lo antes posible.
        </p>
      </section>

      <section>
        <h2>12. Enlaces a Sitios de Terceros</h2>
        <p>
          Nuestro sitio web puede contener enlaces a sitios de terceros (ej.
          redes sociales, pasarelas de pago). Esta Política de Privacidad no se
          aplica a esos sitios.
        </p>
        <p>
          Le recomendamos revisar las políticas de privacidad de cualquier
          sitio de terceros que visite. No somos responsables de las prácticas
          de privacidad de sitios externos.
        </p>
      </section>

      <section>
        <h2>13. Modificaciones a esta Política</h2>
        <p>
          VerifiCARLO se reserva el derecho de modificar esta Política de
          Privacidad en cualquier momento para reflejar cambios en nuestras
          prácticas, tecnologías o requisitos legales.
        </p>
        <p>En caso de modificaciones:</p>
        <ul>
          <li>
            Actualizaremos la fecha de "Última actualización" al inicio de este
            documento
          </li>
          <li>
            Si los cambios son sustanciales, le notificaremos por correo
            electrónico o mediante un aviso destacado en nuestro sitio web
          </li>
          <li>
            Le recomendamos revisar periódicamente esta política para estar
            informado sobre cómo protegemos sus datos
          </li>
        </ul>
      </section>

      <section>
        <h2>14. Autoridad de Control</h2>
        <p>
          Si considera que el tratamiento de sus datos personales vulnera la
          normativa peruana de protección de datos, puede presentar una
          reclamación ante:
        </p>
        <ul>
          <li>
            <strong>
              Dirección General de Protección de Datos Personales (DGPDP)
            </strong>
          </li>
          <li>
            Ministerio de Justicia y Derechos Humanos
          </li>
          <li>
            Web:{" "}
            <a
              href="https://www.minjus.gob.pe/direccion-general-de-proteccion-de-datos-personales/"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.minjus.gob.pe
            </a>
          </li>
          <li>Email: protecciondedatospersonales@minjus.gob.pe</li>
        </ul>
      </section>

      <section>
        <h2>15. Contacto sobre Protección de Datos</h2>
        <p>
          Si tiene preguntas, inquietudes o solicitudes relacionadas con esta
          Política de Privacidad o el tratamiento de sus datos personales,
          puede contactarnos:
        </p>
        <ul>
          <li>
            <strong>Email:</strong> verificarlo@carlo.pe (Asunto: "Protección
            de Datos")
          </li>
          <li>
            <strong>Teléfono/WhatsApp:</strong> +51 934 140 010
          </li>
          <li>
            <strong>Dirección:</strong> Cerro Azul 421, Santiago de Surco,
            Lima, Perú
          </li>
        </ul>
        <p>
          Nuestro horario de atención para consultas sobre protección de datos
          es de lunes a viernes, de 9:00 AM a 6:00 PM (hora de Lima).
        </p>
      </section>

    </LegalPageLayout>
  );
}

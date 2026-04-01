import type { Metadata } from "next";
import LegalPageLayout from "@/app/components/Legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Política de Cambios y Devoluciones | VerifiCARLO",
  description:
    "Política de cambios, cancelaciones y devoluciones de VerifiCARLO, en cumplimiento con el Código de Protección y Defensa del Consumidor de Perú.",
};

export default function PoliticaCambiosDevolucionesPage() {
  return (
    <LegalPageLayout
      title="Política de Cambios y Devoluciones"
      lastUpdated="01 de Abril de 2026"
    >
      <section>
        <p>
          En VerifiCARLO nos esforzamos por brindar un servicio de calidad y
          transparente. Esta política describe sus derechos de cancelación,
          cambios y devoluciones en cumplimiento con la{" "}
          <strong>
            Ley N° 29571 - Código de Protección y Defensa del Consumidor
          </strong>{" "}
          de la República del Perú.
        </p>
      </section>

      <section>
        <h2>1. Derecho de Retracto</h2>
        <p>
          De acuerdo con el artículo 78 del Código de Protección y Defensa del
          Consumidor, usted tiene derecho a retractarse de la compra de un
          servicio contratado fuera de un establecimiento comercial (ej.
          online) dentro de los <strong>7 días calendario</strong> contados
          desde la fecha de contratación.
        </p>

        <h3>1.1. Condiciones del Derecho de Retracto</h3>
        <p>
          Para ejercer el derecho de retracto, deben cumplirse las siguientes
          condiciones:
        </p>
        <ul>
          <li>
            El servicio <strong>NO debe haberse ejecutado</strong> al momento
            de la retracción
          </li>
          <li>
            La solicitud debe realizarse dentro de los 7 días calendario desde
            la contratación (pago del adelanto)
          </li>
          <li>
            Debe notificarnos por escrito mediante correo electrónico a{" "}
            <strong>verificarlo@carlo.pe</strong>
          </li>
        </ul>

        <h3>1.2. Procedimiento para Ejercer el Derecho de Retracto</h3>
        <ol>
          <li>
            Envíe un correo electrónico a <strong>verificarlo@carlo.pe</strong>{" "}
            con el asunto "Derecho de Retracto - [Número de Reserva]"
          </li>
          <li>
            Incluya en el correo:
            <ul>
              <li>Nombre completo</li>
              <li>Número de reserva o booking</li>
              <li>Fecha de contratación</li>
              <li>Motivo de la retracción (opcional)</li>
            </ul>
          </li>
          <li>
            Recibirá una confirmación de su solicitud dentro de las 24 horas
            hábiles
          </li>
          <li>
            El reembolso del 100% del adelanto se procesará en un plazo máximo
            de <strong>10 días hábiles</strong>
          </li>
        </ol>

        <h3>1.3. Limitaciones del Derecho de Retracto</h3>
        <p>
          <strong>El derecho de retracto NO aplica</strong> en los siguientes
          casos:
        </p>
        <ul>
          <li>
            Cuando el servicio de inspección ya se haya realizado (total o
            parcialmente)
          </li>
          <li>
            Cuando hayan transcurrido más de 7 días calendario desde la
            contratación
          </li>
          <li>
            Cuando el Cliente haya aceptado expresamente que el servicio
            comience antes del plazo de retracto y renuncie a este derecho
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Cancelación de la Reserva</h2>
        <p>
          Si desea cancelar su reserva de inspección, los términos varían según
          la anticipación con la que lo solicite:
        </p>

        <h3>2.1. Cancelación con 48 horas o más de anticipación</h3>
        <ul>
          <li>
            <strong>Reembolso:</strong> 100% del adelanto pagado (S/ 50)
          </li>
          <li>
            <strong>Plazo de devolución:</strong> 10 días hábiles
          </li>
          <li>
            <strong>Método de reembolso:</strong> Mismo medio de pago utilizado
            originalmente
          </li>
        </ul>

        <h3>2.2. Cancelación entre 24 y 48 horas de anticipación</h3>
        <ul>
          <li>
            <strong>Reembolso:</strong> 50% del adelanto pagado (S/ 25)
          </li>
          <li>
            <strong>Justificación:</strong> Gastos administrativos y de
            coordinación ya incurridos
          </li>
          <li>
            <strong>Plazo de devolución:</strong> 10 días hábiles
          </li>
        </ul>

        <h3>2.3. Cancelación con menos de 24 horas de anticipación</h3>
        <ul>
          <li>
            <strong>Reembolso:</strong> No hay reembolso del adelanto
          </li>
          <li>
            <strong>Justificación:</strong> El inspector ya ha sido asignado y
            coordinado para su cita
          </li>
          <li>
            <strong>Excepción:</strong> Ver sección 4 sobre Casos de Fuerza
            Mayor
          </li>
        </ul>

        <h3>2.4. No Presentarse (No-Show)</h3>
        <p>
          Si el Cliente no se presenta a la cita programada sin previo aviso:
        </p>
        <ul>
          <li>
            <strong>No hay reembolso</strong> del adelanto pagado
          </li>
          <li>El servicio se considera como no prestado por causa del Cliente</li>
          <li>
            El Cliente deberá pagar una nueva reserva si desea reagendar
          </li>
        </ul>

        <h3>2.5. Cómo Solicitar una Cancelación</h3>
        <ol>
          <li>
            Envíe un correo a <strong>verificarlo@carlo.pe</strong> o contacte
            vía WhatsApp al <strong>+51 934 140 010</strong>
          </li>
          <li>
            Indique su número de reserva y la razón de la cancelación
          </li>
          <li>
            Recibirá confirmación de la cancelación y los términos de reembolso
            aplicables
          </li>
          <li>
            El reembolso se procesará según el método de pago original
          </li>
        </ol>
      </section>

      <section>
        <h2>3. Reagendamiento de la Cita</h2>
        <p>
          Si necesita cambiar la fecha u hora de su inspección, puede
          reagendar sin costo adicional bajo ciertas condiciones:
        </p>

        <h3>3.1. Reagendamiento con 24 horas o más de anticipación</h3>
        <ul>
          <li>
            <strong>Costo:</strong> Sin cargo adicional
          </li>
          <li>
            <strong>Frecuencia:</strong> Hasta 2 reagendamientos sin costo
          </li>
          <li>
            El adelanto pagado se mantiene vigente para la nueva fecha
          </li>
          <li>Sujeto a disponibilidad de horarios</li>
        </ul>

        <h3>3.2. Reagendamiento con menos de 24 horas</h3>
        <ul>
          <li>
            <strong>Costo:</strong> S/ 20 soles (cargo administrativo)
          </li>
          <li>Sujeto a disponibilidad del inspector</li>
          <li>
            No garantizamos poder acomodar solicitudes de último momento
          </li>
        </ul>

        <h3>3.3. Procedimiento de Reagendamiento</h3>
        <ol>
          <li>
            Contacte a VerifiCARLO vía WhatsApp (+51 934 140 010) o email
            (verificarlo@carlo.pe)
          </li>
          <li>Indique su número de reserva y la nueva fecha/hora preferida</li>
          <li>
            Confirmaremos la disponibilidad y le enviaremos una nueva
            confirmación de cita
          </li>
          <li>
            Si aplica cargo de S/ 20, debe pagarlo antes de confirmar la nueva
            fecha
          </li>
        </ol>
      </section>

      <section>
        <h2>4. Casos de Fuerza Mayor</h2>
        <p>
          En situaciones excepcionales que escapen al control razonable del
          Cliente, se aplicarán condiciones especiales:
        </p>

        <h3>4.1. Situaciones Consideradas de Fuerza Mayor</h3>
        <ul>
          <li>
            <strong>Clima extremo:</strong> Lluvias intensas, huaicos,
            inundaciones que impidan la inspección de forma segura
          </li>
          <li>
            <strong>Emergencia médica:</strong> Enfermedad o accidente del
            Cliente (se requerirá documentación)
          </li>
          <li>
            <strong>Emergencias familiares:</strong> Fallecimiento o
            hospitalización de un familiar directo
          </li>
          <li>
            <strong>Desastres naturales:</strong> Sismos, cortes de servicios
            públicos generalizados
          </li>
          <li>
            <strong>Restricciones gubernamentales:</strong> Cuarentenas,
            toques de queda no previstos
          </li>
        </ul>

        <h3>4.2. Opciones en Caso de Fuerza Mayor</h3>
        <p>El Cliente puede elegir entre:</p>
        <ul>
          <li>
            <strong>Reagendamiento sin costo:</strong> Sin importar la
            anticipación del aviso
          </li>
          <li>
            <strong>Reembolso del 100%:</strong> Se devuelve el adelanto
            completo
          </li>
        </ul>

        <h3>4.3. Documentación Requerida</h3>
        <p>
          Para acogerse a la política de fuerza mayor, el Cliente debe
          proporcionar:
        </p>
        <ul>
          <li>
            Evidencia de la situación (certificado médico, constancia policial,
            etc.)
          </li>
          <li>Notificación a VerifiCARLO lo antes posible</li>
        </ul>
      </section>

      <section>
        <h2>5. Cancelación por Parte de VerifiCARLO</h2>
        <p>
          VerifiCARLO se reserva el derecho de cancelar o reprogramar una
          inspección en los siguientes casos:
        </p>

        <h3>5.1. Motivos de Cancelación por la Empresa</h3>
        <ul>
          <li>
            <strong>Enfermedad o emergencia del inspector:</strong> Si el
            inspector asignado no puede asistir por motivos de salud
          </li>
          <li>
            <strong>Condiciones climáticas peligrosas:</strong> Cuando la
            seguridad del inspector esté en riesgo
          </li>
          <li>
            <strong>Información falsa del Cliente:</strong> Si se descubre que
            los datos proporcionados son incorrectos o fraudulentos
          </li>
          <li>
            <strong>Ubicación insegura:</strong> Si el lugar de la inspección
            representa un riesgo de seguridad
          </li>
          <li>
            <strong>Vehículo no disponible o inoperativo:</strong> Si el
            vehículo no está en condiciones de ser inspeccionado
          </li>
        </ul>

        <h3>5.2. Consecuencias de la Cancelación por VerifiCARLO</h3>
        <p>Cuando VerifiCARLO cancela la cita, el Cliente puede elegir:</p>
        <ul>
          <li>
            <strong>Reagendamiento sin costo:</strong> Nueva fecha en los
            próximos días, según disponibilidad
          </li>
          <li>
            <strong>Reembolso del 100% del adelanto:</strong> Procesado en 5
            días hábiles
          </li>
          <li>
            <strong>Crédito para futura inspección:</strong> Válido por 90 días
          </li>
        </ul>

        <h3>5.3. Notificación</h3>
        <p>
          VerifiCARLO notificará la cancelación con la mayor anticipación
          posible por:
        </p>
        <ul>
          <li>WhatsApp al número proporcionado</li>
          <li>Correo electrónico</li>
          <li>Llamada telefónica</li>
        </ul>
      </section>

      <section>
        <h2>6. Insatisfacción con el Servicio</h2>
        <p>
          Si el Cliente no está conforme con la inspección realizada,
          VerifiCARLO ofrece las siguientes opciones:
        </p>

        <h3>6.1. Re-inspección Gratuita</h3>
        <p>
          Se ofrece una re-inspección sin costo adicional si se cumplen las
          siguientes condiciones:
        </p>
        <ul>
          <li>
            El Cliente presenta evidencia clara de que la inspección fue
            deficiente o incompleta
          </li>
          <li>
            La queja se presenta dentro de las <strong>48 horas</strong>{" "}
            posteriores a recibir el reporte
          </li>
          <li>
            El vehículo sigue disponible en la misma ubicación y condiciones
          </li>
          <li>
            La queja es razonable y se refiere a aspectos técnicos verificables
          </li>
        </ul>

        <h3>6.2. Reembolso Parcial o Total</h3>
        <p>
          En casos excepcionales donde se determine que el servicio no cumplió
          con los estándares prometidos:
        </p>
        <ul>
          <li>
            <strong>Deficiencias menores:</strong> Reembolso de hasta el 30%
            del costo total
          </li>
          <li>
            <strong>Deficiencias mayores:</strong> Reembolso de hasta el 50%
            del costo total
          </li>
          <li>
            <strong>Servicio no prestado adecuadamente:</strong> Reembolso del
            100% del costo total
          </li>
        </ul>

        <h3>6.3. Procedimiento para Quejas</h3>
        <ol>
          <li>
            Envíe un correo detallado a <strong>verificarlo@carlo.pe</strong>{" "}
            con:
            <ul>
              <li>Número de reserva</li>
              <li>Descripción específica del problema</li>
              <li>
                Evidencia que sustente su reclamo (fotos, videos, documentos)
              </li>
            </ul>
          </li>
          <li>
            Recibirá respuesta dentro de las <strong>48 horas hábiles</strong>
          </li>
          <li>
            Se revisará el caso y se coordinará la solución más apropiada
          </li>
          <li>
            Si corresponde reembolso, se procesará en 10 días hábiles
          </li>
        </ol>

        <h3>6.4. Libro de Reclamaciones</h3>
        <p>
          Si no está conforme con la solución propuesta, puede presentar su
          reclamo en nuestro{" "}
          <strong>Libro de Reclamaciones Digital</strong>, accesible desde
          nuestra página web. Su reclamo será atendido en un plazo máximo de 30
          días calendario conforme a la Ley N° 29571.
        </p>
      </section>

      <section>
        <h2>7. Excepciones - Casos Donde NO Aplica Devolución</h2>
        <p>
          No procederá ningún tipo de reembolso en los siguientes casos:
        </p>
        <ul>
          <li>
            <strong>Servicio ejecutado conforme:</strong> Cuando la inspección
            se realizó según los estándares y el plan contratado
          </li>
          <li>
            <strong>Información falsa del Cliente:</strong> Si el Cliente
            proporcionó datos erróneos o incompletos que afectaron la
            inspección
          </li>
          <li>
            <strong>Cliente impidió la inspección:</strong> Si el Cliente o
            terceros obstaculizaron el trabajo del inspector
          </li>
          <li>
            <strong>Uso indebido del reporte:</strong> Si el Cliente modificó,
            alteró o usó fraudulentamente el reporte de inspección
          </li>
          <li>
            <strong>Desacuerdo con el veredicto:</strong> El mero desacuerdo
            con los resultados técnicos de la inspección (ej. "No Recomendado")
            no constituye motivo de devolución
          </li>
          <li>
            <strong>Decisión de compra:</strong> Si el Cliente decidió comprar
            el vehículo a pesar de un veredicto negativo y luego tuvo problemas
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Método y Plazo de Reembolso</h2>

        <h3>8.1. Métodos de Reembolso</h3>
        <p>Los reembolsos se realizan mediante:</p>
        <ul>
          <li>
            <strong>Mismo método de pago original:</strong>
            <ul>
              <li>
                Tarjeta de crédito/débito: Reversión automática (5-10 días
                hábiles según el banco)
              </li>
              <li>
                Transferencia bancaria: Transferencia a la misma cuenta (2-5
                días hábiles)
              </li>
              <li>
                Yape/Plin: Transferencia al mismo número (1-3 días hábiles)
              </li>
            </ul>
          </li>
          <li>
            <strong>Método alternativo:</strong> Si el método original no está
            disponible, se coordinará con el Cliente
          </li>
        </ul>

        <h3>8.2. Plazos de Reembolso</h3>
        <ul>
          <li>
            <strong>Procesamiento interno:</strong> Máximo 5 días hábiles desde
            la aprobación
          </li>
          <li>
            <strong>Plazo total:</strong> Máximo 10 días hábiles desde la
            solicitud aprobada
          </li>
          <li>
            <strong>Demora bancaria:</strong> Los tiempos de acreditación
            dependen de la entidad financiera del Cliente
          </li>
        </ul>

        <h3>8.3. Seguimiento</h3>
        <p>
          El Cliente recibirá notificaciones sobre el estado de su reembolso:
        </p>
        <ul>
          <li>Confirmación de solicitud recibida</li>
          <li>Aprobación o rechazo del reembolso (con justificación)</li>
          <li>Procesamiento del pago</li>
          <li>
            Comprobante de transferencia (cuando el reembolso haya sido
            enviado)
          </li>
        </ul>
      </section>

      <section>
        <h2>9. Créditos y Promociones</h2>

        <h3>9.1. Crédito para Futura Inspección</h3>
        <p>
          En algunos casos, VerifiCARLO puede ofrecer un crédito en lugar de
          reembolso:
        </p>
        <ul>
          <li>
            <strong>Monto:</strong> Igual o mayor al adelanto original
          </li>
          <li>
            <strong>Validez:</strong> 90 días calendario desde su emisión
          </li>
          <li>
            <strong>Uso:</strong> Aplicable a cualquier plan de inspección
          </li>
          <li>
            <strong>Transferible:</strong> Puede cederse a otra persona (con
            notificación)
          </li>
        </ul>

        <h3>9.2. Compensaciones Especiales</h3>
        <p>
          Por inconvenientes significativos causados por VerifiCARLO, podemos
          ofrecer:
        </p>
        <ul>
          <li>
            Descuentos en futuros servicios (10%-20% según el caso)
          </li>
          <li>
            Upgrade gratuito a un plan superior
          </li>
          <li>
            Servicios adicionales sin costo (ej. segunda inspección gratuita
            para otro vehículo)
          </li>
        </ul>
      </section>

      <section>
        <h2>10. Modificaciones a esta Política</h2>
        <p>
          VerifiCARLO se reserva el derecho de modificar esta Política de
          Cambios y Devoluciones en cualquier momento. Los cambios entrarán en
          vigor inmediatamente después de su publicación en el sitio web.
        </p>
        <p>
          Las reservas realizadas antes de una modificación se regirán por los
          términos vigentes al momento de la contratación.
        </p>
      </section>

      <section>
        <h2>11. Contacto para Solicitudes</h2>
        <p>
          Para cualquier solicitud de cancelación, reagendamiento o devolución,
          puede contactarnos:
        </p>
        <ul>
          <li>
            <strong>Email:</strong> verificarlo@carlo.pe
          </li>
          <li>
            <strong>WhatsApp:</strong> +51 934 140 010
          </li>
          <li>
            <strong>Horario de atención:</strong> Lunes a viernes, 9:00 AM -
            6:00 PM (hora de Lima)
          </li>
        </ul>
        <p>
          <strong>Tiempo de respuesta:</strong> Nos comprometemos a responder
          todas las solicitudes dentro de las 24 horas hábiles.
        </p>
      </section>
      
    </LegalPageLayout>
  );
}

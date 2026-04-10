import type { Metadata } from "next";
import LegalPageLayout from "@/app/components/Legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Términos y Condiciones | VerifiCARLO",
  description:
    "Términos y condiciones del servicio de inspección vehicular VerifiCARLO en Lima, Perú.",
};

export default function TerminosCondicionesPage() {
  return (
    <LegalPageLayout
      title="Términos y Condiciones"
      lastUpdated="01 de Abril de 2026"
    >
      <section>
        <p>
          <strong>IMPORTANTE:</strong> Por favor, lea cuidadosamente estos
          Términos y Condiciones antes de contratar nuestros servicios. Al
          utilizar nuestra plataforma y/o contratar una inspección vehicular,
          usted acepta estar sujeto a estos términos.
        </p>
      </section>

      <section>
        <h2>1. Identificación de la Empresa</h2>
        <p>
          Los servicios de inspección vehicular que se ofrecen a través de este
          sitio web son provistos por:
        </p>
        <ul>
          <li>
            <strong>Razón Social:</strong> MOVE TECHNOLOGIES S.A.C.
          </li>
          <li>
            <strong>RUC:</strong> 20603667451
          </li>
          <li>
            <strong>Domicilio fiscal:</strong> Cerro Azul 421, Santiago de
            Surco, Lima, Perú
          </li>
          <li>
            <strong>Correo electrónico:</strong> verificarlo@carlo.pe
          </li>
          <li>
            <strong>Teléfono:</strong> +51 934 140 010
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Definiciones</h2>
        <p>Para efectos de estos Términos y Condiciones, se entiende por:</p>
        <ul>
          <li>
            <strong>"VerifiCARLO" o "la Empresa":</strong> Se refiere al
            prestador del servicio de inspección vehicular.
          </li>
          <li>
            <strong>"Usuario" o "Cliente":</strong> Persona natural o jurídica
            que contrata los servicios de inspección.
          </li>
          <li>
            <strong>"Servicio" o "Inspección":</strong> Revisión técnica del
            estado de un vehículo usado, realizada por un inspector calificado.
          </li>
          <li>
            <strong>"Plataforma":</strong> El sitio web www.verificarlo.com y
            todas sus funcionalidades.
          </li>
          <li>
            <strong>"Reporte":</strong> Documento que contiene los resultados
            de la inspección vehicular.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Objeto del Contrato</h2>
        <p>
          VerifiCARLO ofrece servicios profesionales de inspección técnica para
          vehículos usados, con el fin de proporcionar al Cliente información
          sobre el estado general del vehículo antes de su adquisición.
        </p>

        <h3>3.1. Alcance del Servicio</h3>
        <p>
          Ofrecemos tres planes de inspección, cada uno con diferentes niveles
          de cobertura:
        </p>
        <ul>
          <li>
            <strong>Plan Básica:</strong> Inspección visual general, revisión
            de documentos, prueba de motor en ralentí.
          </li>
          <li>
            <strong>Plan Intermedia:</strong> Incluye lo del Plan Básica más
            revisión de sistema eléctrico, frenos, suspensión y prueba de
            manejo.
          </li>
          <li>
            <strong>Plan Completa (Premium):</strong> Incluye lo del Plan
            Intermedia más escaneo de computadora (OBD), revisión de carrocería
            con medidor de pintura, y análisis detallado de fluidos.
          </li>
        </ul>

        <h3>3.2. Limitaciones del Servicio</h3>
        <p>
          El Cliente reconoce expresamente que el servicio de inspección de
          VerifiCARLO:
        </p>
        <ul>
          <li>
            <strong>NO es una certificación oficial</strong> ni reemplaza la
            Revisión Técnica Vehicular obligatoria.
          </li>
          <li>
            <strong>NO garantiza la ausencia total de fallas</strong>,
            especialmente aquellas que no son detectables mediante inspección
            visual o pruebas no invasivas.
          </li>
          <li>
            <strong>NO incluye desarme de piezas</strong> del motor o de otras
            partes del vehículo.
          </li>
          <li>
            Se basa en el estado del vehículo <strong>al momento de la
            inspección</strong>, y no garantiza el comportamiento futuro.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Proceso de Reserva y Contratación</h2>

        <h3>4.1. Reserva Online</h3>
        <p>
          La contratación del servicio se realiza a través de nuestra
          plataforma web mediante un proceso de 4 pasos:
        </p>
        <ol>
          <li>Selección del plan de inspección deseado</li>
          <li>Ingreso de datos del vehículo y ubicación</li>
          <li>Selección de fecha, hora y datos de contacto</li>
          <li>Pago del adelanto de S/ 50 soles</li>
        </ol>

        <h3>4.2. Confirmación</h3>
        <p>
          La reserva se considera confirmada una vez que VerifiCARLO reciba y
          valide el pago del adelanto. El Cliente recibirá un correo
          electrónico de confirmación con los detalles de la cita.
        </p>

        <h3>4.3. Derecho de Aceptación</h3>
        <p>
          VerifiCARLO se reserva el derecho de rechazar o cancelar cualquier
          reserva en los siguientes casos:
        </p>
        <ul>
          <li>Información falsa o incompleta proporcionada por el Cliente</li>
          <li>
            Vehículo ubicado fuera del área de cobertura (Lima Metropolitana)
          </li>
          <li>
            Condiciones inseguras para realizar la inspección (ej. vehículo
            inoperativo, lugar peligroso)
          </li>
        </ul>
        <p>
          En estos casos, se procederá al reembolso total del adelanto pagado.
        </p>
      </section>

      <section>
        <h2>5. Precio y Forma de Pago</h2>

        <h3>5.1. Estructura de Precios</h3>
        <ul>
          <li>
            <strong>Adelanto:</strong> S/ 50 soles al momento de la reserva
            (requerido para confirmar la cita).
          </li>
          <li>
            <strong>Saldo restante:</strong> Se paga al inspector el día de la
            inspección, antes del inicio del servicio.
          </li>
          <li>
            Los precios totales varían según el plan seleccionado y se
            encuentran publicados en nuestra página web.
          </li>
        </ul>

        <h3>5.2. Medios de Pago Aceptados</h3>
        <p>Para el adelanto de S/ 50:</p>
        <ul>
          <li>Tarjeta de crédito o débito (vía Culqi)</li>
          <li>Transferencia bancaria (BCP - Soles)</li>
          <li>Yape o Plin (mediante código QR)</li>
          <li>Coordinación vía WhatsApp con un asesor</li>
        </ul>
        <p>Para el saldo restante:</p>
        <ul>
          <li>Efectivo al inspector</li>
          <li>Yape o Plin al inspector</li>
          <li>
            Pago online previo (con las mismas opciones del adelanto, si se
            coordina anticipadamente)
          </li>
        </ul>

        <h3>5.3. Facturación</h3>
        <p>
          VerifiCARLO emite comprobantes de pago electrónicos (boletas o
          facturas) de acuerdo a la normativa SUNAT vigente. Los comprobantes
          se envían al correo electrónico registrado dentro de las 48 horas
          posteriores al pago total del servicio.
        </p>
      </section>

      <section>
        <h2>6. Política de Cancelación y Reagendamiento</h2>

        <h3>6.1. Cancelación por el Cliente</h3>
        <ul>
          <li>
            <strong>Con 48 horas o más de anticipación:</strong> Reembolso del
            100% del adelanto pagado.
          </li>
          <li>
            <strong>Entre 24 y 48 horas de anticipación:</strong> Reembolso del
            50% del adelanto.
          </li>
          <li>
            <strong>Con menos de 24 horas:</strong> No hay reembolso del
            adelanto.
          </li>
          <li>
            <strong>No presentarse (no-show):</strong> No hay reembolso del
            adelanto.
          </li>
        </ul>

        <h3>6.2. Reagendamiento</h3>
        <p>
          El Cliente puede reagendar su cita sin costo adicional si lo solicita
          con al menos 24 horas de anticipación. Reagendamientos con menos de
          24 horas están sujetos a disponibilidad y pueden tener un cargo
          adicional de S/ 20.
        </p>

        <h3>6.3. Cancelación por VerifiCARLO</h3>
        <p>
          En casos de fuerza mayor (clima extremo, emergencia del inspector,
          etc.), VerifiCARLO puede cancelar o reprogramar la cita, ofreciendo
          al Cliente:
        </p>
        <ul>
          <li>Reagendamiento sin costo adicional, o</li>
          <li>Reembolso del 100% del adelanto</li>
        </ul>
      </section>

      <section>
        <h2>7. Ejecución del Servicio</h2>

        <h3>7.1. Lugar de Inspección</h3>
        <p>
          La inspección se realiza en el domicilio o ubicación indicada por el
          Cliente dentro de Lima Metropolitana, siempre que cumpla con las
          siguientes condiciones:
        </p>
        <ul>
          <li>Espacio adecuado para realizar la inspección con seguridad</li>
          <li>Buena iluminación (inspecciones diurnas)</li>
          <li>Acceso vehicular para llegar al lugar</li>
          <li>Zona segura para el inspector</li>
        </ul>

        <h3>7.2. Duración</h3>
        <p>
          La duración aproximada de la inspección es de 60 a 120 minutos,
          dependiendo del plan contratado y del estado del vehículo.
        </p>

        <h3>7.3. Documentos Requeridos</h3>
        <p>
          El Cliente debe presentar al inspector los siguientes documentos del
          vehículo:
        </p>
        <ul>
          <li>Tarjeta de propiedad vehicular vigente</li>
          <li>SOAT vigente</li>
          <li>Revisión técnica (si el vehículo lo requiere por antigüedad)</li>
        </ul>

        <h3>7.4. Condiciones del Vehículo</h3>
        <p>El vehículo debe estar:</p>
        <ul>
          <li>Limpio (al menos externamente e interiormente)</li>
          <li>Con combustible suficiente para la prueba de manejo</li>
          <li>Operativo (motor encendiendo)</li>
          <li>Con las llaves disponibles</li>
        </ul>

        <h3>7.5. Entrega del Reporte</h3>
        <p>
          El reporte de inspección se entrega al Cliente vía correo electrónico
          dentro de las <strong>24-48 horas hábiles</strong> posteriores a la
          inspección. El reporte incluye:
        </p>
        <ul>
          <li>Información del vehículo</li>
          <li>Resultados de la inspección por categorías</li>
          <li>Fotografías del vehículo y de las partes inspeccionadas</li>
          <li>Veredicto final (Recomendado, Con Observaciones, No Recomendado)</li>
          <li>
            Estimado de costos de reparación (cuando aplique, Plan Completa)
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Responsabilidades del Cliente</h2>
        <p>El Cliente se compromete a:</p>
        <ul>
          <li>
            Proporcionar información veraz y completa sobre el vehículo y su
            ubicación
          </li>
          <li>Asegurar que el vehículo esté disponible en la fecha y hora acordadas</li>
          <li>Permitir al inspector acceso completo al vehículo</li>
          <li>
            Estar presente durante la inspección o designar a un representante
            autorizado
          </li>
          <li>
            No interferir con el trabajo del inspector ni presionarlo para
            alterar los resultados
          </li>
          <li>
            Pagar el saldo restante antes del inicio de la inspección
          </li>
        </ul>
      </section>

      <section>
        <h2>9. Limitaciones de Responsabilidad</h2>

        <h3>9.1. Alcance de la Responsabilidad</h3>
        <p>
          El Cliente reconoce y acepta expresamente que VerifiCARLO:
        </p>
        <ul>
          <li>
            Presta un servicio de <strong>inspección informativa</strong>, no
            una garantía sobre el estado del vehículo.
          </li>
          <li>
            No se hace responsable por fallas ocultas, desgastes progresivos o
            problemas que se manifiesten después de la inspección.
          </li>
          <li>
            No garantiza que el vehículo inspeccionado sea adecuado para los
            fines específicos del Cliente.
          </li>
          <li>
            La responsabilidad de VerifiCARLO se limita exclusivamente al costo
            del servicio contratado.
          </li>
        </ul>

        <h3>9.2. Decisión de Compra</h3>
        <p>
          La decisión final de comprar o no el vehículo es exclusiva del
          Cliente. VerifiCARLO proporciona información técnica como
          herramienta de apoyo, pero no asume responsabilidad por la decisión
          de compra ni por problemas posteriores que puedan surgir con el
          vehículo.
        </p>

        <h3>9.3. Exclusión de Responsabilidad</h3>
        <p>VerifiCARLO no será responsable por:</p>
        <ul>
          <li>
            Daños al vehículo causados por condiciones pre-existentes no
            detectadas
          </li>
          <li>
            Pérdidas económicas derivadas de la compra del vehículo
          </li>
          <li>
            Información errónea proporcionada por el vendedor del vehículo
          </li>
          <li>
            Problemas legales relacionados con la propiedad o historial del
            vehículo
          </li>
        </ul>
      </section>

      <section>
        <h2>10. Propiedad Intelectual</h2>
        <p>
          Todos los reportes, fotografías, videos y demás contenido generado
          durante la inspección son propiedad intelectual de VerifiCARLO. El
          Cliente tiene derecho a:
        </p>
        <ul>
          <li>Usar el reporte para su información personal</li>
          <li>
            Compartir el reporte con terceros relacionados con la transacción
            del vehículo (ej. vendedor, banco, aseguradora)
          </li>
        </ul>
        <p>El Cliente NO tiene derecho a:</p>
        <ul>
          <li>
            Reproducir, publicar o distribuir el reporte con fines comerciales
          </li>
          <li>
            Modificar, alterar o editar el contenido del reporte
          </li>
          <li>
            Eliminar marcas de agua, logos o referencias a VerifiCARLO
          </li>
        </ul>
      </section>

      <section>
        <h2>11. Protección de Datos Personales</h2>
        <p>
          VerifiCARLO se compromete a proteger la privacidad y los datos
          personales de sus Clientes en cumplimiento con la{" "}
          <strong>Ley N° 29733 - Ley de Protección de Datos Personales</strong>{" "}
          de Perú y su reglamento.
        </p>
        <p>
          Para conocer cómo recopilamos, usamos y protegemos su información
          personal, así como sus derechos ARCO (Acceso, Rectificación,
          Cancelación y Oposición), consulte nuestra{" "}
          <a href="/politica-de-privacidad">Política de Privacidad</a>.
        </p>
      </section>

      <section>
        <h2>12. Libro de Reclamaciones</h2>
        <p>
          En cumplimiento con la{" "}
          <strong>
            Ley N° 29571 - Código de Protección y Defensa del Consumidor
          </strong>
          , VerifiCARLO pone a disposición de sus clientes un Libro de
          Reclamaciones Digital.
        </p>
        <p>
          Puede presentar su reclamo o queja accediendo al botón "Libro de
          Reclamaciones" disponible en nuestro sitio web. Su reclamo será
          atendido en un plazo máximo de 30 días calendario.
        </p>
        <p>
          También puede presentar su reclamo directamente ante INDECOPI a
          través de la plataforma SICLA (
          <a
            href="https://enlinea.indecopi.gob.pe/reclamavirtual/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://enlinea.indecopi.gob.pe/reclamavirtual/
          </a>
          ).
        </p>
      </section>

      <section>
        <h2>13. Resolución de Conflictos</h2>

        <h3>13.1. Solución Amistosa</h3>
        <p>
          Antes de iniciar cualquier acción legal, las partes se comprometen a
          intentar resolver cualquier controversia mediante negociación directa
          y de buena fe.
        </p>

        <h3>13.2. Jurisdicción y Ley Aplicable</h3>
        <p>
          Estos Términos y Condiciones se rigen por las leyes de la República
          del Perú. Cualquier disputa que no pueda resolverse amistosamente
          será sometida a los tribunales competentes de Lima, Perú, o ante
          INDECOPI según corresponda.
        </p>
      </section>

      <section>
        <h2>14. Modificaciones a los Términos</h2>
        <p>
          VerifiCARLO se reserva el derecho de modificar estos Términos y
          Condiciones en cualquier momento. Los cambios entrarán en vigor
          inmediatamente después de su publicación en el sitio web.
        </p>
        <p>
          En caso de modificaciones sustanciales, notificaremos a los Clientes
          registrados a través de correo electrónico con al menos 7 días de
          anticipación.
        </p>
        <p>
          El uso continuado de nuestros servicios después de la publicación de
          modificaciones constituye la aceptación de los nuevos términos.
        </p>
      </section>

      <section>
        <h2>15. Disposiciones Finales</h2>

        <h3>15.1. Separabilidad</h3>
        <p>
          Si alguna disposición de estos Términos y Condiciones es declarada
          inválida o inaplicable, las demás disposiciones seguirán en pleno
          vigor y efecto.
        </p>

        <h3>15.2. Renuncia</h3>
        <p>
          La no exigencia por parte de VerifiCARLO del cumplimiento estricto de
          cualquiera de estas condiciones no constituirá una renuncia a
          exigirlas en el futuro.
        </p>

        <h3>15.3. Acuerdo Completo</h3>
        <p>
          Estos Términos y Condiciones, junto con la Política de Privacidad y
          la Política de Cambios y Devoluciones, constituyen el acuerdo
          completo entre VerifiCARLO y el Cliente.
        </p>
      </section>

      <section>
        <h2>16. Contacto</h2>
        <p>
          Para cualquier consulta, aclaración o solicitud relacionada con estos
          Términos y Condiciones, puede contactarnos a través de:
        </p>
        <ul>
          <li>
            <strong>Email:</strong> verificarlo@carlo.pe
          </li>
          <li>
            <strong>Teléfono/WhatsApp:</strong> +51 934 140 010
          </li>
          <li>
            <strong>Dirección:</strong> Cerro Azul 421, Santiago de Surco,
            Lima, Perú
          </li>
        </ul>
      </section>

    </LegalPageLayout>
  );
}

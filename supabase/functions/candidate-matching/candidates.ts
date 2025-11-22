// Chilean presidential candidates data
import { Candidate, TOPICS } from "./types.ts";

export const MOCK_CANDIDATES: Candidate[] = [
  {
    name: "Jeannette Jara",
    party: "Partido Comunista",
    opinions: {
      economia:
        "Apoya la tributación progresiva con mayores impuestos para los más ricos. Defiende el aumento del gasto público en infraestructura, proyectos de energía verde y programas sociales. Cree en el aumento del salario mínimo a un salario digno y en fortalecer los derechos de los trabajadores a través del apoyo sindical.",
      educacion:
        "Aboga por la educación pública gratuita desde preescolar hasta la universidad, incluyendo programas de alivio de la deuda estudiantil. Apoya el aumento de financiamiento para las escuelas públicas, aumentos salariales para profesores y reducción del tamaño de las clases. Cree que la educación es un derecho fundamental, no un privilegio.",
      seguridad_social:
        "Cree en expandir los beneficios de seguridad social y asegurar que el programa permanezca solvente. Apoya el aumento de beneficios para adultos mayores de bajos ingresos e indexar beneficios a la inflación. Se opone a la privatización de la seguridad social.",
      salud:
        "Apoya fuertemente la salud universal a través de un sistema de pagador único. Cree que la salud es un derecho humano y no debe estar vinculada al empleo. Aboga por menores costos de medicamentos recetados y servicios expandidos de salud mental.",
      medio_ambiente:
        "Prioriza acciones climáticas agresivas incluyendo la transición a 100% energía renovable para 2035. Apoya impuestos al carbono, inversiones en infraestructura verde e iniciativas de justicia ambiental. Cree en hacer responsables a las corporaciones por la contaminación.",
      seguridad:
        "Apoya políticas de seguridad ciudadana con enfoque en prevención social. Cree en fortalecer la policía pero también en abordar las causas raíz de la delincuencia a través de programas sociales. Se opone a medidas represivas excesivas.",
      migracion:
        "Apoya políticas migratorias humanitarias con procesos de regularización. Cree en proteger los derechos de los migrantes y en la integración social. Aboga por vías legales para la migración y contra la criminalización de migrantes.",
    },
  },
  {
    name: "Evelyn Matthei",
    party: "Chile Vamos",
    opinions: {
      economia:
        "Apoya presupuestos equilibrados con aumentos moderados de impuestos a los altos ingresos. Cree en inversiones dirigidas en infraestructura y asociaciones público-privadas. Aboga por incentivos fiscales para pequeñas empresas y aumentos graduales del salario mínimo vinculados a la inflación.",
      educacion:
        "Apoya el aumento de financiamiento para escuelas públicas y expandir el acceso a la formación vocacional. Cree en el alivio dirigido de préstamos estudiantiles para graduados de bajos ingresos en lugar del perdón universal. Apoya las escuelas charter como opción junto a las escuelas públicas.",
      seguridad_social:
        "Apoya mantener los beneficios actuales de seguridad social mientras explora reformas moderadas para asegurar la solvencia a largo plazo. Cree en la prueba de medios para beneficiarios de altos ingresos. Se opone a recortes mayores o privatización.",
      salud:
        "Apoya expandir el acceso a la salud a través de una opción pública y fortalecer la Ley de Acceso Universal. Cree en la competencia entre seguros públicos y privados. Apoya las negociaciones de precios de medicamentos recetados.",
      medio_ambiente:
        "Apoya la transición gradual a energía renovable con un objetivo del 50% para 2050. Cree en soluciones basadas en el mercado como el comercio de emisiones. Apoya inversiones en tecnología de energía limpia e infraestructura.",
      seguridad:
        "Apoya políticas de seguridad más estrictas con mayor presencia policial. Cree en fortalecer las leyes penales y aumentar las penas para delitos graves. Apoya la modernización de las fuerzas policiales.",
      migracion:
        "Apoya políticas migratorias más estrictas con controles fronterizos mejorados. Cree en procesos de inmigración ordenados y en hacer cumplir las leyes migratorias. Aboga por la integración pero con requisitos claros.",
    },
  },
  {
    name: "José Antonio Kast",
    party: "Partido Republicano",
    opinions: {
      economia:
        "Aboga por menores impuestos en general, especialmente para empresas y altos ingresos. Cree en reducir el gasto gubernamental y las regulaciones. Apoya soluciones de libre mercado y se opone a aumentos del salario mínimo, prefiriendo salarios determinados por el mercado.",
      educacion:
        "Apoya la elección de escuela incluyendo vouchers para escuelas privadas. Cree en reducir la participación federal en educación y devolver el control a estados y distritos locales. Se opone a la universidad gratuita, creyendo que los estudiantes deben pagar por la educación superior.",
      seguridad_social:
        "Apoya la privatización gradual de la seguridad social a través de cuentas de retiro individuales. Cree en aumentar la edad de retiro y hacer pruebas de medios para beneficios. Se opone a expandir el programa.",
      salud:
        "Se opone a la salud universal y sistemas de pagador único. Cree en soluciones de salud de libre mercado, reduciendo regulaciones y aumentando la competencia. Apoya cuentas de ahorro para salud y se opone a controles de precios gubernamentales en medicamentos.",
      medio_ambiente:
        "Apoya la independencia energética a través de la producción nacional de petróleo y gas. Cree que el cambio climático debe abordarse a través de la innovación en lugar de la regulación. Se opone a impuestos al carbono y apoya la energía nuclear como alternativa limpia.",
      seguridad:
        "Apoya políticas de seguridad muy estrictas con tolerancia cero para la delincuencia. Cree en aumentar significativamente el presupuesto policial y las penas. Aboga por medidas de seguridad más duras y mayor presencia policial.",
      migracion:
        "Apoya políticas migratorias muy restrictivas con controles fronterizos estrictos. Cree en limitar fuertemente la inmigración y hacer cumplir estrictamente las leyes migratorias. Se opone a la regularización de migrantes indocumentados.",
    },
  },
  {
    name: "Johannes Kaiser",
    party: "Partido Nacional Libertario",
    opinions: {
      economia:
        "Aboga por la intervención mínima del gobierno en la economía. Apoya impuesto plano o impuesto al consumo en lugar de tributación progresiva. Cree en eliminar la mayoría de las regulaciones y dejar que los mercados libres determinen los resultados. Se opone a las leyes de salario mínimo.",
      educacion:
        "Cree que la educación debe ser completamente privatizada sin participación gubernamental. Apoya vouchers escolares y educación en casa. Se opone a todo el financiamiento federal de educación y programas de préstamos estudiantiles.",
      seguridad_social:
        "Apoya la privatización completa de la seguridad social y eliminar gradualmente el programa. Cree que los individuos deben ser responsables de sus propios ahorros para el retiro. Se opone a cualquier programa gubernamental de retiro.",
      salud:
        "Cree que la salud debe ser completamente basada en el mercado sin participación gubernamental. Se opone a todas las formas de salud universal, opciones públicas y la mayoría de las regulaciones. Apoya cuentas de ahorro para salud y solo seguro catastrófico.",
      medio_ambiente:
        "Cree que la protección ambiental debe manejarse a través de derechos de propiedad y acción privada en lugar de regulación gubernamental. Se opone a impuestos al carbono, regulaciones de emisiones y la mayoría de las leyes ambientales. Apoya esfuerzos de conservación privados.",
      seguridad:
        "Cree en un gobierno mínimo con seguridad proporcionada principalmente por el sector privado. Apoya la reducción del tamaño de las fuerzas policiales gubernamentales. Aboga por la autodefensa y seguridad privada.",
      migracion:
        "Apoya la inmigración completamente abierta sin restricciones gubernamentales. Cree en la libertad de movimiento como principio libertario. Se opone a controles fronterizos y leyes de inmigración restrictivas.",
    },
  },
  {
    name: "Franco Parisi",
    party: "Partido de la Gente",
    opinions: {
      economia:
        "Se opone al establishment político y económico. Aboga por políticas económicas populistas que beneficien a la clase media. Cree en reducir la corrupción y la influencia de las élites. Apoya medidas que reduzcan la desigualdad económica.",
      educacion:
        "Apoya mejoras en la educación pública pero se opone a sistemas completamente gratuitos. Cree en reformas educativas que mejoren la calidad sin aumentar significativamente los costos. Aboga por mayor transparencia en el gasto educativo.",
      seguridad_social:
        "Apoya mantener el sistema de seguridad social pero con reformas para hacerlo más eficiente. Cree en combatir el fraude y mejorar la administración. Se opone tanto a la privatización completa como a la expansión significativa.",
      salud:
        "Aboga por mejoras en el sistema de salud público sin cambiar completamente a un sistema de pagador único. Cree en reducir los costos a través de mayor competencia y eficiencia. Apoya medidas para reducir los precios de medicamentos.",
      medio_ambiente:
        "Apoya medidas ambientales moderadas que no dañen la economía. Cree en un equilibrio entre protección ambiental y crecimiento económico. Se opone a medidas extremas que puedan afectar empleos.",
      seguridad:
        "Apoya políticas de seguridad que protejan a los ciudadanos comunes. Cree en fortalecer la seguridad ciudadana sin medidas excesivamente represivas. Aboga por abordar tanto la delincuencia como sus causas sociales.",
      migracion:
        "Apoya políticas migratorias que protejan los intereses de los chilenos. Cree en controles migratorios ordenados pero humanitarios. Se opone tanto a la inmigración completamente abierta como a políticas excesivamente restrictivas.",
    },
  },
  {
    name: "Marco Enríquez-Ominami",
    party: "Independiente",
    opinions: {
      economia:
        "Apoya políticas económicas progresistas con enfoque en justicia social. Cree en aumentar los impuestos a los más ricos y expandir programas sociales. Aboga por inversiones en infraestructura y creación de empleo. Apoya aumentos del salario mínimo.",
      educacion:
        "Apoya la educación pública gratuita y mejoras significativas en el sistema educativo. Cree en el acceso universal a la educación superior. Aboga por el alivio de la deuda estudiantil y mayor financiamiento para escuelas públicas.",
      seguridad_social:
        "Apoya expandir los beneficios de seguridad social y asegurar la solvencia del programa. Cree en proteger los beneficios para todos los chilenos. Se opone a la privatización y recortes de beneficios.",
      salud:
        "Apoya un sistema de salud más universal y accesible. Cree en expandir la cobertura de salud pública. Aboga por reducir los costos de atención médica y medicamentos. Apoya mejoras en la salud mental.",
      medio_ambiente:
        "Apoya acciones climáticas significativas y transición a energías renovables. Cree en inversiones en tecnología verde. Aboga por políticas ambientales que protejan el futuro. Apoya medidas de justicia ambiental.",
      seguridad:
        "Apoya políticas de seguridad equilibradas que aborden tanto la delincuencia como sus causas. Cree en fortalecer la policía pero también en programas de prevención social. Se opone a medidas puramente represivas.",
      migracion:
        "Apoya políticas migratorias humanitarias con procesos de regularización. Cree en proteger los derechos de los migrantes. Aboga por la integración social y vías legales para la migración.",
    },
  },
  {
    name: "Harold Mayne-Nicholls",
    party: "Independiente",
    opinions: {
      economia:
        "Apoya políticas económicas centristas con enfoque en estabilidad y crecimiento. Cree en presupuestos equilibrados y reformas moderadas. Aboga por inversiones estratégicas en infraestructura. Apoya políticas que fomenten el emprendimiento.",
      educacion:
        "Apoya mejoras en la educación pública con enfoque en calidad y resultados. Cree en expandir opciones educativas y formación vocacional. Aboga por mayor transparencia y rendición de cuentas en educación.",
      seguridad_social:
        "Apoya mantener y mejorar el sistema de seguridad social existente. Cree en reformas moderadas para asegurar la sostenibilidad. Aboga por proteger los beneficios actuales mientras se asegura la solvencia futura.",
      salud:
        "Apoya mejoras en el sistema de salud público con mayor eficiencia. Cree en expandir el acceso sin cambiar completamente el sistema. Aboga por reducir costos y mejorar la calidad de la atención.",
      medio_ambiente:
        "Apoya políticas ambientales moderadas con enfoque en sostenibilidad. Cree en transición gradual a energías más limpias. Aboga por equilibrio entre protección ambiental y desarrollo económico.",
      seguridad:
        "Apoya políticas de seguridad que protejan a los ciudadanos de manera efectiva. Cree en fortalecer las fuerzas policiales y mejorar la coordinación. Aboga por enfoques equilibrados que combinen prevención y aplicación de la ley.",
      migracion:
        "Apoya políticas migratorias ordenadas y reguladas. Cree en procesos de inmigración claros y justos. Aboga por la integración de migrantes legales y controles fronterizos apropiados.",
    },
  },
  {
    name: "Eduardo Artés",
    party: "Izquierda Radical",
    opinions: {
      economia:
        "Apoya políticas económicas radicales de izquierda con nacionalización de industrias clave. Cree en la redistribución radical de la riqueza. Aboga por el control estatal de los recursos estratégicos. Se opone completamente al modelo neoliberal.",
      educacion:
        "Apoya la educación completamente pública y gratuita en todos los niveles. Cree en la educación como herramienta de transformación social. Aboga por la eliminación completa de la educación privada con fines de lucro.",
      seguridad_social:
        "Apoya la expansión radical de la seguridad social con beneficios universales generosos. Cree en la seguridad social como derecho fundamental. Aboga por financiamiento completo del estado sin privatización.",
      salud:
        "Apoya un sistema de salud completamente público y gratuito. Cree en la nacionalización de los servicios de salud. Aboga por la eliminación de la salud privada con fines de lucro.",
      medio_ambiente:
        "Apoya acciones climáticas radicales con transición inmediata a energías renovables. Cree en la nacionalización de recursos energéticos. Aboga por políticas ambientales estrictas y justicia climática.",
      seguridad:
        "Apoya reformas radicales del sistema de seguridad con enfoque en causas sociales de la delincuencia. Cree en desmilitarizar la policía. Aboga por enfoques comunitarios de seguridad.",
      migracion:
        "Apoya políticas migratorias completamente abiertas y humanitarias. Cree en la eliminación de controles fronterizos restrictivos. Aboga por la regularización completa de todos los migrantes.",
    },
  },
];

// Helper function to get full profile text
export function getCandidateProfile(candidate: Candidate): string {
  const profileParts = Object.entries(candidate.opinions).map(
    ([topic, opinion]) => `${topic}: ${opinion}`
  );
  return profileParts.join(" | ");
}

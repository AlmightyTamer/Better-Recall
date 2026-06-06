const base = import.meta.env.BASE_URL;

function flower(file: string): string {
  return `${base}flowers/${file}`;
}

export const FLOWERS = {
  splash: flower('flower-01-splash.webp'),
  landing: flower('flower-02-landing.webp'),
  patient: flower('flower-03-patient.webp'),
  supervisor: flower('flower-04-supervisor.webp'),
  patientEnter: flower('flower-05-patient-enter.webp'),
  supervisorEnter: flower('flower-06-supervisor-enter.webp'),
  patientApp: flower('flower-07-patient-app.webp'),
  supervisorApp: flower('flower-08-supervisor-app.webp'),
  home: flower('flower-09-home.webp'),
  comfort: flower('flower-10-comfort.webp'),
} as const;

export type FlowerKey = keyof typeof FLOWERS;

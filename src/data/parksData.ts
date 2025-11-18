import parksDataJson from './parksData.json';

export interface SerialData {
  serialNumber: string;
  parkName: string;
  functionalLocation: string;
}

export interface HolidayData {
  [parkName: string]: string[];
}

export const PARK_NAMES = [
  "Alegria",
  "Alto Sertão III",
  "Amontada",
  "Angicos",
  "Aroeira",
  "Assuruá",
  "Aventura",
  "Babilônia Centro",
  "Babilônia Sul CDV",
  "Cabeço Preto",
  "Caldeirão",
  "Campo Largo",
  "Catanduba",
  "CGN",
  "Copel",
  "Cristalândia",
  "Cumaru",
  "Delfina",
  "Elera",
  "Folha Larga CDV",
  "Folha Larga Norte",
  "Gargaú",
  "Gravatá",
  "Honda",
  "Icaraí",
  "Jerusalém",
  "Kairós",
  "Macambira",
  "Monte Verde",
  "Morro do Chapeu I",
  "Morro do Chapeu II",
  "Mundo Novo",
  "Novo Horizonte",
  "Ouro Branco",
  "Pedra do Reino",
  "Pedra Pintada",
  "Pedra Rajada",
  "Riachão",
  "Rio do Vento Expansão",
  "Rio do Vento II",
  "Santa Rosa Mundo Novo",
  "Sento Sé",
  "Seridó",
  "Serra das almas",
  "Serra das vacas",
  "Serra do Assuruá",
  "Serra do Tigre",
  "Serrote e Serra do Mato",
  "Taiba",
  "UMARI",
  "Ventos da Bahia",
  "Ventos do Piauí",
  "Vilas",
  "Vilas IV"
];

// Load holidays from JSON
export const HOLIDAYS: HolidayData = parksDataJson.holidays;

// Load serials from JSON and transform to array format
const serialsFromJson = parksDataJson.serials as Record<string, Array<{serialNumber: string, functionalLocation: string}>>;

export const SERIALS_DATA: SerialData[] = Object.entries(serialsFromJson).flatMap(([parkName, serials]) =>
  serials.map(s => ({
    serialNumber: s.serialNumber,
    parkName,
    functionalLocation: s.functionalLocation
  }))
);

export const getSerialsByPark = (parkName: string): SerialData[] => {
  return SERIALS_DATA
    .filter(s => s.parkName.toLowerCase() === parkName.toLowerCase())
    .sort((a, b) => a.serialNumber.localeCompare(b.serialNumber));
};

export const getHolidaysByPark = (parkName: string): Date[] => {
  const holidays = HOLIDAYS[parkName] || [];
  return holidays.map(h => {
    const [day, month, year] = h.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  });
};

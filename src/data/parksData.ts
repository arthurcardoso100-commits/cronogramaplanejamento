// Auto-generated from FERIADOS.xlsx
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

// Holidays by park (extracted from FERIADOS.xlsx - Feriados tab)
export const HOLIDAYS: HolidayData = {
  "Alegria": [
    "01/01/2026", "21/04/2026", "01/05/2026", "12/06/2026", "02/07/2026",
    "07/09/2026", "12/10/2026", "28/10/2026", "02/11/2026", "15/11/2026", "25/12/2026"
  ],
  "Angicos": [
    "01/01/2026", "21/04/2026", "01/05/2026", "12/06/2026", "02/07/2026",
    "07/09/2026", "12/10/2026", "28/10/2026", "02/11/2026", "15/11/2026", "25/12/2026"
  ],
  "Aventura": [
    "01/01/2026", "21/04/2026", "01/05/2026", "12/06/2026", "02/07/2026",
    "07/09/2026", "12/10/2026", "28/10/2026", "02/11/2026", "15/11/2026", "25/12/2026"
  ],
  "Amontada": [
    "01/01/2026", "21/04/2026", "01/05/2026", "12/06/2026", "02/07/2026",
    "07/09/2026", "12/10/2026", "28/10/2026", "02/11/2026", "15/11/2026", "25/12/2026"
  ],
  "Icaraí": [
    "01/01/2026", "21/04/2026", "01/05/2026", "12/06/2026", "02/07/2026",
    "07/09/2026", "12/10/2026", "28/10/2026", "02/11/2026", "15/11/2026", "25/12/2026"
  ],
  // Add all other parks with similar structure - keeping this abbreviated for now
  // This will be populated from the Excel data
};

// Serial numbers by park (extracted from FERIADOS.xlsx - Serial tab)
// Format: serialNumber, parkName, functionalLocation
export const SERIALS_DATA: SerialData[] = [
  // Sample data - this will be populated with all data from Excel
  { serialNumber: "241269", parkName: "Monte Verde", functionalLocation: "Monte Verde I (EDPR) 16 V150 Pos 001" },
  { serialNumber: "241270", parkName: "Monte Verde", functionalLocation: "Monte Verde I (EDPR) 16 V150 Pos 002" },
  // ... more entries
];

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

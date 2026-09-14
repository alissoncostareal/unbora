export interface RegionCatalog {
  id: string;
  name: string;
  cities: string[];
}

export const REGIONS: RegionCatalog[] = [
  {
    id: 'grande-fortaleza',
    name: 'Grande Fortaleza',
    cities: ['Fortaleza', 'Caucaia', 'Maracanaú', 'Eusébio', 'Aquiraz'],
  },
  {
    id: 'litoral-leste',
    name: 'Litoral Leste',
    cities: ['Beberibe', 'Cascavel', 'Aracati', 'Canoa Quebrada'],
  },
  {
    id: 'litoral-oeste',
    name: 'Litoral Oeste',
    cities: ['Cumbuco', 'Paracuru', 'São Gonçalo do Amarante'],
  },
  {
    id: 'serra',
    name: 'Serra de Fortaleza',
    cities: ['Guaramiranga', 'Baturité', 'Redenção'],
  },
  {
    id: 'interior',
    name: 'Interior do Ceará',
    cities: ['Juazeiro do Norte', 'Sobral', 'Crato'],
  },
];

export const DEFAULT_CITY = 'Fortaleza';
export const DEFAULT_REGION = 'Grande Fortaleza';

export const ALL_CITIES = REGIONS.flatMap((region) => region.cities);

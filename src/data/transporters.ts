export type Transporter = {
  id: string;
  name: string;
  initials: string;
  rating: string;
  reviews: string;
  gst: string;
  services: string[];
  from: string;
  state: string;
  serviceCities: string[];
  serviceStates: string[];
  destinations: string;
  since: string;
  trucks: string;
  capacity: string;
  availability: string;
  about: string;
};

export const transporters: Transporter[] = [
  {
    id: 'sharma-transport',
    name: 'Sharma Transport Co.',
    initials: 'ST',
    rating: '4.8',
    reviews: '320 reviews',
    gst: '24AABCS1234F1Z5',
    services: ['FTL', 'PTL', 'Container', 'Refrigerated'],
    from: 'Ahmedabad',
    state: 'Gujarat',
    serviceCities: ['Ahmedabad', 'Mumbai', 'Delhi', 'Pune'],
    serviceStates: ['Gujarat', 'Maharashtra', 'Delhi'],
    destinations: 'Mumbai, Delhi, Pune +12',
    since: '2018',
    trucks: '25',
    capacity: '45 MT',
    availability: 'Open',
    about:
      'Sharma Transport Co. is a trusted name in Indian logistics, offering safe, on-time and cost-effective transportation services across 250+ cities.',
  },
  {
    id: 'jai-maa-logistics',
    name: 'Jai Maa Logistics',
    initials: 'JM',
    rating: '4.6',
    reviews: '210 reviews',
    gst: '27AABCU5678H1Z8',
    services: ['FTL', 'PTL', 'Open Truck'],
    from: 'Surat',
    state: 'Gujarat',
    serviceCities: ['Surat', 'Mumbai', 'Bengaluru', 'Kolkata'],
    serviceStates: ['Gujarat', 'Maharashtra', 'Karnataka', 'West Bengal'],
    destinations: 'Mumbai, Bangalore +8',
    since: '2020',
    trucks: '18',
    capacity: '32 MT',
    availability: 'Open',
    about:
      'Jai Maa Logistics provides dependable full and part-load transportation with a strong network across western and southern India.',
  },
  {
    id: 'royal-cargo-movers',
    name: 'Royal Cargo Movers',
    initials: 'RC',
    rating: '4.7',
    reviews: '180 reviews',
    gst: '33AABCR9101K1Z9',
    services: ['Container', 'Refrigerated', 'ODC'],
    from: 'Vadodara',
    state: 'Gujarat',
    serviceCities: ['Vadodara', 'Mumbai', 'Delhi', 'Pune'],
    serviceStates: ['Gujarat', 'Maharashtra', 'Delhi'],
    destinations: 'Nhava Sheva, Delhi +10',
    since: '2019',
    trucks: '31',
    capacity: '60 MT',
    availability: 'Open',
    about:
      'Royal Cargo Movers specialises in container, refrigerated and over-dimensional cargo with experienced teams and nationwide coverage.',
  },
  {
    id: 'global-roadways',
    name: 'Global Roadways',
    initials: 'GR',
    rating: '4.7',
    reviews: '186 reviews',
    gst: '24AABCG4381P1Z2',
    services: ['FTL', 'Container', 'Express'],
    from: 'Rajkot',
    state: 'Gujarat',
    serviceCities: ['Rajkot', 'Pune', 'Jaipur', 'Delhi', 'Kolkata'],
    serviceStates: ['Gujarat', 'Maharashtra', 'Rajasthan', 'Delhi', 'West Bengal'],
    destinations: 'Pune, Jaipur, Delhi +6',
    since: '2017',
    trucks: '22',
    capacity: '40 MT',
    availability: 'Open',
    about:
      'Global Roadways offers fast and reliable freight movement for businesses with flexible vehicles and established interstate routes.',
  },
];

export function getTransporter(id: string) {
  return transporters.find((transporter) => transporter.id === id);
}

// Zambian locations — all 10 provinces and their districts / towns.
// Well-known towns carry accurate coordinates; the rest resolve to their
// province centre with a small deterministic offset (see townCoords) so map
// pins spread out sensibly. This is the source of truth for the location picker.

export const PROVINCES = [
  { name: 'Lusaka', lat: -15.4167, lng: 28.2833 },
  { name: 'Copperbelt', lat: -12.8, lng: 28.2 },
  { name: 'Central', lat: -14.45, lng: 28.45 },
  { name: 'Southern', lat: -16.8, lng: 26.98 },
  { name: 'Eastern', lat: -13.63, lng: 32.65 },
  { name: 'Northern', lat: -10.21, lng: 31.18 },
  { name: 'Muchinga', lat: -10.55, lng: 32.06 },
  { name: 'Luapula', lat: -11.2, lng: 28.89 },
  { name: 'North-Western', lat: -12.17, lng: 26.39 },
  { name: 'Western', lat: -15.25, lng: 23.13 },
];

export const PROVINCE_MAP = Object.fromEntries(PROVINCES.map((p) => [p.name, p]));

// name, province, [lat, lng?] — coordinates optional (derived if absent).
const T = (name, province, lat, lng) => ({ name, province, lat, lng });

export const TOWNS = [
  // ---------------- Lusaka ----------------
  T('Lusaka', 'Lusaka', -15.4167, 28.2833),
  T('Kafue', 'Lusaka', -15.7691, 28.1814),
  T('Chongwe', 'Lusaka', -15.3286, 28.6836),
  T('Chilanga', 'Lusaka', -15.5553, 28.2717),
  T('Luangwa', 'Lusaka', -15.6167, 30.4167),
  T('Rufunsa', 'Lusaka', -15.05, 29.65),
  T('Chirundu', 'Lusaka', -16.0453, 28.8508),

  // ---------------- Copperbelt ----------------
  T('Ndola', 'Copperbelt', -12.9587, 28.6366),
  T('Kitwe', 'Copperbelt', -12.8024, 28.2132),
  T('Chingola', 'Copperbelt', -12.5289, 27.8492),
  T('Mufulira', 'Copperbelt', -12.5497, 28.2408),
  T('Luanshya', 'Copperbelt', -13.1367, 28.4166),
  T('Kalulushi', 'Copperbelt', -12.8419, 28.0942),
  T('Chililabombwe', 'Copperbelt', -12.3664, 27.8286),
  T('Masaiti', 'Copperbelt'),
  T('Mpongwe', 'Copperbelt', -13.5106, 28.1547),
  T('Lufwanyama', 'Copperbelt'),

  // ---------------- Central ----------------
  T('Kabwe', 'Central', -14.4469, 28.4464),
  T('Kapiri Mposhi', 'Central', -13.9711, 28.6698),
  T('Mkushi', 'Central', -13.6206, 29.3897),
  T('Serenje', 'Central', -13.2333, 30.2333),
  T('Mumbwa', 'Central', -14.9847, 27.0619),
  T('Chibombo', 'Central', -14.6564, 28.0708),
  T('Chisamba', 'Central', -14.9833, 28.3667),
  T('Ngabwe', 'Central'),
  T('Luano', 'Central'),
  T('Itezhi-Tezhi', 'Central', -15.7333, 26.0333),
  T('Shibuyunji', 'Central'),

  // ---------------- Southern ----------------
  T('Livingstone', 'Southern', -17.8419, 25.8543),
  T('Choma', 'Southern', -16.8091, 26.9866),
  T('Mazabuka', 'Southern', -15.8567, 27.7597),
  T('Monze', 'Southern', -16.2833, 27.4833),
  T('Kalomo', 'Southern', -17.0333, 26.4833),
  T('Namwala', 'Southern', -15.7503, 26.4425),
  T('Siavonga', 'Southern', -16.5375, 28.7089),
  T('Sinazongwe', 'Southern', -17.2667, 27.4667),
  T('Gwembe', 'Southern', -16.4986, 27.6039),
  T('Kazungula', 'Southern', -17.7883, 25.2647),
  T('Zimba', 'Southern', -17.3167, 26.2167),
  T('Pemba', 'Southern', -16.5167, 27.3667),
  T('Chikankata', 'Southern'),

  // ---------------- Eastern ----------------
  T('Chipata', 'Eastern', -13.6333, 32.65),
  T('Petauke', 'Eastern', -14.2431, 31.32),
  T('Katete', 'Eastern', -14.0667, 32.05),
  T('Lundazi', 'Eastern', -12.2833, 33.1833),
  T('Nyimba', 'Eastern', -14.5567, 30.8214),
  T('Chadiza', 'Eastern', -14.0667, 32.4333),
  T('Mambwe', 'Eastern', -13.0833, 31.7833),
  T('Sinda', 'Eastern', -14.1333, 31.9),
  T('Vubwi', 'Eastern', -14.15, 32.65),
  T('Chasefu', 'Eastern'),
  T('Lumezi', 'Eastern'),
  T('Chipangali', 'Eastern'),
  T('Kasenengwa', 'Eastern'),

  // ---------------- Northern ----------------
  T('Kasama', 'Northern', -10.2126, 31.1808),
  T('Mbala', 'Northern', -8.8375, 31.3667),
  T('Mpulungu', 'Northern', -8.7625, 31.1136),
  T('Luwingu', 'Northern', -10.2597, 29.9),
  T('Mporokoso', 'Northern', -9.375, 30.125),
  T('Kaputa', 'Northern', -8.4697, 29.6608),
  T('Chilubi', 'Northern', -11.0833, 30.2),
  T('Mungwi', 'Northern', -10.1725, 31.3672),
  T('Nsama', 'Northern'),
  T('Lupososhi', 'Northern'),
  T('Lunte', 'Northern'),
  T('Senga Hill', 'Northern'),

  // ---------------- Muchinga ----------------
  T('Chinsali', 'Muchinga', -10.5497, 32.0653),
  T('Mpika', 'Muchinga', -11.8333, 31.45),
  T('Nakonde', 'Muchinga', -9.3417, 32.7492),
  T('Isoka', 'Muchinga', -10.1333, 32.6333),
  T('Mafinga', 'Muchinga', -10.1833, 33.35),
  T('Chama', 'Muchinga', -11.2, 33.15),
  T("Shiwang'andu", 'Muchinga'),
  T('Kanchibiya', 'Muchinga'),
  T('Lavushimanda', 'Muchinga'),

  // ---------------- Luapula ----------------
  T('Mansa', 'Luapula', -11.1996, 28.894),
  T('Kawambwa', 'Luapula', -9.7936, 29.0781),
  T('Nchelenge', 'Luapula', -9.3453, 28.7339),
  T('Mwense', 'Luapula', -10.3833, 28.6833),
  T('Samfya', 'Luapula', -11.3644, 29.5567),
  T('Chienge', 'Luapula', -8.65, 29.1667),
  T('Milenge', 'Luapula'),
  T('Mwansabombwe', 'Luapula'),
  T('Chembe', 'Luapula'),
  T('Lunga', 'Luapula'),
  T('Chipili', 'Luapula'),
  T('Chifunabuli', 'Luapula'),

  // ---------------- North-Western ----------------
  T('Solwezi', 'North-Western', -12.1688, 26.3894),
  T('Kasempa', 'North-Western', -13.4592, 25.8339),
  T('Mwinilunga', 'North-Western', -11.7369, 24.4297),
  T('Zambezi', 'North-Western', -13.5497, 23.1069),
  T('Kabompo', 'North-Western', -13.5953, 24.2003),
  T('Mufumbwe', 'North-Western', -13.6833, 24.8),
  T('Chavuma', 'North-Western', -13.085, 22.6833),
  T('Ikelenge', 'North-Western', -11.2333, 24.2667),
  T('Kalumbila', 'North-Western', -12.3, 25.3),
  T('Manyinga', 'North-Western'),
  T('Mushindamo', 'North-Western'),

  // ---------------- Western ----------------
  T('Mongu', 'Western', -15.2485, 23.1237),
  T('Senanga', 'Western', -16.1167, 23.2667),
  T('Kaoma', 'Western', -14.7833, 24.8),
  T('Kalabo', 'Western', -14.9994, 22.6797),
  T('Lukulu', 'Western', -14.3736, 23.2408),
  T('Sesheke', 'Western', -17.4761, 24.2967),
  T('Shangombo', 'Western', -16.7167, 22.2),
  T('Nalolo', 'Western'),
  T('Limulunga', 'Western', -15.1167, 23.1333),
  T('Mwandi', 'Western', -17.4667, 24.7),
  T('Mulobezi', 'Western', -16.7667, 25.1667),
  T('Sioma', 'Western', -16.6667, 23.6),
  T('Nkeyema', 'Western'),
  T('Luampa', 'Western'),
  T('Mitete', 'Western'),
  T('Sikongo', 'Western'),
];

// deterministic pseudo-offset from a name so derived coords don't stack
function offset(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const dx = ((h % 1000) / 1000 - 0.5) * 0.5; // ±0.25°
  const dy = (((h >> 10) % 1000) / 1000 - 0.5) * 0.5;
  return [dx, dy];
}

export function townCoords(town) {
  if (town.lat != null && town.lng != null) return { lat: town.lat, lng: town.lng };
  const p = PROVINCE_MAP[town.province] || PROVINCE_MAP.Lusaka;
  const [dx, dy] = offset(town.name);
  return { lat: p.lat + dx, lng: p.lng + dy };
}

// Full list with resolved coordinates, sorted A→Z within province groups.
export const TOWNS_FULL = TOWNS.map((t) => ({ ...t, ...townCoords(t) }));

export const TOWN_NAMES = [...new Set(TOWNS_FULL.map((t) => t.name))].sort((a, b) =>
  a.localeCompare(b)
);

export function findTown(name) {
  if (!name) return null;
  const n = String(name).toLowerCase();
  return TOWNS_FULL.find((t) => t.name.toLowerCase() === n) || null;
}

// Group towns by province for a sectioned picker.
export const TOWNS_BY_PROVINCE = PROVINCES.map((p) => ({
  province: p.name,
  towns: TOWNS_FULL.filter((t) => t.province === p.name).sort((a, b) => a.name.localeCompare(b.name)),
}));

// A location object usable directly on a listing.
export function locationOf(townName, area) {
  const t = findTown(townName) || TOWNS_FULL[0];
  return { city: t.name, area: area || t.name, province: t.province, lat: t.lat, lng: t.lng };
}

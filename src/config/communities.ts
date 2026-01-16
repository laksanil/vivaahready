// Community and Sub-community hierarchy organized by religion
// Structure: Religion -> Community -> Sub-communities

export const RELIGIONS = [
  'Hindu',
  'Muslim',
  'Sikh',
  'Christian',
  'Jain',
  'Buddhist',
  'Parsi',
  'Jewish',
  'Agnostic',
  'Atheist',
  'Other',
] as const;

export type Religion = typeof RELIGIONS[number];

// Community -> Sub-community mapping for each religion
export interface CommunityData {
  communities: {
    [community: string]: string[]; // community name -> array of sub-communities
  };
}

export const RELIGION_COMMUNITIES: Record<string, CommunityData> = {
  Hindu: {
    communities: {
      'Brahmin': [
        'Madhwa',
        'Smartha',
        'Iyer',
        'Iyengar',
        'Sanketi',
        'Havyaka',
        'Deshastha',
        'Kokanastha',
        'Karhade',
        'Chitpavan',
        'Saraswat',
        'Goud Saraswat',
        'Namboodiri',
        'Vaidiki',
        'Niyogi',
        'Kanyakubja',
        'Saryuparin',
        'Maithil',
        'Bengali',
        'Kulin',
        'Kashmiri Pandit',
        'Garhwali',
        'Punjabi',
        'Tyagi',
        'Mohyal',
        'Other Brahmin',
      ],
      'Reddy': [
        'Reddy',
        'Panta Reddy',
        'Motati Reddy',
        'Deshmukh Reddy',
        'Pedda Reddy',
        'Other Reddy',
      ],
      'Kamma': [
        'Kamma Naidu',
        'Chowdary',
        'Other Kamma',
      ],
      'Kapu': [
        'Kapu',
        'Balija',
        'Telaga',
        'Ontari',
        'Munnuru Kapu',
        'Other Kapu',
      ],
      'Naidu': [
        'Balija Naidu',
        'Gajula Balija',
        'Ediga',
        'Kamma Naidu',
        'Velama Naidu',
        'Other Naidu',
      ],
      'Velama': [
        'Velama',
        'Padmashali Velama',
        'Other Velama',
      ],
      'Nair': [
        'Nair',
        'Menon',
        'Pillai',
        'Kurup',
        'Panicker',
        'Unnithan',
        'Kartha',
        'Other Nair',
      ],
      'Ezhava': [
        'Ezhava',
        'Thiyya',
        'Billava',
        'Other Ezhava',
      ],
      'Mudaliar': [
        'Mudaliar',
        'Arcot Mudaliar',
        'Senguntha Mudaliar',
        'Thuluva Vellala',
        'Other Mudaliar',
      ],
      'Chettiar': [
        'Nattukotai Chettiar',
        'Nagarathar',
        'Arya Vysya',
        'Komati',
        'Other Chettiar',
      ],
      'Nadar': [
        'Nadar',
        'Shanar',
        'Gramani',
        'Other Nadar',
      ],
      'Gowda': [
        'Vokkaliga Gowda',
        'Lingayat Gowda',
        'Kuruba Gowda',
        'Ediga Gowda',
        'Other Gowda',
      ],
      'Lingayat': [
        'Lingayat',
        'Veerashaiva',
        'Jangam',
        'Panchamasali',
        'Banajiga',
        'Sadar',
        'Other Lingayat',
      ],
      'Vokkaliga': [
        'Vokkaliga',
        'Morasu Vokkaliga',
        'Gangadikara Vokkaliga',
        'Other Vokkaliga',
      ],
      'Bunt': [
        'Bunt',
        'Nadava',
        'Other Bunt',
      ],
      'Maratha': [
        'Maratha',
        '96 Kuli Maratha',
        'Maratha Kshatriya',
        'Kunbi Maratha',
        'Other Maratha',
      ],
      'Rajput': [
        'Rajput',
        'Thakur',
        'Chauhan',
        'Rathore',
        'Sisodiya',
        'Parmar',
        'Solanki',
        'Other Rajput',
      ],
      'Jat': [
        'Jat',
        'Jat Sikh',
        'Other Jat',
      ],
      'Yadav': [
        'Yadav',
        'Ahir',
        'Gowala',
        'Other Yadav',
      ],
      'Kurmi': [
        'Kurmi',
        'Kurmi Kshatriya',
        'Awadhiya Kurmi',
        'Other Kurmi',
      ],
      'Kayastha': [
        'Kayastha',
        'Bengali Kayastha',
        'North Indian Kayastha',
        'Other Kayastha',
      ],
      'Vaishya': [
        'Agarwal',
        'Gupta',
        'Maheshwari',
        'Marwari',
        'Khandelwal',
        'Baniya',
        'Vaish',
        'Oswal',
        'Other Vaishya',
      ],
      'Khatri': [
        'Khatri',
        'Arora',
        'Bhatia',
        'Other Khatri',
      ],
      'Arora': [
        'Arora',
        'Other Arora',
      ],
      'Sindhi': [
        'Sindhi',
        'Lohana',
        'Bhatia',
        'Other Sindhi',
      ],
      'Patel': [
        'Patel',
        'Patidar',
        'Kadva Patel',
        'Leuva Patel',
        'Other Patel',
      ],
      'Gujarati': [
        'Prajapati',
        'Suthar',
        'Soni',
        'Darji',
        'Other Gujarati',
      ],
      'Meena': [
        'Meena',
        'Other Meena',
      ],
      'Gujjar': [
        'Gujjar',
        'Gurjar',
        'Other Gujjar',
      ],
      'Scheduled Caste': [
        'SC',
        'Other SC',
      ],
      'Scheduled Tribe': [
        'ST',
        'Other ST',
      ],
      'Vishwakarma': [
        'Vishwakarma',
        'Lohar',
        'Sonar',
        'Suthar',
        'Other Vishwakarma',
      ],
      'Other': [
        'Other',
      ],
    },
  },
  Muslim: {
    communities: {
      'Sunni': [
        'Hanafi',
        'Shafi',
        'Maliki',
        'Hanbali',
        'Deobandi',
        'Barelvi',
        'Ahle Hadith',
        'Other Sunni',
      ],
      'Shia': [
        'Ithna Ashari (Twelver)',
        'Ismaili',
        'Bohra',
        'Dawoodi Bohra',
        'Khoja',
        'Zaidiya',
        'Other Shia',
      ],
      'Sheikh': [
        'Sheikh',
        'Siddiqui',
        'Farooqui',
        'Osmani',
        'Ansari',
        'Other Sheikh',
      ],
      'Syed': [
        'Syed',
        'Bukhari',
        'Rizvi',
        'Naqvi',
        'Zaidi',
        'Other Syed',
      ],
      'Pathan': [
        'Pathan',
        'Khan',
        'Afridi',
        'Yusufzai',
        'Other Pathan',
      ],
      'Mughal': [
        'Mughal',
        'Other Mughal',
      ],
      'Qureshi': [
        'Qureshi',
        'Qassab',
        'Other Qureshi',
      ],
      'Malik': [
        'Malik',
        'Other Malik',
      ],
      'Rajput Muslim': [
        'Rajput Muslim',
        'Ranghar',
        'Other Rajput Muslim',
      ],
      'Jat Muslim': [
        'Jat Muslim',
        'Other Jat Muslim',
      ],
      'Memon': [
        'Memon',
        'Halai Memon',
        'Kathiawadi Memon',
        'Other Memon',
      ],
      'Mapila': [
        'Mapila',
        'Moplah',
        'Other Mapila',
      ],
      'Lebbai': [
        'Lebbai',
        'Rowther',
        'Marakayar',
        'Other Lebbai',
      ],
      'Other': [
        'Other',
      ],
    },
  },
  Sikh: {
    communities: {
      'Jat Sikh': [
        'Jat Sikh',
        'Sidhu',
        'Sandhu',
        'Gill',
        'Dhillon',
        'Grewal',
        'Other Jat Sikh',
      ],
      'Khatri Sikh': [
        'Khatri',
        'Arora',
        'Suri',
        'Kohli',
        'Kapoor',
        'Other Khatri Sikh',
      ],
      'Arora Sikh': [
        'Arora',
        'Other Arora Sikh',
      ],
      'Ramgarhia': [
        'Ramgarhia',
        'Dhiman',
        'Other Ramgarhia',
      ],
      'Saini': [
        'Saini',
        'Other Saini',
      ],
      'Kamboj': [
        'Kamboj',
        'Other Kamboj',
      ],
      'Labana': [
        'Labana',
        'Lubana',
        'Other Labana',
      ],
      'Ahluwalia': [
        'Ahluwalia',
        'Other Ahluwalia',
      ],
      'Ravidasia': [
        'Ravidasia',
        'Other Ravidasia',
      ],
      'Majhabi': [
        'Majhabi',
        'Other Majhabi',
      ],
      'Other': [
        'Other',
      ],
    },
  },
  Christian: {
    communities: {
      'Catholic': [
        'Roman Catholic',
        'Latin Catholic',
        'Syrian Catholic',
        'Anglo Indian Catholic',
        'Goan Catholic',
        'Mangalorean Catholic',
        'East Indian Catholic',
        'Other Catholic',
      ],
      'Protestant': [
        'Church of South India (CSI)',
        'Church of North India (CNI)',
        'Methodist',
        'Baptist',
        'Lutheran',
        'Presbyterian',
        'Anglican',
        'Episcopalian',
        'Other Protestant',
      ],
      'Orthodox': [
        'Syrian Orthodox',
        'Malankara Orthodox',
        'Jacobite',
        'Mar Thoma',
        'Knanaya',
        'Other Orthodox',
      ],
      'Pentecostal': [
        'Assemblies of God',
        'Church of God',
        'IPC',
        'Other Pentecostal',
      ],
      'Evangelical': [
        'Evangelical',
        'Born Again',
        'Brethren',
        'Other Evangelical',
      ],
      'Seventh Day Adventist': [
        'Seventh Day Adventist',
        'Other SDA',
      ],
      'Other': [
        'Other',
      ],
    },
  },
  Jain: {
    communities: {
      'Digambar': [
        'Digambar',
        'Terapanthi Digambar',
        'Bisa Digambar',
        'Other Digambar',
      ],
      'Shwetambar': [
        'Shwetambar',
        'Murtipujak',
        'Sthanakvasi',
        'Terapanthi Shwetambar',
        'Other Shwetambar',
      ],
      'Agarwal Jain': [
        'Agarwal',
        'Other Agarwal Jain',
      ],
      'Oswal': [
        'Oswal',
        'Bisa Oswal',
        'Dasa Oswal',
        'Other Oswal',
      ],
      'Porwal': [
        'Porwal',
        'Other Porwal',
      ],
      'Khandelwal': [
        'Khandelwal',
        'Other Khandelwal',
      ],
      'Other': [
        'Other',
      ],
    },
  },
  Buddhist: {
    communities: {
      'Theravada': [
        'Theravada',
        'Sri Lankan',
        'Thai',
        'Burmese',
        'Other Theravada',
      ],
      'Mahayana': [
        'Mahayana',
        'Chinese',
        'Vietnamese',
        'Korean',
        'Japanese',
        'Other Mahayana',
      ],
      'Vajrayana': [
        'Tibetan',
        'Gelug',
        'Kagyu',
        'Nyingma',
        'Sakya',
        'Other Vajrayana',
      ],
      'Neo Buddhist': [
        'Ambedkarite',
        'Navayana',
        'Other Neo Buddhist',
      ],
      'Other': [
        'Other',
      ],
    },
  },
  Parsi: {
    communities: {
      'Parsi': [
        'Parsi',
        'Zoroastrian',
        'Other Parsi',
      ],
      'Irani': [
        'Irani',
        'Other Irani',
      ],
      'Other': [
        'Other',
      ],
    },
  },
  Jewish: {
    communities: {
      'Ashkenazi': [
        'Ashkenazi',
        'Other Ashkenazi',
      ],
      'Sephardic': [
        'Sephardic',
        'Mizrahi',
        'Other Sephardic',
      ],
      'Cochini': [
        'Cochini',
        'Other Cochini',
      ],
      'Bene Israel': [
        'Bene Israel',
        'Other Bene Israel',
      ],
      'Other': [
        'Other',
      ],
    },
  },
  Agnostic: {
    communities: {
      'Agnostic': [
        'Agnostic',
      ],
      'Other': [
        'Other',
      ],
    },
  },
  Atheist: {
    communities: {
      'Atheist': [
        'Atheist',
      ],
      'Other': [
        'Other',
      ],
    },
  },
  Other: {
    communities: {
      'Inter-Religion': [
        'Inter-Religion',
      ],
      'No Religion': [
        'No Religion',
      ],
      'Spiritual': [
        'Spiritual',
      ],
      'Other': [
        'Other',
      ],
    },
  },
};

// Helper function to get communities for a religion (alphabetically sorted, with "Other" at the end)
export function getCommunities(religion: string): string[] {
  const religionData = RELIGION_COMMUNITIES[religion];
  if (!religionData) return ['Other'];
  const communities = Object.keys(religionData.communities);
  // Sort alphabetically but keep "Other" at the end
  return communities.sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });
}

// Helper function to get sub-communities for a religion and community (alphabetically sorted, with "Other" variants at the end)
export function getSubCommunities(religion: string, community: string): string[] {
  const religionData = RELIGION_COMMUNITIES[religion];
  if (!religionData) return ['Other'];
  const subCommunities = religionData.communities[community] || ['Other'];
  // Sort alphabetically but keep "Other" and "Other X" at the end
  return [...subCommunities].sort((a, b) => {
    const aIsOther = a === 'Other' || a.startsWith('Other ');
    const bIsOther = b === 'Other' || b.startsWith('Other ');
    if (aIsOther && !bIsOther) return 1;
    if (!aIsOther && bIsOther) return -1;
    return a.localeCompare(b);
  });
}

// Get all communities across all religions (for partner preferences)
export function getAllCommunities(): { religion: string; community: string }[] {
  const result: { religion: string; community: string }[] = [];
  Object.entries(RELIGION_COMMUNITIES).forEach(([religion, data]) => {
    Object.keys(data.communities).forEach(community => {
      if (community !== 'Other') {
        result.push({ religion, community });
      }
    });
  });
  return result;
}

// Get all sub-communities across all religions (for partner preferences)
export function getAllSubCommunities(): { religion: string; community: string; subCommunity: string }[] {
  const result: { religion: string; community: string; subCommunity: string }[] = [];
  Object.entries(RELIGION_COMMUNITIES).forEach(([religion, data]) => {
    Object.entries(data.communities).forEach(([community, subCommunities]) => {
      subCommunities.forEach(subCommunity => {
        if (subCommunity !== 'Other' && !subCommunity.startsWith('Other ')) {
          result.push({ religion, community, subCommunity });
        }
      });
    });
  });
  return result;
}

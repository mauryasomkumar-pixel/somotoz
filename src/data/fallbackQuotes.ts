export interface ShayariQuote {
  id: string;
  category: 'love' | 'breakup' | 'mood_off' | 'motivation' | 'genz';
  language: 'hinglish' | 'english';
  text: string;
  translation?: string;
  attribution: string;
  moodTag: string;
}

export const FALLBACK_SHAYARI_QUOTES: ShayariQuote[] = [
  // ==========================================
  // 1. LOVE (Romantic) - Hinglish
  // ==========================================
  {
    id: 'love-h-1',
    category: 'love',
    language: 'hinglish',
    text: 'Teri ek muskaan pe meri saari playlist ruk jaati hai.',
    translation: 'On a single smile of yours, my entire playlist comes to a halt.',
    attribution: 'Original by Somotoz',
    moodTag: 'Romantic',
  },
  {
    id: 'love-h-2',
    category: 'love',
    language: 'hinglish',
    text: 'Tujhse baat na ho to din guzarta hai, par waqt ruk sa jaata hai.',
    translation: 'If I do not talk to you, the day passes, but time itself seems to stop.',
    attribution: 'Original by Somotoz',
    moodTag: 'Romantic',
  },
  {
    id: 'love-h-3',
    category: 'love',
    language: 'hinglish',
    text: 'Hazaron chehron ke shor mein, ek tera khamosh ehsaas kaafi hai.',
    translation: 'Amid the clamor of thousands of faces, your silent presence is enough.',
    attribution: 'Original by Somotoz',
    moodTag: 'Romantic',
  },
  {
    id: 'love-h-4',
    category: 'love',
    language: 'hinglish',
    text: 'Ishq wahi jo lafzon se pare ho, jahan aankhon mein hi saari guftagu mukammal ho jaye.',
    translation: 'True love lies beyond spoken words, where silent gazes complete the conversation.',
    attribution: 'Original by Somotoz',
    moodTag: 'Romantic',
  },
  {
    id: 'love-h-5',
    category: 'love',
    language: 'hinglish',
    text: 'Mohabbat mein har roz wahi chehra dekhna bhi ek nayi dua lagta hai.',
    translation: 'In love, seeing the same familiar face every day still feels like a brand new blessing.',
    attribution: 'Original by Somotoz',
    moodTag: 'Romantic',
  },

  // ==========================================
  // 1. LOVE (Romantic) - English & Classics
  // ==========================================
  {
    id: 'love-e-1',
    category: 'love',
    language: 'english',
    text: 'In a room full of noise, your silence was the only melody I wanted to hear.',
    translation: 'A serene testament to intimate connection.',
    attribution: 'Original by Somotoz',
    moodTag: 'Romantic',
  },
  {
    id: 'love-e-2',
    category: 'love',
    language: 'english',
    text: 'Ishq par zor nahin hai ye wo aatish Ghalib, jo lagaye na lage aur bujhaye na bane.',
    translation: 'Love cannot be commanded, Ghalib; it is a fire that cannot be lit by will, nor doused by force.',
    attribution: 'Mirza Ghalib',
    moodTag: 'Romantic',
  },
  {
    id: 'love-e-3',
    category: 'love',
    language: 'english',
    text: 'You are the gentle gravity that quietly pulls my wandering thoughts back home.',
    translation: 'Finding peace in the one who centers you.',
    attribution: 'Original by Somotoz',
    moodTag: 'Romantic',
  },
  {
    id: 'love-e-4',
    category: 'love',
    language: 'english',
    text: 'Some souls fit together like verses written by the same unseen poet.',
    translation: 'Unspoken spiritual symmetry between two minds.',
    attribution: 'Original by Somotoz',
    moodTag: 'Romantic',
  },
  {
    id: 'love-e-5',
    category: 'love',
    language: 'english',
    text: 'Dekhna taqreer ki lazzat ki jo us ne kaha, maine yeh jaana ke goya yeh bhi mere dil mein tha.',
    translation: 'Behold the sweetness of their words; whatever they uttered, my heart felt it had always known.',
    attribution: 'Mirza Ghalib',
    moodTag: 'Romantic',
  },

  // ==========================================
  // 2. BREAKUP (Heartbroken) - Hinglish
  // ==========================================
  {
    id: 'breakup-h-1',
    category: 'breakup',
    language: 'hinglish',
    text: 'Tu gaya to shehar wahi hai, bas mere liye khaali ho gaya.',
    translation: 'You left and the city remains the same, yet for me it turned completely empty.',
    attribution: 'Original by Somotoz',
    moodTag: 'Heartbroken',
  },
  {
    id: 'breakup-h-2',
    category: 'breakup',
    language: 'hinglish',
    text: 'Ab koi shikwa nahi tujhse, dukh bas is baat ka hai ki tu ajnabi kitni asaani se ban gaya.',
    translation: 'I have no grievances left against you; the heartache is only how easily you turned into a stranger.',
    attribution: 'Original by Somotoz',
    moodTag: 'Heartbroken',
  },
  {
    id: 'breakup-h-3',
    category: 'breakup',
    language: 'hinglish',
    text: 'Kahaani wahi khatam ho gayi jahan tune sach sunne se inkaar kar diya.',
    translation: 'The story ended right where you refused to listen to the truth.',
    attribution: 'Original by Somotoz',
    moodTag: 'Heartbroken',
  },
  {
    id: 'breakup-h-4',
    category: 'breakup',
    language: 'hinglish',
    text: 'Dil dukhane ka bhi apna saleeqa tha unka, muskurate huye saare vaade tod diye.',
    translation: 'They had their own subtle grace in hurting; they broke every promise with an untroubled smile.',
    attribution: 'Original by Somotoz',
    moodTag: 'Heartbroken',
  },
  {
    id: 'breakup-h-5',
    category: 'breakup',
    language: 'hinglish',
    text: 'Patta gira toh ped ne rona chod diya, humne bhi wahi seekha jab tu juda hua.',
    translation: 'When a leaf falls the tree lets go without tears; I learned the same wisdom when you drifted away.',
    attribution: 'Original by Somotoz',
    moodTag: 'Heartbroken',
  },

  // ==========================================
  // 2. BREAKUP (Heartbroken) - English & Classics
  // ==========================================
  {
    id: 'breakup-e-1',
    category: 'breakup',
    language: 'english',
    text: 'You did not just leave; you took the music that used to play in everyday conversations.',
    translation: 'The lingering quietness after separation.',
    attribution: 'Original by Somotoz',
    moodTag: 'Heartbroken',
  },
  {
    id: 'breakup-e-2',
    category: 'breakup',
    language: 'english',
    text: 'Ibtida-e-ishq hai rota hai kya, aage aage dekhiye hota hai kya.',
    translation: 'It is only the beginning of love, why do you weep? Watch what trials still unfold ahead.',
    attribution: 'Mir Taqi Mir',
    moodTag: 'Heartbroken',
  },
  {
    id: 'breakup-e-3',
    category: 'breakup',
    language: 'english',
    text: 'We turned into a memory I carefully avoid when the night grows still.',
    translation: 'Protecting one’s peace from old echoes.',
    attribution: 'Original by Somotoz',
    moodTag: 'Heartbroken',
  },
  {
    id: 'breakup-e-4',
    category: 'breakup',
    language: 'english',
    text: 'Sometimes letting go is not surrender; it is simply respecting what is already gone.',
    translation: 'Dignified closure over prolonged longing.',
    attribution: 'Original by Somotoz',
    moodTag: 'Heartbroken',
  },
  {
    id: 'breakup-e-5',
    category: 'breakup',
    language: 'english',
    text: 'Hum ko un se wafa ki hai ummeed, jo nahi jaante wafa kya hai.',
    translation: 'We pinned our hopes of devotion on those who never understood the sanctity of loyalty.',
    attribution: 'Mirza Ghalib',
    moodTag: 'Heartbroken',
  },

  // ==========================================
  // 3. MOOD OFF - Hinglish
  // ==========================================
  {
    id: 'moodoff-h-1',
    category: 'mood_off',
    language: 'hinglish',
    text: 'Aaj kuch kehna nahi hai, bas chup rehna hai, aur koi samajh jaye.',
    translation: 'Today I have nothing to say, I just wish to be quiet, and have someone understand.',
    attribution: 'Original by Somotoz',
    moodTag: 'Mood Off',
  },
  {
    id: 'moodoff-h-2',
    category: 'mood_off',
    language: 'hinglish',
    text: 'Kabhi kabhi thakaan sharir ki nahi, har cheez sambhalne ki hoti hai.',
    translation: 'Sometimes tiredness is not of the body, but of holding everything together.',
    attribution: 'Original by Somotoz',
    moodTag: 'Mood Off',
  },
  {
    id: 'moodoff-h-3',
    category: 'mood_off',
    language: 'hinglish',
    text: 'Sab kuch theek hai bolkar sabko khush rakhna hi sabse bada bojh ban jata hai.',
    translation: 'Saying everything is fine just to appease everyone becomes the heaviest weight.',
    attribution: 'Original by Somotoz',
    moodTag: 'Mood Off',
  },
  {
    id: 'moodoff-h-4',
    category: 'mood_off',
    language: 'hinglish',
    text: 'Thodi der ke liye duniya ka volume zero karne ka mann hai.',
    translation: 'I just feel like turning the volume of the entire world down to zero for a while.',
    attribution: 'Original by Somotoz',
    moodTag: 'Mood Off',
  },
  {
    id: 'moodoff-h-5',
    category: 'mood_off',
    language: 'hinglish',
    text: 'Bheed bohot hai aas-paas, par baith kar dukh baantne wala koi nahi.',
    translation: 'There are crowds everywhere, but nobody to sit quietly with and share the weight.',
    attribution: 'Original by Somotoz',
    moodTag: 'Mood Off',
  },

  // ==========================================
  // 3. MOOD OFF - English & Classics
  // ==========================================
  {
    id: 'moodoff-e-1',
    category: 'mood_off',
    language: 'english',
    text: 'My social battery is at one percent, and the world keeps asking for a full charge.',
    translation: 'Cognitive and emotional exhaustion needing quiet recharge.',
    attribution: 'Original by Somotoz',
    moodTag: 'Mood Off',
  },
  {
    id: 'moodoff-e-2',
    category: 'mood_off',
    language: 'english',
    text: 'Be-dili kya yoon hi din guzar jayenge, sirf zinda rahe hum to mar jayenge.',
    translation: 'In this listlessness will all days slip away? If we merely exist without soul, we are already dead.',
    attribution: 'Jaun Elia (Classic)',
    moodTag: 'Mood Off',
  },
  {
    id: 'moodoff-e-3',
    category: 'mood_off',
    language: 'english',
    text: 'Not mad, not broken, just mentally unavailable for anything that takes effort.',
    translation: 'Honoring the need for peaceful retreat.',
    attribution: 'Original by Somotoz',
    moodTag: 'Mood Off',
  },
  {
    id: 'moodoff-e-4',
    category: 'mood_off',
    language: 'english',
    text: 'Sometimes solitude is not loneliness; it is self-defense against the noise.',
    translation: 'Protecting your mind through sacred silence.',
    attribution: 'Original by Somotoz',
    moodTag: 'Mood Off',
  },
  {
    id: 'moodoff-e-5',
    category: 'mood_off',
    language: 'english',
    text: 'Heavy clouds do not mean the sun vanished; they just mean the sky is processing.',
    translation: 'Gentle patience with emotional storms.',
    attribution: 'Original by Somotoz',
    moodTag: 'Mood Off',
  },

  // ==========================================
  // 4. MOTIVATION - Hinglish
  // ==========================================
  {
    id: 'mot-h-1',
    category: 'motivation',
    language: 'hinglish',
    text: 'Raat jitni lambi ho, subah ka hisaab wahi chukata hai.',
    translation: 'However long the night may be, the morning light balances the ledger.',
    attribution: 'Original by Somotoz',
    moodTag: 'Motivated',
  },
  {
    id: 'mot-h-2',
    category: 'motivation',
    language: 'hinglish',
    text: 'Koshishon ka wazan itna rakho ki nateeje khud jhuk kar salaam karein.',
    translation: 'Put so much gravity into your efforts that the outcomes bow in respect.',
    attribution: 'Original by Somotoz',
    moodTag: 'Motivated',
  },
  {
    id: 'mot-h-3',
    category: 'motivation',
    language: 'hinglish',
    text: 'Gir kar uthna hi aukaat tay karta hai, baith kar kismat ko kosna nahi.',
    translation: 'Rising after falling defines your true caliber, not cursing destiny from the ground.',
    attribution: 'Original by Somotoz',
    moodTag: 'Motivated',
  },
  {
    id: 'mot-h-4',
    category: 'motivation',
    language: 'hinglish',
    text: 'Shant reh kar itna kaam kar ki teri kamiyabi shehar ke akhbaar ban jaye.',
    translation: 'Work in such quiet discipline that your success becomes the headline of the town.',
    attribution: 'Original by Somotoz',
    moodTag: 'Motivated',
  },
  {
    id: 'mot-h-5',
    category: 'motivation',
    language: 'hinglish',
    text: 'Har subah ek naya panna hai, likh do wahi jo kal tak mushkil lagta tha.',
    translation: 'Every dawn is an unwritten sheet; pen down what seemed impossible yesterday.',
    attribution: 'Original by Somotoz',
    moodTag: 'Motivated',
  },

  // ==========================================
  // 4. MOTIVATION - English & Classics
  // ==========================================
  {
    id: 'mot-e-1',
    category: 'motivation',
    language: 'english',
    text: 'Khudi ko kar buland itna ke har taqdeer se pehle, khuda bande se khud pooche bata teri raza kya hai.',
    translation: 'Elevate your self so high that before writing any destiny, God asks you: what is your desire?',
    attribution: 'Allama Iqbal',
    moodTag: 'Motivated',
  },
  {
    id: 'mot-e-2',
    category: 'motivation',
    language: 'english',
    text: 'Do not count the days you survived; make the days count through the legacy you build.',
    translation: 'Channeling resilience into meaningful impact.',
    attribution: 'Original by Somotoz',
    moodTag: 'Motivated',
  },
  {
    id: 'mot-e-3',
    category: 'motivation',
    language: 'english',
    text: 'Tund-e-baad-e-mukhalif se na ghabra aye uqaab, yeh toh chalti hai tujhe ooncha udaane ke liye.',
    translation: 'Do not fear the harsh headwind, O falcon; it blows only to lift your flight even higher.',
    attribution: 'Allama Iqbal',
    moodTag: 'Motivated',
  },
  {
    id: 'mot-e-4',
    category: 'motivation',
    language: 'english',
    text: 'Small daily executions compound into impossible dreams realized.',
    translation: 'Consistency outpaces fleeting motivation.',
    attribution: 'Original by Somotoz',
    moodTag: 'Motivated',
  },
  {
    id: 'mot-e-5',
    category: 'motivation',
    language: 'english',
    text: 'When the path gets steep, remember that only summits have views worth remembering.',
    translation: 'Finding courage in the difficulty of great pursuits.',
    attribution: 'Original by Somotoz',
    moodTag: 'Motivated',
  },

  // ==========================================
  // 5. GEN-Z ONE-LINERS - Hinglish
  // ==========================================
  {
    id: 'genz-h-1',
    category: 'genz',
    language: 'hinglish',
    text: 'Overthinking band, lo-fi beats chalu, aur zindagi sorted.',
    translation: 'Turn down overthinking, turn up the lo-fi beats, and life is sorted.',
    attribution: 'Original by Somotoz',
    moodTag: 'Chill',
  },
  {
    id: 'genz-h-2',
    category: 'genz',
    language: 'hinglish',
    text: 'Main character energy tab aati hai jab aap logon ki validation se resign de do.',
    translation: 'Main character energy unlocks the moment you resign from seeking outside validation.',
    attribution: 'Original by Somotoz',
    moodTag: 'Happy',
  },
  {
    id: 'genz-h-3',
    category: 'genz',
    language: 'hinglish',
    text: 'Vibe match na ho toh "seen" pe chhodna bhi ek boundary setting hai.',
    translation: 'If the vibe does not match, leaving on seen is just boundary setting.',
    attribution: 'Original by Somotoz',
    moodTag: 'Chill',
  },
  {
    id: 'genz-h-4',
    category: 'genz',
    language: 'hinglish',
    text: 'Screen time kam, coffee garam, aur goals clear — bas itna hi chahiye.',
    translation: 'Less screen time, warm coffee, and crystal-clear goals — that is all we need.',
    attribution: 'Original by Somotoz',
    moodTag: 'Focus',
  },
  {
    id: 'genz-h-5',
    category: 'genz',
    language: 'hinglish',
    text: 'Dil bacha hai par dimaag ne enterprise code deploy kar diya hai.',
    translation: 'The heart remains innocent while the mind just shipped enterprise code.',
    attribution: 'Original by Somotoz',
    moodTag: 'Happy',
  },

  // ==========================================
  // 5. GEN-Z ONE-LINERS - English
  // ==========================================
  {
    id: 'genz-e-1',
    category: 'genz',
    language: 'english',
    text: 'Protecting my peace like it is an uncommitted production hotfix.',
    translation: 'Unapologetic emotional boundaries and mental hygiene.',
    attribution: 'Original by Somotoz',
    moodTag: 'Chill',
  },
  {
    id: 'genz-e-2',
    category: 'genz',
    language: 'english',
    text: 'No drama, just high frequencies, cold brew, and steady momentum.',
    translation: 'Staying centered in clean creative energy.',
    attribution: 'Original by Somotoz',
    moodTag: 'Happy',
  },
  {
    id: 'genz-e-3',
    category: 'genz',
    language: 'english',
    text: 'Silence is my favorite status update.',
    translation: 'Thriving without announcing every move.',
    attribution: 'Original by Somotoz',
    moodTag: 'Chill',
  },
  {
    id: 'genz-e-4',
    category: 'genz',
    language: 'english',
    text: 'Focus mode is not a setting on your phone; it is a declaration of self-respect.',
    translation: 'Guarding your attention from cheap distractions.',
    attribution: 'Original by Somotoz',
    moodTag: 'Focus',
  },
  {
    id: 'genz-e-5',
    category: 'genz',
    language: 'english',
    text: 'Zero tech debt today, pure dopamine tomorrow. Keep shipping.',
    translation: 'Discipline today delivers effortless euphoria tomorrow.',
    attribution: 'Original by Somotoz',
    moodTag: 'Motivated',
  },
];

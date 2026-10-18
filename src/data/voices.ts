export interface VoiceOption {
  id: string;
  name: string;
  bengaliName: string;
  gender: 'male' | 'female';
  baseVoice: 'Fenrir' | 'Kore' | 'Zephyr' | 'Charon' | 'Puck';
  category: 'preset' | 'cloned';
  tag: string;
  description: string;
  bengaliDescription: string;
  avatarColor: string;
  sampleAudio?: string;
  // Cloned voice custom attributes
  timbre?: string;
  pitchSemitones?: number;
  speedMultiplier?: number;
  stylePrompt?: string;
  clarityScore?: number;
  transcription?: string;
  tags?: string[];
  createdAt?: string;
}

export const PRESET_VOICES: VoiceOption[] = [
  {
    id: 'male',
    name: 'Kabir (Male)',
    bengaliName: 'কবির (পুরুষ কণ্ঠ)',
    gender: 'male',
    baseVoice: 'Fenrir',
    category: 'preset',
    tag: 'Formal & News',
    description: 'Natural Bangladeshi male voice. Articulate, confident, and warm.',
    bengaliDescription: 'স্বাভাবিক ও স্পষ্ট বাচনভঙ্গি, সংবাদ ও আনুষ্ঠানিক বক্তব্যের জন্য সেরা।',
    avatarColor: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'female',
    name: 'Nusrat (Female)',
    bengaliName: 'নুসরাত (নারী কণ্ঠ)',
    gender: 'female',
    baseVoice: 'Kore',
    category: 'preset',
    tag: 'Story & Warm',
    description: 'Natural expressive Bangladeshi female voice. Melodious, clear, and engaging.',
    bengaliDescription: 'মিষ্টি ও মনকাড়া উচ্চারণ, অডিওবুক এবং বর্ণনার জন্য দারুণ।',
    avatarColor: 'from-purple-600 to-pink-600',
  },
  {
    id: 'cute_girl',
    name: 'Tisha (Cute Girl)',
    bengaliName: 'তিশা (কিউট বালিকা কণ্ঠ)',
    gender: 'female',
    baseVoice: 'Zephyr',
    category: 'preset',
    tag: 'Youthful & Sweet',
    description: 'Sweet, youthful, cheerful and cute young female voice. Gentle and bright.',
    bengaliDescription: 'প্রাণবন্ত ও মিষ্টি তরুণী কণ্ঠ, রিলস, শর্টস এবং পডকাস্টের জন্য উপযুক্ত।',
    avatarColor: 'from-pink-500 to-rose-400',
  },
  {
    id: 'deep_voice',
    name: 'Shanto (Deep Voice)',
    bengaliName: 'শান্ত (গম্ভীর ব্যারিটোন কণ্ঠ)',
    gender: 'male',
    baseVoice: 'Charon',
    category: 'preset',
    tag: 'Cinematic & Deep',
    description: 'Deep resonant baritone male voice. Authoritative, rich, and dramatic.',
    bengaliDescription: 'ভারী গম্ভীর ভয়েস, ড্রামাটিক আবৃত্তি, সিনেমা ট্রেলার ও ট্রাভেল ভ্লগের জন্য আদর্শ।',
    avatarColor: 'from-indigo-700 to-slate-900',
  },
];

export interface EmotionOption {
  id: 'normal' | 'happy' | 'sad' | 'angry' | 'excited';
  name: string;
  bengaliName: string;
  emoji: string;
  description: string;
}

export const EMOTIONS: EmotionOption[] = [
  {
    id: 'normal',
    name: 'Normal',
    bengaliName: 'স্বাভাবিক',
    emoji: '🎙️',
    description: 'Balanced, calm and professional conversational delivery.',
  },
  {
    id: 'happy',
    name: 'Happy',
    bengaliName: 'আনন্দিত',
    emoji: '😊',
    description: 'Joyful, warm, smiling tone full of positive vibes.',
  },
  {
    id: 'sad',
    name: 'Sad',
    bengaliName: 'দুঃখিত',
    emoji: '🥺',
    description: 'Soft, emotional, reflective, and touching melancholy.',
  },
  {
    id: 'angry',
    name: 'Angry',
    bengaliName: 'রাগান্বিত',
    emoji: '😠',
    description: 'Intense, stern, authoritative and commanding presence.',
  },
  {
    id: 'excited',
    name: 'Excited',
    bengaliName: 'উত্তেজিত',
    emoji: '🔥',
    description: 'High energy, enthusiastic, upbeat and dramatic tempo.',
  },
];

export interface SampleText {
  id: string;
  title: string;
  category: string;
  text: string;
  suggestedEmotion: 'normal' | 'happy' | 'sad' | 'angry' | 'excited';
  suggestedVoiceId: string;
}

export const SAMPLE_TEXTS: SampleText[] = [
  {
    id: 'welcome',
    title: 'স্বাগত বক্তব্য (Welcome)',
    category: 'সাধারণ',
    text: 'নমস্কার এবং আসসালামু আলাইকুম। আরএক্স নাফিজ এআই ভয়েস স্টুডিওতে আপনাকে স্বাগতম। আধুনিক কৃত্রিম বুদ্ধিমত্তার শক্তিতে তৈরি করুন জীবন্ত বাংলা ভয়েস।',
    suggestedEmotion: 'happy',
    suggestedVoiceId: 'female',
  },
  {
    id: 'inspirational',
    title: 'অনুপ্রেরণা (Inspiration)',
    category: 'মোটিভেশন',
    text: 'যদি তুমি সফল হতে চাও, তবে নিজের স্বপ্নের ওপর বিশ্বাস রাখো। কঠিন পরিশ্রম কখনো বৃথা যায় না, প্রতিটি ছোট পদক্ষেপ তোমাকে সাফল্যের চূড়ায় পৌঁছে দেবে।',
    suggestedEmotion: 'excited',
    suggestedVoiceId: 'male',
  },
  {
    id: 'news',
    title: 'নিউজ বুলেটিন (News)',
    category: 'সংবাদ',
    text: 'আজকের প্রধান খবর: প্রযুক্তির জগতে বাংলাদেশের তরুণরা তৈরি করছে নতুন ইতিহাস। দেশের প্রত্যন্ত অঞ্চলেও দ্রুত ছড়িয়ে পড়ছে কৃত্রিম বুদ্ধিমত্তা নির্ভর সেবা।',
    suggestedEmotion: 'normal',
    suggestedVoiceId: 'male',
  },
  {
    id: 'poetry',
    title: 'কবিতার চরণ (Poetry)',
    category: 'সাহিত্য',
    text: 'মেঘের ওপরে মেঘ জমেছে, আঁধার করে আসে। আমায় কেন বসিয়ে রাখিস একেলা দ্বারের পাশে। বৃষ্টির মিষ্টি সুর মনে করিয়ে দেয় ফেলে আসা স্মৃতির কথা।',
    suggestedEmotion: 'sad',
    suggestedVoiceId: 'cute_girl',
  },
  {
    id: 'commercial',
    title: 'বিজ্ঞাপন প্রোমো (Commercial)',
    category: 'বিজ্ঞাপন',
    text: 'এই ঈদে নিয়ে নিন ধামাকা অফার! সেরা কোয়ালিটির সব প্রডাক্টে পাচ্ছেন সর্বোচ্চ ৫০ শতাংশ পর্যন্ত বিশেষ ছাড়। সীমিত সময়ের অফার, আজই ভিজিট করুন!',
    suggestedEmotion: 'excited',
    suggestedVoiceId: 'cute_girl',
  },
  {
    id: 'deep_dialogue',
    title: 'ড্রামাটিক সংলাপ (Cinematic)',
    category: 'চলচ্চিত্র',
    text: 'যে দিন থেকে আমি নিজের পথ বেছে নিয়েছি, সেদিন থেকেই ভয়কে পেছনে ফেলে এসেছি। নিয়তির সাথে লড়াইয়ে জেতার একটাই শর্ত—কখনো থামবে না।',
    suggestedEmotion: 'angry',
    suggestedVoiceId: 'deep_voice',
  },
  {
    id: 'english_test',
    title: 'English Auto-Translate Test',
    category: 'English',
    text: 'Hello everyone! Artificial intelligence is changing the way we create content and connect with our audience in Bangladesh.',
    suggestedEmotion: 'happy',
    suggestedVoiceId: 'male',
  },
];

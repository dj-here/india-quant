'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  HeartHandshake, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Send, 
  Award, 
  CheckCircle2, 
  Smile, 
  Mic, 
  Edit3, 
  Flame,
  ArrowRight
} from 'lucide-react';

interface Plant {
  id: string;
  module: string;
  title: string;
  icon: string;
  plantName: string;
  stage: number; // 0: Seed, 1: Sprout, 2: Budding, 3: Bloom
  totalMissions: number;
}

export default function ChildValuesPage() {
  const [activeTab, setActiveTab] = useState<'GARDEN' | 'STORY_REFLECT' | 'JOURNAL'>('GARDEN');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'te'>('en');

  // Garden State
  const [plants, setPlants] = useState<Plant[]>([
    { id: '1', module: 'GRATITUDE', title: 'Gratitude', icon: '🌻', plantName: 'Golden Sunflower', stage: 2, totalMissions: 3 },
    { id: '2', module: 'KINDNESS', title: 'Kindness', icon: '🌸', plantName: 'Pink Lotus', stage: 1, totalMissions: 2 },
    { id: '3', module: 'HONESTY', title: 'Honesty', icon: '🌱', plantName: 'Bamboo Sprout', stage: 3, totalMissions: 5 },
    { id: '4', module: 'EMPATHY', title: 'Empathy', icon: '🌷', plantName: 'Gentle Orchid', stage: 1, totalMissions: 1 },
    { id: '5', module: 'RESPONSIBILITY', title: 'Responsibility', icon: '🌳', plantName: 'Mighty Banyan', stage: 2, totalMissions: 3 },
    { id: '6', module: 'RESPECT', title: 'Respect', icon: '🌹', plantName: 'Velvet Rose', stage: 3, totalMissions: 4 },
    { id: '7', module: 'PERSEVERANCE', title: 'Perseverance', icon: '🌲', plantName: 'Mountain Pine', stage: 1, totalMissions: 2 },
    { id: '8', module: 'COURAGE', title: 'Courage', icon: '🌺', plantName: 'Red Hibiscus', stage: 2, totalMissions: 3 },
    { id: '9', module: 'SHARING', title: 'Sharing', icon: '🍇', plantName: 'Sweet Grapevine', stage: 0, totalMissions: 0 },
    { id: '10', module: 'ENVIRONMENT', title: 'Care for Earth', icon: '🌿', plantName: 'Healing Neem', stage: 2, totalMissions: 3 },
    { id: '11', module: 'DIGITAL_CITIZENSHIP', title: 'Digital Safety', icon: '🛡️', plantName: 'Protective Aloe', stage: 1, totalMissions: 1 },
    { id: '12', module: 'PEER_PRESSURE', title: 'Self-Respect', icon: '🎋', plantName: 'Sacred Tulsi', stage: 1, totalMissions: 2 },
  ]);

  // Story & Reflection state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1); // 1: Story, 2: Reflect, 3: Act, 4: Share
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);

  // Gratitude Journal state
  const [gratitudeEntries, setGratitudeEntries] = useState<string[]>([
    "Thankful for grandma baking hot idlis this morning.",
    "Grateful to my friend Kabir for sharing his eraser in drawing class.",
    "Thankful for the cool rain after a hot day."
  ]);
  const [newGratitude, setNewGratitude] = useState('');

  const stageDescriptions = [
    { stage: 0, label: 'Planted Seed', desc: 'Ready to germinate with real practice' },
    { stage: 1, label: 'Tender Sprout', desc: 'Growing strong from your first reflection' },
    { stage: 2, label: 'Budding Blossom', desc: 'Reaching high with real-world missions' },
    { stage: 3, label: 'Radiant Flower', desc: 'In full bloom through consistent kindness!' },
  ];

  const handleWaterPlant = (plantId: string) => {
    setPlants(prev => prev.map(p => {
      if (p.id === plantId) {
        const nextStage = Math.min(p.stage + 1, 3);
        return { ...p, stage: nextStage, totalMissions: p.totalMissions + 1 };
      }
      return p;
    }));
  };

  const handleAddGratitude = () => {
    if (!newGratitude.trim()) return;
    setGratitudeEntries(prev => [newGratitude.trim(), ...prev]);
    setNewGratitude('');
    // Water gratitude plant
    handleWaterPlant('1');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Track Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/40 text-emerald-100 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Flagship Life Values & Ethics
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Character Garden & Real-Life Missions
            </h1>
            <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
              Values grow in your heart and in your daily actions with real people. Ollie is your thinking companion—not a judge or moral authority.
            </p>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex bg-emerald-800/60 p-1.5 rounded-2xl border border-emerald-500/40 text-xs font-bold">
            <button
              onClick={() => setActiveTab('GARDEN')}
              className={`px-3 py-2 rounded-xl transition-colors ${
                activeTab === 'GARDEN' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:text-white'
              }`}
            >
              🌱 My Garden
            </button>
            <button
              onClick={() => setActiveTab('STORY_REFLECT')}
              className={`px-3 py-2 rounded-xl transition-colors ${
                activeTab === 'STORY_REFLECT' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:text-white'
              }`}
            >
              📖 Story & Mission
            </button>
            <button
              onClick={() => setActiveTab('JOURNAL')}
              className={`px-3 py-2 rounded-xl transition-colors ${
                activeTab === 'JOURNAL' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:text-white'
              }`}
            >
              ✨ Gratitude Journal
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: CHARACTER GARDEN */}
      {activeTab === 'GARDEN' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Your 12 Values in Bloom</h2>
              <p className="text-xs text-slate-500">Every real-life mission waters and grows your garden</p>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full">
              Growth Mindset • Effort Over Score
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {plants.map((plant) => (
              <div
                key={plant.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{plant.icon}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      plant.stage === 3 ? 'bg-emerald-100 text-emerald-800' :
                      plant.stage === 2 ? 'bg-amber-100 text-amber-800' :
                      plant.stage === 1 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {stageDescriptions[plant.stage].label}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base">{plant.title}</h3>
                  <div className="text-xs text-slate-500">{plant.plantName}</div>
                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    {stageDescriptions[plant.stage].desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {plant.totalMissions} missions completed
                  </span>
                  <button
                    onClick={() => handleWaterPlant(plant.id)}
                    className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-colors"
                    title="Water this value!"
                  >
                    💧 Water
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: 4-STAGE STORY -> REFLECT -> ACT -> SHARE */}
      {activeTab === 'STORY_REFLECT' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
          
          {/* Stepper Strip */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold border-b border-slate-100 pb-4">
            <button
              onClick={() => setCurrentStep(1)}
              className={`p-2 rounded-xl transition-colors ${currentStep === 1 ? 'bg-emerald-100 text-emerald-950 font-black' : 'text-slate-500'}`}
            >
              1. Story
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              className={`p-2 rounded-xl transition-colors ${currentStep === 2 ? 'bg-emerald-100 text-emerald-950 font-black' : 'text-slate-500'}`}
            >
              2. Reflect
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className={`p-2 rounded-xl transition-colors ${currentStep === 3 ? 'bg-emerald-100 text-emerald-950 font-black' : 'text-slate-500'}`}
            >
              3. Real Mission
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className={`p-2 rounded-xl transition-colors ${currentStep === 4 ? 'bg-emerald-100 text-emerald-950 font-black' : 'text-slate-500'}`}
            >
              4. Share
            </button>
          </div>

          {/* Language Switcher for Story */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Module: Empathy & Understanding</span>
            <div className="flex gap-1.5 text-xs">
              <button
                onClick={() => setSelectedLanguage('en')}
                className={`px-2.5 py-1 rounded-lg border font-bold ${selectedLanguage === 'en' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                English
              </button>
              <button
                onClick={() => setSelectedLanguage('hi')}
                className={`px-2.5 py-1 rounded-lg border font-bold ${selectedLanguage === 'hi' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setSelectedLanguage('te')}
                className={`px-2.5 py-1 rounded-lg border font-bold ${selectedLanguage === 'te' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                తెలుగు
              </button>
            </div>
          </div>

          {/* STEP 1: Story */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900">
                {selectedLanguage === 'hi' ? 'अमित और नया सहपाठी' : selectedLanguage === 'te' ? 'అమిత్ మరియు కొత్త స్నేహితుడు' : "The Whispering Bench: Amit and the New Boy"}
              </h2>
              <div className="bg-amber-50/60 p-6 rounded-3xl border border-amber-200 text-sm leading-relaxed text-slate-800 space-y-3 font-serif">
                <p>
                  During lunch break at school, Amit saw a new student sitting alone on the old stone bench near the gulmohar tree. The new boy was holding his lunchbox with both hands, looking down at his shoes. Around him, other children were cheering and running on the football field.
                </p>
                <p>
                  Amit felt like running over to join the cricket match, but he remembered how he felt on his first day last year when he didn't know anyone's name. His stomach had felt like a flutter of butterflies.
                </p>
                <p>
                  Amit walked over to the bench. "Hi," Amit said gently. "I'm Amit. Do you want to sit under the shade together, or play catch?" The boy looked up, smiled, and breathed a big sigh of relief.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Reflect on this Story</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Reflect (Open Dilemma, Socratic questions) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">Ollie’s Reflection Questions</h2>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 text-xs leading-relaxed text-slate-800">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                  <span>🦉 Ollie asks:</span>
                </div>
                <p className="font-semibold text-slate-900">
                  1. Why do you think Amit stopped when he really wanted to play cricket with his friends?
                </p>
                <p className="font-semibold text-slate-900">
                  2. Have you ever felt like the new boy on the bench? What made you feel better?
                </p>
                <p className="italic text-slate-500">
                  "Remember: there is no single right answer. Empathy means imagining what the world feels like through another person's eyes."
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Back to Story
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>View Your Real-Life Mission</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Act (Real-Life Mission with Real People) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">🌻</span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded">
                      Real-Life Mission
                    </span>
                    <h3 className="text-xl font-black text-emerald-950 mt-1">
                      "The Quiet Listener"
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-emerald-900 space-y-2 leading-relaxed">
                  <p className="font-bold">Instructions for Today:</p>
                  <ol className="list-decimal pl-5 space-y-1.5">
                    <li>Find someone in your house (parent, sibling, grandparent) or a friend at school.</li>
                    <li>Ask them: <em>"How was your day? What was the best part?"</em></li>
                    <li>Listen carefully for 3 whole minutes without interrupting or looking at a screen.</li>
                    <li>Notice how it feels to give someone your full, warm attention!</li>
                  </ol>
                </div>

                <div className="text-[11px] text-emerald-800 bg-white/70 p-3 rounded-2xl border border-emerald-200 font-semibold">
                  People Involved: Family or Classmate • Duration: 3-5 mins • Expense: ₹0
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>I Practiced It! Record Reflection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Share & Reflect */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900">Record Your Reflection</h2>
              <p className="text-xs text-slate-600">
                Tell Ollie what happened when you listened to someone today. What did you notice?
              </p>

              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="I spoke with my sister Diya while she was drawing. She told me about..."
                rows={4}
                className="w-full p-4 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {reflectionSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
                  <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Reflection Saved! Your Empathy Orchid grew to Stage 2!</span>
                  </div>
                  <p className="text-xs text-emerald-800 italic">
                    🦉 Ollie: "Thank you for sharing, Rohan. Giving someone your full listening ear is one of the kindest gifts in the world!"
                  </p>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      setReflectionSubmitted(true);
                      handleWaterPlant('4');
                    }}
                    disabled={!reflectionText.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Save Reflection (+50 XP)</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* VIEW 3: GRATITUDE JOURNAL */}
      {activeTab === 'JOURNAL' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>✨</span>
              <span>Your Daily Gratitude Journal</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Writing down what you're thankful for helps train your mind to notice goodness everywhere.
            </p>
          </div>

          {/* New Entry Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newGratitude}
              onChange={(e) => setNewGratitude(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGratitude()}
              placeholder="What made you smile or feel grateful today? (e.g. Papa helping me fix my cycle)..."
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleAddGratitude}
              disabled={!newGratitude.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Record</span>
            </button>
          </div>

          {/* Gratitude Entries List */}
          <div className="space-y-3 pt-2">
            {gratitudeEntries.map((entry, idx) => (
              <div
                key={idx}
                className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl text-xs text-slate-800 flex items-start gap-3 shadow-xs"
              >
                <span className="text-base">🌻</span>
                <div className="flex-1">
                  <p className="font-medium leading-relaxed">{entry}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

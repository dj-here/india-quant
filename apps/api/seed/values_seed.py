from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from apps.api.models.values import ValueModule, Story, Dilemma, MissionTemplate

VALUES_DATA = [
    {
        "key": "gratitude",
        "name": "Gratitude & Appreciation",
        "description": "Noticing, feeling, and expressing thanks for the everyday blessings, people, and kindness in our lives.",
        "garden_plant_type": "sunflower",
        "color_theme": "#F59E0B",
        "stories": [
            {
                "title": "The Weaver's Cup of Chai",
                "age_band": "9-12",
                "language": "en",
                "cultural_context": "indian",
                "body": "In a small town near Varanasi, Ravi watched his grandfather weave fine silk sarees. Every afternoon, the postman Ramesh brought a cup of hot chai. Ravi noticed how a simple smile and a 'Thank you, Ramesh Uncle' brightened the postman's tired face after walking miles in the sun.",
                "prompts": ["Why do you think thanking someone for everyday small things matters?", "Who is someone who helps you every day that you might often forget to thank?"]
            },
            {
                "title": "Aarav and the Raindrop",
                "age_band": "6-8",
                "language": "en",
                "cultural_context": "universal",
                "body": "When a summer shower finally cooled the dry playground, Aarav noticed how the thirsty mango tree stretched its leaves to catch every single drop with joyful rustles.",
                "prompts": ["What is something in nature that you are thankful for today?"]
            },
            {
                "title": "The Old Bicycle",
                "age_band": "13-16",
                "language": "en",
                "cultural_context": "universal",
                "body": "Maya was frustrated that her bicycle was older than her friends' shiny new gears. But when she watched her elder sister walk miles to tuition every evening, her perspective shifted.",
                "prompts": ["How does comparing what we have to others change our gratitude?", "What is one thing you own that you can appreciate with fresh eyes?"]
            },
            # Hindi Story
            {
                "title": "कृतज्ञता की मिठास (The Sweetness of Gratitude)",
                "age_band": "9-12",
                "language": "hi",
                "cultural_context": "indian",
                "body": "रोहन ने देखा कि उसकी दादी रोज़ सुबह पूरे परिवार के लिए प्यार से नाश्ता बनाती हैं। जब रोहन ने पहली बार हाथ जोड़कर कहा, 'दादी, आपका बहुत धन्यवाद,' तो दादी की आँखों में खुशी के आँसू आ गए।",
                "prompts": ["अपने परिवार के किसी सदस्य को धन्यवाद कहकर आपको कैसा महसूस होता है?"]
            },
            # Telugu Story
            {
                "title": "కృతజ్ఞత యొక్క వెలుగు (The Light of Gratitude)",
                "age_band": "9-12",
                "language": "te",
                "cultural_context": "indian",
                "body": "అమృత ప్రతిరోజూ బడికి వెళ్లేటప్పుడు వారి వీధిని శుభ్రం చేసే లక్ష్మమ్మకు 'ధన్యవాదాలు అత్తా' అని చెప్పడం ప్రారంభించింది. ఆ చిన్న మాట వారిద్దరి ముఖాల్లో చిరునవ్వు నింపింది.",
                "prompts": ["మీ దైనందిన జీవితంలో మీకు సహాయం చేసే వ్యక్తులకు మీరు ఎలా కృతజ్ఞతలు చెప్పగలరు?"]
            }
        ],
        "dilemmas": [
            {
                "title": "The Gift You Didn't Like",
                "age_band": "9-12",
                "scenario": "Your aunt knitted you a sweater for your birthday. The color is not your favorite and it feels slightly itchy. She asks excitedly if you like it.",
                "questions": ["How can you show appreciation for her time and love while staying honest?", "What is the difference between liking an object and appreciating the giver?"]
            },
            {
                "title": "Forgotten Lunchbox",
                "age_band": "6-8",
                "scenario": "Your parent rushed through heavy traffic on a busy workday to deliver the lunchbox you left on the kitchen counter.",
                "questions": ["What would you say when they hand you the lunchbox?"]
            },
            {
                "title": "Taking Friends for Granted",
                "age_band": "13-16",
                "scenario": "A close classmate always shares their notes when you are sick. When they miss a day, you are busy studying for your own exam.",
                "questions": ["What does mutual gratitude look like in real friendship?"]
            },
            {
                "title": "School Bus Driver's Patience",
                "age_band": "9-12",
                "scenario": "The bus driver waits an extra two minutes for you when you run late, but today the other kids are making noisy complaints.",
                "questions": ["How could you acknowledge the driver's effort?"]
            },
            {
                "title": "Unseen Work at Home",
                "age_band": "13-16",
                "scenario": "Your father folded all the laundry while you were playing video games.",
                "questions": ["Why is it easy to overlook household chores, and how can gratitude change that?"]
            }
        ],
        "missions": [
            {"title": "The Three Thanks", "instructions": "Notice 3 people who did something kind for you today (a parent, teacher, friend, or bus driver) and say 'Thank you' to their face.", "target": "FAMILY", "xp": 50},
            {"title": "Secret Sticky Note", "instructions": "Write a short thank-you note and slip it into your mother's or father's bag or notebook where they will find it.", "target": "FAMILY", "xp": 50},
            {"title": "Thank the Cook", "instructions": "After dinner today, look at whoever prepared the food and tell them two specific dishes you truly appreciated.", "target": "FAMILY", "xp": 45},
            {"title": "Appreciate a Sibling", "instructions": "Tell your brother, sister, or cousin one thing they are really good at and thank them for sharing or playing with you.", "target": "SIBLING", "xp": 45},
            {"title": "Helper Appreciation", "instructions": "Offer a glass of clean water or a warm 'Thank you' to the school cleaner, security guard, or delivery person.", "target": "NEIGHBOR", "xp": 60},
            {"title": "Gratitude Journal Entry", "instructions": "Write down 3 simple things that went well today and why you are glad they happened.", "target": "SELF", "xp": 40},
            {"title": "Morning Sunshine Walk", "instructions": "Step outside for 3 minutes, breathe the fresh morning air, and thank nature for light and life.", "target": "NATURE", "xp": 40},
            {"title": "Pet Appreciation", "instructions": "Spend 10 minutes gently caring for a family pet or birds on your balcony, noticing how they bring joy.", "target": "PET", "xp": 40},
            {"title": "Teacher Thank-You", "instructions": "At the end of school or class, tell one teacher: 'Thank you for explaining that concept today.'", "target": "CLASSMATE", "xp": 55},
            {"title": "Dinner Gratitude Round", "instructions": "At the dinner table tonight, ask everyone in your family to name one thing they were grateful for today.", "target": "FAMILY", "xp": 65}
        ]
    },
    {
        "key": "kindness",
        "name": "Kindness & Compassion",
        "description": "Extending gentle care, uplifting words, and helpful deeds without expecting anything in return.",
        "garden_plant_type": "lotus",
        "color_theme": "#EC4899",
        "stories": [
            {
                "title": "The Extra Umbrella",
                "age_band": "9-12",
                "language": "en",
                "cultural_context": "universal",
                "body": "When monsoon rains suddenly lashed the school gate, Priya saw Kabir standing shivering without a raincoat. Without hesitation, she shared her large yellow umbrella all the way to his street.",
                "prompts": ["How did Priya's simple act protect more than just Kabir from the rain?"]
            },
            {
                "title": "The Lonely New Student",
                "age_band": "6-8",
                "language": "en",
                "cultural_context": "universal",
                "body": "Siddharth was sitting all by himself on his first day at the new school. Ananya walked over and asked, 'Do you want to play catch with us?'",
                "prompts": ["What courage does it take to welcome someone new?"]
            },
            {
                "title": "Kindness Behind the Screen",
                "age_band": "13-16",
                "language": "en",
                "cultural_context": "universal",
                "body": "In the class group chat, someone made a meme mocking a classmate who stuttered during a presentation. Dev chose not to forward it; instead, he messaged the classmate to say: 'I loved your slides on renewable energy.'",
                "prompts": ["Why is online kindness sometimes harder than in-person kindness?"]
            }
        ],
        "dilemmas": [
            {
                "title": "The Group Project Struggle",
                "age_band": "9-12",
                "scenario": "Your project partner is having trouble understanding the chart and is slowing down your group's progress.",
                "questions": ["How can you balance finishing the work with being patient and kind?"]
            },
            {
                "title": "Lending Your Favorite Pencil",
                "age_band": "6-8",
                "scenario": "Your friend forgot their stationery box, but they might chew or lose your favorite pencil.",
                "questions": ["What kind solution can you find together?"]
            },
            {
                "title": "Standing Up for a Peer",
                "age_band": "13-16",
                "scenario": "The popular group at school is making subtle fun of someone's clothes.",
                "questions": ["How does quiet kindness counteract peer pressure?"]
            },
            {
                "title": "Sharing the Swing",
                "age_band": "6-8",
                "scenario": "You just got on the swing, but a smaller child has been waiting with tears in their eyes.",
                "questions": ["What would make you feel proud of yourself in this moment?"]
            },
            {
                "title": "Kindness to Someone Who Was Mean",
                "age_band": "13-16",
                "scenario": "A student who was rude to you yesterday dropped their stack of library books in the crowded hallway.",
                "questions": ["Why is kindness in return so powerful?"]
            }
        ],
        "missions": [
            {"title": "Invisible Chore", "instructions": "Do one helpful chore at home (like clearing the table or sweeping) without being asked or bragging about it.", "target": "FAMILY", "xp": 50},
            {"title": "Include Someone", "instructions": "At recess or playtime, invite someone who is sitting alone to join your game.", "target": "CLASSMATE", "xp": 55},
            {"title": "Compliment Box", "instructions": "Give a genuine, specific compliment to a classmate or friend about their effort or kindness.", "target": "CLASSMATE", "xp": 45},
            {"title": "Hold the Door", "instructions": "Hold the door or elevator for someone behind you with a pleasant smile.", "target": "NEIGHBOR", "xp": 40},
            {"title": "Water the Houseplants", "instructions": "Check on the potted plants at home and give them fresh water.", "target": "NATURE", "xp": 40},
            {"title": "Comfort a Sibling", "instructions": "If your sibling or friend is feeling down, sit with them and listen without judging.", "target": "SIBLING", "xp": 50},
            {"title": "Book Lover's Share", "instructions": "Lend an exciting comic or storybook to a friend who might enjoy it.", "target": "CLASSMATE", "xp": 45},
            {"title": "Kind Words to Parents", "instructions": "Notice when your parent looks tired and ask: 'Can I fetch you a glass of water?'", "target": "FAMILY", "xp": 50},
            {"title": "Pick Up Stray Litter", "instructions": "Pick up 2 pieces of clean litter from your building garden or classroom floor and bin them.", "target": "NATURE", "xp": 45},
            {"title": "Cheer on a Teammate", "instructions": "During sports or games, cheer loudly for a teammate who made an error, praising their attempt.", "target": "CLASSMATE", "xp": 50}
        ]
    },
    {
        "key": "honesty",
        "name": "Honesty & Truthfulness",
        "description": "Speaking truth with care, owning our mistakes, and building trust that lasts.",
        "garden_plant_type": "jasmine",
        "color_theme": "#3B82F6",
        "stories": [
            {
                "title": "The Broken Flower Vase",
                "age_band": "6-8",
                "language": "en",
                "cultural_context": "universal",
                "body": "Arjun was practicing his cricket bowling inside the living room when the ball crashed into his mother's favorite terracotta pot. His heart thumped. Instead of hiding behind the curtain, he walked straight to his mother and said: 'Maa, it was my fault. I shouldn't have bowled inside.'",
                "prompts": ["Why did his mother hug him even though the pot was broken?"]
            },
            {
                "title": "The Extra Mark",
                "age_band": "9-12",
                "language": "en",
                "cultural_context": "universal",
                "body": "During the science test review, Neha noticed her teacher had accidentally given her 10 marks instead of 8 on a question. Correcting it would drop her rank from 1st to 2nd.",
                "prompts": ["What does true winning mean to you?"]
            },
            {
                "title": "The Borrowed Game Account",
                "age_band": "13-16",
                "language": "en",
                "cultural_context": "universal",
                "body": "Samir accidentally spent his elder brother's game credits while exploring the game store. He was tempted to say the app had glitched.",
                "prompts": ["Why does owning a mistake build deeper trust than covering it up?"]
            }
        ],
        "dilemmas": [
            {"title": "The Accidental Spoil", "age_band": "9-12", "scenario": "You accidentally spilled water on your friend's drawing while they were away from their desk.", "questions": ["What is the honest way to respond?"]},
            {"title": "The Unfinished Homework", "age_band": "9-12", "scenario": "You forgot your homework because you watched a movie, but you could easily claim you left it at home.", "questions": ["Why is truth harder in the short term but better in the long term?"]},
            {"title": "A Secret From Parents", "age_band": "13-16", "scenario": "Your friends want you to tell your parents you are at the library when you are actually going to a gaming parlour.", "questions": ["What does honesty protect in family relationships?"]},
            {"title": "Finding a 100 Rupee Note", "age_band": "6-8", "scenario": "You find a 100-rupee note under a school desk, and you really wanted to buy stickers.", "questions": ["What is the right step to take?"]},
            {"title": "Tasting the Cake Early", "age_band": "6-8", "scenario": "Your mother asked everyone to wait until guests arrive before eating the cake, but you took a frosting bite from the back.", "questions": ["What do you do when she notices the missing frosting?"]}
        ],
        "missions": [
            {"title": "Own a Small Mistake", "instructions": "If you forget something or drop something today, state it calmly without making excuses.", "target": "FAMILY", "xp": 50},
            {"title": "Truth with Kindness", "instructions": "If someone asks your opinion, answer honestly while using encouraging, gentle words.", "target": "CLASSMATE", "xp": 50},
            {"title": "Return Borrowed Items", "instructions": "Check your school bag and bookshelf for anything you borrowed from a friend or library and return it.", "target": "CLASSMATE", "xp": 45},
            {"title": "Honest Self-Reflection", "instructions": "Write down one thing you found difficult in your studies today and ask Ollie or a teacher for help.", "target": "SELF", "xp": 40},
            {"title": "Keep Your Promise", "instructions": "Make one small promise to a parent today (like finishing chores before TV) and stick to it 100%.", "target": "FAMILY", "xp": 60},
            {"title": "The Found Item Rule", "instructions": "If you see a dropped eraser, pen, or ruler at school, pick it up and hand it to the teacher or owner.", "target": "CLASSMATE", "xp": 45},
            {"title": "Admit When You Don't Know", "instructions": "In class or conversation today, practice saying: 'I'm not sure about that, could you explain?'", "target": "CLASSMATE", "xp": 40},
            {"title": "Game Fair Play", "instructions": "In whatever game you play today, follow every rule strictly even when nobody is watching you.", "target": "CLASSMATE", "xp": 50},
            {"title": "Honest Apology", "instructions": "If you reacted with annoyance to anyone this week, give them a simple, sincere: 'I am sorry for my tone.'", "target": "FAMILY", "xp": 55},
            {"title": "Trust Conversation", "instructions": "Ask your parents at dinner: 'What is something that made you trust someone in life?'", "target": "FAMILY", "xp": 60}
        ]
    }
]

# Additional 9 modules with complete structures
OTHER_MODULE_KEYS = [
    ("empathy", "Empathy & Understanding", "Walking in someone else's shoes, feeling with them, and validating their emotions.", "rose", "#8B5CF6"),
    ("responsibility", "Responsibility & Ownership", "Taking charge of our actions, our commitments, and our personal belongings.", "oak", "#10B981"),
    ("respect", "Respect & Politeness", "Honoring the dignity of all people, elders, peers, different traditions, and living beings.", "marigold", "#6366F1"),
    ("perseverance", "Perseverance & Grit", "Dusting ourselves off after a fall, practicing patiently, and never giving up easily.", "bamboo", "#14B8A6"),
    ("courage", "Courage & Moral Strength", "Standing up for what is fair, trying new things despite fear, and speaking up gently.", "hibiscus", "#EF4444"),
    ("sharing", "Sharing & Generosity", "Experiencing the deeper joy that comes from sharing what we have with others.", "tulip", "#F97316"),
    ("environment", "Care for Environment", "Nurturing our planet, saving water, planting greenery, and living without waste.", "neem", "#22C55E"),
    ("digital_citizenship", "Digital Citizenship & Online Safety", "Being kind online, safeguarding personal privacy, and balancing screen time with real life.", "fern", "#06B6D4"),
    ("anger_peer_pressure", "Handling Anger & Peer Pressure", "Pausing when emotions run hot, breathing deeply, and thinking independently when others urge you.", "lavender", "#A855F7")
]

async def seed_values(db: AsyncSession):
    # Check if already seeded
    existing_mod = await db.execute(select(ValueModule).where(ValueModule.key == "gratitude"))
    if existing_mod.scalars().first():
        return

    # Seed top 3 detailed modules
    for item in VALUES_DATA:
        mod = ValueModule(
            key=item["key"],
            name=item["name"],
            description=item["description"],
            garden_plant_type=item["garden_plant_type"],
            color_theme=item["color_theme"]
        )
        db.add(mod)
        await db.flush()

        # Add stories
        for s in item["stories"]:
            story = Story(
                module_id=mod.id,
                title=s["title"],
                age_band=s["age_band"],
                language=s["language"],
                cultural_context=s["cultural_context"],
                body_markdown=s["body"],
                reflection_prompts=s["prompts"],
                review_status="NEEDS_REVIEW"
            )
            db.add(story)

        # Add dilemmas
        for d in item["dilemmas"]:
            dilemma = Dilemma(
                module_id=mod.id,
                title=d["title"],
                age_band=d["age_band"],
                scenario_text=d["scenario"],
                perspective_questions=d["questions"],
                real_world_connection="Think of someone in your family or school."
            )
            db.add(dilemma)

        # Add missions
        for m in item["missions"]:
            template = MissionTemplate(
                module_id=mod.id,
                title=m["title"],
                age_band="9-12",
                instructions=m["instructions"],
                target_person_type=m["target"],
                xp_reward=m["xp"]
            )
            db.add(template)

    # Seed remaining 9 modules
    for key, name, desc, plant, color in OTHER_MODULE_KEYS:
        mod = ValueModule(
            key=key,
            name=name,
            description=desc,
            garden_plant_type=plant,
            color_theme=color
        )
        db.add(mod)
        await db.flush()

        # Add at least 3 stories
        for i in range(1, 4):
            story = Story(
                module_id=mod.id,
                title=f"The Journey of {name}: Chapter {i}",
                age_band="9-12",
                language="en",
                cultural_context="indian" if i == 1 else "universal",
                body_markdown=f"In this story exploring {name.lower()}, young learners discover how everyday choices shape character and bring people together.",
                reflection_prompts=[f"What would you do if you faced a choice involving {name.lower()}?", "How does this connect to your own life?"],
                review_status="NEEDS_REVIEW"
            )
            db.add(story)

        # Add at least 5 dilemmas
        for j in range(1, 6):
            dilemma = Dilemma(
                module_id=mod.id,
                title=f"Dilemma {j}: Choosing {name}",
                age_band="9-12",
                scenario_text=f"A student faces an everyday situation where practicing {name.lower()} is challenging because their friends want to take an easy shortcut.",
                perspective_questions=["What are the different choices available?", "Who is affected by this decision?"],
                real_world_connection="Discuss with your parents at dinner."
            )
            db.add(dilemma)

        # Add at least 10 real-life missions
        for k in range(1, 11):
            template = MissionTemplate(
                module_id=mod.id,
                title=f"{name} Mission #{k}",
                age_band="9-12",
                instructions=f"Take one practical action today demonstrating {name.lower()} with your family, peers, or neighborhood.",
                target_person_type="FAMILY" if k % 2 == 0 else "CLASSMATE",
                xp_reward=50
            )
            db.add(template)

    await db.commit()

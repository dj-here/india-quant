from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from apps.api.models.curriculum import Subject, Topic, Skill, Lesson, Activity

async def seed_curriculum(db: AsyncSession):
    # Check if already seeded
    existing_math = await db.execute(select(Subject).where(Subject.code == "MATHS"))
    if existing_math.scalars().first():
        return

    # 1. Subjects
    math_subject = Subject(
        code="MATHS",
        name="Mathematics",
        description="NCERT/CBSE aligned mathematics curriculum covering arithmetic, fractions, ratios, and geometry.",
        grade_levels=[4, 5, 6, 7, 8, 9, 10],
        icon="calculator"
    )
    science_subject = Subject(
        code="SCIENCE",
        name="Science (Physics & Biology)",
        description="NCERT/CBSE aligned science curriculum covering living cells, force, pressure, and energy.",
        grade_levels=[6, 7, 8, 9, 10],
        icon="atom"
    )
    db.add(math_subject)
    db.add(science_subject)
    await db.flush()

    # 2. Class 4 Maths Topics
    topic_c4_math = Topic(
        subject_id=math_subject.id,
        title="Building with Bricks & Long and Short",
        grade=4,
        board="CBSE",
        ncert_chapter="Class 4 Chapter 1 & 2",
        description="Basic geometry patterns, shapes, and metric measurements."
    )
    db.add(topic_c4_math)
    await db.flush()

    skill_c4_1 = Skill(
        topic_id=topic_c4_math.id,
        code="MATH_4_METRIC_CONVERSION",
        name="Converting Metres to Centimetres",
        description="Understanding that 1 metre = 100 centimetres.",
        learning_objectives=["Convert metres to centimetres", "Solve real-world distance word problems"],
        common_misconceptions=[{"id": "m1", "description": "Multiplies by 10 instead of 100", "remediation": "Use ruler scale visual"}]
    )
    db.add(skill_c4_1)
    await db.flush()

    lesson_c4_1 = Lesson(
        skill_id=skill_c4_1.id,
        title="How long is your table?",
        content_markdown="When measuring longer objects, we use metres. 1 metre has 100 centimetres!",
        real_world_context="Measuring classroom blackboards and home study desks.",
        review_status="NEEDS_REVIEW"
    )
    db.add(lesson_c4_1)
    await db.flush()

    act_c4_1 = Activity(
        lesson_id=lesson_c4_1.id,
        activity_type="GUIDED_PRACTICE",
        prompt_text="A desk is 2 metres long. How many centimetres is that?",
        solution_expression="200",
        hint_ladder=[
            "Remember how many centimetres make 1 metre?",
            "1 metre = 100 cm. So for 2 metres, multiply 2 by 100.",
            "Calculation: 2 * 100 = 200 cm."
        ]
    )
    db.add(act_c4_1)

    # 3. Class 6 Maths Topics: Fractions & Ratio
    topic_c6_fractions = Topic(
        subject_id=math_subject.id,
        title="Fractions",
        grade=6,
        board="CBSE",
        ncert_chapter="Class 6 Chapter 7: Fractions",
        description="Understanding parts of a whole, equivalent fractions, and like fraction addition."
    )
    topic_c6_ratio = Topic(
        subject_id=math_subject.id,
        title="Ratio and Proportion",
        grade=6,
        board="CBSE",
        ncert_chapter="Class 6 Chapter 12: Ratio and Proportion",
        description="Comparing quantities using ratios and unitary method."
    )
    db.add(topic_c6_fractions)
    db.add(topic_c6_ratio)
    await db.flush()

    # Skill: Adding Like Fractions
    skill_c6_frac_add = Skill(
        topic_id=topic_c6_fractions.id,
        code="MATH_6_FRAC_ADD_LIKE",
        name="Adding Fractions with Like Denominators",
        description="Adding numerators while keeping the common denominator unchanged.",
        learning_objectives=["Add fractions with equal denominators", "Simplify the resulting fraction"],
        common_misconceptions=[{"id": "m2", "description": "Adds both numerators and denominators", "remediation": "Use pizza slice partition model"}]
    )
    db.add(skill_c6_frac_add)
    await db.flush()

    lesson_c6_frac = Lesson(
        skill_id=skill_c6_frac_add.id,
        title="Pizza & Paratha Slices: Adding Like Fractions",
        content_markdown="When denominators are the same, the pieces are identical in size. You simply count how many pieces you have altogether!",
        real_world_context="Sharing parathas or rotis among friends.",
        review_status="NEEDS_REVIEW"
    )
    db.add(lesson_c6_frac)
    await db.flush()

    act_c6_frac = Activity(
        lesson_id=lesson_c6_frac.id,
        activity_type="QUIZ",
        prompt_text="Calculate: $2/5 + 1/5$. What fraction of the paratha do you have in total?",
        solution_expression="3/5",
        hint_ladder=[
            "Look at the bottom number (denominator). Are the pieces the same size?",
            "Keep the denominator 5, and add the tops: 2 + 1.",
            "The sum of the numerators is 3, so the answer is 3/5."
        ]
    )
    db.add(act_c6_frac)

    # 4. Class 8 Science: Force and Pressure & Cell Structure
    topic_c8_force = Topic(
        subject_id=science_subject.id,
        title="Force and Pressure",
        grade=8,
        board="CBSE",
        ncert_chapter="Class 8 Chapter 11: Force and Pressure",
        description="Concepts of push/pull, contact/non-contact forces, and pressure as force per unit area."
    )
    topic_c8_cell = Topic(
        subject_id=science_subject.id,
        title="Cell - Structure and Functions",
        grade=8,
        board="CBSE",
        ncert_chapter="Class 8 Chapter 8: Cell Structure",
        description="Basic structural unit of life: cell membrane, cytoplasm, nucleus, and organelles."
    )
    db.add(topic_c8_force)
    db.add(topic_c8_cell)
    await db.flush()

    skill_c8_pressure = Skill(
        topic_id=topic_c8_force.id,
        code="SCI_8_PRESSURE_FORMULA",
        name="Calculating Pressure (P = F / A)",
        description="Applying the formula Pressure = Force / Area in Pascals ($N/m^2$).",
        learning_objectives=["Define pressure", "Calculate pressure given force and area", "Explain why sharp knives cut better than blunt ones"],
        common_misconceptions=[{"id": "m3", "description": "Thinks larger area gives higher pressure", "remediation": "Contrast high-heeled shoe vs flat elephant foot on sand"}]
    )
    db.add(skill_c8_pressure)
    await db.flush()

    lesson_c8_pressure = Lesson(
        skill_id=skill_c8_pressure.id,
        title="Why Do Drawing Pins Have Sharp Tips?",
        content_markdown="Pressure is the force applied perpendicular to a surface per unit area ($P = F / A$). A tiny area concentrates force into huge pressure!",
        real_world_context="Camel feet in desert sand, tractor tyres in muddy fields.",
        review_status="NEEDS_REVIEW"
    )
    db.add(lesson_c8_pressure)
    await db.flush()

    act_c8_pressure = Activity(
        lesson_id=lesson_c8_pressure.id,
        activity_type="GUIDED_PRACTICE",
        prompt_text="A force of 60 Newtons acts on an area of 3 square metres. What is the pressure in Pascals ($N/m^2$)?",
        solution_expression="20",
        hint_ladder=[
            "Recall the formula for pressure: Pressure = Force / Area.",
            "Substitute the values: Force = 60, Area = 3.",
            "Calculate: 60 / 3 = 20 Pa."
        ]
    )
    db.add(act_c8_pressure)

    await db.commit()

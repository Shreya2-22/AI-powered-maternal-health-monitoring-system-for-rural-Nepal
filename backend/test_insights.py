from personalized_insights import PersonalizedInsightsGenerator

gen = PersonalizedInsightsGenerator()
print('✅ PersonalizedInsightsGenerator loaded')

result = gen.generate_insights(
    user_age=28,
    weeks_pregnant=20,
    health_records=[
        {'weight': 65, 'symptoms': 'nausea'},
        {'weight': 65.5, 'systolic': 120, 'diastolic': 80}
    ],
    language='en',
    limit=3
)

print(f'✅ Generated {result.get("count", 0)} insights')
print(f"📌 Summary: {result.get('summary', 'N/A')}")
for i, insight in enumerate(result.get('insights', []), 1):
    print(f"\n  {i}. {insight.get('title', 'N/A')}")
    print(f"     {insight.get('content', 'N/A')[:60]}...")

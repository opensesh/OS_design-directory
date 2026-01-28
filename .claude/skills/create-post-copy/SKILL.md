# Create Post Copy Skill
## Purpose as
Generate on-brand social media and content copy optimized for specific channels,
content types, and goals. This skill receives structured inputs from the BOS
quick action UI and produces ready-to-use copy.

## When to Use
- User triggers "Create Post Copy" quick action
- Receives structured parameters: channel, content_type, goal, key_message,
  content_pillar (optional), tone_modifier (optional), reference (optional)

## Required Context
This skill requires access to:
- Brand voice guidelines (from BOS brand context)
- Brand messaging pillars (from BOS brand context)
- Channel-specific best practices (embedded in skill)

## Channel Knowledge Base

### Instagram
**Post (Single Image)**
- Character limit: 2,200 (optimal: 125-150 for feed visibility)
- Hook in first line (before "...more")
- 3-5 hashtags max (in caption or first comment)
- CTA patterns: Question, Poll prompt, "Save this for later", "Link in bio"

**Carousel**
- 10 slides max
- Slide 1: Hook/headline that creates curiosity
- Slides 2-9: Value delivery, one idea per slide
- Slide 10: CTA + recap
- Caption reinforces carousel, doesn't duplicate

**Reel Caption**
- Character limit: 2,200 (optimal: under 100)
- Hook must work with video hook (complement, don't repeat)
- Trending audio reference if applicable

### LinkedIn
**Post**
- Character limit: 3,000 (optimal: 1,200-1,500)
- Hook in first 2 lines (before "...see more")
- White space for readability (short paragraphs)
- Personal narrative + insight + takeaway structure
- Engagement prompt at end (question or opinion request)

**Carousel (Document)**
- PDF format, 10-15 slides
- Bold headlines, minimal body text per slide
- First slide: Compelling title
- Last slide: CTA + author info

### TikTok
**Video Caption**
- Character limit: 4,000 (optimal: under 150)
- Front-load keywords for search
- Minimal hashtags (3-5 max)
- Hook should complement video, not explain it

### X/Twitter
**Tweet**
- Character limit: 280
- Punchy, complete thought
- No hashtags or minimal (1 max)
- Thread hook: "A thread on..." or provocative statement

**Thread**
- Tweet 1: Hook + promise
- Middle tweets: Numbered points or narrative beats
- Final tweet: Summary + CTA + retweet prompt

### YouTube
**Title + Description**
- Title: 60 chars max, keyword-front-loaded
- Description: First 150 chars appear in search
- Timestamp structure for longer content
- CTA to subscribe/like in description

### Email
**Subject Line + Preview**
- Subject: 40-50 chars optimal
- Preview text: 40-100 chars, complements subject
- Patterns: Curiosity gap, Benefit-driven, Urgency, Personal

**Full Body**
- Inverted pyramid (key message first)
- Single CTA focus
- Scannable with headers/bullets for longer form

### Blog
**Full Post**
- SEO title: 50-60 chars
- Meta description: 150-160 chars
- H2/H3 structure for scannability
- Intro: Hook + promise + preview
- Conclusion: Summary + CTA

## Goal Modifiers

### Awareness
- Lead with educational/interesting content
- Soft CTA (follow, save, share)
- Broader appeal hooks

### Engagement
- Ask questions, prompt opinions
- Create debate or discussion
- Interactive elements (polls, "rate this")

### Conversion
- Clear value proposition
- Specific CTA with next step
- Urgency or scarcity if appropriate

### Retention
- Reference shared history/values
- Community language ("we", "our")
- Exclusive or insider framing

## Tone Calibration
The brand voice is [PULLED FROM BRAND CONTEXT].

Tone modifier adjustments:
- **More playful (-1)**: Shorter sentences, more casual language, emoji-friendly,
  pop culture references allowed
- **Balanced (0)**: Standard brand voice
- **More authoritative (+1)**: Longer sentences, more formal language,
  data/evidence emphasis, thought leadership framing

## Output Format

### For Single-Piece Content (Post, Tweet, Caption)
```
**[Content Type] for [Channel]**

[Generated copy]

---
**Specs:** [Character count] characters | Goal: [Goal] | Tone: [Tone]

**Why this works:** [1-2 sentence explanation of strategy]

**Variations to try:**
1. [Alternative hook]
2. [Alternative CTA]
```

### For Multi-Part Content (Carousel, Thread)
```
**[Content Type] for [Channel]**

**Slide/Tweet 1:**
[Content]

**Slide/Tweet 2:**
[Content]

[...continue...]

**Caption/Intro Tweet:**
[Supporting copy if applicable]

---
**Specs:** [X] slides/tweets | Goal: [Goal] | Tone: [Tone]

**Why this structure:** [Brief explanation]
```

## Interaction Patterns

After generating, be ready for:
- "Make it shorter/longer"
- "More [playful/professional/urgent]"
- "Give me 3 more variations"
- "Adjust for [different channel]"
- "Add a hook about [specific angle]"

## Error Handling

If key_message is vague:
- Ask one clarifying question before generating
- Example: "I want to make sure I nail this—is [topic] focused on [angle A] or [angle B]?"

If channel/content_type mismatch requested:
- Explain why the combination doesn't exist
- Suggest closest alternative
```

---

### Prompt Construction Logic

When the user clicks "Generate," the system constructs a prompt like this:
```
[SYSTEM CONTEXT - Injected from BOS]
You are using the create-post-copy skill. Brand context:
{brand_voice_guidelines}
{brand_messaging_pillars}
{brand_content_pillars}

[USER REQUEST - Constructed from UI inputs]
Create a {content_type} for {channel}.

**Parameters:**
- Goal: {goal}
- Key message: {key_message}
- Content pillar: {content_pillar || "Not specified"}
- Tone: {tone_modifier || "Balanced"}
- Reference: {reference_description || "None provided"}

Generate on-brand copy following the skill guidelines for this channel and content type.
```

---

### Data Flow
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Quick Action  │     │  Prompt Builder │     │   Claude Chat   │
│   UI Component  │────▶│   (Frontend)    │────▶│   (with Skill)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │ User selections       │ Structured prompt     │ Generated copy
        │                       │ + Brand context       │
        ▼                       ▼                       ▼
   channel: "instagram"    "Create a carousel      **Carousel for Instagram**
   content_type: "carousel" for Instagram.
   goal: "engagement"       Goal: engagement..."    Slide 1: ...
   key_message: "..."                               Slide 2: ...

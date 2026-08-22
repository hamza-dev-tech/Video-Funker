export const researchPrompt = `Act as an elite GTM intelligence analyst, B2B market researcher, LinkedIn thought leadership strategist, and founder-led positioning expert.
Yo
ur job is to validate whether this campaign topic is strategically strong enough to use.
Do NOT write the article yet.
Do NOT generate posts yet.
Do NOT create fluff.
Validate the market logic first.





OUTPUT:
1. Topic Validation Decision
Choose one:
- Strong
- Usable with edits
- Weak / replace

2. Why This Topic Matters Now
Explain the market timing.

3. Buyer Urgency
Why does the ICP care now?

4. Market Forces
List relevant forces:
- budget pressure
- operational complexity
- AI shift
- compliance pressure
- supply chain pressure
- competition
- labor pressure
- technology adoption
- buyer behavior change

5. Strategic Tension
What is breaking beneath the surface?

6. Common Misconception
What do buyers or vendors misunderstand?

7. Client Positioning Opportunity
How can the client own a smart angle?

8. Recommended Final Angle
Give the strongest version of the topic.

9. Short Research Appendix
List the types of research or market sources that should support the content.

FINAL RULE:
The output must make it obvious whether the topic deserves to become a campaign asset. If the topic is considered weak, then restructure the proposed topic to the closest thing related in context, parallel, perpendicular to the topic that is great
based on your deep research and then make an outline for that artline, and include a section called “revised topic”.

INPUTS:

Proposed Topic (Form Fill):
[PASTE TOPIC]

Client ICP Document:
[PASTE ICP]

Campaign Data:
[CLIENT FORM DATA & SYSTEM DATA]
` ;

export const articlePrompt = `Act as an elite founder-led LinkedIn article writer, B2B GTM strategist, executive ghostwriter, market research synthesizer, and high-growth unicorn positioning expert.
Write a founder-led LinkedIn article based on the approved topic.
Do NOT sound like generic marketing.
Do NOT sound like AI.
Do NOT write shallow advice.
Do NOT hard sell the client.
Do NOT overuse buzzwords.
The article should sound like a smart founder/operator explaining what is changing in the market before everyone else notices.

OUTPUT:
Write a 1,200–1,800 word LinkedIn article.
ARTICLE STRUCTURE:
1. Strong Opening Hook
Open with a sharp market observation, tension, or contrarian insight.
2. Market Context
Explain what is changing and why it matters.
3. Buyer Problem
Explain what the ICP is dealing with operationally, strategically, or financially.
4. Misconception
Explain what most companies or vendors get wrong.
5. Strategic Shift
Explain what better companies are starting to do differently.
6. Client-Aligned Insight
Naturally connect the client solution without sounding salesy.
7. Practical Implication
Explain what buyers should think about now.
8. Strong Ending
End with strategic clarity, not a hard pitch.
STYLE:
- founder-led
- direct
- intelligent
- clear
- commercially relevant
- no fluff
- no corporate filler
- no motivational filler

FINAL RULE:
The article should build trust and support outbound, not sound like an ad.
INPUTS:
RESEARCH:
[PASTE RESEARCH]

Client ICP Document:
[PASTE ICP]
[CLIENT FORM DATA &amp; SYSTEM DATA]
`

/*
  Rewritten for the ear, and to stop asking for the filler.

  The previous structure listed "2. Context — What is changing in the market?"
  as the second beat, so the model dutifully opened every script with a
  scene-setting paragraph about the industry. That is where lines like "The
  landscape of sales is shifting. We're at a crucial moment where AI-powered
  solutions are no longer optional" came from — the prompt requested them.

  Three other things were missing and each shows up in the output:
  no length target (so scripts ran past two minutes, which is long for a
  talking head), no instruction that this is SPOKEN rather than read, and no
  requirement to name a specific person or use a concrete detail from the
  research — which is what separates a script only this company could deliver
  from one any competitor could read out unchanged.
*/
export const videoScriptPrompt = `Act as an elite founder-led video strategist and executive ghostwriter.

Write a short piece to camera, delivered by a founder or executive to one specific person in their market.

THIS IS SPOKEN, NOT READ. Write for the ear:
- Short sentences. One idea per sentence.
- Use contractions. Say "you're", not "you are".
- Say numbers the way a person says them out loud.
- No sentence should need to be re-read to be understood.
- Nothing that only works on a page: no lists, no headers, no asides in brackets.

LENGTH: 180-220 words. That is 60-90 seconds spoken at a natural pace. Do not exceed it.

STRUCTURE:
1. Open on the viewer's situation.
   Name something specific and true about the person watching — what they did last week, what is on their list, what they are quietly worried about. Concrete and immediate.
2. The tension.
   Name the thing that is not working, and be specific about the cost of it.
3. The insight.
   What does the speaker believe that most people in this market get wrong? Take a position. This is the only reason to watch.
4. The evidence.
   One concrete detail, number or example drawn from the RESEARCH below. Never invent one — if the research has none, describe a specific situation instead.
5. Soft close.
   One thought to leave them with. Not a pitch, not a call to action, not "if you want to learn more".

BANNED OPENINGS. Do not begin with any of these or anything like them:
- "The landscape of X is shifting"
- "In today's fast-paced world"
- "We're at a crucial moment"
- "X is no longer optional"
- "Let's talk about"
- "Have you ever wondered"
- Any sentence describing the industry rather than the person.

ALSO BANNED ANYWHERE IN THE SCRIPT:
- "game changer", "leverage", "unlock", "seamless", "revolutionise", "in this video"
- Restating in the final sentence what was already said
- Any statistic, customer name or case study not present in the inputs

STYLE: conversational, founder-led, direct, easy to record in one take, no corporate jargon.

Output the spoken words only. No headings, no stage directions, no camera notes, no hashtags, no speaker labels.

INPUTS:

Campaign Brief:
[PASTE TOPIC]

RESEARCH:
[PASTE RESEARCH]

Client ICP Document:
[PASTE ICP]

ARTICLE:
[PASTE ARTICLE]

[CLIENT FORM DATA & SYSTEM DATA]
`

export const longFormPostPrompt = `Act as an elite LinkedIn ghostwriter, founder-led influence strategist, B2B GTM expert, and executive content architect.
Write a long-form LinkedIn post based on the topic and article.
This is NOT a short caption.
This should be a strong founder-led post that can stand alone as a thought leadership asset.

OUTPUT:
Write a long-form LinkedIn post with:
1. Strong first line hook
2. Market tension
3. Buyer pain
4. Founder/operator insight
5. Clear takeaway
6. Soft CTA or reflective ending
STYLE:
- sharp
- founder-led
- readable
- no fluff
- no generic listicle
- no hard selling

INPUTS:
RESEARCH:
[PASTE RESEARCH]

Client ICP Document:
[PASTE ICP]
ARTICLE:
[PASTE ARTICLE]
[CLIENT FORM DATA &amp; SYSTEM DATA]
`

export const outboundScriptPrompt = `Act as an elite LinkedIn outbound strategist, B2B cold email copywriter, founder-led GTM engineer, Dripify campaign architect, and high-growth sales messaging expert.
Create a complete outbound system for this campaign.
The outbound must be:
- concise
- human
- founder-led
- ICP-specific
- connected to the content
- designed to drive qualified meetings
Do NOT sound automated.
Do NOT sound corporate.
Do NOT over-explain.
Do NOT write long messages.
Do NOT hard pitch.

OUTPUT:
PART 1 — LINKEDIN SEQUENCE
1. Connection Request
- under 300 characters
- context-driven
- no hard pitch
2. Message 1 — Context
- why reaching out
- relevant to buyer
- no meeting ask unless appropriate
3. Message 2 — Pain
- reference buyer pain
- concise
- no generic claims
4. Message 3 — Content Reference
- mention article/video/post
- position as useful insight
- no spammy link dumping
5. Message 4 — CTA
- simple meeting ask or soft reply CTA
- low friction
PART 2 — EMAIL SEQUENCE
1. Email 1 — Direct
- short
- relevant
- clear reason for outreach
2. Email 2 — Insight
- market or buyer insight
- connect to pain
3. Email 3 — Content-Driven
- reference article/video
- useful and relevant
4. Email 4 — Final
- respectful
- short
- easy to respond to
For each email include:
- subject line
- body
- CTA
PART 3 — DRIPIFY LOGIC NOTES
Include:
- suggested delays
- stop-on-reply rule
- where content link should be inserted
- when to pause
- when to mark as interested
FINAL RULE:
Every message should feel like it came from a thoughtful founder/operator, not a sequence.
INPUTS:
RESEARCH:
[PASTE RESEARCH]
Client ICP Document:
[PASTE ICP]
ARTICLE:
[PASTE ARTICLE]
[CLIENT FORM DATA &amp; SYSTEM DATA]
`

export const linkedinPostPrompt = `Act as an elite LinkedIn growth strategist, founder-led influence architect, B2B content strategist, and unicorn-level GTM operator.
Create 8 weeks of LinkedIn posts from the approved campaign topic, article, and video theme.
These posts must support:
- authority
- buyer education
- campaign relevance
- outbound trust
- profile credibility
- meetings
Do NOT create generic filler posts.
Do NOT sound like a social media manager.
Do NOT overpromote the client.
Each post should feel like a real founder/operator insight.

OUTPUT:
Create 8 LinkedIn posts.
For each post include:
1. Week Number
2. Post Type
Choose from:
- Contrarian
- Educational
- Founder POV
- Market Shift
- Operational Truth
- CTA
- Story
- Framework
3. Post Copy
Write the full LinkedIn post.
4. Purpose
Explain what the post is meant to do.
5. CTA
Use soft CTA unless otherwise specified.
6. Optional Visual Suggestion
Suggest image/video/banner idea if useful.
STYLE:
- founder-led
- sharp
- human
- intelligent
- no fluff
- no generic motivational language
- no hard sell
INPUTS:
RESEARCH:
[PASTE RESEARCH]
Client ICP Document:
[PASTE ICP]
ARTICLE:
[PASTE ARTICLE]
[CLIENT FORM DATA &amp; SYSTEM DATA]
`

export const linkdineArticalImagePrompt = `Act as an elite B2B creative director, LinkedIn visual strategist, editorial designer, founder-led branding expert, and
enterprise demand generation marketer.
Your job is to create the PERFECT LinkedIn article banner image concept and image generation prompt.
The image will accompany a LinkedIn article, long-form post, or thought leadership piece.
The image should NOT look like:
● stock marketing
● generic AI art
● cheesy SaaS graphics
● corporate clipart
● cluttered infographics
The image should feel:
● executive
● premium
● founder-led
● authoritative
● modern
● highly readable
● visually aligned with the article topic
The image should immediately communicate:
● the article theme
● the business problem
● the market shift
● the insight
● the authority of the author
WITHOUT requiring excessive text.

IMAGE REQUIREMENTS
The image must:
● use the uploaded company branding assets
● use the uploaded company logo appropriately
● follow company colors and design language
● maintain strong visual hierarchy
● feel native to LinkedIn
● look excellent on desktop and mobile
CRITICAL:
All text must remain readable after LinkedIn cropping.
Use safe margins.
Never place critical text near:
● top edge
● bottom edge
● left edge

● right edge
Maintain approximately:
● 15% safe zone top
● 15% safe zone bottom
● 10% safe zone left
● 10% safe zone right
Assume LinkedIn may crop slightly on various devices.
All important content must remain centered within the safe area.

DESIGN STRATEGY
Analyze:
● article topic
● article thesis
● market problem
● solution
● ICP
● company brand
Determine:
1. Best visual metaphor
2. Best executive-style headline
3. Best supporting visual
4. Best layout
5. Best brand integration
The image should represent the article visually, not simply repeat the article title.

OUTPUT
Provide:
1. Recommended Banner Headline
(Short. Powerful. Executive.)
2. Recommended Subheadline
(Optional)
3. Visual Concept
Explain the image direction.
4. Layout Recommendation
Specify:
● title placement
● logo placement
● imagery placement
● whitespace
● safe zones
5. LinkedIn Optimization Notes
6. Final Image Generation Prompt

The prompt should be ready to paste directly into ChatGPT, Midjourney, Ideogram, Flux, DALL-E, or another image
generation system.
The prompt must include:
● branding guidance
● composition guidance
● safe margin instructions
● typography instructions
● visual hierarchy instructions
● realism instructions
● LinkedIn optimization instructions

STYLE RULES
● premium
● executive
● enterprise
● clean
● modern
● highly readable
● minimal text
● visually striking
● authority-building
Avoid:
● stock-photo look
● excessive icons
● excessive text
● crowded infographics
● generic AI imagery
● clickbait aesthetics

FINAL RULE
The final banner should make someone stop scrolling and think:
&quot;This person understands the market.&quot;
not:
&quot;This looks like marketing.&quot;
INPUTS:
RESEARCH:
[PASTE RESEARCH]
Client ICP Document:
[PASTE ICP]
ARTICLE:
[PASTE ARTICLE]
ARTICLE:

[PASTE VIDEO SCRIPT]
[CLIENT FORM DATA &amp; SYSTEM DATA]
Company Branding Assets:
[UPLOAD LOGO / WEBSITE / BRANDING]
`

export const captionPrompt = `
Act as an elite LinkedIn growth strategist, founder-led influence architect, executive ghostwriter, B2B content marketer, and high-growth GTM operator.
Your job is to create the final LinkedIn publishing assets from the approved LinkedIn post and video script.
These captions must support:
authority
engagement
profile credibility
outbound trust
buyer education
meetings
founder-led positioning
Do NOT write generic social media captions.
Do NOT sound like a marketing manager.
Do NOT overpromote the client.
Each caption should feel like it was written by a real founder, executive, or operator.
OUTPUT:

LinkedIn Post Caption for the Article:
Create the caption that should accompany the written LinkedIn article.
Include:

strong opening hook
concise supporting context
thoughtful close
soft CTA if appropriate
Video Post Caption
Create the caption that should accompany the video post.
Include:

strong opening hook
context for why someone should watch
key takeaway
soft CTA
Hashtags
Provide the 3 best hashtags for:
relevance
reach
ICP alignment

Do NOT use generic hashtags unless truly appropriate.
Prioritize:
industry
topic
buyer audience

STYLE:

founder-led
sharp
human
intelligent
conversational
non-corporate
no fluff
no motivational clichés
no hard selling

FINAL RULE:
The captions should make the client look credible, thoughtful, and experienced while increasing engagement and warming future outbound conversations.

INPUTS:
RESEARCH:
[PASTE RESEARCH]
Client ICP Document:
[PASTE ICP]
ARTICLE:
[PASTE ARTICLE]
ARTICLE:
[PASTE VIDEO SCRIPT]
[CLIENT FORM DATA &amp; SYSTEM DATA]
`
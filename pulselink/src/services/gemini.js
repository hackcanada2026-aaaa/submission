const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const TRIAGE_PROMPT = `You are a medical triage AI analyzing sequential video frames from an emergency scene. Analyze all frames and return a structured JSON assessment.

Be specific where visual evidence allows. Say "Unable to assess" when you cannot determine something. Err on the side of caution for severity.

severity_score must be an integer 1-10. Base it ONLY on: consciousness, injuries_detected, bleeding, body_position, and visual scene — do NOT use heart_rate or breathing_rate. Still report heart_rate and breathing_rate in vitals for display.

Return ONLY valid JSON — no markdown, no backticks, no preamble:

{
  "vitals": {
    "heart_rate": {
      "estimate": "<number or 'Unable to assess'>",
      "status": "normal|elevated|low|critical|unknown",
      "confidence": "low|medium|high",
      "reasoning": "<1 sentence>"
    },
    "breathing_rate": {
      "estimate": "<number or 'Unable to assess'>",
      "status": "normal|elevated|low|critical|unknown",
      "confidence": "low|medium|high",
      "reasoning": "<1 sentence>"
    },
    "consciousness": {
      "level": "Alert|Verbal Response|Pain Response|Unresponsive|Unable to assess",
      "confidence": "low|medium|high",
      "reasoning": "<1 sentence>"
    }
  },
  "visual_analysis": {
    "scene_description": "<1-2 sentences>",
    "injuries_detected": [
      {
        "type": "<laceration|bruising|burn|deformity|swelling|etc>",
        "location": "<body part>",
        "severity": "minor|moderate|severe|critical",
        "details": "<brief>"
      }
    ],
    "bleeding": {
      "detected": true,
      "severity": "none|minor|moderate|severe",
      "location": "<body area or N/A>"
    },
    "body_position": "<description>"
  },
  "diagnosis": {
    "primary_assessment": "<1-2 sentence interpretation>",
    "risk_flags": ["<possible shock>", "<airway compromise>"],
    "severity_score": 5
  },
  "first_aid": {
    "immediate_actions": ["<step 1>", "<step 2>", "<up to 6 steps>"],
    "do_not": ["<thing to avoid>"],
    "call_911": true,
    "call_911_reason": "<why>"
  },
  "summary": "<2-3 sentence plain-English summary for a panicked bystander>"
}`;

const fetchWithRetry = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429 && i < retries - 1) {
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
      continue;
    }
    return response;
  }
};

const getTriageCategory = (score) => {
  if (score >= 8) return 'Immediate (Red)';
  if (score >= 5) return 'Urgent (Yellow)';
  return 'Delayed (Green)';
};

export const analyzeScene = async (base64Frames) => {
  const response = await fetchWithRetry(
    `${GEMINI_URL}?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            ...base64Frames.map(f => ({
              inline_data: { mime_type: 'image/jpeg', data: f.split(',')[1] }
            })),
            { text: TRIAGE_PROMPT }
          ]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
      })
    }
  );
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in Gemini response');
  const result = JSON.parse(match[0]);
  result.diagnosis.triage_category = getTriageCategory(result.diagnosis.severity_score);
  return result;
};

export const buildInitialHistory = (triageData) => [
  {
    role: 'user',
    parts: [{ text: `SYSTEM CONTEXT: You are PulseLink's emergency first aid coach. A triage analysis has been performed. Results:\n${JSON.stringify(triageData)}\n\nRULES:\n- CALM but URGENT, like a 911 dispatcher\n- Max 2-3 sentences per message\n- DIRECTIVE: tell them what to do, no hedging\n- ONE question at a time\n- Simple language, no jargon\n- Use arrow symbol for action items\n- ALL CAPS only for critical warnings\n\nBegin by acknowledging the situation and asking if 911 has been called.` }]
  },
  {
    role: 'model',
    parts: [{ text: 'Understood. Acting as emergency first aid coach with these guidelines.' }]
  }
];

export const sendChatMessage = async (userMsg, history) => {
  const contents = [...history, { role: 'user', parts: [{ text: userMsg }] }];
  const res = await fetch(
    `${GEMINI_URL}?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 }
      })
    }
  );
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return { text, contents: [...contents, { role: 'model', parts: [{ text }] }] };
};

const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const getGroqApiKey = () => process.env.GROQ_API_KEY || process.env.groq_api_key;

const tokenize = (text = '') =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);

const localSimilarity = (a = '', b = '') => {
  const aWords = new Set(tokenize(a));
  const bWords = new Set(tokenize(b));
  if (!aWords.size || !bWords.size) return 0;

  const shared = [...aWords].filter(word => bWords.has(word)).length;
  return shared / Math.max(aWords.size, bWords.size);
};

const fallbackDuplicateDetection = (newComplaint, existingIssues) => {
  let bestMatch = { matchedIndex: -1, confidence: 0, reason: 'No similar issue found' };
  const newText = `${newComplaint.title || ''} ${newComplaint.description || ''}`;

  existingIssues.forEach((issue, index) => {
    const existingText = `${issue.title || ''} ${issue.description || ''}`;
    const confidence = Math.max(
      localSimilarity(newComplaint.title, issue.title),
      localSimilarity(newText, existingText)
    );

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        matchedIndex: index,
        confidence,
        reason: 'Matched by local text similarity'
      };
    }
  });

  return {
    isDuplicate: bestMatch.confidence >= 0.35,
    ...bestMatch
  };
};

const parseGroqJson = (content) => {
  const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned);
};

const detectDuplicate = async (newComplaint, existingIssues) => {
  if (!existingIssues?.length) {
    return { isDuplicate: false, matchedIndex: -1, confidence: 0, reason: 'No existing issues to compare' };
  }

  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return fallbackDuplicateDetection(newComplaint, existingIssues);
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You detect duplicate civic complaints. Return only JSON with keys: isDuplicate(boolean), matchedIndex(number), confidence(number 0-1), reason(string). Treat same civic problem in same ward/category as duplicate even if wording differs.'
          },
          {
            role: 'user',
            content: JSON.stringify({
              newComplaint,
              existingIssues: existingIssues.map((issue, index) => ({
                index,
                title: issue.title,
                description: issue.description,
                category: issue.category,
                ward: issue.ward
              }))
            })
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content || '{}';
    const parsed = parseGroqJson(content);
    const matchedIndex = Number.isInteger(parsed.matchedIndex) ? parsed.matchedIndex : -1;

    return {
      isDuplicate: Boolean(parsed.isDuplicate) && matchedIndex >= 0 && matchedIndex < existingIssues.length,
      matchedIndex,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      reason: parsed.reason || 'Groq duplicate analysis completed'
    };
  } catch (error) {
    console.error('Groq duplicate detection failed, using fallback:', error.response?.data || error.message);
    return fallbackDuplicateDetection(newComplaint, existingIssues);
  }
};

module.exports = { detectDuplicate };

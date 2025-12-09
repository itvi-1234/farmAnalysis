/**
 * Service to generate descriptions for alert metrics using Gemini API
 * Based on ML model outputs (NDVI, moisture, disease risk, pest risk, stress index)
 * 
 * Uses GEMINI_API_KEY_2 environment variable for authentication
 * API Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
 * Model: gemini-2.5-flash
 */

/**
 * Generate description for a specific metric using Grok API
 * @param {string} metricType - Type of metric (ndvi, moisture, disease, pest, stress, advisory)
 * @param {Object} metricData - The metric value and context
 * @param {Object} allMetrics - All metrics for context (optional)
 * @returns {Promise<string>} Generated description
 */
export const generateMetricDescription = async (metricType, metricData, allMetrics = {}) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY_2;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY_2 not found in environment variables');
      return getDefaultDescription(metricType, metricData);
    }

    // Build context-aware prompt based on metric type
    let prompt = '';
    
    switch (metricType.toLowerCase()) {
      case 'ndvi':
        prompt = buildNDVIPrompt(metricData, allMetrics);
        break;
      case 'moisture':
        prompt = buildMoisturePrompt(metricData, allMetrics);
        break;
      case 'disease':
      case 'diseaserisk':
        prompt = buildDiseasePrompt(metricData, allMetrics);
        break;
      case 'pest':
      case 'pestrisk':
        prompt = buildPestPrompt(metricData, allMetrics);
        break;
      case 'stress':
      case 'stressindex':
        prompt = buildStressPrompt(metricData, allMetrics);
        break;
      case 'advisory':
      case 'farmadvisory':
        prompt = buildAdvisoryPrompt(metricData, allMetrics);
        break;
      default:
        return getDefaultDescription(metricType, metricData);
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.5,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 180, // concise 1-2 lines
          },
        }),
      }
    );

    const rawText = await response.text();
    let data;
    
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (parseError) {
      console.error('Failed to parse Grok JSON response:', parseError);
      console.error('Raw response:', rawText);
      return getDefaultDescription(metricType, metricData);
    }

    // Parse Gemini response structure
    let candidateText = null;
    
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      candidateText =
        candidate.content?.parts?.[0]?.text ||
        candidate.output ||
        candidate.text;
    }

    if (response.ok && candidateText) {
      // Clean the text - remove markdown, extra whitespace, and ensure it's in English
      let cleanedText = candidateText.trim();
      
      // Remove markdown formatting if present
      cleanedText = cleanedText.replace(/\*\*/g, '').replace(/\*/g, '');
      cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
      cleanedText = cleanedText.replace(/`/g, '');
      
      // Remove any incomplete sentences (ending with ... or cut off mid-sentence)
      cleanedText = cleanedText.replace(/\.\.\..*$/, '');
      
      // Check if response is incomplete (ends with incomplete sentence patterns)
      const incompletePatterns = [
        /means\.?$/i,
        /value of \d+\.?$/i,
        /risk of \d+%\.?$/i,
        /index of \d+\.?$/i,
        /means$/i,
        /is \d+\.?$/i,
        /are \d+\.?$/i
      ];
      
      const isIncomplete = incompletePatterns.some(pattern => pattern.test(cleanedText.trim()));
      
      if (isIncomplete || cleanedText.length < 20) {
        console.warn('Response appears incomplete, using default description');
        console.warn('Incomplete text:', cleanedText);
        return getDefaultDescription(metricType, metricData);
      }
      
      // Ensure it ends with proper punctuation
      if (cleanedText && !cleanedText.match(/[.!?]$/)) {
        cleanedText += '.';
      }
      
      // Basic check for Hindi characters - if found, return default
      if (/[\u0900-\u097F]/.test(cleanedText)) {
        console.warn('Response contains Hindi characters, using default description');
        return getDefaultDescription(metricType, metricData);
      }
      
      return cleanedText;
    } else {
      console.error('Gemini API Error:', data);
      console.error('Response status:', response.status);
      if (data.error) {
        console.error('Error details:', data.error);
      }
      return getDefaultDescription(metricType, metricData);
    }
  } catch (error) {
    console.error('Error generating description:', error);
    return getDefaultDescription(metricType, metricData);
  }
};

/**
 * Generate descriptions for all metrics at once
 * @param {Object} metrics - Object containing all metric values
 * @returns {Promise<Object>} Object with descriptions for each metric
 */
export const generateAllDescriptions = async (metrics) => {
  const descriptions = {};
  
  console.log('Generating descriptions for metrics:', metrics);
  
  // Generate descriptions in parallel
  const promises = [
    metrics.ndvi !== undefined && metrics.ndvi !== '-' && metrics.ndvi !== null
      ? generateMetricDescription('ndvi', metrics.ndvi, metrics)
          .then(desc => { 
            console.log('NDVI description generated:', desc);
            descriptions.ndvi = desc; 
          })
          .catch(err => {
            console.error('Error generating NDVI description:', err);
            descriptions.ndvi = getDefaultDescription('ndvi', metrics.ndvi);
          })
      : Promise.resolve(),
    metrics.moisture !== undefined && metrics.moisture !== '-' && metrics.moisture !== null
      ? generateMetricDescription('moisture', metrics.moisture, metrics)
          .then(desc => { 
            console.log('Moisture description generated:', desc);
            descriptions.moisture = desc; 
          })
          .catch(err => {
            console.error('Error generating Moisture description:', err);
            descriptions.moisture = getDefaultDescription('moisture', metrics.moisture);
          })
      : Promise.resolve(),
    metrics.diseaseRisk !== undefined
      ? generateMetricDescription('disease', metrics.diseaseRisk, metrics)
          .then(desc => { 
            console.log('Disease description generated:', desc);
            descriptions.diseaseRisk = desc; 
          })
          .catch(err => {
            console.error('Error generating Disease description:', err);
            descriptions.diseaseRisk = getDefaultDescription('disease', metrics.diseaseRisk);
          })
      : Promise.resolve(),
    metrics.pestRisk !== undefined
      ? generateMetricDescription('pest', metrics.pestRisk, metrics)
          .then(desc => { 
            console.log('Pest description generated:', desc);
            descriptions.pestRisk = desc; 
          })
          .catch(err => {
            console.error('Error generating Pest description:', err);
            descriptions.pestRisk = getDefaultDescription('pest', metrics.pestRisk);
          })
      : Promise.resolve(),
    metrics.stressIndex !== undefined
      ? generateMetricDescription('stress', metrics.stressIndex, metrics)
          .then(desc => { 
            console.log('Stress description generated:', desc);
            descriptions.stressIndex = desc; 
          })
          .catch(err => {
            console.error('Error generating Stress description:', err);
            descriptions.stressIndex = getDefaultDescription('stress', metrics.stressIndex);
          })
      : Promise.resolve(),
    // Skip farm advisory descriptions (per request)
    Promise.resolve(),
  ];

  await Promise.all(promises);
  
  console.log('All descriptions generated:', descriptions);
  return descriptions;
};

// Prompt builders for each metric type
function buildNDVIPrompt(ndviValue, allMetrics) {
  const ndvi = parseFloat(ndviValue) || 0;
  
  return `You are an agriculture expert. Explain what NDVI (Normalized Difference Vegetation Index) value of ${ndvi} means for crop health.

Context: 
- NDVI Range: -1 to 1 (where 1 = very healthy vegetation, 0 = no vegetation, negative = water/clouds)
- Current NDVI: ${ndvi}
- Soil Moisture: ${allMetrics.moisture || 'N/A'}
- Disease Risk: ${allMetrics.diseaseRisk || 0}%
- Pest Risk: ${allMetrics.pestRisk || 0}%

CRITICAL REQUIREMENTS:
- Respond ONLY in English (no Hindi, no mixed languages)
- Provide COMPLETE, FULL sentences - do NOT cut off mid-sentence
- Write 2-3 complete sentences that form a full explanation
- Each sentence must be complete with proper ending punctuation
- Be practical and farmer-friendly
- Start directly with the explanation, do not say "An NDVI value of X means" - instead explain what it means

Provide a complete explanation covering:
1. What this NDVI value indicates about crop health (complete sentence)
2. Whether action is needed (complete sentence)
3. What the farmer should know (complete sentence)

Example format: "This NDVI value indicates [complete explanation]. [Action needed explanation]. [What farmer should know]."

Keep it simple and practical for Indian farmers.`;
}

function buildMoisturePrompt(moistureValue, allMetrics) {
  const moisture = parseFloat(moistureValue) || 0;
  
  return `You are an agriculture expert. Explain what soil moisture level of ${moisture} means for crop irrigation.

Context:
- Soil Moisture Range: 0-100% (where 100% = fully saturated, 0% = completely dry)
- Current Moisture: ${moisture}%
- NDVI: ${allMetrics.ndvi || 'N/A'}
- Disease Risk: ${allMetrics.diseaseRisk || 0}%

IMPORTANT REQUIREMENTS:
- Respond ONLY in English (no Hindi, no mixed languages)
- Provide complete sentences (do not cut off mid-sentence)
- Maximum 2-3 sentences
- Be practical and farmer-friendly

Provide a brief explanation about:
1. Whether the soil has adequate moisture
2. If irrigation is needed
3. What the farmer should do

Keep it simple and practical for Indian farmers.`;
}

function buildDiseasePrompt(diseaseRisk, allMetrics) {
  const risk = parseInt(diseaseRisk) || 0;
  
  return `You are an agriculture expert. Explain what disease risk level of ${risk}% means for crop health.

Context:
- Disease Risk: ${risk}% (0-100%, where 100% = very high risk)
- NDVI: ${allMetrics.ndvi || 'N/A'}
- Soil Moisture: ${allMetrics.moisture || 'N/A'}%
- Stress Index: ${allMetrics.stressIndex || 0}%

CRITICAL REQUIREMENTS:
- Respond ONLY in English (no Hindi, no mixed languages)
- Provide COMPLETE, FULL sentences - do NOT cut off mid-sentence
- Write 2-3 complete sentences that form a full explanation
- Each sentence must be complete with proper ending punctuation
- Be practical and farmer-friendly
- Start directly with the explanation, do not say "A ${risk}% disease risk means" - instead explain what it means

Provide a complete explanation covering:
1. What this risk level means for the crops (complete sentence)
2. Whether preventive action is needed (complete sentence)
3. What the farmer should watch for (complete sentence)

Example format: "This disease risk level indicates [complete explanation]. [Action needed explanation]. [What farmer should watch for]."

Keep it simple and practical for Indian farmers.`;
}

function buildPestPrompt(pestRisk, allMetrics) {
  const risk = parseInt(pestRisk) || 0;
  
  return `You are an agriculture expert. Explain what pest risk level of ${risk}% means for crop protection.

Context:
- Pest Risk: ${risk}% (0-100%, where 100% = very high risk)
- NDVI: ${allMetrics.ndvi || 'N/A'}
- Disease Risk: ${allMetrics.diseaseRisk || 0}%
- Stress Index: ${allMetrics.stressIndex || 0}%

CRITICAL REQUIREMENTS:
- Respond ONLY in English (no Hindi, no mixed languages)
- Provide COMPLETE, FULL sentences - do NOT cut off mid-sentence
- Write 2-3 complete sentences that form a full explanation
- Each sentence must be complete with proper ending punctuation
- Be practical and farmer-friendly
- Start directly with the explanation, do not say "A ${risk}% pest risk means" - instead explain what it means

Provide a complete explanation covering:
1. What this risk level means for the crops (complete sentence)
2. Whether pest control is needed (complete sentence)
3. What preventive measures the farmer should take (complete sentence)

Example format: "This pest risk level indicates [complete explanation]. [Action needed explanation]. [Preventive measures]."

Keep it simple and practical for Indian farmers.`;
}

function buildStressPrompt(stressIndex, allMetrics) {
  const stress = parseInt(stressIndex) || 0;
  
  return `You are an agriculture expert. Explain what crop stress index of ${stress}% means.

Context:
- Stress Index: ${stress}% (0-100%, where 100% = severe stress)
- NDVI: ${allMetrics.ndvi || 'N/A'}
- Soil Moisture: ${allMetrics.moisture || 'N/A'}%
- Disease Risk: ${allMetrics.diseaseRisk || 0}%
- Pest Risk: ${allMetrics.pestRisk || 0}%

CRITICAL REQUIREMENTS:
- Respond ONLY in English (no Hindi, no mixed languages)
- Provide COMPLETE, FULL sentences - do NOT cut off mid-sentence
- Write 2-3 complete sentences that form a full explanation
- Each sentence must be complete with proper ending punctuation
- Be practical and farmer-friendly
- Start directly with the explanation, do not say "A crop stress index of ${stress}%" - instead explain what it means

Provide a complete explanation covering:
1. What this stress level indicates about crop condition (complete sentence)
2. Whether the crops are under stress (complete sentence)
3. What the farmer should do to reduce stress (complete sentence)

Example format: "This stress index indicates [complete explanation]. [Stress level explanation]. [What farmer should do]."

Keep it simple and practical for Indian farmers.`;
}

function buildAdvisoryPrompt(advisoryActions, allMetrics) {
  const actions = Array.isArray(advisoryActions) ? advisoryActions.join(', ') : String(advisoryActions);
  
  return `You are an agriculture expert. Based on the following farm advisory actions and current crop conditions, provide a concise 1-2 line summary explanation.

Advisory Actions: ${actions}

Current Conditions:
- NDVI: ${allMetrics.ndvi || 'N/A'}
- Soil Moisture: ${allMetrics.moisture || 'N/A'}%
- Disease Risk: ${allMetrics.diseaseRisk || 0}%
- Pest Risk: ${allMetrics.pestRisk || 0}%
- Stress Index: ${allMetrics.stressIndex || 0}%

IMPORTANT REQUIREMENTS:
- Respond ONLY in English (no Hindi, no mixed languages)
- Provide complete sentences (do not cut off mid-sentence)
- Maximum 2 sentences
- Be practical and farmer-friendly
- Explain what these advisory actions mean and why they are important

Provide a brief, farmer-friendly explanation summarizing what these advisory actions mean and why they are important.`;
}

/**
 * Generate description for a single advisory action
 * @param {string} action - The advisory action text
 * @param {Object} allMetrics - All metrics for context
 * @returns {Promise<string>} Generated description for the action
 */
export const generateAdvisoryActionDescription = async (action, allMetrics = {}) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY_2;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY_2 not found in environment variables');
      return getDefaultActionDescription(action);
    }

    const prompt = `You are an agriculture expert. Explain this farm advisory action in simple, farmer-friendly English.

Advisory Action: "${action}"

Current Crop Conditions:
- NDVI: ${allMetrics.ndvi || 'N/A'}
- Soil Moisture: ${allMetrics.moisture || 'N/A'}%
- Disease Risk: ${allMetrics.diseaseRisk || 0}%
- Pest Risk: ${allMetrics.pestRisk || 0}%
- Stress Index: ${allMetrics.stressIndex || 0}%

CRITICAL REQUIREMENTS:
- Respond ONLY in English (no Hindi, no mixed languages)
- Provide exactly 1-2 COMPLETE sentences - do NOT cut off mid-sentence
- Each sentence must be complete with proper ending punctuation
- Explain what this action means and why it's important
- Be practical and actionable for Indian farmers
- Start directly with the explanation, do not repeat the action name or say "${action} means" - just explain it

Provide a complete 1-2 sentence explanation of what this advisory action means and why the farmer should follow it.

Example format: "[Complete explanation of what the action means]. [Why it's important for the farmer]."`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.5,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 180,
          },
        }),
      }
    );

    const rawText = await response.text();
    let data;
    
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (parseError) {
      console.error('Failed to parse Grok JSON response:', parseError);
      console.error('Raw response:', rawText);
      return getDefaultActionDescription(action);
    }

    // Parse Gemini response structure
    let candidateText = null;
    
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      candidateText =
        candidate.content?.parts?.[0]?.text ||
        candidate.output ||
        candidate.text;
    }

    if (response.ok && candidateText) {
      let cleanedText = candidateText.trim();
      
      // Remove markdown formatting
      cleanedText = cleanedText.replace(/\*\*/g, '').replace(/\*/g, '');
      cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
      cleanedText = cleanedText.replace(/`/g, '');
      
      // Remove incomplete sentences
      cleanedText = cleanedText.replace(/\.\.\..*$/, '');
      
      // Check if response is incomplete
      const incompletePatterns = [
        /means\.?$/i,
        /"([^"]+)" means\.?$/i,
        /^"([^"]+)"\.?$/i,
        /is \d+\.?$/i,
        /are \d+\.?$/i
      ];
      
      const isIncomplete = incompletePatterns.some(pattern => pattern.test(cleanedText.trim())) || cleanedText.length < 30;
      
      if (isIncomplete) {
        console.warn('Action description appears incomplete, using default');
        console.warn('Incomplete text:', cleanedText);
        return getDefaultActionDescription(action);
      }
      
      // Ensure proper punctuation
      if (cleanedText && !cleanedText.match(/[.!?]$/)) {
        cleanedText += '.';
      }
      
      // Check for Hindi characters
      if (/[\u0900-\u097F]/.test(cleanedText)) {
        console.warn('Response contains Hindi characters, using default description');
        return getDefaultActionDescription(action);
      }
      
      return cleanedText;
    } else {
      console.error('Grok API Error:', data);
      console.error('Response status:', response.status);
      if (data.error) {
        console.error('Error details:', data.error);
      }
      return getDefaultActionDescription(action);
    }
  } catch (error) {
    console.error('Error generating action description:', error);
    return getDefaultActionDescription(action);
  }
};

function getDefaultActionDescription(action) {
  // Simple default descriptions based on common actions
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('irrigation') || actionLower.includes('water') || actionLower.includes('plan irrigation')) {
    return 'Schedule and apply irrigation to maintain adequate soil moisture levels for optimal crop growth and health.';
  }
  if (actionLower.includes('fungicide') || actionLower.includes('fungal') || actionLower.includes('apply fungicide')) {
    return 'Apply fungicide to prevent and control fungal diseases that can damage your crops and reduce yield.';
  }
  if (actionLower.includes('pest') || actionLower.includes('insecticide')) {
    return 'Monitor and control pests to protect your crops from damage and prevent yield loss.';
  }
  if (actionLower.includes('fertilizer') || actionLower.includes('nutrient')) {
    return 'Apply appropriate fertilizers to provide essential nutrients for optimal crop growth and development.';
  }
  if (actionLower.includes('high fungal risk')) {
    return 'High risk of fungal diseases detected. Apply preventive fungicide treatments immediately to protect your crops.';
  }
  
  return `Follow this advisory action to maintain healthy crop conditions and maximize your yield potential.`;
}

// Default descriptions if Gemini API fails
function getDefaultDescription(metricType, metricData) {
  const type = metricType.toLowerCase();
  const value = metricData;
  
  if (type === 'ndvi') {
    const ndvi = parseFloat(value) || 0;
    if (ndvi >= 0.7) return 'Excellent crop health. Vegetation is very healthy and thriving.';
    if (ndvi >= 0.4) return 'Good crop health. Vegetation is healthy but monitor regularly.';
    if (ndvi >= 0.2) return 'Moderate crop health. Some areas may need attention.';
    return 'Poor crop health. Immediate action may be required.';
  }
  
  if (type === 'moisture') {
    const moisture = parseFloat(value) || 0;
    if (moisture >= 60) return 'Soil has adequate moisture. Irrigation may not be needed.';
    if (moisture >= 40) return 'Soil moisture is moderate. Monitor and irrigate if needed.';
    return 'Soil is dry. Irrigation is recommended.';
  }
  
  if (type === 'disease' || type === 'diseaserisk') {
    const risk = parseInt(value) || 0;
    if (risk >= 60) return 'High disease risk detected. Take preventive measures immediately.';
    if (risk >= 30) return 'Moderate disease risk. Monitor crops closely.';
    return 'Low disease risk. Continue regular monitoring.';
  }
  
  if (type === 'pest' || type === 'pestrisk') {
    const risk = parseInt(value) || 0;
    if (risk >= 60) return 'High pest risk detected. Apply pest control measures.';
    if (risk >= 30) return 'Moderate pest risk. Monitor for pest activity.';
    return 'Low pest risk. Continue regular monitoring.';
  }
  
  if (type === 'stress' || type === 'stressindex') {
    const stress = parseInt(value) || 0;
    if (stress >= 60) return 'High crop stress detected. Check irrigation and nutrient levels.';
    if (stress >= 30) return 'Moderate crop stress. Monitor conditions.';
    return 'Low crop stress. Crops are healthy.';
  }
  
  return 'Description not available.';
}


export interface Env {
  AI: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body: any = await request.json();
      const policyText = body?.policyText || body?.policy || '';

      if (!policyText || typeof policyText !== 'string') {
        return new Response(JSON.stringify({ error: 'Please provide valid policyText in the request body.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const systemPrompt = `You are a specialized institutional payroll policy parser and salary adjustment intelligence engine.
Given an academy's natural language policy or custom executive prompt (including rules, bonuses, or specific staff salary cuts/fines/bonuses), convert it into an accurate, strict JSON object with this exact schema:

{
  "policy_name": "Short descriptive name",
  "summary": "Clear 2-sentence summary of the extracted rules",
  "workingDaysMode": "fixed_26" | "fixed_30" | "calendar",
  "customWorkingDays": number,
  "lateDeductionMode": "ratio_3_to_1" | "ratio_3_to_half" | "fixed_amount" | "none",
  "lateGraceCount": number,
  "latePenaltyAmount": number,
  "halfDayDeductionRatio": number,
  "unexcusedAbsenceRatio": number,
  "paidLeaveAllowance": number,
  "attendanceBonus": {
    "enabled": boolean,
    "amount": number,
    "condition": "zero_absences" | "zero_lates_and_absences" | "none"
  },
  "specialAllowances": [
    {
      "label": string,
      "type": "percentage" | "fixed",
      "value": number,
      "applies_to": string
    }
  ],
  "staffAdjustments": [
    {
      "staffName": string (e.g. "Adnan", "Ali"),
      "type": "deduction_percentage" | "deduction_fixed" | "bonus_percentage" | "bonus_fixed",
      "value": number (for half salary use 50, for quarter use 25, or exact PKR number),
      "reason": string
    }
  ],
  "explanation": "Brief human explanation of how deductions, specific staff salary cuts, and bonuses will be computed"
}

IMPORTANT: If the user mentions any specific person or staff name (e.g. "cut half salary of Adnan", "deduct 5000 from Ali", "give bonus to Sarah"), ALWAYS add an item to the "staffAdjustments" array with their name, type, value, and reason.

Respond ONLY with the JSON object. Do not include markdown codeblocks or conversational filler.`;

      let aiResponse: any;
      try {
        aiResponse = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: policyText }
          ],
          temperature: 0.1,
          max_tokens: 1500
        });
      } catch (e1) {
        try {
          aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: policyText }
            ],
            temperature: 0.1,
            max_tokens: 1500
          });
        } catch (e2) {
          aiResponse = await env.AI.run('@cf/mistral/mistral-7b-instruct-v0.1', {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: policyText }
            ]
          });
        }
      }

      let parsedRules: any = null;

      if (aiResponse && typeof aiResponse.response === 'object' && aiResponse.response !== null) {
        parsedRules = aiResponse.response;
      } else {
        let textContent = '';
        if (typeof aiResponse === 'string') {
          textContent = aiResponse;
        } else if (aiResponse?.response && typeof aiResponse.response === 'string') {
          textContent = aiResponse.response;
        } else if (aiResponse?.choices?.[0]?.message?.content) {
          textContent = aiResponse.choices[0].message.content;
        } else {
          textContent = JSON.stringify(aiResponse || {});
        }

        textContent = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = textContent.indexOf('{');
        const lastBrace = textContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          textContent = textContent.substring(firstBrace, lastBrace + 1);
        }

        try {
          parsedRules = JSON.parse(textContent);
        } catch {
          parsedRules = null;
        }
      }

      if (!parsedRules) {
        const has30 = policyText.includes('30');
        const isHalf = policyText.toLowerCase().includes('half');
        parsedRules = {
          policy_name: 'Custom Academy Policy',
          summary: 'Institutional attendance and salary deduction policy.',
          workingDaysMode: has30 ? 'fixed_30' : 'fixed_26',
          customWorkingDays: has30 ? 30 : 26,
          lateDeductionMode: isHalf ? 'ratio_3_to_half' : 'ratio_3_to_1',
          lateGraceCount: 2,
          latePenaltyAmount: 500,
          halfDayDeductionRatio: 0.5,
          unexcusedAbsenceRatio: 1.0,
          paidLeaveAllowance: 2,
          attendanceBonus: { enabled: false, amount: 0, condition: 'none' },
      } else if (aiResponse && typeof aiResponse.response === 'string') {
        try {
          const cleaned = aiResponse.response.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
          parsedRules = JSON.parse(cleaned);
        } catch (parseErr) {
          console.error('Failed to parse AI JSON response:', parseErr, aiResponse.response);
        }
      }

      // Default fallback if AI parsing completely failed
      if (!parsedRules || typeof parsedRules !== 'object') {
        parsedRules = {};
      }

      // Normalize output schema
      parsedRules.policy_name = parsedRules.policy_name || parsedRules.policyName || 'Custom Academy Policy';
      parsedRules.summary = parsedRules.summary || 'Institutional attendance and deduction rules.';
      parsedRules.workingDaysMode = parsedRules.workingDaysMode || 'fixed_26';
      parsedRules.customWorkingDays = parsedRules.customWorkingDays || (parsedRules.workingDaysMode === 'fixed_30' ? 30 : 26);
      parsedRules.lateDeductionMode = parsedRules.lateDeductionMode || 'ratio_3_to_1';
      parsedRules.lateGraceCount = parsedRules.lateGraceCount !== undefined ? parsedRules.lateGraceCount : 2;
      parsedRules.latePenaltyAmount = parsedRules.latePenaltyAmount || 0;
      parsedRules.halfDayDeductionRatio = parsedRules.halfDayDeductionRatio !== undefined ? parsedRules.halfDayDeductionRatio : 0.5;
      parsedRules.unexcusedAbsenceRatio = parsedRules.unexcusedAbsenceRatio !== undefined ? parsedRules.unexcusedAbsenceRatio : 1.0;
      parsedRules.paidLeaveAllowance = parsedRules.paidLeaveAllowance !== undefined ? parsedRules.paidLeaveAllowance : 2;
      parsedRules.staffAdjustments = Array.isArray(parsedRules.staffAdjustments) ? parsedRules.staffAdjustments : [];

      // Normalize half salary adjustments
      const lower = policyText.toLowerCase();
      parsedRules.staffAdjustments = parsedRules.staffAdjustments.map((adj: any) => {
        const reasonLower = (adj.reason || '').toLowerCase();
        const isHalfRequested = reasonLower.includes('half') || reasonLower.includes('50%') || reasonLower.includes('0.5') ||
                                lower.includes('counted half') || lower.includes('half of that month') ||
                                lower.includes('salay is counted half') || lower.includes('salary is counted half');
        if (isHalfRequested && (adj.type === 'deduction_fixed' || adj.value !== 50)) {
          return {
            ...adj,
            type: 'deduction_percentage',
            value: 50,
            reason: adj.reason || '50% half salary deduction'
          };
        }
        return adj;
      });

      // Staff code pattern check (e.g. FAC-2026-050)
      const staffCodeMatch = policyText.match(/\b([A-Za-z]{2,5}-\d{2,4}-\d{2,4}|FAC-\d{3,4}|STF-\d{3,4}|EMP-\d{3,4})\b/i);
      if (staffCodeMatch) {
        const code = staffCodeMatch[1].toUpperCase();
        const mentionsHalf = lower.includes('half') || lower.includes('50%') || lower.includes('counted half') || lower.includes('0.5');
        if (mentionsHalf) {
          const existingIdx = parsedRules.staffAdjustments.findIndex((a: any) => (a.staffName || '').toUpperCase() === code);
          if (existingIdx >= 0) {
            parsedRules.staffAdjustments[existingIdx].type = 'deduction_percentage';
            parsedRules.staffAdjustments[existingIdx].value = 50;
          } else {
            parsedRules.staffAdjustments.push({
              staffName: code,
              type: 'deduction_percentage',
              value: 50,
              reason: `50% half salary deduction requested for ${code}`
            });
          }
        }
      }

      // Heuristic fallback for specific staff name adjustments if AI missed it
      const nonNameTokens = new Set(['day', 'days', 'late', 'lates', 'absence', 'absences', 'leave', 'leaves', 'grace', 'pay', 'salary', 'salay', 'salry', 'deduction', 'fine', 'penalty']);
      const cutHalfMatch = lower.match(/(?:cut|deduct|reduce)\s+(?:half|50%|0\.5)\s*(?:salary|pay|compensation)?\s+(?:of|from)\s+([a-zA-Z\s]{2,25}?)(?:\s+(?:for|due|because|as|on)|[.,;\n]|$)/i);
      if (cutHalfMatch) {
        const candidateName = cutHalfMatch[1].replace(/salary|pay|for|from|of/gi, '').trim();
        const tokens = candidateName.toLowerCase().split(/\s+/);
        const isInvalid = tokens.every(tok => nonNameTokens.has(tok));
        if (candidateName && !isInvalid && candidateName.length >= 2 && !parsedRules.staffAdjustments.some((a: any) => a.staffName?.toLowerCase().includes(candidateName.toLowerCase()))) {
          parsedRules.staffAdjustments.push({
            staffName: candidateName,
            type: 'deduction_percentage',
            value: 50,
            reason: `50% salary reduction requested for ${candidateName}`
          });
        }
      }

      return new Response(JSON.stringify({ success: true, data: parsedRules }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message || 'Error processing policy' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
